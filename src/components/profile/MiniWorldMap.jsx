import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { useNavigate } from 'react-router-dom';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const N2A = {
  "004":"AF","008":"AL","012":"DZ","024":"AO","032":"AR","036":"AU","040":"AT",
  "050":"BD","056":"BE","068":"BO","076":"BR","100":"BG","116":"KH","120":"CM",
  "124":"CA","152":"CL","156":"CN","170":"CO","188":"CR","191":"HR","192":"CU",
  "196":"CY","203":"CZ","208":"DK","214":"DO","218":"EC","222":"SV","231":"ET",
  "233":"EE","246":"FI","250":"FR","276":"DE","288":"GH","300":"GR","320":"GT",
  "328":"GY","332":"HT","340":"HN","348":"HU","352":"IS","356":"IN","360":"ID",
  "364":"IR","368":"IQ","372":"IE","376":"IL","380":"IT","388":"JM","392":"JP",
  "398":"KZ","400":"JO","404":"KE","410":"KR","414":"KW","422":"LB","428":"LV",
  "430":"LR","434":"LY","440":"LT","450":"MG","454":"MW","458":"MY","466":"ML",
  "484":"MX","496":"MN","504":"MA","508":"MZ","516":"NA","524":"NP","528":"NL",
  "540":"NC","554":"NZ","558":"NI","562":"NE","566":"NG","578":"NO","586":"PK",
  "591":"PA","598":"PG","604":"PE","608":"PH","616":"PL","620":"PT","630":"PR",
  "634":"QA","642":"RO","643":"RU","682":"SA","686":"SN","694":"SL","703":"SK",
  "704":"VN","705":"SI","706":"SO","710":"ZA","716":"ZW","724":"ES","729":"SD",
  "740":"SR","748":"SZ","752":"SE","756":"CH","760":"SY","764":"TH","788":"TN",
  "792":"TR","800":"UG","804":"UA","818":"EG","826":"GB","834":"TZ","840":"US",
  "854":"BF","858":"UY","860":"UZ","862":"VE","887":"YE","894":"ZM","140":"CF",
  "148":"TD","178":"CG","180":"CD","204":"BJ","226":"GQ","266":"GA","270":"GM",
  "275":"PS","282":"DJ","296":"KI","304":"GL","324":"GN","384":"CI","408":"KP",
};

export default function MiniWorldMap({ visitedCountries = [], trips = [] }) {
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
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mapa de viajes</span>
        <div className="flex items-center gap-2">
          {visitedCountries.length > 0 && (
            <span className="text-xs font-bold text-primary">{visitedCountries.length} países</span>
          )}
          <span className="text-[10px] text-muted-foreground">Toca un país amarillo para ver el viaje</span>
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
