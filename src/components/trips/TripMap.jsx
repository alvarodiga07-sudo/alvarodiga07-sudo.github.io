import React from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { getCountryName } from '@/lib/countries';
import { N2A, CENTROIDS } from '@/lib/mapData';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const CAPITALS = {
  AF:[69.18,34.52],AL:[19.82,41.33],DZ:[3.05,36.74],AO:[13.22,-8.84],AR:[-58.38,-34.61],
  AU:[149.13,-35.28],AT:[16.37,48.21],BD:[90.41,23.72],BE:[4.35,50.85],BO:[-68.15,-16.5],
  BR:[-47.93,-15.78],BG:[23.32,42.7],KH:[104.92,11.57],CM:[11.52,3.87],CA:[-75.7,45.42],
  CL:[-70.67,-33.46],CN:[116.39,39.93],CO:[-74.08,4.71],HR:[15.98,45.81],CU:[-82.37,23.13],
  CZ:[14.47,50.09],DK:[12.59,55.69],DO:[-69.9,18.48],EC:[-78.51,-0.23],EG:[31.25,30.06],
  ET:[38.74,9.04],FI:[25.0,60.17],FR:[2.35,48.86],DE:[13.41,52.52],GH:[-0.21,5.56],
  GR:[23.73,37.98],HU:[19.08,47.5],IS:[-21.9,64.15],IN:[77.2,28.6],ID:[106.82,-6.19],
  IR:[51.42,35.69],IQ:[44.39,33.34],IE:[-6.27,53.33],IL:[35.22,31.77],IT:[12.48,41.9],
  JP:[139.75,35.69],JO:[35.93,31.96],KZ:[71.43,51.18],KE:[36.82,-1.29],KR:[126.98,37.57],
  KW:[47.98,29.37],LB:[35.5,33.87],LV:[24.11,56.95],LT:[25.32,54.69],MY:[101.7,3.15],
  MX:[-99.13,19.43],MA:[-6.83,33.99],NP:[85.32,27.71],NL:[4.89,52.37],NZ:[174.78,-36.87],
  NG:[7.49,9.05],NO:[10.75,59.91],PK:[73.1,33.72],PE:[-77.05,-12.05],PH:[120.97,14.6],
  PL:[21.0,52.23],PT:[-9.14,38.72],RO:[26.1,44.44],RU:[37.62,55.75],SA:[46.77,24.69],
  RS:[20.5,44.8],ZA:[28.19,-25.74],ES:[-3.68,40.4],SE:[18.07,59.33],CH:[7.45,46.95],
  TZ:[39.29,-6.18],TH:[100.52,13.75],TN:[10.18,36.82],TR:[32.86,39.93],UA:[30.52,50.43],
  AE:[54.37,24.47],GB:[-0.09,51.51],US:[-77.0,38.9],UY:[-56.19,-34.86],VE:[-66.87,10.49],
  VN:[105.85,21.03],SD:[32.53,15.56],ZM:[28.29,-15.42],ZW:[31.05,-17.82],
  SG:[103.85,1.29],MN:[106.9,47.9],OM:[58.6,23.6],QA:[51.5,25.3],KP:[125.7,39.0],
  TM:[58.4,37.9],UZ:[69.3,41.3],TJ:[68.8,38.6],KG:[74.6,42.9],GE:[44.8,41.7],
  AM:[44.5,40.2],AZ:[49.9,40.4],BY:[27.6,53.9],MD:[28.9,47.0],RS:[20.5,44.8],
};

export default function TripMap({ countryCode, cityName }) {
  const capital = CAPITALS[countryCode];
  const countryName = getCountryName(countryCode);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {countryName}{cityName ? ` · ${cityName}` : ''}
        </span>
        <span className="text-xs text-muted-foreground">Mapa del destino</span>
      </div>

      {/* Full world map, destination highlighted — same fix as MiniWorldMap */}
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
              const isTarget = alpha2 === countryCode;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isTarget ? 'hsl(45,93%,47%)' : 'hsl(var(--secondary))'}
                  stroke="hsl(var(--border))"
                  strokeWidth={isTarget ? 1.2 : 0.3}
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

        {capital && (
          <Marker coordinates={capital}>
            <circle r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
            <text
              y={-10}
              textAnchor="middle"
              style={{
                fontSize: 11, fontWeight: 700,
                fill: 'hsl(var(--foreground))',
                paintOrder: 'stroke',
                stroke: 'rgba(255,255,255,0.9)',
                strokeWidth: 2.5,
              }}
            >
              {cityName || countryName}
            </text>
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
