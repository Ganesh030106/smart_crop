const CACHE_NAME = 'smart-crop-advisor-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/data/advisory-rules.json',
];

const DYNAMIC_CACHE = 'dynamic-v1';

// Install event - cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Some assets may not exist yet, ignore errors
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and chrome-extension
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

    // For API calls - network only, no cache
    if (url.pathname.startsWith('/api/') || url.port === '5000') {
        event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), { headers: { 'Content-Type': 'application/json' } })));
        return;
    }

    // For everything else - network first, fallback to cache
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    // Return offline fallback for navigation requests
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// Background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-logs') {
        event.waitUntil(syncPendingLogs());
    }
});

async function syncPendingLogs() {
    // Sync logic handled by the app
    const clients = await self.clients.matchAll();
    clients.forEach((client) => client.postMessage({ type: 'SYNC_REQUESTED' }));
}
