import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Users, Edit3, Save, Plus, Image,
  Video, Map, FileText, Trash2, Check, Plane, Hotel, ChevronDown,
  ChevronUp, Clock, DollarSign, Info, Utensils, Star, Sparkles, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import TripMap from '@/components/trips/TripMap';
import TripVideoTab from '@/components/trips/TripVideoTab';
import { toast } from 'sonner';
import { generateItinerary } from '@/lib/claudeAI';
import { COUNTRIES } from '@/lib/countries';

const STATUS_LABELS = { planning: 'Planeando', active: 'Activo', completed: 'Completado' };
const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-amber-100 text-amber-700',
};

// ─── Itinerario IA completo ────────────────────────────────────────────────
function AIItinerary({ itinerary, trip, onRegenerate, regenerating }) {
  const [openDay, setOpenDay] = useState(0);

  if (!itinerary) return (
    <div className="bg-card rounded-2xl border border-dashed border-primary/30 p-8 text-center">
      <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
      <p className="text-sm font-semibold text-foreground mb-1">Sin itinerario IA todavía</p>
      <p className="text-xs text-muted-foreground mb-4">Genera uno con un clic — incluye actividades, restaurantes, vuelos y hoteles</p>
      <Button onClick={onRegenerate} disabled={regenerating} className="rounded-xl h-9 text-xs">
        {regenerating ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generando...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generar itinerario con IA</>}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Botón regenerar */}
      <div className="flex justify-end">
        <Button onClick={onRegenerate} disabled={regenerating} variant="outline" size="sm" className="h-8 rounded-xl text-xs">
          {regenerating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
          Regenerar
        </Button>
      </div>

      {/* Resumen */}
      {itinerary.resumen && (
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-4">
          <p className="text-sm font-medium text-foreground leading-relaxed">{itinerary.resumen}</p>
        </div>
      )}

      {/* Precio total destacado — por persona y grupo (#10) */}
      {(itinerary.precio_total_persona || itinerary.precio_total_grupo) && (
        <div className="bg-foreground text-background rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Coste estimado del viaje</p>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            {itinerary.precio_total_persona && (
              <div>
                <p className="text-[10px] opacity-60">Por persona</p>
                <p className="text-lg font-bold">{itinerary.precio_total_persona}</p>
              </div>
            )}
            {itinerary.precio_total_grupo && (
              <div className="text-right">
                <p className="text-[10px] opacity-60">Total grupo</p>
                <p className="text-lg font-bold">{itinerary.precio_total_grupo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info rápida */}
      <div className="grid grid-cols-2 gap-2">
        {itinerary.presupuesto_estimado && (
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Presupuesto est.</p>
            <p className="text-xs font-bold text-foreground">{itinerary.presupuesto_estimado}</p>
          </div>
        )}
        {itinerary.clima_temporada && (
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Clima</p>
            <p className="text-xs font-bold text-foreground">{itinerary.clima_temporada}</p>
          </div>
        )}
        {itinerary.mejor_epoca && (
          <div className="bg-card rounded-xl border border-border p-3 col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Mejor época para ir</p>
            <p className="text-xs text-foreground">{itinerary.mejor_epoca}</p>
          </div>
        )}
      </div>

      {/* Desglose de presupuesto */}
      {itinerary.desglose_presupuesto && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border-b border-border">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-foreground">Desglose del presupuesto (por persona)</span>
          </div>
          <div className="p-4 space-y-2">
            {Object.entries(itinerary.desglose_presupuesto).map(([k, v]) => {
              const labels = { alojamiento:'🏨 Alojamiento', comida:'🍽️ Comida', actividades:'🎟️ Actividades', transporte:'🚕 Transporte', vuelos:'✈️ Vuelos' };
              return (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{labels[k] || k}</span>
                  <span className="font-semibold text-foreground">{v}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vuelos */}
      {itinerary.vuelos && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-border">
            <Plane className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-foreground">Vuelos</span>
          </div>
          <div className="p-4 space-y-2">
            {itinerary.vuelos.precio_aproximado && (
              <p className="text-xs text-foreground"><span className="font-semibold">Precio aprox.:</span> {itinerary.vuelos.precio_aproximado}</p>
            )}
            {itinerary.vuelos.mejor_momento_comprar && (
              <p className="text-xs text-foreground"><span className="font-semibold">Mejor momento para comprar:</span> {itinerary.vuelos.mejor_momento_comprar}</p>
            )}
            {itinerary.vuelos.consejo_vuelo && (
              <p className="text-xs text-muted-foreground">{itinerary.vuelos.consejo_vuelo}</p>
            )}
            {itinerary.vuelos.aerolineas_recomendadas?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {itinerary.vuelos.aerolineas_recomendadas.map((a, i) => (
                  <span key={i} className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            )}
            {itinerary.vuelos.url_busqueda && (
              <a href={itinerary.vuelos.url_busqueda} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-2 hover:underline">
                <Plane className="w-3 h-3" /> Buscar vuelos en Skyscanner →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Hoteles */}
      {itinerary.hoteles && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-border">
            <Hotel className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-foreground">Alojamiento</span>
          </div>
          <div className="p-4 space-y-2">
            {itinerary.hoteles.zona_recomendada && (
              <p className="text-xs text-foreground"><span className="font-semibold">Zona recomendada:</span> {itinerary.hoteles.zona_recomendada}</p>
            )}
            {itinerary.hoteles.precio_noche && (
              <p className="text-xs text-foreground"><span className="font-semibold">Precio por noche:</span> {itinerary.hoteles.precio_noche}</p>
            )}
            {itinerary.hoteles.tipo_recomendado && (
              <p className="text-xs text-muted-foreground">{itinerary.hoteles.tipo_recomendado}</p>
            )}
            {itinerary.hoteles.hoteles_sugeridos?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Sugerencias:</p>
                {itinerary.hoteles.hoteles_sugeridos.map((h, i) => (
                  <p key={i} className="text-xs text-foreground flex items-start gap-1"><Star className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />{h}</p>
                ))}
              </div>
            )}
            {itinerary.hoteles.url_busqueda && (
              <a href={itinerary.hoteles.url_busqueda} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-2 hover:underline">
                <Hotel className="w-3 h-3" /> Buscar en Booking.com →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Consejos de ahorro */}
      {itinerary.consejos_ahorro?.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-800 p-4">
          <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">💡 Consejos de ahorro</p>
          {itinerary.consejos_ahorro.map((c, i) => (
            <p key={i} className="text-xs text-green-800 dark:text-green-300 flex items-start gap-1.5 mb-1">
              <span>•</span>{c}
            </p>
          ))}
        </div>
      )}

      {/* Días del itinerario */}
      {itinerary.dias?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">📅 Itinerario día a día</h3>
          <div className="space-y-3">
            {itinerary.dias.map((dia, idx) => (
              <div key={idx} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpenDay(openDay === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{dia.dia}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{dia.titulo}</p>
                      {dia.descripcion_dia && <p className="text-xs text-muted-foreground truncate max-w-[220px]">{dia.descripcion_dia}</p>}
                    </div>
                  </div>
                  {openDay === idx ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>

                <AnimatePresence>
                  {openDay === idx && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border">
                      <div className="p-4 space-y-4">

                        {/* Frase del día */}
                        {dia.frase_del_dia && (
                          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-3">
                            <p className="text-xs italic text-foreground">"{dia.frase_del_dia}"</p>
                          </div>
                        )}

                        {/* Tema del día */}
                        {dia.tema && (
                          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-primary font-bold">
                            <span>📍</span> Tema: {dia.tema}
                          </div>
                        )}

                        {/* Plan del día (timeline) */}
                        {dia.actividades?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Plan del día</p>
                            <div className="space-y-2">
                              {dia.actividades.map((act, ai) => {
                                const franjaColors = {
                                  'mañana': 'bg-amber-100 text-amber-700 border-amber-200',
                                  'mediodía': 'bg-orange-100 text-orange-700 border-orange-200',
                                  'tarde': 'bg-blue-100 text-blue-700 border-blue-200',
                                  'atardecer': 'bg-pink-100 text-pink-700 border-pink-200',
                                  'noche': 'bg-indigo-100 text-indigo-700 border-indigo-200',
                                };
                                const colorClass = franjaColors[act.franja] || 'bg-secondary text-muted-foreground';
                                return (
                                  <div key={ai} className="flex gap-3">
                                    <div className="flex flex-col items-center min-w-[55px]">
                                      <span className="text-[10px] font-mono font-bold text-foreground whitespace-nowrap">{act.hora}</span>
                                      {act.franja && <span className={`text-[8px] mt-0.5 px-1.5 py-0.5 rounded-full ${colorClass} font-semibold capitalize`}>{act.franja}</span>}
                                      {ai < dia.actividades.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                                    </div>
                                    <div className={`flex-1 pb-3 ${act.opcional ? 'opacity-70' : ''}`}>
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-semibold text-foreground">
                                          {act.opcional && '✨ '}
                                          {act.nombre}
                                          {act.prioridad === 'imprescindible' && <span className="ml-1 text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">⭐ Imprescindible</span>}
                                        </p>
                                        {act.coste && <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground whitespace-nowrap flex-shrink-0">{act.coste}</span>}
                                      </div>
                                      {act.descripcion && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{act.descripcion}</p>}
                                      {act.consejo && (
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1">
                                          <span>💡</span>{act.consejo}
                                        </p>
                                      )}
                                      {act.duracion && <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground mt-1"><Clock className="w-2.5 h-2.5" />{act.duracion}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Presupuesto del día */}
                        {dia.presupuesto_dia && (
                          <div className="bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800 p-2.5">
                            <p className="text-[10px] font-bold text-green-700 dark:text-green-400">💰 Coste estimado del día</p>
                            <p className="text-xs text-green-800 dark:text-green-300 mt-0.5">{dia.presupuesto_dia}</p>
                          </div>
                        )}

                        {/* Cómo moverse */}
                        {dia.como_moverse && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-base">🚶</span>
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Cómo moverse</p>
                              <p className="text-[11px] text-foreground">{dia.como_moverse}</p>
                            </div>
                          </div>
                        )}

                        {/* Qué llevar + Qué fotografiar (2 columnas) */}
                        <div className="grid grid-cols-2 gap-3">
                          {dia.que_llevar?.length > 0 && (
                            <div className="bg-secondary/40 rounded-xl p-2.5">
                              <p className="text-[10px] font-bold text-foreground uppercase mb-1">🎒 Qué llevar</p>
                              <ul className="space-y-0.5">
                                {dia.que_llevar.map((q, qi) => (
                                  <li key={qi} className="text-[10px] text-muted-foreground">• {q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {dia.que_fotografiar?.length > 0 && (
                            <div className="bg-secondary/40 rounded-xl p-2.5">
                              <p className="text-[10px] font-bold text-foreground uppercase mb-1">📸 Fotografía</p>
                              <ul className="space-y-0.5">
                                {dia.que_fotografiar.map((q, qi) => (
                                  <li key={qi} className="text-[10px] text-muted-foreground">• {q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Alternativa lluvia */}
                        {dia.alternativa_lluvia && (
                          <div className="flex items-start gap-2 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2">
                            <span>☔</span>
                            <span><strong>Si llueve:</strong> {dia.alternativa_lluvia}</span>
                          </div>
                        )}

                        {/* Tip cultural */}
                        {dia.tip_cultural && (
                          <div className="flex items-start gap-2 text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2">
                            <span>🌍</span>
                            <span><strong>Tip cultural:</strong> {dia.tip_cultural}</span>
                          </div>
                        )}

                        {/* Restaurantes (info adicional) */}
                        {dia.restaurantes?.length > 0 && (
                          <details className="bg-secondary/30 rounded-xl">
                            <summary className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide p-3 cursor-pointer">
                              🍽️ Más opciones para comer ({dia.restaurantes.length})
                            </summary>
                            <div className="p-3 pt-0 space-y-2">
                              {dia.restaurantes.map((r, ri) => (
                                <div key={ri} className="bg-card rounded-xl p-2.5">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <Utensils className="w-3 h-3 text-muted-foreground" />
                                      <span className="text-xs font-semibold text-foreground">{r.nombre}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {r.comida && <span className="text-[9px] bg-background border border-border px-1.5 rounded-full">{r.comida}</span>}
                                      {r.precio && <span className="text-[9px] text-muted-foreground">{r.precio}</span>}
                                    </div>
                                  </div>
                                  {r.cocina && <p className="text-[10px] text-muted-foreground">{r.cocina}</p>}
                                  {r.plato_estrella && <p className="text-[10px] text-amber-600 dark:text-amber-400">★ Pedir: {r.plato_estrella}</p>}
                                  {r.descripcion && <p className="text-[10px] text-muted-foreground mt-0.5">{r.descripcion}</p>}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        {/* Alojamiento del día */}
                        {dia.alojamiento_zona && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <Hotel className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>Dormir en: <span className="text-foreground font-medium">{dia.alojamiento_zona}</span></span>
                          </div>
                        )}

                        {/* Nota del día */}
                        {dia.nota_del_dia && (
                          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-3">
                            <p className="text-xs text-amber-800 dark:text-amber-300">{dia.nota_del_dia}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info práctica */}
      {itinerary.info_practica && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50 border-b border-border">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Información práctica</span>
          </div>
          <div className="p-4 grid grid-cols-1 gap-3">
            {Object.entries(itinerary.info_practica).map(([key, val]) => {
              if (!val || key === 'apps_utiles') return null;
              const labels = {
                moneda: '💰 Moneda', visado: '📋 Visado', transporte_local: '🚌 Transporte local',
                transporte_desde_origen: '✈️ Cómo llegar', idioma: '🗣️ Idioma',
                seguridad: '🛡️ Seguridad', sanidad: '🏥 Sanidad', propina: '💵 Propinas',
                enchufe: '🔌 Enchufe', agua: '💧 Agua', conduccion: '🚗 Conducción',
              };
              return (
                <div key={key}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">{labels[key] || key}</p>
                  <p className="text-xs text-foreground leading-relaxed">{val}</p>
                </div>
              );
            })}
            {itinerary.info_practica.apps_utiles?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">📱 Apps útiles</p>
                <div className="flex flex-wrap gap-1.5">
                  {itinerary.info_practica.apps_utiles.map((app, i) => (
                    <span key={i} className="text-[10px] bg-secondary px-2 py-0.5 rounded-full text-foreground">{app}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function TripDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tripId = window.location.pathname.split('/trip/')[1];
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmCount, setDeleteConfirmCount] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [dateForm, setDateForm] = useState({ start_date:'', end_date:'' });

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => { const trips = await base44.entities.Trip.filter({ id: tripId }); return trips[0]; },
    enabled: !!tripId,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ['tripPhotos', tripId],
    queryFn: () => base44.entities.TripPhoto.filter({ trip_id: tripId }),
    enabled: !!tripId,
  });

  const handleSaveDates = async () => {
    if (!dateForm.start_date) {
      toast.error('Selecciona al menos la fecha de inicio');
      return;
    }
    try {
      // Calcular end_date si no se ha puesto y hay duration_days
      let end = dateForm.end_date;
      if (!end && trip.duration_days) {
        const d = new Date(dateForm.start_date);
        d.setDate(d.getDate() + Number(trip.duration_days) - 1);
        end = d.toISOString().split('T')[0];
      }
      await base44.entities.Trip.update(tripId, {
        start_date: dateForm.start_date,
        end_date: end || dateForm.end_date,
      });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setEditingDates(false);
      toast.success('Fechas actualizadas');
    } catch (err) {
      toast.error('Error al guardar fechas');
    }
  };

  const handleSaveNotes = async () => {
    await base44.entities.Trip.update(tripId, { itinerary_notes: notesText });
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    setEditingNotes(false);
    toast.success('Notas guardadas');
  };

  const handleUploadPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    await Promise.all(files.map(async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.TripPhoto.create({ trip_id: tripId, image_url: file_url, taken_date: new Date().toISOString().split('T')[0] });
    }));
    queryClient.invalidateQueries({ queryKey: ['tripPhotos', tripId] });
    setUploading(false);
    toast.success(files.length > 1 ? `${files.length} fotos añadidas` : 'Foto añadida');
  };

  const handleDeleteTrip = async () => {
    // Triple confirmación: 3 clicks para borrar
    if (deleteConfirmCount < 2) {
      setDeleteConfirmCount(deleteConfirmCount + 1);
      toast.success(deleteConfirmCount === 0 ? 'Pulsa 2 veces más para eliminar' : 'Una más para confirmar');
      return;
    }
    // Tercer click: borrar
    try {
      await base44.entities.Trip.delete(tripId);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Viaje eliminado');
      navigate('/trips');
    } catch (err) {
      toast.error('Error al eliminar viaje');
    }
  };

  const handleMarkCompleted = async () => {
    await base44.entities.Trip.update(tripId, { status: 'completed' });
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    toast.success('Viaje completado');
  };

  const handleRegenerate = async () => {
    if (!trip) return;
    setRegenerating(true);
    const countryData = COUNTRIES.find(c => c.code === trip.destination_country);
    const originData = COUNTRIES.find(c => c.code === trip.origin_country);
    try {
      const aiPromise = generateItinerary({
        ...trip,
        destination_country: countryData?.name || trip.destination_country,
        origin_country: originData?.name || trip.origin_country,
      }, () => {});
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 50000));
      const ai = await Promise.race([aiPromise, timeout]);
      if (ai) {
        await base44.entities.Trip.update(tripId, { ai_itinerary: ai });
        queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
        toast.success('¡Itinerario generado!');
      }
    } catch (e) {
      toast.error(e.message === 'TIMEOUT' ? 'Timeout — inténtalo de nuevo' : `Error: ${e.message}`);
    }
    setRegenerating(false);
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!trip) return <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6"><p className="text-muted-foreground mb-4">Viaje no encontrado</p><Button onClick={() => navigate('/trips')}>Volver</Button></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary flex items-center justify-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-card/60 backdrop-blur rounded-full h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="absolute top-4 right-4 flex gap-2">
          {trip.status !== 'completed' && (
            <Button size="sm" onClick={handleMarkCompleted} className="h-8 px-3 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs">
              <Check className="w-3.5 h-3.5 mr-1" />Completar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleDeleteTrip} title={deleteConfirmCount === 0 ? 'Eliminar viaje' : deleteConfirmCount === 1 ? 'Confirma de nuevo' : 'Último clic para borrar'}
            className={`backdrop-blur rounded-full h-9 w-9 transition-all ${deleteConfirmCount === 0 ? 'bg-card/60 text-destructive' : deleteConfirmCount === 1 ? 'bg-destructive/30 text-destructive' : 'bg-destructive/50 text-white'}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-6xl">{getCountryEmoji(trip.destination_country)}</span>
      </div>

      {/* Info card */}
      <div className="px-4 -mt-5 relative z-10">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-lg font-bold text-foreground flex-1 pr-2">{trip.title}</h1>
            {trip.status && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[trip.status] || STATUS_COLORS.planning}`}>{STATUS_LABELS[trip.status]}</span>}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{getCountryName(trip.destination_country)}{trip.destination_city && ` · ${trip.destination_city}`}</span>
            <button
              onClick={() => {
                setDateForm({ start_date: trip.start_date || '', end_date: trip.end_date || '' });
                setEditingDates(true);
              }}
              className="flex items-center gap-1 hover:text-primary"
              title="Editar fechas"
            >
              <Calendar className="w-3.5 h-3.5" />
              {trip.start_date
                ? <>{format(new Date(trip.start_date + 'T12:00'), 'dd MMM yyyy')}{trip.end_date && ` → ${format(new Date(trip.end_date + 'T12:00'), 'dd MMM yyyy')}`}</>
                : <span className="text-primary underline">Añadir fecha</span>}
              <Edit3 className="w-3 h-3 opacity-60" />
            </button>
            {trip.travelers_count > 1 && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{trip.travelers_count} viajeros</span>}
            {trip.duration_days && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trip.duration_days} días</span>}
          </div>

          {/* Editor de fechas */}
          {editingDates && (
            <div className="mt-3 p-3 bg-secondary/40 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-foreground">Editar fechas del viaje</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">Inicio</label>
                  <input type="date" value={dateForm.start_date}
                    onChange={(e) => setDateForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full h-9 px-2 text-xs rounded-lg border border-border bg-background" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Fin (opcional)</label>
                  <input type="date" value={dateForm.end_date}
                    onChange={(e) => setDateForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full h-9 px-2 text-xs rounded-lg border border-border bg-background" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveDates} className="flex-1 h-8 rounded-lg text-xs">
                  <Save className="w-3 h-3 mr-1" />Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingDates(false)} className="h-8 rounded-lg text-xs px-3">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4 pb-24">
        <Tabs defaultValue="itinerary">
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="itinerary" className="flex-1 text-xs gap-1"><Sparkles className="w-3 h-3" />IA</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1 text-xs gap-1"><FileText className="w-3 h-3" />Notas</TabsTrigger>
            <TabsTrigger value="photos" className="flex-1 text-xs gap-1"><Image className="w-3 h-3" />Fotos</TabsTrigger>
            <TabsTrigger value="map" className="flex-1 text-xs gap-1"><Map className="w-3 h-3" />Mapa</TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 text-xs gap-1"><Video className="w-3 h-3" />Video</TabsTrigger>
          </TabsList>

          {/* ── Itinerario IA ── */}
          <TabsContent value="itinerary" className="mt-4">
            {regenerating && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3 mb-4">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs font-medium text-primary">Generando itinerario con IA...</span>
              </div>
            )}
            <AIItinerary
              itinerary={trip.ai_itinerary}
              trip={trip}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
            />
          </TabsContent>

          {/* ── Notas personales ── */}
          <TabsContent value="notes" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Mis notas</h3>
              <Button size="sm" variant="ghost" onClick={() => {
                if (editingNotes) handleSaveNotes();
                else { setNotesText(trip.itinerary_notes || ''); setEditingNotes(true); }
              }} className="text-xs text-primary h-7">
                {editingNotes ? <><Save className="w-3.5 h-3.5 mr-1" />Guardar</> : <><Edit3 className="w-3.5 h-3.5 mr-1" />Editar</>}
              </Button>
            </div>
            {editingNotes ? (
              <Textarea value={notesText} onChange={e => setNotesText(e.target.value)}
                placeholder="Notas personales, recordatorios, puntos de interés..." className="min-h-[200px] rounded-xl" />
            ) : trip.itinerary_notes ? (
              <div className="bg-card rounded-xl border border-border p-4 whitespace-pre-wrap text-sm leading-relaxed">{trip.itinerary_notes}</div>
            ) : (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">Sin notas todavía</p>
                <Button size="sm" variant="outline" onClick={() => { setNotesText(''); setEditingNotes(true); }} className="rounded-xl text-xs">
                  <Edit3 className="w-3 h-3 mr-1" />Añadir notas
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Fotos ── */}
          <TabsContent value="photos" className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Fotos del viaje</h3>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadPhoto} />
                <span className="inline-flex items-center text-xs text-primary font-medium">
                  <Plus className="w-3.5 h-3.5 mr-1" />{uploading ? 'Subiendo...' : 'Añadir fotos'}
                </span>
              </label>
            </div>
            {photos.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Image className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">Sin fotos todavía</p>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadPhoto} />
                  <span className="inline-flex items-center text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium"><Plus className="w-3 h-3 mr-1" />Subir fotos</span>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {photos.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square">
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  </motion.div>
                ))}
                <label className="aspect-square border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 rounded-lg">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadPhoto} />
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </label>
              </div>
            )}
          </TabsContent>

          {/* ── Mapa ── */}
          <TabsContent value="map" className="mt-4">
            {trip.destination_country
              ? <TripMap countryCode={trip.destination_country} cityName={trip.destination_city} />
              : <div className="bg-card rounded-xl border border-border p-8 text-center"><Map className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-xs text-muted-foreground">Sin destino asignado</p></div>}
          </TabsContent>

          {/* ── Video ── */}
          <TabsContent value="videos" className="mt-4">
            <TripVideoTab photos={photos} tripTitle={trip.title} tripId={tripId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
