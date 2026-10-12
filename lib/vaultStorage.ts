/**
 * Vault Storage Layer
 * Multi-tier bulletproof persistence for EDSA prepaid tokens and meter profiles.
 * Backs up data across:
 * 1. Synchronous localStorage (primary fast read)
 * 2. Redundant localStorage backup key
 * 3. Asynchronous browser IndexedDB (resilient against WebView storage sweeps)
 * 4. Requests navigator.storage.persist() for persistent OS-level quota.
 */

export interface StoredToken {
  id: string;
  token: string;
  meterNumber: string;
  meterName?: string;
  amountNle: number;
  kwhUnits?: number;
  date: string;
  loaded: boolean;
}

export interface MeterProfile {
  id: string;
  name: string;
  meterNumber: string;
  isDefault?: boolean;
}

const STORAGE_KEYS = {
  TOKENS: 'edsa_saved_tokens_v1',
  TOKENS_BACKUP: 'edsa_saved_tokens_backup_v1',
  METERS: 'edsa_saved_meters_v1',
  METERS_BACKUP: 'edsa_saved_meters_backup_v1',
};

const DB_NAME = 'edsa_vault_db_v1';
const DB_VERSION = 1;
const STORE_TOKENS = 'tokens';
const STORE_METERS = 'meters';

/**
 * Request OS-level persistent storage permission so Android / Chrome
 * will not evict user tokens during background cleanups.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Open native IndexedDB instance
 */
function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_TOKENS)) {
          db.createObjectStore(STORE_TOKENS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_METERS)) {
          db.createObjectStore(STORE_METERS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save array of tokens to IndexedDB
 */
async function saveTokensToIdb(tokens: StoredToken[]): Promise<void> {
  const db = await openDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_TOKENS, 'readwrite');
      const store = tx.objectStore(STORE_TOKENS);
      store.clear();
      tokens.forEach((t) => store.put(t));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/**
 * Load array of tokens from IndexedDB
 */
async function loadTokensFromIdb(): Promise<StoredToken[]> {
  const db = await openDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_TOKENS, 'readonly');
      const store = tx.objectStore(STORE_TOKENS);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        resolve(req.result || []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

/**
 * Save meters to IndexedDB
 */
async function saveMetersToIdb(meters: MeterProfile[]): Promise<void> {
  const db = await openDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_METERS, 'readwrite');
      const store = tx.objectStore(STORE_METERS);
      store.clear();
      meters.forEach((m) => store.put(m));
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

/**
 * Load meters from IndexedDB
 */
async function loadMetersFromIdb(): Promise<MeterProfile[]> {
  const db = await openDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_METERS, 'readonly');
      const store = tx.objectStore(STORE_METERS);
      const req = store.getAll();
      req.onsuccess = () => {
        db.close();
        resolve(req.result || []);
      };
      req.onerror = () => {
        db.close();
        resolve([]);
      };
    } catch {
      db.close();
      resolve([]);
    }
  });
}

/**
 * Synchronously load tokens from localStorage (with backup fallback)
 */
export function getInitialTokensFromLocalStorage(): StoredToken[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOKENS) || localStorage.getItem(STORAGE_KEYS.TOKENS_BACKUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Synchronously load meters from localStorage (with backup fallback)
 */
export function getInitialMetersFromLocalStorage(): MeterProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.METERS) || localStorage.getItem(STORAGE_KEYS.METERS_BACKUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Multi-tier loader for tokens:
 * Reads localStorage first, then checks IndexedDB, reconciles any missing tokens,
 * and updates storage layers so nothing is ever lost.
 */
export async function loadTokensMultiTier(): Promise<StoredToken[]> {
  const localTokens = getInitialTokensFromLocalStorage();
  const idbTokens = await loadTokensFromIdb();

  // Deduplicate and merge by token string (or ID)
  const tokenMap = new Map<string, StoredToken>();

  // Add IDB tokens first
  idbTokens.forEach((t) => {
    if (t && t.token) tokenMap.set(t.token, t);
  });

  // Local tokens take precedence if newer / loaded status updated
  localTokens.forEach((t) => {
    if (t && t.token) tokenMap.set(t.token, t);
  });

  const merged = Array.from(tokenMap.values());

  // If merged list differs from either store, resync both
  if (merged.length > 0) {
    if (merged.length !== localTokens.length || merged.length !== idbTokens.length) {
      persistTokensMultiTier(merged);
    }
  }

  return merged;
}

/**
 * Multi-tier loader for meters
 */
export async function loadMetersMultiTier(): Promise<MeterProfile[]> {
  const localMeters = getInitialMetersFromLocalStorage();
  const idbMeters = await loadMetersFromIdb();

  const meterMap = new Map<string, MeterProfile>();
  idbMeters.forEach((m) => {
    if (m && m.id) meterMap.set(m.id, m);
  });
  localMeters.forEach((m) => {
    if (m && m.id) meterMap.set(m.id, m);
  });

  const merged = Array.from(meterMap.values());
  if (merged.length > 0 && (merged.length !== localMeters.length || merged.length !== idbMeters.length)) {
    persistMetersMultiTier(merged);
  }

  return merged;
}

/**
 * Persist tokens across ALL storage tiers immediately and permanently.
 */
export function persistTokensMultiTier(tokens: StoredToken[]): void {
  if (typeof window === 'undefined') return;

  const json = JSON.stringify(tokens);

  // 1. Primary localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.TOKENS, json);
  } catch (err) {
    console.warn('Failed to write tokens to localStorage primary:', err);
  }

  // 2. Backup localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.TOKENS_BACKUP, json);
  } catch (err) {
    console.warn('Failed to write tokens to localStorage backup:', err);
  }

  // 3. Persistent IndexedDB
  saveTokensToIdb(tokens).catch((err) => {
    console.warn('Failed to write tokens to IndexedDB:', err);
  });
}

/**
 * Persist meters across ALL storage tiers immediately and permanently.
 */
export function persistMetersMultiTier(meters: MeterProfile[]): void {
  if (typeof window === 'undefined') return;

  const json = JSON.stringify(meters);

  // 1. Primary localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.METERS, json);
  } catch (err) {
    console.warn('Failed to write meters to localStorage primary:', err);
  }

  // 2. Backup localStorage
  try {
    localStorage.setItem(STORAGE_KEYS.METERS_BACKUP, json);
  } catch (err) {
    console.warn('Failed to write meters to localStorage backup:', err);
  }

  // 3. Persistent IndexedDB
  saveMetersToIdb(meters).catch((err) => {
    console.warn('Failed to write meters to IndexedDB:', err);
  });
}
