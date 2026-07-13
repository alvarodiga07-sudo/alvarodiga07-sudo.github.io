import { useT } from '@/lib/i18n';
import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { useNavigate } from 'react-router-dom';
import { N2A } from '@/lib/mapData';
import GEO_URL from 'world-atlas/countries-50m.json?url';

export default function MiniWorldMap({ visitedCountries = [], trips = [] }) {
  const { t } = useT();
  const navigate = useNavigate();
  const visitedSet = useMemo(() => new Set(visitedCountries), [visitedCountries]);

  // map country code → most recent trip id
  const countryToTrip = useMemo(() => {
    const map = {};
    [...trips]
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .forEach(t => { if (t.destination_country && !map[t.destination_country]) map[t.destination_country] = t.id; });
    return map;
  }, [trips]);

  const handleClick = (alpha2) => {
    if (!alpha2 || !visitedSet.has(alpha2)) return;
    const tripId = countryToTrip[alpha2];
    if (tripId) navigate(`/trip/${tripId}`);
  };

  return (
    <div className="mx-5 mt-4 bg-card rounded-2xl border border-border overflow-hidden">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('Mapa de viajes')}</span>
        <div className="flex items-center gap-2">
          {visitedCountries.length > 0 && (
            <span className="text-xs font-bold text-primary">{visitedCountries.length} {t('países')}</span>
          )}
          <span className="text-[10px] text-muted-foreground">{t('Toca un país amarillo para ver el viaje')}</span>
        </div>
      </div>
      <div className="pb-3">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{ scale: 153, center: [0, 0] }}
          width={960}
          height={500}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numId = String(geo.id || '').padStart(3, '0');
                const alpha2 = N2A[numId];
                const isVisited = alpha2 ? visitedSet.has(alpha2) : false;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => handleClick(alpha2)}
                    fill={isVisited ? "hsl(45,93%,47%)" : "hsl(var(--secondary))"}
                    stroke="hsl(var(--border))"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: 'none', cursor: isVisited ? 'pointer' : 'default' },
                      hover: { outline: 'none', fill: isVisited ? "hsl(45,93%,60%)" : "hsl(var(--secondary-foreground)/0.15)", cursor: isVisited ? 'pointer' : 'default' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  );
}
