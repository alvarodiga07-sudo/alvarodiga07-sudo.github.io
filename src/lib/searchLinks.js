// Construye los enlaces de búsqueda (vuelos/hoteles/extras) AL MOMENTO desde los
// datos del viaje. Antes las URLs se congelaban dentro de ai_itinerary al generarlo,
// así que los viajes antiguos llevaban enlaces sin fechas/viajeros. Calculándolos
// aquí, TODOS los viajes (viejos y nuevos) abren las webs con fechas, nº de
// personas y filtro de presupuesto ya puestos.
import { getCityIata, getOriginIata } from './destinationData';
import { COUNTRIES } from './countries';

// Rango de precio POR NOCHE (habitación/alojamiento entero) según nivel de presupuesto.
// Se usa en los filtros de Booking y Airbnb. Rangos amplios a propósito: filtrar
// demasiado fino esconde resultados y frustra más de lo que ayuda.
const NIGHTLY_BUDGET = {
  budget:  { min: 0,   max: 90 },
  mid:     { min: 50,  max: 180 },
  comfort: { min: 120, max: 350 },
  luxury:  { min: 250, max: 0 }, // sin tope
};

export function buildSearchLinks(trip) {
  if (!trip) return null;
  const city = trip.destination_city || (Array.isArray(trip.destination_cities) ? trip.destination_cities[0] : '') || '';
  const destCode = trip.destination_country;
  const originCode = trip.origin_country;
  const start = trip.start_date || '';
  const end = trip.end_date || '';
  const travelers = Number(trip.travelers_count) || 1;
  const budgetType = trip.preferences?.budget_type || '';
  const nightly = NIGHTLY_BUDGET[budgetType];

  const destName = COUNTRIES.find(c => c.code === destCode)?.name || destCode || '';
  const originName = COUNTRIES.find(c => c.code === originCode)?.name || originCode || '';
  const oIata = getOriginIata(originCode);
  const dIata = getCityIata(city);

  // ── Vuelos ──
  const toSky = (d) => (d ? d.slice(2).replaceAll('-', '') : ''); // 2026-09-10 → 260910
  const skyscanner = (oIata && dIata && start && end)
    ? `https://www.skyscanner.es/transport/flights/${oIata.toLowerCase()}/${dIata.toLowerCase()}/${toSky(start)}/${toSky(end)}/?adults=${travelers}&currency=EUR`
    : `https://www.skyscanner.es/transporte/vuelos-a/${(dIata || city || destName).toLowerCase()}/`;
  const kiwi = (oIata && dIata)
    ? `https://www.kiwi.com/deep?from=${oIata.toUpperCase()}&to=${dIata.toUpperCase()}` +
      (start ? `&departure=${start}` : '') + (end ? `&return=${end}` : '')
    : `https://www.kiwi.com/es/`;
  const google = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `Vuelos a ${city || destName} desde ${originName}` + (start ? ` el ${start}` : '') + (end ? ` hasta el ${end}` : '')
  )}`;

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
  const airaloSlug = destName.toLowerCase().trim().replace(/\s+/g, '-');
  const extras = {
    actividades: { url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(city || destName)}`, marca: 'GetYourGuide', prellenado: true,
      desc: `Tours, entradas y experiencias en ${city || destName}, con cancelación gratuita.` },
    esim: { url: airaloSlug ? `https://www.airalo.com/${airaloSlug}-esim` : 'https://www.airalo.com/', marca: 'Airalo', prellenado: !!airaloSlug,
      desc: `Datos móviles desde que aterrizas, sin cambiar de tarjeta${destName ? ` (${destName})` : ''}.` },
    coches: { url: 'https://www.discovercars.com/', marca: 'DiscoverCars', prellenado: false,
      desc: 'Compara alquiler de coche con cancelación gratis.' },
    traslados: { url: 'https://www.welcomepickups.com/', marca: 'Welcome Pickups', prellenado: false,
      desc: 'Traslado del aeropuerto al hotel con conductor que te espera.' },
    transporte: { url: 'https://www.omio.com/', marca: 'Omio', prellenado: false,
      desc: 'Trenes, buses y ferris entre ciudades, comparados en un sitio.' },
    seguro: { url: 'https://www.heymondo.com/', marca: 'Heymondo', prellenado: false,
      desc: 'Seguro de viaje con cobertura médica y cancelación.' },
  };

  return {
    vuelos: { skyscanner, kiwi, google },
    hoteles: { booking, airbnb, expedia, hotelscom },
    extras,
  };
}
