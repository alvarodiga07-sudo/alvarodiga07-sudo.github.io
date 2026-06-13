// AI engine — WebLLM (browser, gratis) > Ollama (local) > Claude API (de pago)
import * as webllm from '@mlc-ai/web-llm';

const API_KEY_STORAGE = 'waddle_api_key';
const OLLAMA_URL = 'http://localhost:11434';
const WEBLLM_MODEL = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

const ENV_KEY = import.meta.env.VITE_ANTHROPIC_KEY || '';
export const getApiKey = () => localStorage.getItem(API_KEY_STORAGE) || ENV_KEY;
export const setApiKey = (key) => localStorage.setItem(API_KEY_STORAGE, key);
export const hasApiKey = () => !!getApiKey();

// Singleton engine para no recargar el modelo cada vez
let _engine = null;
let _engineLoading = false;

export async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const data = await res.json();
    return data.models || [];
  } catch {
    return null;
  }
}

export async function detectAI() {
  // 1. WebLLM siempre disponible (gratis, en el navegador)
  if (typeof window !== 'undefined' && webllm) {
    return { provider: 'webllm' };
  }
  // 2. Ollama local
  const models = await checkOllama();
  if (models?.length > 0) {
    const model = models.find(m => m.name.includes('llama') || m.name.includes('mistral')) || models[0];
    return { provider: 'ollama', model: model.name };
  }
  // 3. Claude API
  if (hasApiKey()) return { provider: 'claude' };
  return { provider: 'none' };
}

// Inicializa WebLLM con callback de progreso
export async function initWebLLM(onProgress) {
  if (_engine) return _engine;
  if (_engineLoading) {
    // Espera a que termine la carga
    await new Promise(resolve => {
      const check = setInterval(() => {
        if (_engine) { clearInterval(check); resolve(); }
      }, 500);
    });
    return _engine;
  }

  _engineLoading = true;
  try {
    const engine = await webllm.CreateMLCEngine(WEBLLM_MODEL, {
      initProgressCallback: (progress) => {
        onProgress?.({
          text: progress.text,
          progress: progress.progress,
        });
      },
    });
    _engine = engine;
    return engine;
  } finally {
    _engineLoading = false;
  }
}

async function callWebLLM(prompt, onProgress) {
  const engine = await initWebLLM(onProgress);
  const reply = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a travel planner. Always respond with valid JSON only, no markdown, no extra text.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });
  const text = reply.choices[0].message.content;
  // Extraer JSON de la respuesta
  const match = text.match(/```json\s*([\s\S]*?)```/) ||
                text.match(/```\s*([\s\S]*?)```/) ||
                [null, text];
  return JSON.parse(match[1].trim());
}

async function callOllama(prompt, model) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000); // 40s timeout
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: model || 'llama3.2', prompt, stream: false, format: 'json' }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}`);
    const data = await res.json();
    return JSON.parse(data.response);
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(promptText) {
  const key = getApiKey();
  if (!key) throw new Error('NO_API_KEY');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000); // 55s timeout
  try {
    const res = await fetch('/ai-proxy/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-client-api-key': key },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 6000,
        system: 'Eres un planificador de viajes experto. Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin bloques de código markdown.',
        messages: [{ role: 'user', content: promptText }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('API_KEY_INVALID');
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Error ${res.status}`);
    }
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    // Extraer JSON con múltiples estrategias
    const match = text.match(/```json\s*([\s\S]*?)```/)
      || text.match(/```\s*([\s\S]*?)```/)
      || text.match(/(\{[\s\S]*\})/);
    if (!match) throw new Error('No JSON in response');
    return JSON.parse(match[1].trim());
  } finally {
    clearTimeout(timer);
  }
}

function getMonthSeason(dateStr) {
  if (!dateStr) return '';
  const month = new Date(dateStr).getMonth() + 1;
  if (month >= 3 && month <= 5) return 'primavera';
  if (month >= 6 && month <= 8) return 'verano';
  if (month >= 9 && month <= 11) return 'otoño';
  return 'invierno';
}

function buildPrompt(trip) {
  const { destination_country, destination_city, destination_cities, origin_country,
    _destCountryName, _originCountryName,
    duration_days, start_date, end_date, trip_type,
    travelers_count, preferences = {} } = trip;
  const { health_notes, interests, food_restrictions, food_experiences, priorities,
    age, companions, budget_type, budget_amount, accommodation_pref,
    flexible_dates, optimize_cost } = preferences;
  const days = Math.min(Number(duration_days) || 7, 10); // máx 10 días para no saturar el modelo
  const season = getMonthSeason(start_date);
  const destName = _destCountryName || destination_country;
  const originName = _originCountryName || origin_country;
  const cityList = Array.isArray(destination_cities) && destination_cities.length
    ? destination_cities.join(', ') : destination_city;
  const dest = cityList ? `${cityList} (${destName})` : destName;

  const budgetMap = {
    budget: 'económico — hostels, transporte público, comedores locales',
    mid: 'medio — hoteles 3★, restaurantes variados',
    comfort: 'confort — hoteles 4★, experiencias premium',
    luxury: 'lujo — hoteles 5★, restaurantes de autor, traslados privados'
  };

  const interestsList = Array.isArray(interests) ? interests.join(', ') : (interests || '');
  const foodList = Array.isArray(food_restrictions) ? food_restrictions.join(', ') : '';

  return `Eres un experto planificador de viajes. Crea un itinerario detallado de ${days} días para viajar de ${originName || 'España'} a ${dest}.

PERFIL DEL VIAJERO:
- Tipo de viaje: ${trip_type || 'ocio y turismo'}
- Viajeros: ${travelers_count || 1} persona(s)${age ? `, edad ${age}` : ''}${companions && companions !== 'solo' ? `, viajan en: ${companions}` : ''}
- Estación al viajar: ${season || 'no especificada'}${start_date ? ` (${start_date}${end_date ? ' al ' + end_date : ''})` : ''}
- Presupuesto: ${budgetMap[budget_type] || 'medio'}${budget_amount ? ` — total aproximado ${budget_amount}€` : ''}${optimize_cost ? ' — PRIORIZAR opciones económicas' : ''}
- Alojamiento: ${accommodation_pref || 'sin preferencia'}${flexible_dates ? ' — fechas flexibles para mejores precios' : ''}
${interestsList ? `- Intereses: ${interestsList}` : ''}
${foodList ? `- Dieta/restricciones: ${foodList}` : ''}
${health_notes ? `- Salud: ${health_notes}` : ''}

Ten en cuenta: clima de la zona en esa estación, festivos locales, temporada alta/baja, distancias entre lugares. Sugiere actividades REALES con nombres reales. Adapta el ritmo del día a los viajeros (familia con niños = más descansos, mochilero = más actividades, romántico = atardeceres y cenas especiales).

Responde ÚNICAMENTE con este JSON (sin texto adicional, sin markdown):

{"resumen":"2-3 frases que describan este viaje único","presupuesto_estimado":"rango total estimado para ${travelers_count || 1} persona(s)","clima_temporada":"clima esperado y qué llevar","mejor_epoca":"si es buen momento para ir y por qué","consejos_ahorro":["tip 1","tip 2","tip 3"],"dias":[{"dia":1,"titulo":"título atractivo del día","descripcion_dia":"resumen del día en 1 frase","actividades":[{"hora":"09:00","nombre":"nombre real del lugar","tipo":"visita|comida|transporte|ocio|compras","duracion":"2h","descripcion":"qué verás/harás","consejo":"tip local","coste":"gratis|~10€|~25€"}],"restaurantes":[{"comida":"desayuno|almuerzo|cena","nombre":"nombre real del restaurante","cocina":"tipo de cocina","precio":"€|€€|€€€","plato_estrella":"plato que pedir","descripcion":"por qué ir aquí"}],"alojamiento_zona":"zona/barrio recomendado para dormir","nota_del_dia":"consejo especial del día"}],"info_practica":{"moneda":"moneda local y cambio aprox desde €","visado":"requisitos para ciudadanos de ","transporte_local":"cómo moverse dentro de ${dest}","transporte_desde_origen":"cómo llegar desde : vuelos directos, escalas","idioma":"idioma oficial y 5 frases útiles","seguridad":"nivel de seguridad y zonas a evitar","sanidad":"vacunas recomendadas y cobertura médica","propina":"costumbre de propinas","apps_utiles":["app - para qué sirve"]},"vuelos":{"mejor_momento_comprar":"cuándo comprar para mejores precios","aerolineas_recomendadas":["aerolínea - ruta"],"precio_aproximado":"rango por persona ida y vuelta","consejo_vuelo":"tip específico para este destino","url_busqueda":"https://www.skyscanner.es"},"hoteles":{"zona_recomendada":"mejor zona y motivo","tipo_recomendado":"tipo de alojamiento ideal","precio_noche":"rango por noche","hoteles_sugeridos":["nombre hotel - por qué"],"url_busqueda":"https://www.booking.com/searchresults.es.html?ss=${encodeURIComponent((cityList || destName || '').replace(/[()]/g,''))}"}}

IMPORTANTE: genera exactamente ${days} objetos en "dias". Todo en español.`;
}

import { generateLocalItinerary } from './itineraryGenerator';

// Genera el itinerario completo. Estrategia:
// 1. Generador LOCAL (instantáneo, gratis, datos reales) → SIEMPRE produce resultado.
// 2. Si hay una API de pago configurada y con créditos, intenta mejorarlo.
//    (Ollama/WebLLM locales son demasiado lentos/débiles para JSON complejo,
//     así que el local curado da mejor experiencia y nunca se cuelga.)
export async function generateItinerary(tripData, onProgress) {
  // Base local SIEMPRE disponible — esto garantiza que el usuario reciba su itinerario
  const localResult = generateLocalItinerary(tripData);

  // Si hay API key de Claude (de pago, con créditos), intentar enriquecer
  if (hasApiKey()) {
    try {
      const aiResult = await callClaude(buildPrompt(tripData));
      // Validar que el resultado de IA tenga la estructura mínima esperada
      if (aiResult && Array.isArray(aiResult.dias) && aiResult.dias.length > 0) {
        return { ...aiResult, _source: 'claude' };
      }
    } catch (e) {
      // Sin créditos / error → usar el local (no lanzar, no colgar)
      console.info('IA externa no disponible, usando generador local:', e.message);
    }
  }

  return localResult;
}
