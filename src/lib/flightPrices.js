// Cliente para la Aviasales Data API (precios reales de mercado, vía proxy de
// Supabase — ver supabase/functions/flight-prices). Best-effort: si no hay
// Supabase configurado, si la función no está desplegada, o si no hay datos
// para esa ruta, devuelve null y el generador local sigue con su estimación
// por fórmula. Nunca bloquea ni lanza: el itinerario siempre se genera.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig';

const TIMEOUT_MS = 3000;

// La Data API devuelve data: [{ origin, destination, value (=precio), depart_date,
// return_date, gate, number_of_changes, ... }]. OJO: el precio está en `value`.
export async function fetchRealFlightPrice(originIata, destIata, currency = 'eur') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !originIata || !destIata) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Slug de la Edge Function en Supabase (el nombre auto-generado al desplegarla).
    const url = `${SUPABASE_URL}/functions/v1/clever-api?origin=${originIata}&destination=${destIata}&currency=${currency}`;
    // La anon key es pública y va en la cabecera porque las Edge Functions de
    // Supabase verifican el JWT por defecto (si no, responderían 401).
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) return null;

    // Nos quedamos con el más barato encontrado (el precio está en `value`)
    const priced = json.data.filter(d => typeof d.value === 'number' && d.value > 0);
    if (priced.length === 0) return null;
    const cheapest = priced.reduce((min, d) => (d.value < min.value ? d : min), priced[0]);
    return {
      price: cheapest.value,
      currency: json.currency || currency,
      sampleSize: priced.length,
    };
  } catch {
    return null; // timeout, red caída, función no desplegada, etc. — nunca rompe el flujo
  } finally {
    clearTimeout(timeout);
  }
}
