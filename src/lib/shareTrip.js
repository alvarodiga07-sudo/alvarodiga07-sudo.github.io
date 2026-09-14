// Compartir viaje (#6): el viaje se guarda en la tabla "shared_trips" (lectura
// pública, sin necesidad de sesión) y el enlace solo lleva su id — corto y
// estable. Antes el viaje entero iba comprimido en la propia URL, pero al
// superar los ~20.000 caracteres apps como WhatsApp o Mensajes la truncaban o
// rompían al pegarla, dando "enlace no válido". Si no hay backend (modo local
// sin cuentas), se mantiene el viaje embebido en la URL como única alternativa.
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { supabase } from './supabaseClient';
import { isSupabaseEnabled } from './supabaseConfig';

// Solo los campos necesarios para mostrar/clonar el viaje — evita arrastrar IDs,
// notas privadas o fotos (que son URLs/blobs locales que no existen en otro dispositivo).
const SHARE_FIELDS = [
  'title', 'destination_country', 'destination_cities', 'destination_city',
  'origin_country', 'start_date', 'end_date', 'duration_days', 'trip_type',
  'travelers_count', 'preferences', 'ai_itinerary',
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildPayload(trip, permission) {
  const payload = { p: permission, v: 1 };
  for (const key of SHARE_FIELDS) payload[key] = trip[key];
  return payload;
}

export async function buildShareUrl(trip, permission = 'view') {
  const payload = buildPayload(trip, permission);
  const base = `${window.location.origin}${window.location.pathname}`;

  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from('shared_trips').insert({ body: payload }).select('id').single();
    if (error) throw error;
    return `${base}#/shared/${data.id}`;
  }
  return `${base}#/shared/${compressToEncodedURIComponent(JSON.stringify(payload))}`;
}

export async function fetchSharedTrip(idOrEncoded) {
  if (!idOrEncoded) return null;
  if (UUID_RE.test(idOrEncoded) && isSupabaseEnabled) {
    const { data, error } = await supabase.from('shared_trips').select('body').eq('id', idOrEncoded).maybeSingle();
    if (error || !data) return null;
    return data.body;
  }
  // Enlace del formato antiguo (viaje comprimido en la URL) — se mantiene por compatibilidad.
  try {
    const json = decompressFromEncodedURIComponent(idOrEncoded);
    if (!json) return null;
    const data = JSON.parse(json);
    return (data && typeof data === 'object') ? data : null;
  } catch {
    return null;
  }
}
