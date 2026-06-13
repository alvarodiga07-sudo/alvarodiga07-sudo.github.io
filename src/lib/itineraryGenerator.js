// ─────────────────────────────────────────────────────────────────────────
// Generador de itinerarios LOCAL — instantáneo, gratis, siempre funciona.
// Produce el mismo JSON que esperaría una IA, con datos reales curados.
// ─────────────────────────────────────────────────────────────────────────
import {
  CITY_ATTRACTIONS, CITY_FOOD, getRegion, getRegionData, getCurrency,
  getCityIata, getOriginIata,
} from './destinationData';
import { COUNTRY_FACTS as ALL_COUNTRY_FACTS, REGION_DEFAULTS } from './countryFacts';

// Helper: obtiene datos del país (específicos sobrescriben región)
function getCountryFacts(countryCode, region) {
  const regionDefault = REGION_DEFAULTS[region] || REGION_DEFAULTS.europa_oeste;
  const specific = ALL_COUNTRY_FACTS[countryCode] || {};
  // Merge: las claves del país sobrescriben las de la región
  return { ...regionDefault, ...specific };
}

// Precios concretos por comida y nivel (€/persona) — reemplaza los €€€ (#8)
const MEAL_PRICES = {
  budget:  { desayuno:'3-6€', almuerzo:'7-12€', cena:'10-16€' },
  mid:     { desayuno:'6-10€', almuerzo:'15-25€', cena:'25-40€' },
  comfort: { desayuno:'10-18€', almuerzo:'30-50€', cena:'50-80€' },
  luxury:  { desayuno:'20-35€', almuerzo:'60-100€', cena:'120-250€' },
};

// Traducción de la alergia para comunicarla en destino (#11)
const ALLERGY_LABELS = {
  vegetarian:'vegetariano', vegan:'vegano', gluten_free:'sin gluten (celíaco)',
  halal:'halal', kosher:'kosher', nuts:'alergia a frutos secos', seafood:'alergia al marisco',
  lactose:'intolerancia a la lactosa',
};

// Frase para comunicar alergia en el idioma local del destino
const ALLERGY_PHRASE = {
  asia_oriental:'Lleva una tarjeta traducida al japonés/chino con tu alergia: muchos restaurantes no hablan inglés.',
  sudeste_asia:'El cacahuete es MUY común aquí. Lleva tu alergia escrita en el idioma local y avisa siempre.',
  oriente_medio:'Pide siempre que te confirmen los ingredientes; el sésamo (tahini) está en casi todo.',
  africa_norte:'Los frutos secos son habituales en la repostería. Confirma siempre antes de pedir.',
  europa_sur:'En España e Italia la ley obliga a indicar alérgenos: pídelos por escrito.',
  default:'Lleva tu alergia escrita en el idioma local y comunícala en CADA restaurante.',
};

// Formatea fecha a YYMMDD para Skyscanner
function toSkyDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = String(d.getFullYear()).slice(2);
  return `${y}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

const SEASONS = {
  primavera: { months:[3,4,5], climate:'templado y agradable, ideal para pasear', pack:'capas ligeras y una chaqueta fina' },
  verano:    { months:[6,7,8], climate:'caluroso, perfecto para playa pero con multitudes', pack:'ropa ligera, protección solar y agua' },
  otoño:     { months:[9,10,11], climate:'fresco y dorado, menos turistas y buenos precios', pack:'capas y un impermeable ligero' },
  invierno:  { months:[12,1,2], climate:'frío, ambiente acogedor y precios bajos', pack:'abrigo, gorro y calzado impermeable' },
};

function getSeason(dateStr) {
  if (!dateStr) return 'primavera';
  const m = new Date(dateStr).getMonth() + 1;
  for (const [name, s] of Object.entries(SEASONS)) if (s.months.includes(m)) return name;
  return 'primavera';
}

// Presupuesto base por persona/día según nivel (€) - más realista
const BUDGET_DAILY = {
  budget:  { hotel: 50,  food: 30, activities: 20, transport: 12 },
  mid:     { hotel: 100, food: 50, activities: 40, transport: 20 },
  comfort: { hotel: 180, food: 90, activities: 70, transport: 35 },
  luxury:  { hotel: 400, food: 160, activities: 120, transport: 50 },
};

// Multiplicadores de coste por país (destinos caros pagan sobrecosto)
const COUNTRY_COST_MULTIPLIER = {
  // Muy caros (1.5x - 2x)
  'BS': 1.8, 'MV': 1.9, 'CH': 1.6, 'NO': 1.5, 'IS': 1.5, 'SG': 1.5, 'AU': 1.4, 'NZ': 1.4,
  // Caros (1.2x - 1.4x)
  'GB': 1.3, 'FR': 1.2, 'IT': 1.2, 'ES': 1.1, 'DE': 1.1, 'US': 1.3, 'JP': 1.2, 'KR': 1.1,
  // Precio normal (1x)
  'PT': 1.0, 'GR': 1.0, 'PL': 0.95, 'CZ': 0.95, 'HU': 0.95, 'RO': 0.9,
  // Muy baratos (0.6x - 0.9x)
  'TH': 0.7, 'VN': 0.7, 'ID': 0.75, 'IN': 0.7, 'MA': 0.8, 'EG': 0.75,
};

const HOTEL_ZONES = {
  'Tokio':'Shinjuku o Shibuya (bien conectados)', 'Kioto':'cerca de la estación o Gion',
  'Roma':'cerca de Termini o Trastevere', 'París':'Le Marais o Barrio Latino',
  'Madrid':'Sol, Malasaña o Chamberí', 'Barcelona':'Eixample o Gótico',
  'Londres':'Soho, Covent Garden o South Bank', 'Bangkok':'Sukhumvit o Riverside',
  'Estambul':'Sultanahmet o Beyoğlu', 'Nueva York':'Midtown o Lower Manhattan',
  'Marrakech':'un riad en la Medina', 'Lisboa':'Baixa, Chiado o Alfama',
};

// ─── Datos prácticos VERAZ por país (revisado contra fuentes oficiales) ───
const COUNTRY_FACTS = {
  // ÁFRICA
  DZ:{
    visa:'Visado obligatorio para españoles. Solicita en consulado con 4-6 semanas. Aprox. 85€.',
    health:'Vacunas recomendadas (Sanidad Exterior): hepatitis A, fiebre tifoidea y rabia si vas a zonas rurales. NO requiere fiebre amarilla salvo si vienes de zona endémica. Bebe SOLO agua embotellada.',
    safety:'Evita zonas fronterizas con Mali, Níger y Libia (recomendación MAE España). En ciudades principales (Argel, Orán) el nivel es aceptable pero mantén precaución habitual.',
    language:'Árabe argelino (dárija) y bereber oficiales. Francés muy extendido. Inglés limitado.',
    plug:'Enchufe tipo C/F (europeo, 230V). No necesitas adaptador desde España.',
    tip:'Propina del 5-10% en restaurantes; no obligatoria.',
  },
  MA:{
    visa:'No se requiere visado para españoles (estancias hasta 90 días). Pasaporte con 6 meses de validez.',
    health:'Recomendable hepatitis A y fiebre tifoidea. No exige vacunas obligatorias desde España.',
    safety:'País seguro para turistas. Vigila carteristas en zocos; regatea con calma y nunca aceptes "guías" callejeros sin licencia.',
    language:'Árabe y bereber oficiales; francés muy extendido; inglés en zonas turísticas.',
    plug:'Tipo C/E (230V) — mismo que España.',
    tip:'10% en restaurantes turísticos; pequeñas propinas en cafés y a porteadores.',
  },
  EG:{
    visa:'Visado obligatorio. Se puede obtener a la llegada (25 USD) o e-Visa online. Pasaporte con 6 meses de validez.',
    health:'Hepatitis A, fiebre tifoidea recomendadas. La fiebre amarilla solo si vienes de zona endémica. Bebe agua embotellada SIEMPRE.',
    safety:'Sigue avisos del MAE: evita Sinaí (excepto Sharm) y zonas fronterizas. El Cairo y Luxor seguros con precaución habitual.',
    language:'Árabe egipcio; inglés en zonas turísticas y hoteles.',
    plug:'Tipo C/F (220V) — mismo que España.',
    tip:'Baksheesh (propina) es cultural: 10-15% restaurantes, pequeñas cantidades a porteadores, guías, taxistas.',
  },
  // ASIA
  TH:{
    visa:'Sin visado para españoles hasta 30 días (turismo). Pasaporte 6 meses validez.',
    health:'Hepatitis A obligatoria; tifoidea y dengue recomendadas. Bebe SOLO agua embotellada o tratada. Repelente con DEET para dengue/Zika.',
    safety:'Muy seguro para turistas. Cuidado con estafas (taxis sin taxímetro, tuk-tuks que te llevan a tiendas), cuida la bebida.',
    language:'Tailandés; inglés básico en zonas turísticas.',
    plug:'Tipo A/B/C (220V) — desde España necesitarás adaptador para tipo A/B.',
    tip:'No es obligatoria; en restaurantes nice 10%, redondear en taxis.',
  },
  JP:{
    visa:'Sin visado para españoles hasta 90 días.',
    health:'Sin vacunas obligatorias. Sistema sanitario excelente pero MUY caro: seguro de viaje imprescindible.',
    safety:'Uno de los países más seguros del mundo. Puedes andar de noche tranquilamente.',
    language:'Japonés; inglés MUY limitado fuera de hoteles. Google Translate con cámara es tu aliado.',
    plug:'Tipo A (100V) — necesitas adaptador desde España. Carga lentamente.',
    tip:'NO se da propina. Es considerada de mala educación. Servicio incluido siempre.',
  },
  VN:{
    visa:'Visado obligatorio. E-visa online (25 USD, 90 días) o on-arrival. Pasaporte 6 meses validez.',
    health:'Hepatitis A, tifoidea recomendadas. Encefalitis japonesa si vas más de 1 mes a zona rural. Solo agua embotellada.',
    safety:'Seguro para turistas. Tráfico caótico — extrema precaución cruzando calles. Carteristas en Hanói y Ho Chi Minh.',
    language:'Vietnamita; inglés básico en zonas turísticas.',
    plug:'Tipo A/C/G (220V) — adaptador necesario para A y G.',
    tip:'No obligatoria; 5-10% en restaurantes turísticos.',
  },
  IN:{
    visa:'Visado obligatorio. E-visa online (25-80 USD según duración).',
    health:'OBLIGATORIO: hepatitis A, tifoidea. Recomendado: hepatitis B, rabia (si zonas rurales), encefalitis japonesa. Malaria en zonas específicas. SOLO agua embotellada precintada.',
    safety:'Cuidado con estafas turísticas (especialmente Delhi, Jaipur). Mujeres viajando solas: extrema precaución, viaja en transporte privado.',
    language:'Hindi e inglés oficiales; inglés muy extendido.',
    plug:'Tipo C/D/M (230V) — adaptador necesario para D.',
    tip:'10% en restaurantes; pequeñas cantidades en hoteles y servicios.',
  },
  ID:{
    visa:'Visado de turista on-arrival 35 USD (30 días, prorrogable). Pasaporte 6 meses.',
    health:'Hepatitis A, tifoidea. Riesgo de dengue: usa repelente con DEET. Bali: cuidado con "Bali belly" (diarrea del viajero).',
    safety:'Seguro en general. Vigila scooters y conducción. Volcanes activos — sigue instrucciones locales.',
    language:'Bahasa Indonesia; inglés en zonas turísticas de Bali.',
    plug:'Tipo C/F (230V) — igual que España.',
    tip:'10% restaurantes; 10.000 IDR a porteadores.',
  },
  // EUROPA
  PT:{
    visa:'Schengen — sin visado para españoles.',
    health:'Sin vacunas necesarias. Sistema sanitario público accesible con TSE.',
    safety:'Muy seguro. Vigila carteristas en tranvía 28 de Lisboa.',
    language:'Portugués; español e inglés muy extendidos.',
    plug:'Tipo C/F (230V) — igual que España.',
    tip:'No obligatoria; redondear o 10% en restaurantes nice.',
  },
  IT:{
    visa:'Schengen — sin visado.',
    health:'Sin vacunas. Sistema sanitario con TSE válida.',
    safety:'Seguro. Carteristas en metro Roma y trenes turísticos. Atención a "amigos" que regalan rosas o pulseras (estafa).',
    language:'Italiano; inglés moderado en zonas turísticas.',
    plug:'Tipo C/F/L (230V) — adaptador puede ser necesario para tipo L.',
    tip:'"Coperto" (cubierto) en la cuenta ya cubre servicio. Propina opcional 5-10%.',
  },
  GR:{
    visa:'Schengen.',
    health:'Sin vacunas. TSE válida.',
    safety:'Muy seguro. En islas, alquila moto con permiso A1 mínimo (multas altas).',
    language:'Griego; inglés muy extendido en turismo.',
    plug:'Tipo C/F (230V).',
    tip:'10% restaurantes; redondear en taxis.',
  },
  TR:{
    visa:'No se requiere visado para españoles hasta 90 días.',
    health:'Sin vacunas obligatorias. Hepatitis A recomendada para zonas rurales. Bebe agua embotellada.',
    safety:'Estambul y costa muy seguros. Evita zonas fronterizas con Siria e Irak.',
    language:'Turco; inglés moderado en turismo.',
    plug:'Tipo C/F (230V).',
    tip:'10-15% restaurantes turísticos; redondear taxis.',
  },
  // AMÉRICAS
  MX:{
    visa:'No requiere visado hasta 180 días. Pasaporte vigente.',
    health:'Hepatitis A recomendada. Cuidado con agua del grifo (solo embotellada). Repelente para Zika/dengue en zonas tropicales.',
    safety:'Zonas turísticas (Cancún, CDMX centro, Oaxaca) seguras. Evita zonas señaladas por MAE (algunos estados del norte y Guerrero).',
    language:'Español; inglés en zonas turísticas.',
    plug:'Tipo A/B (127V) — adaptador necesario desde España. Tensión más baja.',
    tip:'10-15% restaurantes; obligatoria por ley en algunos sitios.',
  },
  PE:{
    visa:'Sin visado hasta 90 días.',
    health:'Hepatitis A, tifoidea. Fiebre amarilla OBLIGATORIA si vas a la selva (Iquitos, Madre de Dios). Mal de altura en Cusco: aclimatación y coca.',
    safety:'Seguro en zonas turísticas. Carteristas en Lima.',
    language:'Español y quechua.',
    plug:'Tipo A/C (220V) — adaptador para tipo A.',
    tip:'10% en restaurantes.',
  },
};

const FLIGHT_TIPS = {
  budget:  'Reserva con 6-8 semanas de antelación, vuela entre semana y considera aeropuertos secundarios.',
  mid:     'Reserva con 4-6 semanas de antelación; martes y miércoles suelen ser más baratos.',
  comfort: 'Vuelos directos en horario cómodo; considera tarifas flexibles.',
  luxury:  'Vuelos directos en business; reserva con asientos premium.',
};

function pad(n) { return String(n).padStart(2, '0'); }

// Genera una franja horaria realista
function timeSlots(activityCount) {
  const base = ['09:00','11:00','13:00','15:00','17:00','19:00','21:00'];
  return base.slice(0, activityCount);
}

// Reparte un array de forma equilibrada entre N días
function distribute(items, days) {
  const out = Array.from({ length: days }, () => []);
  items.forEach((item, i) => out[i % days].push(item));
  return out;
}

export function generateLocalItinerary(trip) {
  const {
    destination_country, destination_country_code, destination_cities = [], destination_city,
    origin_country, origin_country_code, _originCountryName, _destCountryName,
    duration_days, start_date, end_date, trip_type,
    travelers_count = 1, preferences = {},
  } = trip;
  const originName = _originCountryName || origin_country || 'tu país';

  // Códigos para IATA / deep-links (el wizard pasa el código en estos campos)
  const destCode = destination_country_code || destination_country;
  const originCode = origin_country_code || origin_country;

  const days = Math.max(1, Math.min(Number(duration_days) || 5, 21));
  const region = getRegion(destCode);
  const regionData = getRegionData(destCode);
  const season = getSeason(start_date);
  const seasonInfo = SEASONS[season];
  const travelers = Number(travelers_count) || 1;
  // Datos veraces específicos del país + fallback por región (TODOS los países cubiertos)
  const facts = getCountryFacts(destCode, region);

  const budgetType = preferences.budget_type || 'mid';
  const priorities = preferences.priorities || {}; // {hotel:0-100, food, activities, transport}
  const interests = preferences.interests || [];
  const foodPrefs = preferences.food_experiences || [];

  // ── Alergias / dieta (#11) ──
  const diet = (preferences.diet || []).filter(d => d && d !== 'none');
  const allergyNames = diet.map(d => ALLERGY_LABELS[d] || d);
  const hasAllergies = allergyNames.length > 0;
  const allergyPhrase = ALLERGY_PHRASE[region] || ALLERGY_PHRASE.default;
  const mealPrices = MEAL_PRICES[budgetType] || MEAL_PRICES.mid;

  // ── Ciudades a visitar ──
  let cities = destination_cities.length ? destination_cities : (destination_city ? [destination_city] : []);
  // Si no hay ciudades, buscar las que tengan datos curados para el país
  if (!cities.length) {
    cities = Object.keys(CITY_ATTRACTIONS).filter(c => trip._countryCities?.includes(c));
  }
  if (!cities.length) cities = [destination_city || 'la capital'];

  // ── Recolectar atracciones reales de las ciudades ──
  let pool = [];
  cities.forEach(city => {
    const attractions = CITY_ATTRACTIONS[city];
    if (attractions) {
      attractions.forEach(a => pool.push({ ...a, city }));
    }
  });

  // Filtrar/priorizar por intereses si los hay
  if (interests.length && pool.length > days * 2) {
    const interestMap = {
      museums:['museo'], history:['monumento'], nature:['naturaleza','mirador'],
      beaches:['naturaleza'], food:['experiencia'], nightlife:['barrio','ocio'],
      shopping:['ocio','experiencia'], art:['museo'], photography:['mirador','monumento'],
    };
    const wantedTypes = new Set(interests.flatMap(i => interestMap[i] || []));
    if (wantedTypes.size) {
      pool.sort((a, b) => (wantedTypes.has(b.t) ? 1 : 0) - (wantedTypes.has(a.t) ? 1 : 0));
    }
  }

  const hasCurated = pool.length > 0;

  // ── Presupuesto desglosado ──
  const base = BUDGET_DAILY[budgetType] || BUDGET_DAILY.mid;
  // Ajustar según prioridades del usuario (0-100, 50 = neutral)
  // Aplicar multiplicador de coste por país (Bahamas es cara, Bangkok es barata)
  const countryMultiplier = COUNTRY_COST_MULTIPLIER[destCode] || 1.0;

  const adj = (key) => {
    const p = priorities[key];
    if (p == null) return 1;
    return 0.6 + (p / 100) * 0.8; // 0.6x a 1.4x
  };
  const daily = {
    hotel: Math.round(base.hotel * adj('hotel') * countryMultiplier),
    food: Math.round(base.food * adj('food') * countryMultiplier),
    activities: Math.round(base.activities * adj('activities') * countryMultiplier),
    transport: Math.round(base.transport * adj('transport') * countryMultiplier),
  };
  const perPersonDay = daily.hotel + daily.food + daily.activities + daily.transport;
  // Vuelos: también ajustados por destino
  const flightEstBase = { budget: 180, mid: 350, comfort: 650, luxury: 1500 }[budgetType] || 350;
  // Equipaje: cabina (incluido en low-cost), facturada (+30-60€), ambos (+60-80€)
  const luggage = preferences.luggage || 'cabin';
  const luggageExtra = luggage === 'checked' ? 50 : luggage === 'both' ? 70 : 0;
  const flightEst = Math.round(flightEstBase * countryMultiplier + luggageExtra);
  const totalLow = Math.round((perPersonDay * days + flightEst) * travelers * 0.85);
  const totalHigh = Math.round((perPersonDay * days + flightEst) * travelers * 1.2);

  const priceTag = budgetType === 'budget' ? '€' : budgetType === 'mid' ? '€€' : budgetType === 'comfort' ? '€€€' : '€€€€';

  // ── Construir días ──
  const cityForDay = (i) => cities[Math.floor(i / Math.ceil(days / cities.length)) % cities.length];
  const buckets = hasCurated ? distribute(pool, days) : Array.from({ length: days }, () => []);

  // ─── Generación de días RICOS y detallados ───
  // Cada día tiene: tema, frase del día, plan minuto a minuto (mañana → noche),
  // restaurantes (desayuno + almuerzo + café/merienda + cena), zona dormir,
  // cómo moverse, qué llevar, qué fotografiar, alternativa lluvia, presupuesto día
  const dayThemes = [
    'Primer contacto e imprescindibles',
    'Ruta clásica monumental',
    'Mercados, sabores y barrios locales',
    'Naturaleza y aire libre',
    'Vida moderna y barrios alternativos',
    'Día de museos y arte',
    'Excursión / día completo fuera',
    'Compras, café y tiempo libre',
    'Día gastronómico y enoturismo',
    'Atardeceres y miradores',
    'Día de descanso o playa',
    'Cultura local y tradiciones',
  ];

  const dias = [];
  for (let i = 0; i < days; i++) {
    const dayNum = i + 1;
    const city = cityForDay(i);
    const acts = buckets[i] || [];
    const isFirst = i === 0;
    const isLast = i === days - 1;
    const cityFood = CITY_FOOD[city] || regionData.food;

    // ─── Tema del día ───
    const tema = isFirst ? 'Llegada y primer contacto'
               : isLast ? 'Despedida y últimas vistas'
               : dayThemes[i % dayThemes.length];

    // ─── Plan completo del día (mañana → noche) ───
    const planDia = [];

    // 1. DESAYUNO (cualquier día menos llegada)
    if (!isFirst) {
      planDia.push({
        hora: '08:30',
        franja: 'mañana',
        nombre: `Desayuno en la zona`,
        tipo: 'comida',
        duracion: '45min',
        descripcion: `Desayuno tranquilo cerca del hotel. Si tu alojamiento no incluye desayuno, busca una panadería/cafetería local.`,
        consejo: 'Los locales suelen desayunar más tarde que los turistas — verás los sitios auténticos llenos a las 9-10h.',
        coste: mealPrices.desayuno,
      });
    } else {
      planDia.push({
        hora: '12:00',
        franja: 'mañana',
        nombre: `Check-in en hotel y orientación`,
        tipo: 'logistica',
        duracion: '1h30',
        descripcion: `Llegada al alojamiento, deshacer maleta y pequeño paseo de reconocimiento por el barrio.`,
        consejo: 'Cambia algo de moneda en el aeropuerto solo lo mínimo. Mejor en cajeros del centro.',
        coste: 'Gratis',
      });
    }

    // 2. MAÑANA (actividad principal — la más importante)
    const morningAct = acts[0];
    if (morningAct) {
      planDia.push({
        hora: isFirst ? '14:30' : '09:30',
        franja: 'mañana',
        nombre: morningAct.n,
        tipo: morningAct.t === 'museo' ? 'visita' : morningAct.t === 'naturaleza' ? 'naturaleza' : 'visita',
        duracion: morningAct.dur,
        descripcion: morningAct.desc,
        consejo: morningAct.tip,
        coste: morningAct.cost,
        prioridad: 'imprescindible',
      });
    } else if (!isFirst) {
      planDia.push({
        hora: '09:30',
        franja: 'mañana',
        nombre: `Centro histórico de ${city}`,
        tipo: 'visita',
        duracion: '2h',
        descripcion: `Recorrido por las calles y monumentos principales del casco antiguo.`,
        consejo: 'Empieza temprano: menos calor, menos colas, mejores fotos.',
        coste: 'Gratis',
      });
    }

    // 3. ALMUERZO
    planDia.push({
      hora: isFirst ? '15:30' : '13:30',
      franja: 'mediodía',
      nombre: `Almuerzo: ${cityFood[i % cityFood.length]}`,
      tipo: 'comida',
      duracion: '1h15',
      descripcion: hasAllergies
        ? `Restaurante con buena relación calidad-precio. Avisa de tu ${allergyNames.join(' y ')} al pedir.`
        : `Comida tradicional. Busca un sitio con gente local: garantía de autenticidad y precio justo.`,
      consejo: 'Pide el menú del día o el plato del día: mejor calidad y precio que la carta para turistas.',
      coste: mealPrices.almuerzo,
    });

    // 4. TARDE (actividad secundaria)
    const afternoonAct = acts[1];
    if (afternoonAct) {
      planDia.push({
        hora: '16:00',
        franja: 'tarde',
        nombre: afternoonAct.n,
        tipo: afternoonAct.t === 'museo' ? 'visita' : afternoonAct.t === 'barrio' ? 'paseo' : 'visita',
        duracion: afternoonAct.dur,
        descripcion: afternoonAct.desc,
        consejo: afternoonAct.tip,
        coste: afternoonAct.cost,
      });
    } else if (!isFirst) {
      const exp = regionData.experiences[i % regionData.experiences.length];
      planDia.push({
        hora: '16:00',
        franja: 'tarde',
        nombre: exp,
        tipo: 'experiencia',
        duracion: '2h',
        descripcion: `Vive una experiencia muy típica de esta región: ${exp.toLowerCase()}.`,
        consejo: 'Pregunta a los locales o al recepcionista del hotel — sus recomendaciones suelen ser oro.',
        coste: budgetType === 'budget' ? '5-15€' : budgetType === 'mid' ? '15-30€' : '30-60€',
      });
    }

    // 5. CAFÉ / MERIENDA (descanso)
    planDia.push({
      hora: '18:00',
      franja: 'tarde',
      nombre: `Café o merienda en una cafetería con encanto`,
      tipo: 'descanso',
      duracion: '45min',
      descripcion: `Descanso para reponer fuerzas. Café/té + algo dulce típico de la zona.`,
      consejo: 'Busca cafeterías de barrio, no las turísticas de la plaza principal: precios el doble.',
      coste: budgetType === 'budget' ? '3-6€' : '5-10€',
    });

    // 6. ATARDECER (3ª actividad o mirador)
    const sunsetAct = acts[2];
    if (sunsetAct) {
      planDia.push({
        hora: '19:00',
        franja: 'atardecer',
        nombre: sunsetAct.n,
        tipo: 'mirador',
        duracion: sunsetAct.dur,
        descripcion: sunsetAct.desc,
        consejo: `${sunsetAct.tip} La hora dorada (1h antes del ocaso) es perfecta para fotos.`,
        coste: sunsetAct.cost,
      });
    } else {
      planDia.push({
        hora: '19:00',
        franja: 'atardecer',
        nombre: `Atardecer en mirador/paseo`,
        tipo: 'mirador',
        duracion: '1h',
        descripcion: `Busca un mirador, una azotea o un paseo elevado para ver el atardecer.`,
        consejo: 'Pregunta al hotel: cada ciudad tiene su sitio "secreto" para ver el atardecer.',
        coste: 'Gratis',
      });
    }

    // 7. CENA
    planDia.push({
      hora: '21:00',
      franja: 'noche',
      nombre: `Cena: ${cityFood[(i+1) % cityFood.length]}`,
      tipo: 'comida',
      duracion: '1h30',
      descripcion: hasAllergies
        ? `Cena con calma. Reserva con antelación. ${allergyPhrase}`
        : `Reserva con 1-2 días de antelación, sobre todo en temporada alta. Pide la especialidad de la casa.`,
      consejo: 'Mira reseñas recientes; los sitios "de toda la vida" de las guías a veces han bajado calidad.',
      coste: mealPrices.cena,
    });

    // 8. OPCIONAL NOCTURNO (no en último día)
    if (!isLast && !isFirst) {
      const nightOptions = [
        'Copa en azotea con vistas',
        'Concierto de música local',
        'Paseo nocturno por iluminación de monumentos',
        'Bar tradicional con música en vivo',
        'Visita a barrio bohemio nocturno',
      ];
      planDia.push({
        hora: '23:00',
        franja: 'noche',
        nombre: nightOptions[i % nightOptions.length],
        tipo: 'opcional',
        duracion: '1h-2h',
        descripcion: 'Opcional. Si te queda energía y quieres exprimir el día, esta es una buena última parada.',
        consejo: 'Salta esta parte si vienes con niños o tienes madrugón al día siguiente.',
        coste: budgetType === 'budget' ? '8-15€' : '15-30€',
        opcional: true,
      });
    }

    // ─── Restaurantes (info adicional, complementa el plan) ───
    const restaurantes = [
      { comida:'desayuno', nombre:`Cafetería/panadería local`, cocina:'desayuno típico', precio: mealPrices.desayuno, plato_estrella: regionData.food[0], descripcion:'Si no incluye en el hotel, busca panaderías locales — más auténtico y barato.' },
      { comida:'almuerzo', nombre:`Restaurante local en ${city}`, cocina: regionData.food[0], precio: mealPrices.almuerzo, plato_estrella: cityFood[i % cityFood.length], descripcion: hasAllergies ? `Pide opciones ${allergyNames.join('/')}.` : 'Cocina local donde comen los habitantes — calidad/precio óptimo.' },
      { comida:'cena', nombre:`Restaurante recomendado en ${city}`, cocina: regionData.food[(i+1) % regionData.food.length], precio: mealPrices.cena, plato_estrella: cityFood[(i+1) % cityFood.length], descripcion: hasAllergies ? allergyPhrase : 'Reserva con antelación. Para celebrar, pregunta por el plato del día.' },
    ];

    // ─── Datos prácticos del día ───
    const movimiento = budgetType === 'budget'
      ? `Andando + transporte público. Calcula 15-25 min entre paradas.`
      : budgetType === 'luxury'
      ? `Conductor privado o taxis VTC entre puntos. 5-15 min entre paradas.`
      : `Mix andando + metro/bus + algún taxi para distancias largas o con calor.`;

    const queLlevar = [
      seasonInfo.pack,
      'Botella de agua reutilizable',
      i % 3 === 0 ? 'Calzado cómodo (vais a andar mucho)' : 'Documentación + tarjeta',
      hasAllergies ? `Tarjeta de alergia traducida` : 'Móvil cargado + powerbank',
    ];

    const queFotografiar = isFirst
      ? ['Llegada y primera vista panorámica', 'Hotel desde fuera', 'Detalle del barrio donde duermes']
      : isLast
      ? ['Última foto en el lugar favorito', 'Última comida típica', 'Selfie de despedida con la ciudad de fondo']
      : [
          morningAct?.n || 'Atracción de la mañana',
          'Calle típica camino del almuerzo',
          'Atardecer desde el mirador',
        ];

    const alternativaLluvia = morningAct?.t === 'museo'
      ? 'Tu plan ya es interior — perfecto.'
      : 'Cambia la actividad de exterior por un museo cercano, un centro comercial con encanto o una visita a una iglesia/catedral importante.';

    // Tip cultural del día (rotativo)
    const tipsCulturales = [
      `En ${_destCountryName || cities[0]} es de buena educación saludar al entrar a tiendas y restaurantes.`,
      `Los horarios locales pueden diferir: muchos sitios cierran a la hora de la siesta o muy tarde la cocina.`,
      `Aprende a decir "gracias" en el idioma local — abre muchas puertas y sonrisas.`,
      `Lleva siempre algo de efectivo: muchas pequeñas tiendas y mercados no aceptan tarjeta.`,
      `Pregunta el precio ANTES de pedir si no está en la carta. Evita malentendidos.`,
      `Respeta las normas en lugares religiosos: hombros y rodillas cubiertos, móvil en silencio.`,
    ];

    // Frase poética del día
    const fraseDia = isFirst
      ? `Hoy todo es nuevo: cada calle es una sorpresa. Tómatelo con calma.`
      : isLast
      ? `Última oportunidad: lleva la cámara y disfruta sin prisa de los sitios favoritos.`
      : `Mañana cargada de imprescindibles, tarde de descubrimiento y noche para el alma de la ciudad.`;

    dias.push({
      dia: dayNum,
      titulo: isFirst ? `Día 1 · Bienvenido a ${city}`
            : isLast ? `Día ${dayNum} · Hasta pronto, ${city}`
            : `Día ${dayNum} · ${tema}`,
      tema,
      frase_del_dia: fraseDia,
      descripcion_dia: planDia.slice(1, 4).map(a => a.nombre).filter(Boolean).join(' → '),
      actividades: planDia,
      restaurantes,
      alojamiento_zona: HOTEL_ZONES[city] || `zona céntrica de ${city}`,
      como_moverse: movimiento,
      que_llevar: queLlevar.filter(Boolean),
      que_fotografiar: queFotografiar,
      alternativa_lluvia: alternativaLluvia,
      tip_cultural: tipsCulturales[i % tipsCulturales.length],
      presupuesto_dia: `~${daily.food + daily.activities + daily.transport}€/persona (comidas + actividades + transporte)`,
      nota_del_dia: isFirst
        ? '📌 Llegada: check-in, cambia algo de moneda local y haz un paseo tranquilo para orientarte. No te exijas demasiado el primer día.'
        : isLast
        ? '📌 Último día: deja tiempo para compras de recuerdos y para llegar con 2-3h de margen al aeropuerto.'
        : '📌 Tip: no quieras verlo todo. Es mejor disfrutar 3 cosas bien que correr a por 10.',
    });
  }

  // ── Consejos premium, específicos y realistas (#9) ──
  const consejos = [
    budgetType === 'budget'
      ? `Compra una tarjeta de transporte recargable nada más llegar a ${cities[0]}: amortiza desde el 2º día y evita pagar de más en cada trayecto.`
      : budgetType === 'luxury'
      ? 'Contrata un conductor privado por jornada completa: por poco más que varios taxis tienes flexibilidad total y un guía local de facto.'
      : `Combina transporte público para el centro y algún taxi/VTC para los traslados con maleta o de noche.`,
    season === 'verano'
      ? `Vas en temporada alta: reserva las atracciones top con franja horaria YA y planifica las visitas exteriores a primera hora (antes de las 11h) para esquivar calor y colas.`
      : season === 'invierno'
      ? 'Aprovecha la temporada baja: precios de hotel un 30-40% más bajos y monumentos casi vacíos, pero confirma los horarios reducidos de invierno.'
      : 'Reserva las entradas estrella online la semana antes: en temporada media las franjas buenas vuelan los fines de semana.',
    hasAllergies
      ? `IMPORTANTE con tu ${allergyNames.join(' y ')}: ${allergyPhrase} Guarda en el móvil el teléfono de emergencias local y la ubicación del hospital más cercano a tu hotel.`
      : 'Lleva siempre algo de efectivo en moneda local: muchos sitios pequeños y mercados no aceptan tarjeta.',
    priorities.food > 60
      ? 'Reserva con 1-2 semanas los 2-3 restaurantes que de verdad te importen; los mejores no improvisan mesa, sobre todo para cenar.'
      : 'Evita los restaurantes con carta en 6 idiomas y camarero captando clientes en la puerta: casi siempre son trampa para turistas.',
  ];

  const cityList = cities.join(', ');
  const tripTypeLabel = {
    leisure:'de ocio', adventure:'de aventura', romantic:'romántico', family:'en familia',
    cultural:'cultural', gastronomy:'gastronómico', nature:'de naturaleza', work:'de trabajo',
  }[trip_type] || '';

  // ── Total por persona y total del grupo (#10) ──
  const perPersonTotal = perPersonDay * days + flightEst;
  const groupTotal = perPersonTotal * travelers;

  // ── Deep-links prácticos (#7) ──
  const depDate = toSkyDate(start_date);
  const retDate = toSkyDate(end_date);
  const oIata = getOriginIata(originCode);
  const dIata = getCityIata(cities[0]);
  const skyUrl = (oIata && dIata && depDate && retDate)
    ? `https://www.skyscanner.es/transport/flights/${oIata.toLowerCase()}/${dIata.toLowerCase()}/${depDate}/${retDate}/?adults=${travelers}&currency=EUR`
    : `https://www.skyscanner.es/transporte/vuelos-a/${(dIata||cities[0]).toLowerCase()}/`;
  const bookingUrl = `https://www.booking.com/searchresults.es.html?ss=${encodeURIComponent(cities[0])}` +
    (start_date ? `&checkin=${start_date}` : '') + (end_date ? `&checkout=${end_date}` : '') +
    `&group_adults=${travelers}&no_rooms=${Math.max(1, Math.ceil(travelers/2))}&order=bayesian_review_score`;

  return {
    _source: 'local',
    resumen: `Un viaje ${tripTypeLabel} de ${days} días por ${cityList}. ${hasCurated ? 'Itinerario optimizado con los imprescindibles' : 'Itinerario diseñado'} para aprovechar al máximo tu tiempo, equilibrando lo esencial con momentos para descubrir a tu ritmo.`,
    // #10: total por persona Y total del grupo bien claros
    precio_total_persona: `${Math.round(perPersonTotal * 0.9)}€ - ${Math.round(perPersonTotal * 1.15)}€ por persona`,
    precio_total_grupo: travelers > 1 ? `${Math.round(groupTotal * 0.9)}€ - ${Math.round(groupTotal * 1.15)}€ en total (${travelers} personas)` : null,
    presupuesto_estimado: `${totalLow}€ - ${totalHigh}€ ${travelers>1?`(${travelers} personas)`:'(1 persona)'} · vuelos + ${days} noches + comidas y actividades`,
    desglose_presupuesto: {
      alojamiento: `${daily.hotel * days}€/persona (${daily.hotel}€/noche × ${days})`,
      comida: `${daily.food * days}€/persona (${daily.food}€/día)`,
      actividades: `${daily.activities * days}€/persona`,
      transporte: `${daily.transport * days}€/persona`,
      vuelos: `${flightEst}€/persona`,
    },
    clima_temporada: `En ${season} el clima en ${cities[0]} suele ser ${seasonInfo.climate}. Lleva ${seasonInfo.pack}.`,
    mejor_epoca: `${season.charAt(0).toUpperCase() + season.slice(1)} es ${season==='verano'?'temporada alta: más ambiente pero más caro y concurrido':season==='invierno'?'temporada baja: mejores precios y menos gente, con horarios reducidos':'temporada media: buen equilibrio entre clima, precio y afluencia'}.`,
    consejos_ahorro: consejos,
    vuelos: {
      mejor_momento_comprar: FLIGHT_TIPS[budgetType] || FLIGHT_TIPS.mid,
      precio_aproximado: `${Math.round(flightEst*0.8)}€ - ${Math.round(flightEst*1.3)}€ ida y vuelta por persona desde ${originName} (incluye ${luggage === 'cabin' ? 'solo cabina' : luggage === 'checked' ? 'maleta facturada' : 'cabina + facturada'})`,
      equipaje: luggage === 'cabin'
        ? `Solo cabina: ahorrarás 30-60€ por trayecto en low-cost (Ryanair/Vueling). Comprueba medidas: máx 40×20×25cm bajo asiento gratis; 55×40×20cm en cabina paga 10-15€.`
        : luggage === 'checked'
        ? `Maleta facturada (23kg): añade 30-50€/trayecto. Reserva online (en aeropuerto cuesta el doble). Etiqueta con datos y cinta de colores para identificarla rápido.`
        : `Cabina + facturada: precio del vuelo incluye ambos (~70€ extra/trayecto). Mete lo imprescindible en cabina por si se pierde la facturada.`,
      consejo_vuelo: dIata
        ? `Para ${cities[0]} (${dIata}), activa alertas de precio 2 meses antes. Vuelos directos suelen costar más pero ahorran medio día de viaje.`
        : `Compara llegar a ${cities[0]} con aeropuertos cercanos: a veces volar a otra ciudad y un tren sale más a cuenta.`,
      aerolineas_recomendadas: ['Filtra por "directo" en Skyscanner', 'Compara precio final CON el equipaje que necesitas, no solo la tarifa base'],
      url_busqueda: skyUrl,
    },
    hoteles: {
      zona_recomendada: HOTEL_ZONES[cities[0]] || `zona céntrica y bien comunicada de ${cities[0]}`,
      tipo_recomendado: { budget:'Hostels y guesthouses con nota >8.5', mid:'Hoteles 3★ o apartamentos enteros', comfort:'Hoteles boutique de 4★ bien ubicados', luxury:'Hoteles 5★, resorts o riads de lujo' }[budgetType],
      precio_noche: `${Math.round(daily.hotel*0.8)}€ - ${Math.round(daily.hotel*1.3)}€/noche`,
      hoteles_sugeridos: [`Prioriza la ${HOTEL_ZONES[cities[0]] || 'zona céntrica'} para ir caminando a todo`, 'Filtra: nota >8.5, "cancelación gratuita" y desayuno incluido'],
      url_busqueda: bookingUrl,
    },
    dias,
    info_practica: {
      moneda: `${getCurrency(destCode)}. Saca efectivo en cajeros del banco (evita los de aeropuerto y casas de cambio: peores comisiones).`,
      visado: facts.visa,
      transporte_local: `En ${cities[0]} descarga el mapa de metro/bus offline y una app de VTC local. Para varios días, los abonos de transporte salen muy a cuenta.`,
      transporte_desde_origen: `Vuelo${cities.length>1?"s":""} hasta ${cities[0]}${dIata?` (${dIata})`:''}. Reserva el traslado oficial aeropuerto-centro antes de coger un taxi a puerta.`,
      idioma: facts.language,
      seguridad: facts.safety,
      sanidad: hasAllergies
        ? `${facts.health} Con tu ${allergyNames.join(' y ')}, lleva tu medicación de rescate en el equipaje de mano y una tarjeta con la alergia traducida.`
        : facts.health,
      propina: facts.tip,
      enchufe: facts.plug,
      agua: facts.water,
      conduccion: facts.drive,
      apps_utiles: ['Google Maps (mapa offline)', 'Google Translate (idioma offline)', 'XE Currency (cambio real)', 'Booking / Airbnb', hasAllergies ? 'AllergyTranslation (tarjetas de alergia)' : 'GetYourGuide (entradas y tours)'],
    },
  };
}
