// Construye los enlaces de búsqueda (vuelos/hoteles/extras) AL MOMENTO desde los
// datos del viaje. Antes las URLs se congelaban dentro de ai_itinerary al generarlo,
// así que los viajes antiguos llevaban enlaces sin fechas/viajeros. Calculándolos
// aquí, TODOS los viajes (viejos y nuevos) abren las webs con fechas, nº de
// personas y filtro de presupuesto ya puestos.
import { getCityIata, getOriginIata } from './destinationData';
import { COUNTRIES } from './countries';
import { buildAviasalesSearchUrl, wrapAffiliate, wrapDirect, buildAiraloAffiliateUrl } from './affiliate';

// Rango de precio POR NOCHE (habitación/alojamiento entero) según nivel de presupuesto.
// Se usa en los filtros de Booking y Airbnb. Rangos amplios a propósito: filtrar
// demasiado fino esconde resultados y frustra más de lo que ayuda.
const NIGHTLY_BUDGET = {
  budget:  { min: 0,   max: 90 },
  mid:     { min: 50,  max: 180 },
  comfort: { min: 120, max: 350 },
  luxury:  { min: 250, max: 0 }, // sin tope
};

export function buildSearchLinks(trip, user) {
  if (!trip) return null;
  const city = trip.destination_city || (Array.isArray(trip.destination_cities) ? trip.destination_cities[0] : '') || '';
  const destCode = trip.destination_country;
  // Fallback al país de origen del perfil: algunos viajes (p.ej. "Destino
  // sorpresa" o viajes antiguos) nunca guardaron origin_country, y sin él
  // ningún enlace de vuelo puede prellenar fecha+origen+destino+pasajeros.
  const originCode = trip.origin_country || user?.country_of_origin;
  const start = trip.start_date || '';
  const end = trip.end_date || '';
  const travelers = Number(trip.travelers_count) || 1;
  const budgetType = trip.preferences?.budget_type || '';
  const nightly = NIGHTLY_BUDGET[budgetType];

  const destName = COUNTRIES.find(c => c.code === destCode)?.name || destCode || '';
  const originName = COUNTRIES.find(c => c.code === originCode)?.name || originCode || '';
  const oIata = getOriginIata(originCode);
  // CITY_IATA solo cubre ~120 ciudades turísticas curadas — para el resto de
  // países seleccionables (Armenia, Baréin...) cae al aeropuerto principal del
  // país (ORIGIN_IATA, que ya cubre los 119 países) en vez de dejarlo vacío.
  const dIata = getCityIata(city) || getOriginIata(destCode);

  // ── Vuelos ──
  const toSky = (d) => (d ? d.slice(2).replaceAll('-', '') : ''); // 2026-09-10 → 260910
  // Slug seguro para segmentos de URL en crudo (sin encodeURIComponent): sin
  // acentos, espacios como guiones — "Ciudad de México" sin esto rompía el
  // fallback (Skyscanner no abría directamente la página, url inválida).
  const slugify = (s) => (s || '')
    .normalize('NFD').replace(new RegExp('[̀-ͯ]', 'g'), '')
    .toLowerCase().trim().replace(/\s+/g, '-');
  // OJO: skyscanner.es traduce las rutas — /transport/flights/ da "página no
  // encontrada"; la ruta válida en el dominio español es /transporte/vuelos/.
  const skyscanner = (oIata && dIata && start && end)
    ? `https://www.skyscanner.es/transporte/vuelos/${oIata.toLowerCase()}/${dIata.toLowerCase()}/${toSky(start)}/${toSky(end)}/?adults=${travelers}&currency=EUR`
    : `https://www.skyscanner.es/transporte/vuelos-a/${slugify(dIata || city || destName)}/`;
  // Kiwi sí acepta pasajeros por URL con `adults` (verificado: muestra "2 Pasajeros").
  // Lleva tracking de afiliado (wrapDirect) → genera comisión por reserva.
  const kiwi = wrapDirect((oIata && dIata)
    ? `https://www.kiwi.com/deep?from=${oIata.toUpperCase()}&to=${dIata.toUpperCase()}` +
      (start ? `&departure=${start}` : '') + (end ? `&return=${end}` : '') + `&adults=${travelers}`
    : `https://www.kiwi.com/es/`, 'kiwi');
  // Google Flights parsea mejor la query en inglés con códigos IATA que en lenguaje natural español.
  const google = (oIata && dIata)
    ? `https://www.google.com/travel/flights?q=${encodeURIComponent(
        `flights from ${oIata} to ${dIata}` + (start ? ` on ${start}` : '') + (end ? ` through ${end}` : '')
      )}`
    : `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${city || destName}`)}`;

  // ── Hoteles ──
  // Booking: nflt=price%3DEUR-min-max-1 filtra por precio/noche (verificado en vivo).
  const bookingPrice = nightly
    ? `&nflt=${encodeURIComponent(`price=EUR-${nightly.min || 'min'}-${nightly.max || 'max'}-1`)}`
    : '';
  const booking = `https://www.booking.com/searchresults.es.html?ss=${encodeURIComponent(city || destName)}` +
    (start ? `&checkin=${start}` : '') + (end ? `&checkout=${end}` : '') +
    `&group_adults=${travelers}&no_rooms=${Math.max(1, Math.ceil(travelers / 2))}&order=bayesian_review_score` +
    bookingPrice;
  const airbnbPrice = nightly
    ? `${nightly.min ? `&price_min=${nightly.min}` : ''}${nightly.max ? `&price_max=${nightly.max}` : ''}`
    : '';
  const airbnb = `https://www.airbnb.es/s/${encodeURIComponent(city || destName)}/homes?` +
    (start ? `checkin=${start}&` : '') + (end ? `checkout=${end}&` : '') +
    `adults=${travelers}${airbnbPrice}`;
  const expedia = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(city || destName)}` +
    (start ? `&startDate=${start}` : '') + (end ? `&endDate=${end}` : '') + `&adults=${travelers}`;
  const hotelscom = `https://www.hotels.com/Hotel-Search?destination=${encodeURIComponent(city || destName)}` +
    (start ? `&startDate=${start}` : '') + (end ? `&endDate=${end}` : '') + `&adults=${travelers}`;

  // ── Extras ──
  // actividades/esim/traslados/coches llevan tracking de afiliado YA ACTIVO
  // (enlaces "Ready-made by brands" verificados en vivo, 2026-07-13). transporte
  // y seguro siguen directos: Omio y Heymondo no están aprobados en Travelpayouts
  // todavía (Heymondo directamente no está en su catálogo).
  const airaloSlug = slugify(destName);
  const extras = {
    actividades: { url: wrapDirect(`https://www.klook.com/search/?query=${encodeURIComponent(city || destName)}`, 'klook'), marca: 'Klook', prellenado: true,
      desc: `Tours, entradas y experiencias en ${city || destName}, con cancelación gratuita.` },
    esim: { url: buildAiraloAffiliateUrl(airaloSlug ? `https://www.airalo.com/${airaloSlug}-esim` : 'https://www.airalo.com/'), marca: 'Airalo', prellenado: !!airaloSlug,
      desc: `Datos móviles desde que aterrizas, sin cambiar de tarjeta${destName ? ` (${destName})` : ''}.` },
    coches: { url: wrapDirect('https://www.autoeurope.eu/', 'autoeurope'), marca: 'AutoEurope', prellenado: false,
      desc: 'Compara alquiler de coche con cancelación gratis.' },
    traslados: { url: wrapDirect('https://traveler.welcomepickups.com/en/sightseeing_rides/cities/', 'welcomepickups'), marca: 'Welcome Pickups', prellenado: false,
      desc: 'Traslados y rutas turísticas con conductor privado que te espera.' },
    transporte: { url: 'https://www.omio.com/', marca: 'Omio', prellenado: false,
      desc: 'Trenes, buses y ferris entre ciudades, comparados en un sitio.' },
    seguro: { url: 'https://www.heymondo.com/', marca: 'Heymondo', prellenado: false,
      desc: 'Seguro de viaje con cobertura médica y cancelación.' },
  };

  // Aviasales lleva el marker de afiliado → genera comisión por reserva.
  const aviasales = buildAviasalesSearchUrl({ oIata, dIata, start, end, travelers });

  return {
    vuelos: { aviasales, skyscanner, kiwi, google },
    hoteles: {
      booking: wrapAffiliate(booking, 'booking'),
      airbnb, // Airbnb no está en Travelpayouts — siempre directo
      expedia: wrapAffiliate(expedia, 'expedia'),
      hotelscom: wrapAffiliate(hotelscom, 'hotelscom'),
    },
    extras,
  };
}
