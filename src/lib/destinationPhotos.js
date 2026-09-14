// Foto real de un destino, sin necesitar ninguna clave de API: usa el resumen
// público de Wikipedia (REST API, sin autenticación, gratis) y se queda con la
// miniatura del artículo. Se cachea en localStorage (30 días) para no repetir
// la petición cada vez que se abre la pantalla.
const CACHE_KEY = 'waddle_destination_photos_v1';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; }
}
function writeCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* almacenamiento lleno o bloqueado: no pasa nada */ }
}

// query: normalmente "Ciudad, País" — Wikipedia suele resolverlo bien tal cual.
export async function fetchDestinationPhoto(query) {
  const key = query.trim().toLowerCase();
  const cache = readCache();
  const hit = cache[key];
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.url;

  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('sin resumen');
    const data = await res.json();
    const url = data?.thumbnail?.source || null;
    // Pide una versión más grande que la miniatura por defecto (~320px) recortando el tamaño en la URL.
    const bigUrl = url ? url.replace(/\/\d+px-/, '/640px-') : null;
    cache[key] = { url: bigUrl, t: Date.now() };
    writeCache(cache);
    return bigUrl;
  } catch {
    cache[key] = { url: null, t: Date.now() };
    writeCache(cache);
    return null;
  }
}
