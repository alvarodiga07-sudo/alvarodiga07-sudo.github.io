// Compartir viaje SIN backend (#6): la app corre en modo local (AUTH_ENABLED=false
// en supabaseConfig.js, cada viaje vive en el localStorage del dispositivo), así
// que no existe ningún servidor donde alojar un viaje para que otro lo abra.
// La alternativa es meter el viaje entero, comprimido, en la propia URL — quien
// abre el enlace recibe una copia (no hay edición colaborativa en tiempo real:
// cada quien edita SU copia local, no la original).
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

// Solo los campos necesarios para mostrar/clonar el viaje — evita arrastrar IDs,
// notas privadas o fotos (que son URLs/blobs locales que no existen en otro dispositivo).
const SHARE_FIELDS = [
  'title', 'destination_country', 'destination_cities', 'destination_city',
  'origin_country', 'start_date', 'end_date', 'duration_days', 'trip_type',
  'travelers_count', 'preferences', 'ai_itinerary',
];

export function encodeSharedTrip(trip, permission = 'view') {
  const payload = { p: permission, v: 1 };
  for (const key of SHARE_FIELDS) payload[key] = trip[key];
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeSharedTrip(encoded) {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

export function buildShareUrl(trip, permission = 'view') {
  const encoded = encodeSharedTrip(trip, permission);
  return `${window.location.origin}${window.location.pathname}#/shared/${encoded}`;
}
