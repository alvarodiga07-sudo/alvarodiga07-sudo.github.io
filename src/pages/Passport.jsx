import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCountryName, getCountryEmoji, COUNTRIES } from '@/lib/countries';
import StampItem from '@/components/passport/StampItem';
import { toast } from 'sonner';

const LOGO_URL = "https://media.base44.com/images/public/user_69aea125734ce6b1da596dd5/ce9f50f11_IMG_05283.png";

// Passport cover colors by country
const PASSPORT_COLORS = {
  ES: { bg: 'from-red-900 to-red-950', accent: 'text-amber-300' },
  US: { bg: 'from-blue-900 to-blue-950', accent: 'text-amber-300' },
  GB: { bg: 'from-red-950 to-red-900', accent: 'text-amber-200' },
  FR: { bg: 'from-blue-950 to-blue-900', accent: 'text-amber-300' },
  DE: { bg: 'from-red-950 to-gray-900', accent: 'text-amber-200' },
  IT: { bg: 'from-green-950 to-green-900', accent: 'text-amber-300' },
  BR: { bg: 'from-blue-900 to-blue-950', accent: 'text-amber-300' },
  MX: { bg: 'from-green-950 to-green-900', accent: 'text-amber-300' },
  JP: { bg: 'from-red-900 to-red-950', accent: 'text-amber-200' },
  AR: { bg: 'from-blue-800 to-blue-900', accent: 'text-amber-300' },
  DEFAULT: { bg: 'from-slate-800 to-slate-900', accent: 'text-amber-300' },
};

export default function Passport() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddPastTrip, setShowAddPastTrip] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const [pastTripForm, setPastTripForm] = useState({
    destination_country: '',
    destination_city: '',
    trip_type: 'leisure',
    start_date: '',
    duration_days: '',
    title: '',
    notes: '',
    highlights: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: stamps = [], isLoading } = useQuery({
    queryKey: ['stamps'],
    queryFn: () => base44.entities.PassportStamp.list('created_date'),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-created_date'),
  });

  // Map trip_id → duration_days (solo viajes COMPLETADOS)
  const tripDurationMap = React.useMemo(() => {
    const map = {};
    trips.forEach(t => { if (t.id) map[t.id] = t.duration_days; });
    return map;
  }, [trips]);

  // Set de países con AL MENOS UN viaje completado (filtramos los sellos por aquí)
  const completedCountriesSet = React.useMemo(() => {
    return new Set(trips.filter(t => t.status === 'completed').map(t => t.destination_country).filter(Boolean));
  }, [trips]);

  const handleAddPastTrip = async () => {
    if (!pastTripForm.destination_country || !pastTripForm.start_date || !pastTripForm.duration_days) {
      toast.error('Completa al menos país, fecha y duración');
      return;
    }
    setSavingTrip(true);
    try {
      const countryData = COUNTRIES.find(c => c.code === pastTripForm.destination_country);
      const endDate = new Date(pastTripForm.start_date);
      endDate.setDate(endDate.getDate() + Number(pastTripForm.duration_days) - 1);

      const trip = await base44.entities.Trip.create({
        title: pastTripForm.title || `Viaje a ${countryData?.name}`,
        destination_country: pastTripForm.destination_country,
        destination_city: pastTripForm.destination_city,
        origin_country: user?.country_of_origin,
        start_date: pastTripForm.start_date,
        end_date: endDate.toISOString().split('T')[0],
        trip_type: pastTripForm.trip_type,
        status: 'completed',
        duration_days: Number(pastTripForm.duration_days),
        travelers_count: 1,
        notes: pastTripForm.notes,
        highlights: pastTripForm.highlights,
        preferences: {},
      });

      // Crear sello
      if (countryData) {
        await base44.entities.PassportStamp.create({
          country_code: pastTripForm.destination_country,
          country_name: countryData.name,
          trip_id: trip.id,
          visit_date: pastTripForm.start_date,
        });
        const visited = user?.countries_visited || [];
        if (!visited.includes(pastTripForm.destination_country))
          await base44.auth.updateMe({ countries_visited: [...visited, pastTripForm.destination_country] });
      }

      queryClient.invalidateQueries({ queryKey: ['trips', 'stamps', 'currentUser'] });
      toast.success('Viaje pasado agregado');
      setShowAddPastTrip(false);
      setPastTripForm({ destination_country: '', destination_city: '', trip_type: 'leisure', start_date: '', duration_days: '', title: '', notes: '', highlights: '' });
    } catch (error) {
      toast.error('Error al agregar viaje');
      console.error(error);
    }
    setSavingTrip(false);
  };

  const passportCountry = user?.passport_country || 'DEFAULT';
  const colors = PASSPORT_COLORS[passportCountry] || PASSPORT_COLORS.DEFAULT;
  const stampsPerPage = 4; // 4 sellos por página
  // Filtrar: solo sellos de países con AL MENOS UN viaje completado
  // + ordenar cronológicamente
  const completedStamps = stamps.filter(s => completedCountriesSet.has(s.country_code));
  const sortedStamps = [...completedStamps].sort((a, b) => new Date(a.visit_date || 0) - new Date(b.visit_date || 0));
  const totalPages = Math.max(1, Math.ceil(sortedStamps.length / stampsPerPage));
  const currentStamps = sortedStamps.slice(currentPage * stampsPerPage, (currentPage + 1) * stampsPerPage);

  // Motivos sutiles por país de origen del pasaporte
  const bgMotifs = {
    ES: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 20 L50 20 L38 30 L42 45 L30 36 L18 45 L22 30 L10 20 L25 20Z' fill='none' stroke='%23c8a882' stroke-width='0.5' opacity='0.15'/%3E%3C/svg%3E\")",
    FR: "url(\"data:image/svg+xml,%3Csvg width='40' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 5 L20 55 M10 15 Q20 10 30 15 M10 35 Q20 30 30 35' stroke='%23c8a882' stroke-width='0.5' fill='none' opacity='0.2'/%3E%3C/svg%3E\")",
    DE: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='15' fill='none' stroke='%23c8a882' stroke-width='0.5' opacity='0.15'/%3E%3Ccircle cx='20' cy='20' r='8' fill='none' stroke='%23c8a882' stroke-width='0.5' opacity='0.15'/%3E%3C/svg%3E\")",
    JP: "url(\"data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='25' cy='25' r='12' fill='none' stroke='%23c8a882' stroke-width='0.5' opacity='0.2'/%3E%3Ccircle cx='25' cy='25' r='20' fill='none' stroke='%23c8a882' stroke-width='0.5' opacity='0.12'/%3E%3C/svg%3E\")",
    DEFAULT: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='25' fill='none' stroke='%23c8a882' stroke-width='0.5' opacity='0.12'/%3E%3Ccircle cx='30' cy='30' r='15' fill='none' stroke='%23c8a882' stroke-width='0.4' opacity='0.1'/%3E%3C/svg%3E\")",
  };
  const motif = bgMotifs[passportCountry] || bgMotifs.DEFAULT;

  return (
    <div className="min-h-screen bg-background pb-4">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-foreground">Pasaporte</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tu colección de viajes</p>
      </div>

      <div className="flex justify-center px-5 py-6">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* Passport Cover */
            <motion.button
              key="cover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.4 }}
              onClick={() => setIsOpen(true)}
              className={`w-64 h-80 md:w-72 md:h-96 bg-gradient-to-b ${colors.bg} rounded-xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden`}
            >
              {/* Decorative border */}
              <div className="absolute inset-3 border border-amber-300/30 rounded-lg" />
              <div className="absolute inset-5 border border-amber-300/15 rounded-lg" />

              {/* Emblem area */}
              <div className="w-16 h-16 rounded-full border-2 border-amber-300/40 flex items-center justify-center mb-4">
                <span className="text-3xl">{getCountryEmoji(passportCountry)}</span>
              </div>

              <h2 className={`text-sm font-bold tracking-[0.3em] uppercase ${colors.accent} mb-1`}>
                PASAPORTE
              </h2>
              <p className={`text-[10px] tracking-[0.2em] uppercase ${colors.accent} opacity-60`}>
                {getCountryName(passportCountry)}
              </p>

              {/* Waddle branding */}
              <div className="absolute bottom-6 flex flex-col items-center gap-1">
                <img src={LOGO_URL} alt="Waddle" className="w-6 h-6 rounded opacity-40" />
                <span className={`text-[8px] tracking-wider uppercase ${colors.accent} opacity-30`}>
                  WADDLE PASSPORT
                </span>
              </div>

              {/* Tap hint */}
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-20"
              >
                <span className={`text-[10px] ${colors.accent} opacity-50`}>Toca para abrir</span>
              </motion.div>
            </motion.button>
          ) : (
            /* Passport Open */
            <motion.div
              key="open"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-md"
            >
              {/* Close button & Add trip button */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsOpen(false); setCurrentPage(0); }}
                    className="text-xs text-muted-foreground"
                  >
                    <BookOpen className="w-4 h-4 mr-1" /> Cerrar pasaporte
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPastTrip(true)}
                    className="text-xs h-8 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar viaje pasado
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  Página {currentPage + 1} de {totalPages}
                </span>
              </div>

              {/* Passport page */}
              <div className="rounded-2xl border border-[#d4c4b0] shadow-lg min-h-[380px] p-5 relative overflow-hidden"
                style={{ backgroundColor: '#ede5db', backgroundImage: motif, backgroundRepeat: 'repeat' }}>
                {/* Líneas de página como papel real */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(180,150,110,0.12) 24px, rgba(180,150,110,0.12) 25px)' }} />

                {/* Borde decorativo interior */}
                <div className="absolute inset-3 rounded-xl border border-[#c8a882]/20 pointer-events-none" />

                {/* Page header */}
                <div className="text-center mb-4 relative">
                  <p className="text-[9px] text-[#8b6914] tracking-[0.3em] uppercase font-semibold">
                    Visados y Sellos
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1.5">
                    <div className="h-px flex-1 bg-[#c8a882]/40" />
                    <span className="text-[#c8a882] text-[8px]">✦</span>
                    <div className="h-px flex-1 bg-[#c8a882]/40" />
                  </div>
                </div>

                {sortedStamps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <p className="text-sm text-[#8b6914]/60 mb-1">Pasaporte vacío</p>
                    <p className="text-xs text-[#8b6914]/40">¡Empieza a viajar!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 relative">
                    {currentStamps.map((stamp, i) => (
                      <StampItem
                        key={stamp.id}
                        stamp={stamp}
                        index={i}
                        durationDays={stamp.trip_id ? tripDurationMap[stamp.trip_id] : null}
                        onClick={() => stamp.trip_id && navigate(`/trip/${stamp.trip_id}`)}
                      />
                    ))}
                  </div>
                )}

                {/* Page navigation */}
                {sortedStamps.length > 0 && (
                  <div className="flex items-center justify-between mt-6">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(p => p - 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-[#c8a882]/20 transition-colors text-[#5c3d11]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2 items-center">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button key={i} onClick={() => setCurrentPage(i)}
                          className={`rounded-full transition-all ${i === currentPage
                            ? 'w-5 h-2.5 bg-[#5c3d11]'
                            : 'w-2.5 h-2.5 bg-[#5c3d11]/30 hover:bg-[#5c3d11]/50'}`}
                        />
                      ))}
                    </div>
                    <button
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage(p => p + 1)}
                      className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-[#c8a882]/20 transition-colors text-[#5c3d11]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="px-5 mt-2">
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Colección de sellos</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-2xl font-bold text-primary">{stamps.length}</span>
            <span>países sellados en tu pasaporte</span>
          </div>
          {stamps.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {stamps.map(s => (
                <span key={s.id} className="text-lg" title={s.country_name}>
                  {getCountryEmoji(s.country_code)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Agregar viaje pasado */}
      {showAddPastTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-2xl border border-border max-w-sm w-full max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Agregar viaje pasado</h2>
              <button onClick={() => setShowAddPastTrip(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">País destino *</Label>
                <Select value={pastTripForm.destination_country} onValueChange={v => setPastTripForm(p => ({ ...p, destination_country: v }))}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue placeholder="Selecciona país" /></SelectTrigger>
                  <SelectContent className="max-h-64">{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Ciudad (opcional)</Label>
                <Input placeholder="ej. Estambul" value={pastTripForm.destination_city} onChange={e => setPastTripForm(p => ({ ...p, destination_city: e.target.value }))} className="h-10 rounded-lg text-sm" />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Fecha de entrada *</Label>
                <Input type="date" value={pastTripForm.start_date} onChange={e => setPastTripForm(p => ({ ...p, start_date: e.target.value }))} className="h-10 rounded-lg text-sm" />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Duración (días) *</Label>
                <Input type="number" placeholder="7" value={pastTripForm.duration_days} onChange={e => setPastTripForm(p => ({ ...p, duration_days: e.target.value }))} className="h-10 rounded-lg text-sm" />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Tipo de viaje</Label>
                <Select value={pastTripForm.trip_type} onValueChange={v => setPastTripForm(p => ({ ...p, trip_type: v }))}>
                  <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leisure">Ocio</SelectItem>
                    <SelectItem value="adventure">Aventura</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="family">Familiar</SelectItem>
                    <SelectItem value="work">Trabajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Título (opcional)</Label>
                <Input placeholder="ej. Ruta por la costa turca" value={pastTripForm.title} onChange={e => setPastTripForm(p => ({ ...p, title: e.target.value }))} className="h-10 rounded-lg text-sm" />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Momentos destacados (opcional)</Label>
                <Textarea placeholder="ej. Visita a la Mezquita Azul, paseo en barco por el Bósforo..." value={pastTripForm.highlights} onChange={e => setPastTripForm(p => ({ ...p, highlights: e.target.value }))} className="rounded-lg text-sm resize-none" rows={2} />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Notas (opcional)</Label>
                <Textarea placeholder="Reflexiones, consejos, lo que aprendiste..." value={pastTripForm.notes} onChange={e => setPastTripForm(p => ({ ...p, notes: e.target.value }))} className="rounded-lg text-sm resize-none" rows={2} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddPastTrip} disabled={savingTrip} className="flex-1 h-10 rounded-lg">
                  {savingTrip ? 'Guardando...' : 'Guardar viaje'}
                </Button>
                <Button onClick={() => setShowAddPastTrip(false)} variant="outline" className="flex-1 h-10 rounded-lg">
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}