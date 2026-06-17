import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, X, Sparkles, Search, Check } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { generateItinerary, hasApiKey } from '@/lib/claudeAI';
import { getRegionData, CITY_ATTRACTIONS, CITIES_BY_COUNTRY } from '@/lib/destinationData';
import { format, addDays } from 'date-fns';

// Rangos de presupuesto seleccionables por nivel (#5)
const BUDGET_RANGES = {
  budget:  ['< 500€', '500-800€', '800-1200€'],
  mid:     ['1000-1500€', '1500-2500€', '2500-3500€'],
  comfort: ['3000-4500€', '4500-6000€', '6000-8000€'],
  luxury:  ['8000-12000€', '12000-20000€', '+20000€'],
};

const TRIP_TYPES = [
  { id:'leisure', label:'Ocio', icon:'🏖️' }, { id:'adventure', label:'Aventura', icon:'🧗' },
  { id:'romantic', label:'Romántico', icon:'💕' }, { id:'family', label:'Familiar', icon:'👨‍👩‍👧‍👦' },
  { id:'cultural', label:'Cultural', icon:'🏛️' }, { id:'gastronomy', label:'Gastronomía', icon:'🍽️' },
  { id:'nature', label:'Naturaleza', icon:'🌿' }, { id:'work', label:'Trabajo', icon:'💼' },
];

const BUDGETS = [
  { id:'budget', label:'Económico', desc:'~70€/día', icon:'🪙' },
  { id:'mid', label:'Intermedio', desc:'~150€/día', icon:'💳' },
  { id:'comfort', label:'Confort', desc:'~260€/día', icon:'⭐' },
  { id:'luxury', label:'Lujo', desc:'~560€/día', icon:'💎' },
];

// Categorías de gasto para el sistema de prioridades (#4)
const SPEND_CATEGORIES = [
  { id:'hotel', label:'Alojamiento', icon:'🏨', desc:'Dónde dormir' },
  { id:'food', label:'Comida', icon:'🍽️', desc:'Restaurantes y experiencias' },
  { id:'activities', label:'Actividades', icon:'🎟️', desc:'Tours, entradas, experiencias' },
  { id:'transport', label:'Transporte', icon:'🚕', desc:'Cómo moverte' },
];

const INTERESTS = [
  { id:'museums', label:'Museos', icon:'🏛️' }, { id:'history', label:'Historia', icon:'📜' },
  { id:'nature', label:'Naturaleza', icon:'🌿' }, { id:'beaches', label:'Playas', icon:'🏖️' },
  { id:'food', label:'Gastronomía', icon:'🍜' }, { id:'nightlife', label:'Vida nocturna', icon:'🎶' },
  { id:'shopping', label:'Compras', icon:'🛍️' }, { id:'art', label:'Arte', icon:'🎨' },
  { id:'photography', label:'Fotografía', icon:'📷' }, { id:'wellness', label:'Bienestar', icon:'🧘' },
  { id:'adventure', label:'Aventura', icon:'⛰️' }, { id:'local', label:'Vida local', icon:'🏘️' },
];

// Restricciones dietéticas (universales — sí aplican a todos los países)
const DIET = [
  { id:'none', label:'Sin restricciones', icon:'✅' }, { id:'vegetarian', label:'Vegetariano', icon:'🥗' },
  { id:'vegan', label:'Vegano', icon:'🌱' }, { id:'gluten_free', label:'Sin gluten', icon:'🌾' },
  { id:'halal', label:'Halal', icon:'☪️' }, { id:'kosher', label:'Kosher', icon:'✡️' },
  { id:'nuts', label:'Alergia frutos secos', icon:'🥜' }, { id:'seafood', label:'Alergia marisco', icon:'🦐' },
];

const COMPANIONS = [
  { id:'solo', label:'Solo', icon:'🧍' }, { id:'partner', label:'Pareja', icon:'💑' },
  { id:'friends', label:'Amigos', icon:'👯' }, { id:'family_kids', label:'Familia+niños', icon:'👨‍👩‍👧' },
  { id:'family_adults', label:'Familia', icon:'👨‍👩‍👦‍👦' }, { id:'colleagues', label:'Trabajo', icon:'💼' },
];

const STEPS = ['Destino','Fechas','Presupuesto','Viajeros','Tipo','Preferencias'];

const AI_MSGS = [
  '✈️ Analizando tu destino...', '🌤️ Consultando clima y temporada...',
  '🗺️ Diseñando la ruta perfecta...', '🍽️ Seleccionando los mejores restaurantes...',
  '🏛️ Eligiendo las atracciones imprescindibles...', '🏨 Buscando alojamiento ideal...',
  '💰 Ajustando todo a tu presupuesto...', '🎯 Finalizando tu itinerario...',
];

// ── Buscador de país con teclado ──
function CountrySearchSelect({ value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const selected = COUNTRIES.find(c => c.code === value);

  const filtered = query
    ? COUNTRIES.filter(c => c.name.toLowerCase().startsWith(query.toLowerCase()))
        .concat(COUNTRIES.filter(c => !c.name.toLowerCase().startsWith(query.toLowerCase()) && c.name.toLowerCase().includes(query.toLowerCase())))
    : COUNTRIES;

  useEffect(() => { if (!open) setQuery(''); }, [open]);
  useEffect(() => {
    const h = e => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="w-full h-11 rounded-xl border border-input bg-background px-3 flex items-center gap-2 text-sm text-left hover:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
        {selected ? <><span className="text-base">{selected.emoji}</span><span className="flex-1 truncate">{selected.name}</span></>
          : <span className="flex-1 text-muted-foreground">{placeholder}</span>}
        <span className="text-muted-foreground text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute z-50 top-12 left-0 right-0 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Escribe para buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-secondary rounded-lg outline-none" />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.code} type="button" onClick={() => { onChange(c.code); setOpen(false); }}
                className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-secondary text-left ${c.code === value ? 'bg-primary/10 font-semibold' : ''}`}>
                <span>{c.emoji}</span><span className="flex-1 truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, icon, selected, onClick }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40'}`}>
      <span>{icon}</span>{label}
    </motion.button>
  );
}

// Campo "Otros" — permite añadir necesidades personalizadas a cualquier grupo (#6)
function OtherInput({ values, onAdd, onRemove, placeholder }) {
  const [text, setText] = useState('');
  const add = () => { const t = text.trim(); if (t && !values.includes(t)) { onAdd(t); setText(''); } };
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder || 'Otros... (escribe y pulsa +)'}
          className="flex-1 h-9 px-3 text-xs rounded-full border border-dashed border-border bg-secondary/40 outline-none focus:border-primary" />
        <button type="button" onClick={add} className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">+</button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map(v => (
            <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
              {v}<button type="button" onClick={() => onRemove(v)} className="text-primary/60 hover:text-primary">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  // Pre-rellenar desde URL (cuando vienen desde "Personalizar" de un destino sugerido)
  const preCountry = searchParams.get('country');
  const preCity = searchParams.get('city');
  const preDays = searchParams.get('days');
  const preBudget = searchParams.get('budget');
  const preType = searchParams.get('type');
  const mode = searchParams.get('mode') || 'custom';
  const isSurprise = mode === 'surprise';

  const [step, setStep] = useState(0);
  const [aiMsg, setAiMsg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  const [form, setForm] = useState({
    origin_country:'', origin_city:'',
    destination_country: preCountry || '',
    destination_cities: preCity ? [preCity] : [],
    title:'', start_date:'', end_date:'',
    duration_days: preDays ? Number(preDays) : 7,
    budget_type: preBudget || '', budget_range:'', budget_amount:'',
    priorities:{ hotel:50, food:50, activities:50, transport:50 },
    travelers_count:1, age:25, companions:'solo', accommodation_pref:'',
    trip_type: preType || '',
    interests:[], diet:[], food_experiences:[], health_notes:'',
    custom_interests:[], custom_food:[], custom_diet:[],
    flexible_dates:false,
    luggage:'cabin', // 'cabin' | 'checked' | 'both'
    surprise_vibe:'', // para modo sorpresa: '' (random) | 'beach' | 'mountain' | 'city' | 'cultural' | 'exotic'
  });

  const addCustom = (key, val) => setForm(p => ({ ...p, [key]: [...p[key], val] }));
  const removeCustom = (key, val) => setForm(p => ({ ...p, [key]: p[key].filter(x => x !== val) }));

  const up = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);

  useEffect(() => {
    if (user) setForm(p => ({
      ...p,
      origin_country: p.origin_country || user.country_of_origin || '',
      age: p.age === 25 ? (user.age || 25) : p.age,
    }));
  }, [user]);

  // Fecha de vuelta automática
  useEffect(() => {
    if (form.start_date && form.duration_days >= 1) {
      try {
        const end = addDays(new Date(form.start_date), Number(form.duration_days) - 1);
        const f = format(end, 'yyyy-MM-dd');
        setForm(p => p.end_date !== f ? { ...p, end_date: f } : p);
      } catch {}
    }
  }, [form.start_date, form.duration_days]);

  const cityOptions = CITIES_BY_COUNTRY[form.destination_country] || [];
  const regionData = form.destination_country ? getRegionData(form.destination_country) : null;
  const countryName = COUNTRIES.find(c => c.code === form.destination_country)?.name || '';

  const toggle = (key, id) => setForm(p => ({
    ...p, [key]: p[key].includes(id) ? p[key].filter(x => x !== id) : [...p[key], id],
  }));

  const toggleCity = (city) => setForm(p => ({
    ...p, destination_cities: p.destination_cities.includes(city)
      ? p.destination_cities.filter(c => c !== city)
      : [...p.destination_cities, city],
  }));

  const canNext = () => {
    // En modo SORPRESA no se requiere destino — solo origen
    if (step === 0) return isSurprise ? form.origin_country : form.destination_country;
    if (step === 2) return form.budget_type;
    if (step === 4) return form.trip_type;
    return true;
  };

  // ─── Pool de destinos sorpresa según vibe y presupuesto ───
  const pickSurpriseDestination = () => {
    // Por vibe
    const pools = {
      beach:    [['MX','Cancún'],['TH','Phuket'],['GR','Santorini'],['ID','Bali'],['DO','Punta Cana'],['HR','Dubrovnik'],['IT','Sicilia'],['PT','Algarve']],
      mountain: [['CH','Zermatt'],['AT','Innsbruck'],['NP','Pokhara'],['IS','Reikiavik'],['PE','Cusco'],['NO','Bergen'],['ES','Granada'],['CA','Banff']],
      city:     [['JP','Tokio'],['US','Nueva York'],['GB','Londres'],['FR','París'],['SG','Singapur'],['NL','Ámsterdam'],['AE','Dubái'],['KR','Seúl']],
      cultural: [['EG','El Cairo'],['IT','Roma'],['JO','Petra'],['CN','Pekín'],['TR','Estambul'],['IN','Jaipur'],['GR','Atenas'],['MA','Fez']],
      exotic:   [['VN','Hanói'],['KH','Siem Riep'],['LK','Colombo'],['MA','Marrakech'],['ET','Lalibela'],['BO','Salar de Uyuni'],['KE','Nairobi'],['JO','Wadi Rum']],
      '':       [['PT','Lisboa'],['IT','Roma'],['GR','Santorini'],['TH','Bangkok'],['JP','Tokio'],['MA','Marrakech'],['MX','Ciudad de México'],['IS','Reikiavik'],['CO','Cartagena'],['VN','Hanói']],
    };
    const vibe = form.surprise_vibe || '';
    const pool = pools[vibe] || pools[''];
    // Filtrar por presupuesto si está definido
    let filtered = pool;
    if (form.budget_type === 'budget') {
      // Excluir destinos caros conocidos
      const expensive = new Set(['CH','NO','IS','SG','JP','GB','US','AE','MV','BS']);
      const cheap = pool.filter(([code]) => !expensive.has(code));
      if (cheap.length) filtered = cheap;
    } else if (form.budget_type === 'luxury') {
      const luxury = ['MV','CH','AE','JP','US','MC','MV'];
      const lux = pool.filter(([code]) => luxury.includes(code));
      if (lux.length) filtered = lux;
    }
    // Elegir aleatorio del pool filtrado
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  const handleCreate = async () => {
    // Para generar itinerarios con IA hace falta conectar una clave de Anthropic (Claude).
    // Si no hay clave, mostramos la explicación en vez de generar.
    if (!hasApiKey()) {
      setShowKeyPrompt(true);
      return;
    }
    try {
      setLoading(true); setAiMsg(0);

      // En modo SORPRESA: elegir destino al vuelo
      let destinationCountry = form.destination_country;
      let destinationCities = form.destination_cities;
      let destinationCity = form.destination_cities[0] || '';
      if (isSurprise && !destinationCountry) {
        const [code, city] = pickSurpriseDestination();
        destinationCountry = code;
        destinationCity = city;
        destinationCities = [city];
      }

      const countryData = COUNTRIES.find(c => c.code === destinationCountry);
      const originData = COUNTRIES.find(c => c.code === form.origin_country);

      const payload = {
        title: form.title || (isSurprise ? `🎲 Sorpresa: ${countryData?.name}` : `Viaje a ${countryData?.name}`),
        destination_country: destinationCountry,
        destination_cities: destinationCities,
        destination_city: destinationCity,
        origin_country: form.origin_country,
        start_date: form.start_date, end_date: form.end_date,
        trip_type: form.trip_type, status:'planning',
        travelers_count: Number(form.travelers_count),
        duration_days: Number(form.duration_days),
        preferences: {
          budget_type: form.budget_type, budget_range: form.budget_range, budget_amount: form.budget_amount,
          priorities: form.priorities,
          interests: [...form.interests, ...form.custom_interests],
          diet: [...form.diet, ...form.custom_diet],
          food_experiences: [...form.food_experiences, ...form.custom_food],
          health_notes: form.health_notes,
          age: Number(form.age), companions: form.companions,
          accommodation_pref: form.accommodation_pref,
          flexible_dates: form.flexible_dates,
          luggage: form.luggage,
        },
      };

      const interval = setInterval(() => setAiMsg(m => (m + 1) % AI_MSGS.length), 600);

      // Generador (local instantáneo + IA si hay créditos) — nunca se cuelga.
      // IMPORTANTE: pasar el CÓDIGO del país (JP) que el generador local necesita
      // para región/moneda; los nombres legibles van como campos extra para Claude.
      const ai = await generateItinerary({
        ...payload, // destination_country = código "JP", origin_country = código
        _destCountryName: countryData?.name,
        _originCountryName: originData?.name || form.origin_country,
      }, () => {});
      clearInterval(interval);

      if (ai) payload.ai_itinerary = ai;

      const trip = await base44.entities.Trip.create(payload);

      if (countryData) {
        await base44.entities.PassportStamp.create({
          country_code: form.destination_country, country_name: countryData.name,
          trip_id: trip.id, visit_date: form.start_date || new Date().toISOString().split('T')[0],
        });
        const visited = user?.countries_visited || [];
        if (!visited.includes(form.destination_country))
          await base44.auth.updateMe({ countries_visited: [...visited, form.destination_country] });
      }

      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['stamps'] });
      setLoading(false);
      navigate(`/trip/${trip.id}`);
    } catch (e) {
      console.error('Error creando viaje:', e);
      setLoading(false);
      if (e?.code === 'STORAGE_FULL' || /STORAGE_FULL/.test(e?.message)) {
        alert('El almacenamiento de este navegador está lleno y no se pudo guardar el viaje.\n\nLibera espacio borrando algún viaje antiguo en "Mis viajes" e inténtalo de nuevo.');
      } else {
        alert('Hubo un error creando el viaje. Inténtalo de nuevo.');
      }
    }
  };

  // ── Pantalla de carga ──
  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center gap-6">
      <div className="w-24 h-24 relative">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
          <motion.circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
            strokeDasharray="251" strokeLinecap="round"
            animate={{ strokeDashoffset: [251, 0] }} transition={{ duration: 4, repeat: Infinity }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">✈️</div>
      </div>
      <div className="max-w-xs">
        <h2 className="text-xl font-bold text-foreground mb-2">Creando tu itinerario</h2>
        <AnimatePresence mode="wait">
          <motion.p key={aiMsg} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="text-sm text-muted-foreground">{AI_MSGS[aiMsg]}</motion.p>
        </AnimatePresence>
      </div>
    </div>
  );

  // Modal: pedir conectar la clave de Claude para generar con IA
  if (showKeyPrompt) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-md">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Conecta Claude para generar tu viaje</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Waddle crea tus itinerarios con la IA de Claude (Anthropic). Solo tienes que conectar tu
          clave <strong>una vez</strong>; se guarda en tu dispositivo y los costes corren por tu cuenta de Anthropic.
        </p>

        <div className="bg-muted/50 rounded-2xl p-4 text-left text-sm space-y-1.5 mb-5">
          <p className="font-semibold text-foreground">Cómo conseguir tu clave (2 min):</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Entra en <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline font-medium">console.anthropic.com</a> y crea tu cuenta</li>
            <li>Ve a <strong>API Keys</strong> → <strong>Create Key</strong></li>
            <li>Copia la clave (empieza por <code>sk-ant-</code>)</li>
            <li>Pégala en <strong>Ajustes</strong> de Waddle y guarda</li>
          </ol>
          <p className="text-muted-foreground pt-1">💡 En Anthropic puedes fijar un límite de gasto para no gastar de más.</p>
        </div>

        <Button onClick={() => navigate('/settings')} className="w-full h-12 rounded-xl text-base font-semibold mb-2">
          Ir a Ajustes y conectar mi clave
        </Button>
        <button onClick={() => setShowKeyPrompt(false)} className="w-full h-10 text-sm text-muted-foreground hover:text-foreground transition">
          Volver
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-9 w-9"><X className="w-4 h-4" /></Button>
        <div className="flex-1 mx-3 flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-secondary">
              <motion.div animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.3 }} className="h-full bg-primary rounded-full" />
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium w-9 text-right">{step + 1}/{STEPS.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-sm mx-auto px-5 py-4">
          <AnimatePresence mode="wait">

            {/* PASO 0: Destino + ciudades */}
            {step === 0 && (
              <motion.div key="dest" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-5">
                <h2 className="text-2xl font-bold text-center">
                  {isSurprise ? '🎲 Destino sorpresa' : '¿A dónde viajas?'}
                </h2>
                {isSurprise && (
                  <div className="bg-foreground text-background rounded-xl p-3 text-center">
                    <p className="text-xs font-semibold">La IA elegirá tu destino</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Cuéntanos solo de dónde sales y tus gustos. Te sorprenderemos.</p>
                  </div>
                )}
                <Field label="País de origen">
                  <CountrySearchSelect value={form.origin_country} onChange={v => { up('origin_country', v); up('origin_city', ''); }} placeholder="¿Desde dónde sales?" />
                </Field>
                {form.origin_country && (
                  <Field label="Ciudad o región de salida">
                    <Input placeholder={`ej. Madrid, Barcelona, Sevilla...`} value={form.origin_city}
                      onChange={e => up('origin_city', e.target.value)} className="h-11 rounded-xl" />
                    <p className="text-xs text-muted-foreground mt-1">Importante para calcular vuelos desde tu aeropuerto más cercano</p>
                  </Field>
                )}

                {/* En modo SORPRESA: NO se pide el destino — lo elige la IA */}
                {!isSurprise && (
                  <>
                    <Field label="País de destino *">
                      <CountrySearchSelect value={form.destination_country} onChange={v => { up('destination_country', v); up('destination_cities', []); }} placeholder="¿A dónde quieres ir?" />
                    </Field>

                    {/* Ciudades del país seleccionado — multi-selección */}
                    {form.destination_country && (
                      <Field label={cityOptions.length ? `¿Qué ciudades de ${countryName} quieres visitar? (elige varias)` : `Ciudad de ${countryName}`}>
                        {cityOptions.length ? (
                          <div className="flex flex-wrap gap-2">
                            {cityOptions.map(city => (
                              <Chip key={city} label={city} icon={form.destination_cities.includes(city) ? '✓' : '📍'}
                                selected={form.destination_cities.includes(city)} onClick={() => toggleCity(city)} />
                            ))}
                          </div>
                        ) : (
                          <Input placeholder="Escribe la ciudad" value={form.destination_cities[0] || ''}
                            onChange={e => up('destination_cities', e.target.value ? [e.target.value] : [])} className="h-11 rounded-xl" />
                        )}
                        {form.destination_cities.length > 0 && (
                          <p className="text-xs text-primary mt-2 font-medium">
                            {form.destination_cities.length} ciudad{form.destination_cities.length>1?'es':''} seleccionada{form.destination_cities.length>1?'s':''} — la IA te dará opciones para cada una
                          </p>
                        )}
                      </Field>
                    )}
                  </>
                )}

                {isSurprise && (
                  <Field label="¿Algún tipo de viaje en mente? (opcional)">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {id:'', label:'Sorpréndeme', icon:'🎲'},
                        {id:'beach', label:'Playa', icon:'🏖️'},
                        {id:'mountain', label:'Montaña', icon:'⛰️'},
                        {id:'city', label:'Ciudad', icon:'🏙️'},
                        {id:'cultural', label:'Cultural', icon:'🏛️'},
                        {id:'exotic', label:'Exótico', icon:'🌴'},
                      ].map(t => (
                        <button key={t.id || 'random'} type="button"
                          onClick={() => up('surprise_vibe', t.id)}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 ${form.surprise_vibe === t.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                          <span className="text-2xl">{t.icon}</span>
                          <span className="text-[10px] font-bold text-center">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                <Field label="Nombre del viaje (opcional)">
                  <Input placeholder={countryName ? `ej. Aventura en ${countryName}` : 'ej. Viaje sorpresa'} value={form.title} onChange={e => up('title', e.target.value)} className="h-11 rounded-xl" />
                </Field>
              </motion.div>
            )}

            {/* PASO 1: Fechas */}
            {step === 1 && (
              <motion.div key="dates" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-5">
                <h2 className="text-2xl font-bold text-center">Fechas del viaje</h2>
                <Field label="Fecha de salida">
                  <Input type="date" value={form.start_date} onChange={e => up('start_date', e.target.value)} className="h-11 rounded-xl" />
                </Field>
                <Field label="Duración">
                  <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-3">
                    <button onClick={() => up('duration_days', Math.max(1, Number(form.duration_days) - 1))} className="w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center hover:border-primary">−</button>
                    <div className="flex-1 text-center"><span className="text-3xl font-bold">{form.duration_days}</span><span className="text-sm text-muted-foreground ml-1">días</span></div>
                    <button onClick={() => up('duration_days', Number(form.duration_days) + 1)} className="w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center hover:border-primary">+</button>
                  </div>
                </Field>
                {form.start_date && form.end_date && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Tu viaje</p>
                    <p className="text-base font-bold text-primary">{format(new Date(form.start_date+'T12:00'), 'dd MMM')} → {format(new Date(form.end_date+'T12:00'), 'dd MMM yyyy')}</p>
                    <p className="text-xs text-muted-foreground mt-1">Vuelta calculada automáticamente</p>
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer bg-secondary/50 rounded-xl p-3">
                  <input type="checkbox" checked={form.flexible_dates} onChange={e => up('flexible_dates', e.target.checked)} className="w-4 h-4 accent-primary" />
                  <span className="text-sm">Fechas flexibles para mejores precios</span>
                </label>
              </motion.div>
            )}

            {/* PASO 2: Presupuesto + prioridades */}
            {step === 2 && (
              <motion.div key="budget" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-5">
                <h2 className="text-2xl font-bold text-center">Presupuesto *</h2>
                <div className="grid grid-cols-2 gap-3">
                  {BUDGETS.map(b => (
                    <motion.button key={b.id} whileTap={{ scale:0.95 }} onClick={() => up('budget_type', b.id)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left ${form.budget_type===b.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                      <span className="text-3xl">{b.icon}</span>
                      <span className="text-sm font-bold">{b.label}</span>
                      <span className="text-[10px] text-muted-foreground">{b.desc}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Sistema de prioridades de gasto */}
                {form.budget_type && (
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
                    <div>
                      <p className="text-sm font-bold text-foreground">¿En qué prefieres gastar más?</p>
                      <p className="text-xs text-muted-foreground">Ajusta cada categoría — la IA priorizará tu presupuesto</p>
                    </div>
                    {SPEND_CATEGORIES.map(cat => (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold flex items-center gap-1.5">{cat.icon} {cat.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {form.priorities[cat.id] < 35 ? 'Ahorrar' : form.priorities[cat.id] > 65 ? 'Gastar más' : 'Equilibrado'}
                          </span>
                        </div>
                        <input type="range" min="0" max="100" step="10" value={form.priorities[cat.id]}
                          onChange={e => up('priorities', { ...form.priorities, [cat.id]: Number(e.target.value) })}
                          className="w-full h-2 accent-primary cursor-pointer" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Rangos de presupuesto seleccionables (#5) */}
                {form.budget_type && (
                  <Field label="Presupuesto total aproximado (por persona)">
                    <div className="flex flex-wrap gap-2">
                      {(BUDGET_RANGES[form.budget_type] || []).map(range => (
                        <Chip key={range} label={range} icon="💶"
                          selected={form.budget_range === range}
                          onClick={() => up('budget_range', form.budget_range === range ? '' : range)} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Selecciona un rango — la IA ajustará todo a ese presupuesto</p>
                  </Field>
                )}
              </motion.div>
            )}

            {/* PASO 3: Viajeros */}
            {step === 3 && (
              <motion.div key="travelers" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-5">
                <h2 className="text-2xl font-bold text-center">¿Quién viaja?</h2>
                <Field label="¿Con quién vas?">
                  <div className="grid grid-cols-3 gap-2">
                    {COMPANIONS.map(c => (
                      <motion.button key={c.id} whileTap={{ scale:0.95 }} onClick={() => up('companions', c.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 ${form.companions===c.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                        <span className="text-2xl">{c.icon}</span>
                        <span className="text-[10px] font-semibold text-center leading-tight">{c.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </Field>
                {form.companions !== 'solo' && (
                  <Field label="Número de personas">
                    <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-3">
                      <button onClick={() => up('travelers_count', Math.max(2, Number(form.travelers_count)-1))} className="w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center">−</button>
                      <span className="flex-1 text-center text-3xl font-bold">{form.travelers_count}</span>
                      <button onClick={() => up('travelers_count', Number(form.travelers_count)+1)} className="w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center">+</button>
                    </div>
                  </Field>
                )}
                <Field label="Tu edad">
                  <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-3">
                    <button onClick={() => up('age', Math.max(1, Number(form.age)-1))} className="w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center">−</button>
                    <span className="flex-1 text-center text-3xl font-bold">{form.age}</span>
                    <button onClick={() => up('age', Number(form.age)+1)} className="w-10 h-10 rounded-full bg-background border border-border text-xl font-bold flex items-center justify-center">+</button>
                  </div>
                </Field>

                {/* Tipo de equipaje (#6) */}
                <Field label="¿Qué equipaje vas a llevar?">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id:'cabin', icon:'🎒', label:'Solo cabina', desc:'Mochila/maleta cabina' },
                      { id:'checked', icon:'🧳', label:'Facturada', desc:'Maleta grande' },
                      { id:'both', icon:'✈️', label:'Cabina + facturada', desc:'Equipaje completo' },
                    ].map(l => (
                      <motion.button key={l.id} whileTap={{ scale:0.95 }} onClick={() => up('luggage', l.id)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 ${form.luggage===l.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                        <span className="text-2xl">{l.icon}</span>
                        <span className="text-[10px] font-bold text-center leading-tight">{l.label}</span>
                        <span className="text-[9px] text-muted-foreground text-center leading-tight">{l.desc}</span>
                      </motion.button>
                    ))}
                  </div>
                </Field>
              </motion.div>
            )}

            {/* PASO 4: Tipo */}
            {step === 4 && (
              <motion.div key="type" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-5">
                <h2 className="text-2xl font-bold text-center">Tipo de viaje *</h2>
                <div className="grid grid-cols-2 gap-3">
                  {TRIP_TYPES.map(t => (
                    <motion.button key={t.id} whileTap={{ scale:0.95 }} onClick={() => up('trip_type', t.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${form.trip_type===t.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                      <span className="text-3xl">{t.icon}</span>
                      <span className="text-xs font-semibold">{t.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* PASO 5: Preferencias CONTEXTUALES */}
            {step === 5 && (
              <motion.div key="prefs" initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} className="space-y-5 pb-4">
                <h2 className="text-2xl font-bold text-center">Tus preferencias</h2>

                <Field label="¿Qué te gusta hacer? (elige varios)">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(i => <Chip key={i.id} {...i} selected={form.interests.includes(i.id)} onClick={() => toggle('interests', i.id)} />)}
                  </div>
                  <OtherInput values={form.custom_interests} placeholder="Otra afición..."
                    onAdd={v => addCustom('custom_interests', v)} onRemove={v => removeCustom('custom_interests', v)} />
                </Field>

                {/* Experiencias típicas del PAÍS seleccionado (#5 contextual) */}
                {regionData && (
                  <Field label={`Experiencias típicas de ${countryName} que quieres vivir`}>
                    <div className="flex flex-wrap gap-2">
                      {regionData.experiences.map(exp => (
                        <Chip key={exp} label={exp} icon="✨" selected={form.food_experiences.includes(exp)} onClick={() => toggle('food_experiences', exp)} />
                      ))}
                    </div>
                  </Field>
                )}

                {/* Comida típica del PAÍS (#5 contextual) */}
                {regionData && (
                  <Field label={`Comida de ${countryName} que quieres probar`}>
                    <div className="flex flex-wrap gap-2">
                      {regionData.food.map(f => (
                        <Chip key={f} label={f} icon="🍴" selected={form.food_experiences.includes(f)} onClick={() => toggle('food_experiences', f)} />
                      ))}
                    </div>
                    <OtherInput values={form.custom_food} placeholder="Otro plato o experiencia gastronómica..."
                      onAdd={v => addCustom('custom_food', v)} onRemove={v => removeCustom('custom_food', v)} />
                  </Field>
                )}

                <Field label="Restricciones dietéticas y alergias">
                  <div className="flex flex-wrap gap-2">
                    {DIET.map(d => <Chip key={d.id} {...d} selected={form.diet.includes(d.id)} onClick={() => toggle('diet', d.id)} />)}
                  </div>
                  <OtherInput values={form.custom_diet} placeholder="Otra alergia o restricción (ej. lactosa, soja)..."
                    onAdd={v => addCustom('custom_diet', v)} onRemove={v => removeCustom('custom_diet', v)} />
                </Field>

                <Field label="Salud o alergias físicas (opcional)">
                  <Input placeholder="ej. alergia a picaduras, problema de altitud..." value={form.health_notes} onChange={e => up('health_notes', e.target.value)} className="h-11 rounded-xl" />
                </Field>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <div className="px-5 pb-8 pt-3 flex gap-3 max-w-sm mx-auto w-full">
        {step > 0 && <Button variant="outline" onClick={() => setStep(s => s-1)} className="h-12 rounded-xl px-5"><ChevronLeft className="w-5 h-5" /></Button>}
        <Button onClick={step === STEPS.length-1 ? handleCreate : () => setStep(s => s+1)} disabled={!canNext()} className="flex-1 h-12 rounded-xl text-base font-semibold">
          {step === STEPS.length-1
            ? <><Sparkles className="w-5 h-5 mr-2" />{isSurprise ? '🎲 Revelar destino' : 'Crear itinerario'}</>
            : <>Siguiente <ChevronRight className="w-5 h-5 ml-1" /></>}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><Label className="text-sm font-medium mb-2 block text-foreground">{label}</Label>{children}</div>;
}
