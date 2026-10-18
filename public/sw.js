const CACHE_NAME = 'edsa-tracker-v1.0.5';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/topup',
  '/assets/edsa-icon-v2-192.png',
  '/assets/edsa-icon-v2-512.png'
];

// Self-contained, guaranteed fallback HTML matching the Connection Problem design
const OFFLINE_HTML_FALLBACK = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Problem — EDSA Power Tracker</title>
  <meta name="theme-color" content="#ffffff">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #ffffff; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.25rem; text-align: center; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 2rem; padding: 2.25rem 1.75rem; max-width: 420px; width: 100%; box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); position: relative; overflow: hidden; }
    .accent-strip { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #fbbf24, #f97316, #f59e0b); }
    .icon-badge { width: 56px; height: 56px; margin: 0 auto 1.25rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 1rem; display: flex; align-items: center; justify-content: center; color: #d97706; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    h1 { font-size: 1.25rem; font-weight: 900; margin-bottom: 0.5rem; color: #0f172a; letter-spacing: -0.02em; }
    p.desc { color: #475569; font-size: 0.8125rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.875rem 1.25rem; border-radius: 0.75rem; border: none; cursor: pointer; text-decoration: none; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.25); margin-bottom: 0.625rem; }
    .btn-primary:active { transform: scale(0.98); }
    .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; color: #334155; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.75rem 1.25rem; border-radius: 0.75rem; cursor: pointer; text-decoration: none; margin-bottom: 0.625rem; }
    .vault-drawer { margin-top: 1rem; text-align: left; display: none; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
    .vault-drawer.open { display: block; }
    .vault-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.5rem; }
    .token-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem; margin-bottom: 0.5rem; }
    .token-number { font-family: monospace; font-size: 0.85rem; font-weight: 700; color: #0f172a; letter-spacing: 0.05em; margin-bottom: 0.25rem; word-break: break-all; }
    .token-meta { font-size: 0.7rem; color: #64748b; display: flex; justify-content: space-between; align-items: center; }
    .copy-btn { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 0.375rem; padding: 0.2rem 0.5rem; font-size: 0.65rem; font-weight: 700; color: #2563eb; cursor: pointer; }
    .status-text { font-size: 0.7rem; color: #94a3b8; margin-top: 0.75rem; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="accent-strip"></div>
    <div class="icon-badge">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M19 12.859a10 10 0 0 0-2.007-1.523"/><path d="M2 8.82a15 15 0 0 1 4.177-2.643"/><path d="M22 8.82a15 15 0 0 0-11.288-3.764"/><line x1="2" x2="22" y1="2" y2="22"/>
      </svg>
    </div>
    <h1>Connection Problem</h1>
    <p class="desc">Unable to reach the EDSA servers. Please verify your mobile data or Wi-Fi connection and tap retry.</p>
    <button id="retryBtn" class="btn-primary" onclick="handleRetry()">
      <svg id="retryIcon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
      </svg>
      <span id="retryText">Retry Connection</span>
    </button>
    <button type="button" class="btn-secondary" onclick="toggleVaultDrawer()">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
      </svg>
      <span>Open Offline Token Vault</span>
    </button>
    <div id="vaultDrawer" class="vault-drawer">
      <div class="vault-title">Saved Offline Tokens</div>
      <div id="vaultTokensList"></div>
    </div>
    <div class="status-text">Your saved tokens and meters are safe offline.</div>
  </div>
  <script>
    function handleRetry() {
      var btn = document.getElementById('retryBtn');
      var icon = document.getElementById('retryIcon');
      var text = document.getElementById('retryText');
      if (btn) btn.disabled = true;
      if (icon) icon.classList.add('spin');
      if (text) text.innerText = 'Reconnecting...';
      fetch('/api/version', { cache: 'no-store' })
        .then(function(res) { if (res.ok) window.location.reload(); else throw new Error('Unreachable'); })
        .catch(function() {
          setTimeout(function() {
            if (btn) btn.disabled = false;
            if (icon) icon.classList.remove('spin');
            if (text) text.innerText = 'Retry Connection';
          }, 1200);
        });
    }
    function formatTokenDigits(raw) {
      if (!raw) return '';
      var digits = String(raw).replace(/\\D/g, '').slice(0, 20);
      var parts = [];
      for (var i = 0; i < digits.length; i += 4) { parts.push(digits.substring(i, i + 4)); }
      return parts.join(' - ');
    }
    function toggleVaultDrawer() {
      var drawer = document.getElementById('vaultDrawer');
      if (!drawer) return;
      var isOpen = drawer.classList.contains('open');
      if (isOpen) { drawer.classList.remove('open'); return; }
      drawer.classList.add('open');
      var list = document.getElementById('vaultTokensList');
      if (!list) return;
      var raw = localStorage.getItem('edsa_saved_tokens_v1') || localStorage.getItem('edsa_saved_tokens_backup_v1');
      var tokens = [];
      try { if (raw) tokens = JSON.parse(raw); } catch (e) {}
      if (!tokens || tokens.length === 0) {
        list.innerHTML = '<div style="font-size: 0.75rem; color: #94a3b8; padding: 0.5rem 0;">No tokens saved in offline vault yet.</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        var formatted = formatTokenDigits(t.token);
        var meta = (t.meterName || ('Meter ' + (t.meterNumber || ''))) + ' • ' + (t.amountNle ? ('NLe ' + t.amountNle) : '') + (t.kwhUnits ? (' • ' + t.kwhUnits + ' kWh') : '');
        html += '<div class="token-card">' +
          '<div class="token-number">' + formatted + '</div>' +
          '<div class="token-meta">' +
            '<span>' + meta + '</span>' +
            '<button class="copy-btn" onclick="navigator.clipboard.writeText(\\'' + t.token + '\\'); this.innerText=\\'Copied!\\'; var self=this; setTimeout(function(){ self.innerText=\\'Copy\\'; }, 2000);">Copy</button>' +
          '</div>' +
        '</div>';
      }
      list.innerHTML = html;
    }
    window.addEventListener('online', function() { window.location.reload(); });
  </script>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Immediately seed offline page with the fallback HTML so cache.match(OFFLINE_URL) always succeeds
      await cache.put(OFFLINE_URL, new Response(OFFLINE_HTML_FALLBACK, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }));

      // Cache remaining assets resiliently (don't fail if any individual asset fails)
      await Promise.allSettled(
        STATIC_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok) await cache.put(url, res);
          } catch (_) {}
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  // Operational data, reports, and announcements must always come from the network
  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For HTML navigation requests, try network first, then cache, then guaranteed offline HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone()).catch(() => {});
            return networkResponse;
          }
          return networkResponse;
        } catch (fetchErr) {
          // Network failed — try to find cached page
          try {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(event.request);
            if (cachedResponse) return cachedResponse;
            const offlinePage = await cache.match(OFFLINE_URL);
            if (offlinePage) return offlinePage;
          } catch (cacheErr) {
            // Ignore cache read errors
          }

          // Return guaranteed styled HTML offline page — NEVER raw text 'Offline'
          return new Response(OFFLINE_HTML_FALLBACK, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          });
        }
      })()
    );
    return;
  }

  // For static assets, try cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return new Response('', { status: 408, statusText: 'Request timed out' });
      });
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'EDSA Power Tracker';
  const options = {
    body: data.body || 'Power status or emergency update for your area.',
    icon: '/assets/edsa-icon-v2-192.png',
    badge: '/assets/edsa-icon-v2-192.png',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync handling
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(Promise.resolve());
  }
});

// Periodic background sync handling
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-power-check') {
    event.waitUntil(Promise.resolve());
  }
});
