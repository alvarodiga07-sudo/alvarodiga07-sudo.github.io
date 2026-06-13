import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Users, DollarSign, Plane, Hotel, Utensils, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateLocalItinerary } from '@/lib/itineraryGenerator';

export default function SuggestedTripModal({ destination, isOpen, onClose, onCreateTrip }) {
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);

  const handlePersonalize = () => {
    // Pre-rellena el wizard con los datos del destino sugerido
    const params = new URLSearchParams({
      country: destination.country,
      city: destination.city,
      days: destination.days || 5,
      budget: destination.budget || 'mid',
      type: destination.type || 'leisure',
    });
    onClose();
    navigate(`/trip-wizard?mode=custom&${params.toString()}`);
  };

  useEffect(() => {
    if (isOpen && destination) {
      setLoading(true);
      setTimeout(() => {
        const it = generateLocalItinerary({
          destination_country: destination.country,
          destination_cities: [destination.city],
          origin_country: 'ES',
          _destCountryName: destination.city,
          _originCountryName: 'España',
          duration_days: destination.days || 5,
          start_date: '2026-07-15',
          end_date: new Date(new Date('2026-07-15').getTime() + (destination.days || 5) * 86400000).toISOString().split('T')[0],
          trip_type: destination.type || 'leisure',
          travelers_count: 2,
          preferences: {
            budget_type: destination.budget || 'mid',
            priorities: { hotel: destination.budget === 'budget' ? 40 : 60, food: 70, activities: destination.budget === 'budget' ? 50 : 60, transport: 40 },
            interests: ['culture', 'food'],
            diet: [],
            food_experiences: []
          }
        });
        setItinerary(it);
        setLoading(false);
      }, 300);
    }
  }, [isOpen, destination]);

  const handleCreateTrip = () => {
    if (onCreateTrip && itinerary) {
      onCreateTrip({
        title: destination.title,
        destination_country: destination.country,
        destination_cities: [destination.city],
        trip_type: destination.type || 'leisure',
        duration_days: destination.days || 5,
        travelers_count: 2,
        itinerary,
      });
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-background w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {destination?.title}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-3 text-sm text-muted-foreground">Generando itinerario...</p>
              </div>
            ) : itinerary ? (
              <div className="p-5 space-y-5">
                {/* Resumen */}
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-4">
                  <p className="text-sm font-medium text-foreground">{itinerary.resumen}</p>
                </div>

                {/* Precios */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">Por persona</p>
                    <p className="text-sm font-bold text-primary">{itinerary.precio_total_persona}</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">Duración</p>
                    <p className="text-sm font-bold">{itinerary.dias.length} días</p>
                  </div>
                </div>

                {/* Info rápida */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Plane className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Vuelos</p>
                      <p className="text-xs text-muted-foreground">{itinerary.vuelos.precio_aproximado}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Hotel className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Alojamiento</p>
                      <p className="text-xs text-muted-foreground">{itinerary.hoteles.precio_noche}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <Utensils className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Comida & actividades incluidas</p>
                      <p className="text-xs text-muted-foreground">Día a día personalizado</p>
                    </div>
                  </div>
                </div>

                {/* Consejos */}
                <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground uppercase">Consejos prácticos</p>
                  {itinerary.consejos_ahorro.slice(0, 3).map((c, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{i + 1}. {c.slice(0, 80)}...</p>
                  ))}
                </div>

                {/* Botones: Personalizar + Crear */}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handlePersonalize} variant="outline" className="h-11 rounded-xl text-sm font-semibold border-2">
                    <Settings2 className="w-4 h-4 mr-1.5" />
                    Personalizar
                  </Button>
                  <Button onClick={handleCreateTrip} className="h-11 rounded-xl text-sm font-semibold">
                    Crear este viaje
                  </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground -mt-2">
                  Personaliza para ajustar días, gustos, dieta...
                </p>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
