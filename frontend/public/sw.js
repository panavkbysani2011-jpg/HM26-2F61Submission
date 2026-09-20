// CivicMesh Progressive Web App Service Worker
// Version: 1.0.0
// Offline-first caching for App Shell, Local Leaflet Assets, OpenStreetMap Tiles & Google Fonts

const SHELL_CACHE = 'civicmesh-shell-v1';
const TILES_CACHE = 'civicmesh-tiles-v1';
const FONTS_CACHE = 'civicmesh-fonts-v1';
const STATIC_CACHE = 'civicmesh-static-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/vendor/leaflet/leaflet.css',
  '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet/marker-icon.png',
  '/vendor/leaflet/marker-icon-2x.png',
  '/vendor/leaflet/marker-shadow.png'
];

// Offline map tile placeholder (256x256 SVG clean grid)
const OFFLINE_TILE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#18181b"/>
  <path d="M 0,0 L 256,0 L 256,256 L 0,256 Z" fill="none" stroke="#27272a" stroke-width="1"/>
  <line x1="0" y1="0" x2="256" y2="256" stroke="#27272a" stroke-width="0.5" stroke-dasharray="4,4"/>
  <line x1="256" y1="0" x2="0" y2="256" stroke="#27272a" stroke-width="0.5" stroke-dasharray="4,4"/>
  <rect x="48" y="108" width="160" height="40" rx="6" fill="#27272a" opacity="0.85"/>
  <text x="128" y="133" dominant-baseline="middle" text-anchor="middle" fill="#a1a1aa" font-family="sans-serif" font-size="11" font-weight="600">Offline Area</text>
</svg>`;

// Limit cache size helper (LRU eviction)
async function trimCache(cacheName, maxItems = 400) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (e) {
    // Non-critical cache cleanup failure
  }
}

// 1. Install Event: Precache Core App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Precache what is currently available
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          // Continue caching remaining assets even if one is missing in dev mode
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean old caches & claim clients
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, TILES_CACHE, FONTS_CACHE, STATIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and non-http/https requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // A. Map Tiles (OpenStreetMap & CartoDB)
  if (
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('basemaps.cartocdn.com') ||
    url.pathname.includes('/tile/')
  ) {
    event.respondWith(
      caches.open(TILES_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
            trimCache(TILES_CACHE, 400);
          }
          return networkResponse;
        } catch (err) {
          // Offline fallback tile
          return new Response(OFFLINE_TILE_SVG, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      })
    );
    return;
  }

  // B. Google Fonts (Style Sheets and Font Files)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(FONTS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. Unpkg CDN Leaflet fallback caching (if ever accessed from CDN)
  if (url.hostname === 'unpkg.com' && url.pathname.includes('leaflet')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          // Fallback to local vendor file if network fails
          if (url.pathname.endsWith('.css')) {
            const localCss = await caches.match('/vendor/leaflet/leaflet.css');
            if (localCss) return localCss;
          }
          if (url.pathname.endsWith('.js')) {
            const localJs = await caches.match('/vendor/leaflet/leaflet.js');
            if (localJs) return localJs;
          }
        }
      })
    );
    return;
  }

  // D. App Shell & Vite Bundled Assets (/assets/*, .js, .css, etc.)
  if (
    request.mode === 'navigate' ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/vendor/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    event.respondWith(
      caches.match(request).then(async (cachedResponse) => {
        // Stale-while-revalidate for local assets
        const fetchPromise = fetch(request).then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(
              request.mode === 'navigate' ? SHELL_CACHE : STATIC_CACHE
            );
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If navigation fails offline, serve root index.html from cache
          if (request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
          return null;
        });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // E. Default: Network with Cache Fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. Message Events
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
