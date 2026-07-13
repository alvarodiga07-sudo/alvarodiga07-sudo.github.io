// Service worker de Waddle — instalable + funciona sin conexión.
// No precacheamos la lista de archivos (los nombres cambian en cada build,
// mantener esa lista a mano se rompería solo). En su lugar: cacheamos sobre
// la marcha lo que el usuario va visitando (runtime caching), así que la
// segunda visita a cualquier pantalla ya funciona sin red.
const CACHE = 'waddle-v1';
const OFFLINE_URL = '/app.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // no tocar Skyscanner, Booking, etc.

  // Navegación (abrir/recargar la app): red primero, caché si no hay conexión.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Todo lo demás (JS, CSS, imágenes, sellos, música): stale-while-revalidate
  // — responde con lo cacheado al instante si existe, y de fondo actualiza
  // la caché para la próxima vez.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request).then((res) => {
        if (res && res.status === 200) cache.put(request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
