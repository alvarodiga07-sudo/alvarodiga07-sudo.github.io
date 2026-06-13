import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, PenLine, Plus, Plane, Search, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TripCard from '@/components/trips/TripCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SuggestedTripModal from '@/components/trips/SuggestedTripModal';
import { toast } from 'sonner';

// Destinos variados: 3 categorías - cheap (verde) / normal (amarillo) / premium (rojo)
const SUGGESTED_DESTINATIONS = [
  // ⚡ Súper baratos (<400€) — fondo verde
  { country: 'PT', city: 'Lisboa', title: '⚡ Lisboa', desc: 'Express barato', price: '~300€', days: 3, budget: 'budget', type: 'leisure', tier: 'cheap' },
  { country: 'MA', city: 'Marrakech', title: '⚡ Marrakech', desc: '4 días, 3h vuelo', price: '~350€', days: 4, budget: 'budget', type: 'leisure', tier: 'cheap' },
  { country: 'PL', city: 'Cracovia', title: '⚡ Cracovia', desc: 'Joya barata', price: '~380€', days: 4, budget: 'budget', type: 'cultural', tier: 'cheap' },
  { country: 'HU', city: 'Budapest', title: '⚡ Budapest', desc: 'Termas y belleza', price: '~390€', days: 4, budget: 'budget', type: 'cultural', tier: 'cheap' },
  // 💰 Asequibles (400-1400€) — fondo amarillo
  { country: 'TH', city: 'Bangkok', title: '🏯 Bangkok', desc: 'Exótico y baratísimo', price: '~500€', days: 7, budget: 'budget', type: 'leisure', tier: 'normal' },
  { country: 'GR', city: 'Atenas', title: '⛩️ Atenas', desc: 'Historia y cultura', price: '~600€', days: 4, budget: 'mid', type: 'cultural', tier: 'normal' },
  { country: 'IT', city: 'Roma', title: '🏛️ Roma', desc: 'Eterna e imprescindible', price: '~700€', days: 5, budget: 'mid', type: 'cultural', tier: 'normal' },
  { country: 'VN', city: 'Hanói', title: '🍜 Vietnam', desc: 'Barato y espectacular', price: '~750€', days: 10, budget: 'budget', type: 'adventure', tier: 'normal' },
  { country: 'IS', city: 'Reikiavik', title: '🌋 Islandia', desc: 'Paisajes únicos', price: '~1100€', days: 7, budget: 'mid', type: 'nature', tier: 'normal' },
  { country: 'JP', city: 'Tokio', title: '🗼 Tokio', desc: 'Viaje de vida', price: '~1400€', days: 10, budget: 'mid', type: 'cultural', tier: 'normal' },
  // 🌟 PREMIUM (más caros, más días, exclusivos) — fondo rojo
  { country: 'MV', city: 'Malé', title: '🌟 Maldivas', desc: 'Resort lujo', price: '~3200€', days: 7, budget: 'luxury', type: 'romantic', tier: 'premium' },
  { country: 'JP', city: 'Tokio', title: '🌟 Gran Japón', desc: '21 días gran tour', price: '~4500€', days: 21, budget: 'comfort', type: 'cultural', tier: 'premium' },
  { country: 'AE', city: 'Dubái', title: '🌟 Dubái 5★', desc: 'Lujo árabe', price: '~3500€', days: 6, budget: 'luxury', type: 'leisure', tier: 'premium' },
  { country: 'CH', city: 'Zúrich', title: '🌟 Alpes Suizos', desc: 'Lujo alpino', price: '~2800€', days: 8, budget: 'comfort', type: 'nature', tier: 'premium' },
  { country: 'AU', city: 'Sídney', title: '🌟 Australia', desc: 'Viaje de vida', price: '~5500€', days: 18, budget: 'comfort', type: 'adventure', tier: 'premium' },
  { country: 'KE', city: 'Nairobi', title: '🌟 Safari Kenia', desc: 'Big Five exclusivo', price: '~4200€', days: 10, budget: 'luxury', type: 'adventure', tier: 'premium' },
];

export default function Trips() {
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

  const handleCreateSuggestedTrip = async (tripData) => {
    setCreatingTrip(true);
    try {
      const newTrip = await base44.entities.Trip.create({
        title: tripData.title,
        destination_country: tripData.destination_country,
        destination_cities: tripData.destination_cities,
        trip_type: tripData.trip_type,
        duration_days: tripData.duration_days,
        travelers_count: tripData.travelers_count,
        status: 'planning',
        itinerary: tripData.itinerary,
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

  // En la pestaña Viajes solo mostramos los pendientes/en curso — los completados están en Inicio
  const activeTrips = trips.filter(t => t.status !== 'completed');
  const filteredTrips = activeTrips.filter(t => {
    const matchFilter = t.status === filter; // Solo planning o active
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
        <h1 className="text-2xl font-bold text-foreground">Planificador</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tus viajes pendientes y en curso</p>
      </div>

      {/* Action buttons — 3 botones (orden: sugeridos, sorpresa más oscuro, crear yo) */}
      <div className="px-5 grid grid-cols-3 gap-2 mb-5">
        <Button
          onClick={() => navigate('/trip-wizard?mode=suggested')}
          className="h-20 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex flex-col items-center gap-1 hover:opacity-90 px-2"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[11px] font-semibold text-center leading-tight">Viajes sugeridos</span>
        </Button>
        <Button
          onClick={() => navigate('/trip-wizard?mode=surprise')}
          className="h-20 rounded-2xl bg-foreground text-background flex flex-col items-center gap-1 hover:opacity-90 px-2"
        >
          <Shuffle className="w-5 h-5" />
          <span className="text-[11px] font-semibold text-center leading-tight">Destino sorpresa</span>
        </Button>
        <Button
          onClick={() => navigate('/trip-wizard?mode=custom')}
          variant="outline"
          className="h-20 rounded-2xl border-2 border-border flex flex-col items-center gap-1 hover:border-primary/50 px-2"
        >
          <PenLine className="w-5 h-5 text-primary" />
          <span className="text-[11px] font-semibold text-center leading-tight">Crear yo mismo</span>
        </Button>
      </div>

      {/* Suggested destinations — 3 tiers de color */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Destinos populares</h3>
          <span className="text-[10px] text-muted-foreground">⚡ Baratos · 🌟 Premium</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {SUGGESTED_DESTINATIONS.map((dest) => {
            const styles = {
              cheap:   { border: 'border-green-500/40 ring-1 ring-green-500/20', bg: 'from-green-500/15 to-emerald-400/10', price: 'text-green-600' },
              normal:  { border: 'border-border',                                  bg: 'from-primary/15 to-accent/10',       price: 'text-primary' },
              premium: { border: 'border-red-500/50 ring-1 ring-red-500/25',      bg: 'from-red-500/15 to-rose-500/10',     price: 'text-red-600' },
            }[dest.tier || 'normal'];
            return (
              <button
                key={`${dest.country}-${dest.title}`}
                onClick={() => { setSelectedDest(dest); setModalOpen(true); }}
                className={`flex-shrink-0 w-36 bg-card rounded-xl border ${styles.border} overflow-hidden hover:shadow-md transition-all active:scale-95`}
              >
                <div className={`h-16 bg-gradient-to-br ${styles.bg} flex items-center justify-center`}>
                  <span className="text-3xl">{getEmoji(dest.country)}</span>
                </div>
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
          <h3 className="text-sm font-semibold text-foreground">Mis viajes</h3>
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
            placeholder="Buscar viajes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        <Tabs value={filter === 'all' || filter === 'completed' ? 'planning' : filter} onValueChange={setFilter} className="mb-4">
          <TabsList className="bg-secondary/50 w-full">
            <TabsTrigger value="planning" className="flex-1 text-xs">Planeando</TabsTrigger>
            <TabsTrigger value="active" className="flex-1 text-xs">Activos</TabsTrigger>
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
            <h3 className="font-semibold text-foreground mb-1">No hay viajes todavía</h3>
            <p className="text-sm text-muted-foreground mb-4">¡Empieza a planificar tu próxima aventura!</p>
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