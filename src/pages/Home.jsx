import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HomeHeader from '@/components/home/HomeHeader';
import InteractiveGlobe from '@/components/home/InteractiveGlobe';
import StatsBar from '@/components/home/StatsBar';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, MapPin, Calendar } from 'lucide-react';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const navigate = useNavigate();
  const [globeSize, setGlobeSize] = useState(280);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user && !user.onboarding_complete) navigate('/onboarding');
  }, [user, navigate]);

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      if (w >= 1024) setGlobeSize(460);
      else if (w >= 768) setGlobeSize(400);
      else setGlobeSize(Math.min(w - 40, 360));
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-created_date'),
  });

  const visitedCountries = user?.countries_visited || [];
  const [yearFilter, setYearFilter] = useState('todos');

  // Viajes completados, agrupados por país
  const completedTrips = trips.filter(t => t.status === 'completed');

  // Años disponibles
  const years = ['todos', ...new Set(
    completedTrips.map(t => t.start_date ? new Date(t.start_date).getFullYear().toString() : null).filter(Boolean)
  ).values()].sort((a, b) => b === 'todos' ? 1 : a === 'todos' ? -1 : Number(b) - Number(a));

  // Viajes filtrados por año
  const filteredTrips = completedTrips.filter(t => {
    if (yearFilter === 'todos') return true;
    return t.start_date && new Date(t.start_date).getFullYear().toString() === yearFilter;
  });

  const handleTripClick = useCallback((tripId) => {
    navigate(`/trip/${tripId}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader user={user} />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center justify-center py-4 md:py-8"
      >
        <div className="relative">
          <InteractiveGlobe
            visitedCountries={visitedCountries}
            size={globeSize}
            trips={trips}
            onTripClick={handleTripClick}
          />
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10 scale-110" />
        </div>
      </motion.div>

      <StatsBar visitedCount={visitedCountries.length} />

      {/* Países conquistados — interactivos, filtro por año */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mx-5 mt-2 mb-2"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Países conquistados</h2>
            <p className="text-xs text-muted-foreground">{completedTrips.length} viaje{completedTrips.length !== 1 ? 's' : ''} completado{completedTrips.length !== 1 ? 's' : ''}</p>
          </div>
          {/* Filtro por año */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="appearance-none text-xs font-semibold bg-secondary/60 border border-border rounded-xl px-3 py-1.5 pr-6 text-foreground cursor-pointer outline-none focus:border-primary"
            >
              {years.map(y => (
                <option key={y} value={y}>{y === 'todos' ? 'Todos los años' : y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">✈️</div>
            <p className="text-sm text-muted-foreground">
              {completedTrips.length === 0 ? '¡Tu primer viaje te está esperando!' : 'Sin viajes en ese año'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTrips.map((trip, i) => (
              <motion.button
                key={trip.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="w-full flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 hover:shadow-sm hover:border-primary/30 active:scale-[0.98] transition-all text-left overflow-x-auto"
              >
                {/* Bandera */}
                <span className="text-xl flex-shrink-0">{getCountryEmoji(trip.destination_country)}</span>
                {/* PAÍS en mayúsculas y negrita */}
                <span className="text-sm font-bold text-foreground tracking-wide flex-shrink-0">
                  {getCountryName(trip.destination_country)?.toUpperCase()}
                </span>
                {/* Fecha */}
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  · {trip.start_date
                    ? format(new Date(trip.start_date), "d MMM yyyy", { locale: es })
                    : 'Sin fecha'}
                </span>
                {/* Días */}
                {trip.duration_days && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">· {trip.duration_days}d</span>
                )}
                {/* Personas */}
                {trip.travelers_count > 0 && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    · {trip.travelers_count} {trip.travelers_count === 1 ? 'persona' : 'pers'}
                  </span>
                )}
                {/* Estado */}
                <span className="ml-auto text-[10px] font-semibold text-green-700 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full flex-shrink-0">
                  Completado
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mx-5 mt-4 mb-24"
      >
        <Button
          onClick={() => navigate('/recap')}
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          <span className="font-semibold">Ver mi resumen anual</span>
        </Button>
      </motion.div>
    </div>
  );
}
