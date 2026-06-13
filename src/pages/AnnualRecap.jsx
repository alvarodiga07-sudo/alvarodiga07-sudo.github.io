import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Line, Marker } from 'react-simple-maps';
import { ArrowLeft, Share2, Sparkles, Globe, Plane, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCountryEmoji, getCountryName, COUNTRIES } from '@/lib/countries';
import { N2A, CENTROIDS } from '@/lib/mapData';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CURRENT_YEAR = new Date().getFullYear();

export default function AnnualRecap() {
  const navigate = useNavigate();
  const [animStep, setAnimStep] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('start_date'),
  });

  const { data: stamps = [] } = useQuery({
    queryKey: ['stamps'],
    queryFn: () => base44.entities.PassportStamp.list('visit_date'),
  });

  const visitedCountries = user?.countries_visited || [];

  // Build sorted trip list for routes
  const sortedTrips = [...trips].sort((a, b) =>
    new Date(a.start_date || a.created_date) - new Date(b.start_date || b.created_date)
  );

  // Rutas: TODAS salen desde el país de origen del usuario, no de país en país
  // Así queda limpio y con sentido real: "yo salgo siempre desde España"
  const originCode = user?.country_of_origin || 'ES';
  const originCoords = CENTROIDS[originCode];
  const routes = sortedTrips
    .filter(t => t.destination_country && t.destination_country !== originCode)
    .map((t, i) => {
      const to = CENTROIDS[t.destination_country];
      if (!originCoords || !to) return null;
      return { from: originCoords, to, key: `${i}-${t.destination_country}` };
    })
    .filter(Boolean)
    // Deduplicar destinos (si viajaste 2 veces al mismo, una sola línea)
    .filter((r, i, arr) => arr.findIndex(x => x.key.split('-')[1] === r.key.split('-')[1]) === i);

  // Continents
  const continents = new Set(
    visitedCountries.map(code => {
      const c = COUNTRIES.find(x => x.code === code);
      return c?.continent;
    }).filter(Boolean)
  );

  // Trigger animation steps
  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimStep(1), 600),
      setTimeout(() => setAnimStep(2), 1400),
      setTimeout(() => setAnimStep(3), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const displayName = user?.display_name || user?.full_name || 'Viajero';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Resumen {CURRENT_YEAR}</h1>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Intro card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 mb-4 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-widest">Tu año viajero</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {visitedCountries.length > 0
            ? `¡${visitedCountries.length} país${visitedCountries.length > 1 ? 'es' : ''} conquistado${visitedCountries.length > 1 ? 's' : ''}!`
            : '¡Empieza a explorar el mundo!'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{displayName} · {CURRENT_YEAR}</p>
      </motion.div>

      {/* World map */}
      <div className="mx-5 bg-card rounded-2xl border border-border overflow-hidden mb-4">
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tu mapa mundial</span>
        </div>
        <div className="relative">
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 150, center: [0, 0] }}
            width={960}
            height={500}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numId = String(geo.id || '').padStart(3, '0');
                  const alpha2 = N2A[numId];
                  const isVisited = alpha2 ? visitedCountries.includes(alpha2) : false;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isVisited ? "hsl(45,93%,47%)" : "hsl(var(--secondary))"}
                      stroke="hsl(var(--border))"
                      strokeWidth={0.4}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Definir marcador de flecha */}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" fill="#374151">
                <polygon points="0 0, 6 3, 0 6" />
              </marker>
            </defs>

            {/* Flight routes con flecha al final, color más sutil */}
            {animStep >= 2 && routes.map((route, i) => (
              <motion.g key={route.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}>
                <Line
                  from={route.from}
                  to={route.to}
                  stroke="#6b7280"
                  strokeWidth={1}
                  strokeLinecap="round"
                  strokeDasharray="4 3"
                  markerEnd="url(#arrowhead)"
                  style={{ opacity: 0.7 }}
                />
              </motion.g>
            ))}

            {/* Punto de origen del usuario - sutil */}
            {originCoords && (
              <Marker coordinates={originCoords}>
                <circle r={2.5} fill="#374151" stroke="white" strokeWidth={0.8} />
              </Marker>
            )}

            {/* Puntos de destinos visitados - más pequeños */}
            {animStep >= 1 && visitedCountries.map((code) => {
              const coords = CENTROIDS[code];
              if (!coords) return null;
              return (
                <motion.g key={code} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Marker coordinates={coords}>
                    <circle r={2} fill="#374151" stroke="white" strokeWidth={0.8} />
                  </Marker>
                </motion.g>
              );
            })}
          </ComposableMap>
        </div>
      </div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={animStep >= 3 ? { opacity: 1, y: 0 } : {}}
        className="mx-5 grid grid-cols-3 gap-3 mb-4"
      >
        <StatCard
          icon={<Globe className="w-5 h-5 text-primary" />}
          value={visitedCountries.length}
          label="Países"
        />
        <StatCard
          icon={<Map className="w-5 h-5 text-primary" />}
          value={continents.size}
          label="Continentes"
        />
        <StatCard
          icon={<Plane className="w-5 h-5 text-primary" />}
          value={trips.length}
          label="Viajes"
        />
      </motion.div>

      {/* Countries list */}
      {visitedCountries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={animStep >= 3 ? { opacity: 1 } : {}}
          className="mx-5 bg-card rounded-2xl border border-border p-4 mb-4"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">Países visitados</h3>
          <div className="flex flex-wrap gap-2">
            {visitedCountries.map(code => (
              <span
                key={code}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 text-foreground rounded-xl text-xs font-medium"
              >
                <span className="text-base">{getCountryEmoji(code)}</span>
                {getCountryName(code)}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stamps */}
      {stamps.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={animStep >= 3 ? { opacity: 1 } : {}}
          className="mx-5 bg-card rounded-2xl border border-border p-4 mb-24"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3">Sellos del pasaporte</h3>
          <div className="flex gap-2 flex-wrap">
            {stamps.map(s => (
              <span key={s.id} className="text-2xl" title={s.country_name}>
                {getCountryEmoji(s.country_code)}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {visitedCountries.length === 0 && (
        <div className="mx-5 bg-card rounded-2xl border border-border p-8 text-center mb-24">
          <Plane className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Aún no hay viajes registrados</p>
          <p className="text-xs text-muted-foreground mb-4">Empieza a añadir viajes para ver tu resumen anual</p>
          <Button onClick={() => navigate('/trips')} className="rounded-xl">
            <Plane className="w-4 h-4 mr-2" />
            Añadir viaje
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
    </div>
  );
}
