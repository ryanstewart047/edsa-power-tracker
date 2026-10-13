import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

export interface OptInRecord {
  id: string;
  email: string;
  name: string | null;
  source: string;
  notified: boolean;
  createdAt: string;
}

interface DbOptInRow {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  notified: boolean | number;
  created_at: Date | string;
}

const FALLBACK_FILE_PATH = path.join(process.cwd(), 'data', 'closed_testing_optins.json');

// In-memory runtime cache for serverless resiliency
const inMemoryCache = new Map<string, OptInRecord>();

/**
 * Ensures the dedicated table exists in PostgreSQL without touching any earlier tables.
 */
let tableInitialized = false;
async function ensureDedicatedTableExists(): Promise<boolean> {
  if (tableInitialized) return true;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS closed_testing_optins (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(320) UNIQUE NOT NULL,
        name VARCHAR(150),
        source VARCHAR(100) DEFAULT 'join-page',
        notified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    tableInitialized = true;
    return true;
  } catch (err) {
    console.warn('[OptIn Storage] PostgreSQL table initialization warning, fallback active:', err);
    return false;
  }
}

/**
 * Helper to read from fallback JSON file
 */
function readFallbackFile(): OptInRecord[] {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Helper to write to fallback JSON file
 */
function writeFallbackFile(records: OptInRecord[]): void {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch {
    // ignore in serverless read-only filesystems
  }
}

/**
 * Save an opt-in record into the unique dedicated store
 */
export async function saveOptIn(
  email: string,
  name?: string | null,
  source = 'join-page'
): Promise<{ isNew: boolean; record: OptInRecord }> {
  const cleanEmail = email.trim().toLowerCase().slice(0, 320);
  const cleanName = name ? name.trim().slice(0, 150) : null;
  const id = `optin_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  let isNew = true;
  let record: OptInRecord = {
    id,
    email: cleanEmail,
    name: cleanName,
    source,
    notified: false,
    createdAt: now,
  };

  const hasDb = await ensureDedicatedTableExists();

  if (hasDb) {
    try {
      // Check if already exists in dedicated table
      const existing = (await prisma.$queryRawUnsafe<DbOptInRow[]>(
        `SELECT id, email, name, source, notified, created_at FROM closed_testing_optins WHERE email = $1 LIMIT 1`,
        cleanEmail
      )) as DbOptInRow[];

      if (existing && existing.length > 0) {
        isNew = false;
        const row = existing[0];
        record = {
          id: row.id,
          email: row.email,
          name: row.name || cleanName,
          source: row.source || source,
          notified: Boolean(row.notified),
          createdAt: new Date(row.created_at).toISOString(),
        };
      } else {
        // Insert new record into dedicated table
        await prisma.$executeRawUnsafe(
          `INSERT INTO closed_testing_optins (id, email, name, source, notified, created_at)
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          id,
          cleanEmail,
          cleanName,
          source
        );
      }
    } catch (err) {
      console.warn('[OptIn Storage] Database query failed, using in-memory/file fallback:', err);
      // Fallback path
      const fileRecords = readFallbackFile();
      const existingInFile = fileRecords.find((r) => r.email === cleanEmail);
      if (existingInFile) {
        isNew = false;
        record = existingInFile;
      } else {
        fileRecords.unshift(record);
        writeFallbackFile(fileRecords);
      }
    }
  } else {
    // Pure fallback path
    const fileRecords = readFallbackFile();
    const existingInFile = fileRecords.find((r) => r.email === cleanEmail);
    if (existingInFile) {
      isNew = false;
      record = existingInFile;
    } else {
      fileRecords.unshift(record);
      writeFallbackFile(fileRecords);
    }
  }

  // Update in-memory cache
  inMemoryCache.set(cleanEmail, record);

  return { isNew, record };
}

/**
 * Get all opt-in records ordered by creation date
 */
export async function getAllOptIns(): Promise<OptInRecord[]> {
  const hasDb = await ensureDedicatedTableExists();
  const recordsMap = new Map<string, OptInRecord>();

  // 1. Load from in-memory cache first
  inMemoryCache.forEach((rec, email) => {
    recordsMap.set(email, rec);
  });

  // 2. Load from fallback file
  const fileRecords = readFallbackFile();
  fileRecords.forEach((rec) => {
    if (!recordsMap.has(rec.email)) {
      recordsMap.set(rec.email, rec);
    }
  });

  // 3. Load from dedicated database table
  if (hasDb) {
    try {
      const rows = (await prisma.$queryRawUnsafe<DbOptInRow[]>(
        `SELECT id, email, name, source, notified, created_at FROM closed_testing_optins ORDER BY created_at DESC`
      )) as DbOptInRow[];

      if (Array.isArray(rows)) {
        rows.forEach((row) => {
          recordsMap.set(row.email, {
            id: row.id,
            email: row.email,
            name: row.name,
            source: row.source || 'join-page',
            notified: Boolean(row.notified),
            createdAt: new Date(row.created_at).toISOString(),
          });
        });
      }
    } catch (err) {
      console.warn('[OptIn Storage] Failed to read from database table, serving cached records:', err);
    }
  }

  return Array.from(recordsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Mark a record as notified (email sent)
 */
export async function markOptInNotified(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  // Update memory
  const cached = inMemoryCache.get(cleanEmail);
  if (cached) {
    cached.notified = true;
    inMemoryCache.set(cleanEmail, cached);
  }

  // Update file
  const fileRecords = readFallbackFile();
  const fileIdx = fileRecords.findIndex((r) => r.email === cleanEmail);
  if (fileIdx >= 0) {
    fileRecords[fileIdx].notified = true;
    writeFallbackFile(fileRecords);
  }

  // Update database table
  const hasDb = await ensureDedicatedTableExists();
  if (hasDb) {
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE closed_testing_optins SET notified = TRUE WHERE email = $1`,
        cleanEmail
      );
    } catch (err) {
      console.warn('[OptIn Storage] Failed to update notified status in database:', err);
    }
  }
}
