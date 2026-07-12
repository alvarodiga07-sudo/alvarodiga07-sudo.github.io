// Monetización por afiliación (Travelpayouts) — el "revenue model" de Waddle.
// Cada reserva hecha a través de estos enlaces genera comisión al marker de la
// cuenta, SIN coste extra para el usuario (paga lo mismo que yendo directo).
export const TP_MARKER = '750118';   // Partner ID de la cuenta Travelpayouts
export const TP_TRS = '549541';      // Source id (trs) de la cuenta

// Aviasales es la marca propia de Travelpayouts: acepta el marker directamente
// en la URL de búsqueda (verificado en vivo), sin necesidad de generar enlaces
// en el panel. Formato de ruta: ORIGEN+DDMM+DESTINO+DDMM+nºadultos.
export function buildAviasalesSearchUrl({ oIata, dIata, start, end, travelers = 1 }) {
  if (!oIata || !dIata) return `https://www.aviasales.es/?marker=${TP_MARKER}`;
  const ddmm = (iso) => (iso ? iso.slice(8, 10) + iso.slice(5, 7) : '');
  const route = `${oIata.toUpperCase()}${ddmm(start)}${dIata.toUpperCase()}${ddmm(end)}${travelers}`;
  return `https://www.aviasales.es/search/${route}?marker=${TP_MARKER}&currency=eur`;
}

// Envoltura genérica tp.media para el resto de marcas (Booking, GetYourGuide...).
// Cada programa necesita su id (p) y campaign_id, que se obtienen generando UN
// enlace de ejemplo en el panel de Travelpayouts (Tools → Links → marca → Generate).
// Hasta tener esos ids, los enlaces van directos (funcionan, pero sin comisión).
const TP_PROGRAMS = {
  // ejemplo: booking: { p: '4939', campaign: '84' },
};

export function wrapAffiliate(url, programKey) {
  const prog = TP_PROGRAMS[programKey];
  if (!prog) return url; // sin ids todavía → enlace directo
  return `https://tp.media/r?marker=${TP_MARKER}&trs=${TP_TRS}&p=${prog.p}&campaign_id=${prog.campaign}&u=${encodeURIComponent(url)}`;
}
