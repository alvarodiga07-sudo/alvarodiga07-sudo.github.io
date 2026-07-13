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

// ── Marcas "Ready-made by brands" (2026-07-13) ──
// Estas NO pasan por tp.media: cada una redirige DIRECTO a su propio dominio
// (o red de afiliación propia) con su parámetro de tracking. Los valores salen
// de resolver los enlaces tpk.mx que genera el panel de Travelpayouts (Tools →
// Ready-made by brands → marca) — son fijos por cuenta, no caducan por click.
// Verificado en vivo (navegador real) que cada uno mantiene el tracking y
// llega a la página correcta: Kiwi, Klook (con &query= de la ciudad), AutoEurope
// (home), Welcome Pickups (sightseeing_rides/cities, su única landing real).
const DIRECT_TRACKING = {
  kiwi: 'affilid=travelpayoutsdeeplink_alvarodiga07-sudo.github.io_bc834da1a4c148fca59dc065b-750118',
  welcomepickups: 'aff_track_id=395451969c214782b2e208837-750118&utm_source=travelpayouts',
  klook: 'aid=api%7C13694%7C418eadb83cb9427ea552298c4-750118%7Cpid%7C750118',
  autoeurope: 'aff=travelpayoutseu&sub_id=c1ff31f5a79e4-750118',
};

export function wrapDirect(url, key) {
  const qs = DIRECT_TRACKING[key];
  if (!qs) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
}

// Airalo va por Impact.com (pxf.io), una red de afiliados distinta — el
// tracking se registra en SU dominio, no en airalo.com. Verificado en vivo que
// el parámetro u= hace de "deep link": redirige con tracking a la página
// concreta del eSIM del país (en vez de al catálogo genérico de la app).
export function buildAiraloAffiliateUrl(destinationUrl) {
  return `https://airalo.pxf.io/c/1209822/1471169/15608?sharedID=750118_&subId1=ff3b51e80a99442d8317eb729-750118&u=${encodeURIComponent(destinationUrl)}`;
}
