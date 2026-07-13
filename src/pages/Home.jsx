import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HomeHeader from '@/components/home/HomeHeader';
import InteractiveGlobe from '@/components/home/InteractiveGlobe';
import StatsBar from '@/components/home/StatsBar';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, MapPin, Calendar } from 'lucide-react';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/i18n';
import { useT } from '@/lib/i18n';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useT();
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

  const [yearFilter, setYearFilter] = useState('todos');

  // Viajes completados, agrupados por país
  const completedTrips = trips.filter(t => t.status === 'completed');

  // Países iluminados en el globo: derivados de los viajes COMPLETADOS (fuente de
  // verdad) + la lista del perfil. Antes solo se usaba user.countries_visited, que
  // el botón "Completar" no actualizaba → países completados sin iluminar.
  const visitedCountries = [...new Set([
    ...completedTrips.map(t => t.destination_country).filter(Boolean),
    ...(user?.countries_visited || []),
  ])];

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

  // País con varias visitas → selector de viaje ({ code, trips } | null)
  const [tripPicker, setTripPicker] = useState(null);
  const handleCountryClick = useCallback((code, list) => {
    const sorted = [...list].sort((a, b) => new Date(b.start_date || b.created_date || 0) - new Date(a.start_date || a.created_date || 0));
    setTripPicker({ code, trips: sorted });
  }, []);

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
            onCountryClick={handleCountryClick}
          />
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10 scale-110" />
        </div>
      </motion.div>

      {/* Selector de viaje cuando has visitado un país varias veces */}
      <AnimatePresence>
        {tripPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setTripPicker(null)}
          >
            <motion.div
              initial={{ y: 40, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full max-w-sm bg-card border border-border rounded-3xl p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <span className="text-4xl">{getCountryEmoji(tripPicker.code)}</span>
                <h3 className="text-lg font-bold text-foreground mt-1">
                  {getCountryName(tripPicker.code)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('Has estado')} {tripPicker.trips.length} {t('veces — ¿qué viaje quieres abrir?')}
                </p>
              </div>
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
                {tripPicker.trips.map((tp, i) => (
                  <motion.button
                    key={tp.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setTripPicker(null); navigate(`/trip/${tp.id}`); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">✈️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{tp.title || `${t('Viajes')} · ${getCountryName(tripPicker.code)}`}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {tp.start_date
                          ? format(new Date(tp.start_date + 'T12:00'), 'MMM yyyy', { locale: getDateLocale() })
                          : t('Sin fecha')}
                        {tp.duration_days ? ` · ${tp.duration_days} ${t('días')}` : ''}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => setTripPicker(null)}
                className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                {t('Cancelar')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <h2 className="text-base font-bold text-foreground">{t('Países conquistados')}</h2>
            <p className="text-xs text-muted-foreground">{completedTrips.length} {completedTrips.length === 1 ? t('viaje completado') : t('viajes completados')}</p>
          </div>
          {/* Filtro por año */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="appearance-none text-xs font-semibold bg-secondary/60 border border-border rounded-xl px-3 py-1.5 pr-6 text-foreground cursor-pointer outline-none focus:border-primary"
            >
              {years.map(y => (
                <option key={y} value={y}>{y === 'todos' ? t('Todos los años') : y}</option>
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
                    ? format(new Date(trip.start_date), "d MMM yyyy", { locale: getDateLocale() })
                    : t('Sin fecha')}
                </span>
                {/* Días */}
                {trip.duration_days && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">· {trip.duration_days}d</span>
                )}
                {/* Personas */}
                {trip.travelers_count > 0 && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    · {trip.travelers_count} {trip.travelers_count === 1 ? t('persona') : t('pers')}
                  </span>
                )}
                {/* Estado */}
                <span className="ml-auto text-[10px] font-semibold text-green-700 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full flex-shrink-0">
                  {t('Completado')}
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
