import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, PenLine, Plus, Plane, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TripCard from '@/components/trips/TripCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuggestedTripModal from '@/components/trips/SuggestedTripModal';
import { fetchDestinationPhoto } from '@/lib/destinationPhotos';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';

// Destinos variados: 3 categorías - cheap (verde) / normal (amarillo) / premium (rojo).
// wikiQuery: nombre en inglés "Ciudad, País" para buscar la foto real en Wikipedia
// (la API solo resuelve bien nombres en inglés/nativos, no "Sídney" o "Cracovia").
const SUGGESTED_DESTINATIONS = [
  // ⚡ Súper baratos (<400€) — fondo verde
  { country: 'PT', city: 'Lisboa', title: '⚡ Lisboa', desc: 'Express barato', price: '~300€', days: 3, budget: 'budget', type: 'leisure', tier: 'cheap', wikiQuery: 'Lisbon' },
  { country: 'MA', city: 'Marrakech', title: '⚡ Marrakech', desc: '4 días, 3h vuelo', price: '~350€', days: 4, budget: 'budget', type: 'leisure', tier: 'cheap', wikiQuery: 'Marrakesh' },
  { country: 'PL', city: 'Cracovia', title: '⚡ Cracovia', desc: 'Joya barata', price: '~380€', days: 4, budget: 'budget', type: 'cultural', tier: 'cheap', wikiQuery: 'Kraków' },
  { country: 'HU', city: 'Budapest', title: '⚡ Budapest', desc: 'Termas y belleza', price: '~390€', days: 4, budget: 'budget', type: 'cultural', tier: 'cheap', wikiQuery: 'Budapest' },
  // 💰 Asequibles (400-1400€) — fondo amarillo
  { country: 'TH', city: 'Bangkok', title: '🏯 Bangkok', desc: 'Exótico y baratísimo', price: '~500€', days: 7, budget: 'budget', type: 'leisure', tier: 'normal', wikiQuery: 'Bangkok' },
  { country: 'GR', city: 'Atenas', title: '⛩️ Atenas', desc: 'Historia y cultura', price: '~600€', days: 4, budget: 'mid', type: 'cultural', tier: 'normal', wikiQuery: 'Athens' },
  { country: 'IT', city: 'Roma', title: '🏛️ Roma', desc: 'Eterna e imprescindible', price: '~700€', days: 5, budget: 'mid', type: 'cultural', tier: 'normal', wikiQuery: 'Rome' },
  { country: 'VN', city: 'Hanói', title: '🍜 Vietnam', desc: 'Barato y espectacular', price: '~750€', days: 10, budget: 'budget', type: 'adventure', tier: 'normal', wikiQuery: 'Hanoi' },
  { country: 'IS', city: 'Reikiavik', title: '🌋 Islandia', desc: 'Paisajes únicos', price: '~1100€', days: 7, budget: 'mid', type: 'nature', tier: 'normal', wikiQuery: 'Reykjavík' },
  { country: 'JP', city: 'Tokio', title: '🗼 Tokio', desc: 'Viaje de vida', price: '~1400€', days: 10, budget: 'mid', type: 'cultural', tier: 'normal', wikiQuery: 'Tokyo' },
  // 🌟 PREMIUM (más caros, más días, exclusivos) — fondo rojo
  { country: 'MV', city: 'Malé', title: '🌟 Maldivas', desc: 'Resort lujo', price: '~3200€', days: 7, budget: 'luxury', type: 'romantic', tier: 'premium', wikiQuery: 'Maldives' },
  { country: 'JP', city: 'Tokio', title: '🌟 Gran Japón', desc: '21 días gran tour', price: '~4500€', days: 21, budget: 'comfort', type: 'cultural', tier: 'premium', wikiQuery: 'Tokyo' },
  { country: 'AE', city: 'Dubái', title: '🌟 Dubái 5★', desc: 'Lujo árabe', price: '~3500€', days: 6, budget: 'luxury', type: 'leisure', tier: 'premium', wikiQuery: 'Dubai' },
  { country: 'CH', city: 'Zúrich', title: '🌟 Alpes Suizos', desc: 'Lujo alpino', price: '~2800€', days: 8, budget: 'comfort', type: 'nature', tier: 'premium', wikiQuery: 'Swiss Alps' },
  { country: 'AU', city: 'Sídney', title: '🌟 Australia', desc: 'Viaje de vida', price: '~5500€', days: 18, budget: 'comfort', type: 'adventure', tier: 'premium', wikiQuery: 'Sydney' },
  { country: 'KE', city: 'Nairobi', title: '🌟 Safari Kenia', desc: 'Big Five exclusivo', price: '~4200€', days: 10, budget: 'luxury', type: 'adventure', tier: 'premium', wikiQuery: 'Maasai Mara' },
];

export default function Trips() {
  const { t } = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState('planning');
  const [search, setSearch] = React.useState('');
  const [selectedDest, setSelectedDest] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [creatingTrip, setCreatingTrip] = React.useState(false);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-created_date'),
  });

  // "La IA aprende de lo que le gusta al usuario": en vez de un orden fijo,
  // los destinos se reordenan según el tipo de viaje y el presupuesto que el
  // usuario ha elegido en sus propios viajes (más viajes → mejores sugerencias).
  // Sigue siendo la misma lista curada; lo que cambia es el orden.
  const personalizedDestinations = React.useMemo(() => {
    if (!trips.length) return SUGGESTED_DESTINATIONS;
    const typeCount = {};
    const budgetCount = {};
    trips.forEach(t => {
      if (t.trip_type) typeCount[t.trip_type] = (typeCount[t.trip_type] || 0) + 1;
      const b = t.preferences?.budget_type;
      if (b) budgetCount[b] = (budgetCount[b] || 0) + 1;
    });
    const score = (dest) => (typeCount[dest.type] || 0) * 2 + (budgetCount[dest.budget] || 0);
    return [...SUGGESTED_DESTINATIONS].sort((a, b) => score(b) - score(a));
  }, [trips]);

  // Foto real del destino (Wikipedia, sin API key) — se pide una vez y se
  // guarda en localStorage; mientras tanto o si falla, se ve el degradado+emoji.
  const [destPhotos, setDestPhotos] = React.useState({});
  React.useEffect(() => {
    let cancelled = false;
    SUGGESTED_DESTINATIONS.forEach(async (dest) => {
      const key = dest.wikiQuery;
      if (destPhotos[key] !== undefined) return;
      const url = await fetchDestinationPhoto(key);
      if (!cancelled) setDestPhotos(prev => ({ ...prev, [key]: url }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateSuggestedTrip = async (tripData) => {
    setCreatingTrip(true);
    try {
      const newTrip = await base44.entities.Trip.create({
        title: tripData.title,
        destination_country: tripData.destination_country,
        destination_cities: tripData.destination_cities,
        origin_country: tripData.origin_country,
        start_date: tripData.start_date,
        end_date: tripData.end_date,
        trip_type: tripData.trip_type,
        duration_days: tripData.duration_days,
        travelers_count: tripData.travelers_count,
        status: 'planning',
        ai_itinerary: tripData.ai_itinerary,
      });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success(`Viaje a ${tripData.title} creado`);
      navigate(`/trip/${newTrip.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Error al crear viaje');
    } finally {
      setCreatingTrip(false);
    }
  };

  const filteredTrips = trips.filter(t => {
    const matchFilter = (t.status || 'planning') === filter;
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getEmoji = (code) => {
    try {
      return String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
    } catch { return '✈️'; }
  };

  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-foreground">{t('Planificador')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('Tus viajes pendientes y en curso')}</p>
      </div>

      {/* Solo 2 botones: antes había un tercero ("Viajes sugeridos") que por dentro
          hacía EXACTAMENTE lo mismo que "Crear yo mismo" (mismo asistente, mismas
          preguntas) — confundía sin aportar nada distinto. Ahora la elección es
          clara: que decida la IA, o decides tú. */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <Button
          onClick={() => navigate('/trip-wizard?mode=surprise')}
          className="h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex flex-col items-center gap-1 hover:opacity-90 px-2"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[12px] font-semibold text-center leading-tight">{t('Que lo haga la IA')}</span>
        </Button>
        <Button
          onClick={() => navigate('/trip-wizard?mode=custom')}
          variant="outline"
          className="h-20 rounded-2xl border-2 border-border flex flex-col items-center gap-1 hover:border-primary/50 px-2"
        >
          <PenLine className="w-5 h-5 text-primary" />
          <span className="text-[12px] font-semibold text-center leading-tight">{t('Lo hago yo')}</span>
        </Button>
      </div>

      {/* Suggested destinations — 3 tiers de color */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t('Destinos populares')}</h3>
          <span className="text-[10px] text-muted-foreground">⚡ {t('Baratos')} · 🌟 {t('Premium')}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {personalizedDestinations.map((dest) => {
            const styles = {
              cheap:   { border: 'border-green-500/40 ring-1 ring-green-500/20', bg: 'from-green-500/15 to-emerald-400/10', price: 'text-green-600' },
              normal:  { border: 'border-border',                                  bg: 'from-primary/15 to-accent/10',       price: 'text-primary' },
              premium: { border: 'border-red-500/50 ring-1 ring-red-500/25',      bg: 'from-red-500/15 to-rose-500/10',     price: 'text-red-600' },
            }[dest.tier || 'normal'];
            const photoUrl = destPhotos[dest.wikiQuery];
            return (
              <button
                key={`${dest.country}-${dest.title}`}
                onClick={() => { setSelectedDest(dest); setModalOpen(true); }}
                className={`flex-shrink-0 w-36 bg-card rounded-xl border ${styles.border} overflow-hidden hover:shadow-md transition-all active:scale-95`}
              >
                {photoUrl ? (
                  <div className="h-16 relative">
                    <img src={photoUrl} alt={dest.city} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className={`h-16 bg-gradient-to-br ${styles.bg} flex items-center justify-center`}>
                    <span className="text-3xl">{getEmoji(dest.country)}</span>
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-bold text-foreground">{dest.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{dest.desc}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[10px] font-semibold ${styles.price}`}>{dest.price}</p>
                    <p className="text-[9px] text-muted-foreground">{dest.days}d</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* My trips */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t('Mis viajes')}</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/trip-wizard?mode=custom')}
            className="h-8 text-xs text-primary"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo
          </Button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('Buscar viajes...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <Tabs value={filter === 'all' ? 'planning' : filter} onValueChange={setFilter} className="mb-4">
          <TabsList className="bg-secondary/50 w-full">
            <TabsTrigger value="planning" className="flex-1 text-xs">{t('Planeando')}</TabsTrigger>
            <TabsTrigger value="active" className="flex-1 text-xs">{t('Activos')}</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-xs">{t('Completados')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl border border-border h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('No hay viajes todavía')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('¡Empieza a planificar tu próxima aventura!')}</p>
            <Button
              onClick={() => navigate('/trip-wizard?mode=custom')}
              className="bg-primary hover:bg-primary/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1" />
              Crear viaje
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip, i) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={i}
                onClick={() => navigate(`/trip/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de viaje sugerido */}
      <SuggestedTripModal
        destination={selectedDest}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreateTrip={handleCreateSuggestedTrip}
      />
    </div>
  );
}