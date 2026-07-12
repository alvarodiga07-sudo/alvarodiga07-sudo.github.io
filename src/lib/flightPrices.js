// Cliente para la Aviasales Data API (precios reales de mercado, vía proxy de
// Supabase — ver supabase/functions/flight-prices). Best-effort: si no hay
// Supabase configurado, si la función no está desplegada, o si no hay datos
// para esa ruta, devuelve null y el generador local sigue con su estimación
// por fórmula. Nunca bloquea ni lanza: el itinerario siempre se genera.
import { SUPABASE_URL } from './supabaseConfig';

const TIMEOUT_MS = 3000;

// data: [{ origin, destination, price, currency, depart_date, return_date, ... }]
export async function fetchRealFlightPrice(originIata, destIata, currency = 'eur') {
  if (!SUPABASE_URL || !originIata || !destIata) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${SUPABASE_URL}/functions/v1/flight-prices?origin=${originIata}&destination=${destIata}&currency=${currency}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) return null;

    // Nos quedamos con el más barato encontrado
    const cheapest = json.data.reduce((min, d) => (d.price < min.price ? d : min), json.data[0]);
    return {
      price: cheapest.price,
      currency: json.currency || currency,
      sampleSize: json.data.length,
    };
  } catch {
    return null; // timeout, red caída, función no desplegada, etc. — nunca rompe el flujo
  } finally {
    clearTimeout(timeout);
  }
}
