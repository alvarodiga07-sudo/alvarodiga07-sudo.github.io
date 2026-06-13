import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Clock, MapPin, Utensils, Plane, Hotel,
  Info, Lightbulb, Globe, Shield, Zap, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_ICONS = {
  visita: '🏛️', comida: '🍽️', transporte: '🚌', ocio: '🎉',
  compras: '🛍️', naturaleza: '🌿', default: '📍',
};
const MEAL_ICONS = { desayuno: '☀️', almuerzo: '🍽️', cena: '🌙' };
const PRICE_COLOR = { '€': 'text-green-600', '€€': 'text-amber-600', '€€€': 'text-red-600' };

function DayCard({ day, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{day.dia}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{day.titulo}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {day.actividades?.length || 0} actividades · {day.restaurantes?.length || 0} restaurantes
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Actividades */}
              {day.actividades?.map((act, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center pt-0.5">
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right flex-shrink-0">
                      {act.hora}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-none mt-0.5">{TYPE_ICONS[act.tipo] || TYPE_ICONS.default}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{act.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{act.descripcion}</p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {act.duracion && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                              <Clock className="w-2.5 h-2.5" />{act.duracion}
                            </span>
                          )}
                          {act.coste && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 px-2 py-0.5 rounded-full text-primary font-medium">
                              {act.coste}
                            </span>
                          )}
                        </div>
                        {act.consejo && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1">
                            <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {act.consejo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Restaurantes */}
              {day.restaurantes?.length > 0 && (
                <div className="bg-secondary/50 rounded-xl p-3 mt-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dónde comer</p>
                  <div className="space-y-2">
                    {day.restaurantes.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-sm">{MEAL_ICONS[r.comida] || '🍴'}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-foreground">{r.nombre}</p>
                            <span className={`text-[10px] font-bold ${PRICE_COLOR[r.precio] || ''}`}>{r.precio}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{r.cocina}{r.descripcion ? ` · ${r.descripcion}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nota del día */}
              {day.nota_del_dia && (
                <p className="text-[11px] text-primary bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                  💡 {day.nota_del_dia}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ItineraryView({ itinerary }) {
  if (!itinerary) return null;
  const [tab, setTab] = useState('dias');

  const tabs = [
    { id: 'dias', label: 'Días', icon: '📅' },
    { id: 'practica', label: 'Info práctica', icon: '📋' },
    { id: 'vuelos', label: 'Vuelos', icon: '✈️' },
    { id: 'hoteles', label: 'Hoteles', icon: '🏨' },
  ];

  return (
    <div className="space-y-4">
      {/* Resumen */}
      {itinerary.resumen && (
        <div className="bg-gradient-to-br from-primary/15 via-accent/10 to-secondary rounded-2xl p-4">
          <p className="text-sm text-foreground leading-relaxed">{itinerary.resumen}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            {itinerary.presupuesto_estimado && (
              <span className="text-xs font-semibold bg-card px-3 py-1 rounded-full border border-border">
                💰 {itinerary.presupuesto_estimado}
              </span>
            )}
            {itinerary.mejor_epoca && (
              <span className="text-xs font-semibold bg-card px-3 py-1 rounded-full border border-border">
                🌤 {itinerary.mejor_epoca}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Días */}
      {tab === 'dias' && (
        <div className="space-y-3">
          {itinerary.dias?.map((day, i) => (
            <DayCard key={i} day={day} index={i} />
          ))}
        </div>
      )}

      {/* Info práctica */}
      {tab === 'practica' && itinerary.info_practica && (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border">
          {[
            { icon: <Globe className="w-4 h-4" />, label: 'Moneda', val: itinerary.info_practica.moneda },
            { icon: <Info className="w-4 h-4" />, label: 'Visado', val: itinerary.info_practica.visado },
            { icon: <MapPin className="w-4 h-4" />, label: 'Transporte', val: itinerary.info_practica.transporte_local },
            { icon: <Zap className="w-4 h-4" />, label: 'Electricidad', val: itinerary.info_practica.electricidad },
            { icon: <Globe className="w-4 h-4" />, label: 'Idioma', val: itinerary.info_practica.idioma },
            { icon: <Shield className="w-4 h-4" />, label: 'Seguridad', val: itinerary.info_practica.seguridad },
            { icon: <Info className="w-4 h-4" />, label: 'Sanidad', val: itinerary.info_practica.sanidad },
          ].filter(r => r.val).map((row, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5">
              <span className="text-primary mt-0.5 flex-shrink-0">{row.icon}</span>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{row.label}</p>
                <p className="text-sm text-foreground mt-0.5">{row.val}</p>
              </div>
            </div>
          ))}
          {itinerary.info_practica.apps_utiles?.length > 0 && (
            <div className="p-3.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Apps útiles</p>
              <div className="space-y-1">
                {itinerary.info_practica.apps_utiles.map((app, i) => (
                  <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-primary">📱</span>{app}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vuelos */}
      {tab === 'vuelos' && itinerary.vuelos && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Recomendaciones de vuelo</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{itinerary.vuelos.consejo}</p>
            {itinerary.vuelos.aerolineas_recomendadas?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {itinerary.vuelos.aerolineas_recomendadas.map((a, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{a}</span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href={itinerary.vuelos.url_busqueda} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-card rounded-2xl border border-border p-4 hover:border-primary/50 transition-all">
              <span className="text-2xl">🔍</span>
              <p className="text-xs font-semibold text-center">Buscar en Skyscanner</p>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
            <a href={`https://www.google.com/flights`} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-card rounded-2xl border border-border p-4 hover:border-primary/50 transition-all">
              <span className="text-2xl">✈️</span>
              <p className="text-xs font-semibold text-center">Google Flights</p>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>
        </div>
      )}

      {/* Hoteles */}
      {tab === 'hoteles' && itinerary.hoteles && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Hotel className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Dónde alojarse</p>
            </div>
            {[
              { label: 'Zona recomendada', val: itinerary.hoteles.zona_recomendada },
              { label: 'Tipo de alojamiento', val: itinerary.hoteles.tipo_alojamiento },
              { label: 'Precio por noche', val: itinerary.hoteles.presupuesto_noche },
            ].filter(r => r.val).map((row, i) => (
              <div key={i} className="mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{row.label}</p>
                <p className="text-sm text-foreground mt-0.5">{row.val}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href={itinerary.hoteles.url_busqueda} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-card rounded-2xl border border-border p-4 hover:border-primary/50 transition-all">
              <span className="text-2xl">🏨</span>
              <p className="text-xs font-semibold text-center">Buscar en Booking</p>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
            <a href="https://www.airbnb.es" target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 bg-card rounded-2xl border border-border p-4 hover:border-primary/50 transition-all">
              <span className="text-2xl">🏠</span>
              <p className="text-xs font-semibold text-center">Buscar en Airbnb</p>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
