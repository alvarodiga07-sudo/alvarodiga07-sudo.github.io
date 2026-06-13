import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule, Marker } from 'react-simple-maps';
import { geoOrthographic } from 'd3-geo';

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const N2A = {
  "004":"AF","008":"AL","012":"DZ","020":"AD","024":"AO","028":"AG","032":"AR",
  "036":"AU","040":"AT","031":"AZ","044":"BS","048":"BH","050":"BD","052":"BB",
  "112":"BY","056":"BE","084":"BZ","204":"BJ","064":"BT","068":"BO","070":"BA",
  "072":"BW","076":"BR","096":"BN","100":"BG","854":"BF","108":"BI","132":"CV",
  "116":"KH","120":"CM","124":"CA","140":"CF","148":"TD","152":"CL","156":"CN",
  "196":"CY","170":"CO","174":"KM","178":"CG","180":"CD","410":"KR","408":"KP",
  "188":"CR","384":"CI","191":"HR","192":"CU","203":"CZ","208":"DK","262":"DJ",
  "212":"DM","214":"DO","218":"EC","818":"EG","222":"SV","784":"AE","232":"ER",
  "703":"SK","705":"SI","724":"ES","275":"PS","840":"US","233":"EE","231":"ET",
  "608":"PH","246":"FI","242":"FJ","250":"FR","266":"GA","270":"GM","268":"GE",
  "288":"GH","308":"GD","300":"GR","320":"GT","324":"GN","624":"GW","226":"GQ",
  "328":"GY","332":"HT","340":"HN","348":"HU","356":"IN","360":"ID","368":"IQ",
  "364":"IR","372":"IE","352":"IS","584":"MH","090":"SB","376":"IL","380":"IT",
  "388":"JM","392":"JP","400":"JO","398":"KZ","404":"KE","417":"KG","296":"KI",
  "414":"KW","418":"LA","426":"LS","428":"LV","422":"LB","430":"LR","434":"LY",
  "438":"LI","440":"LT","442":"LU","807":"MK","450":"MG","458":"MY","454":"MW",
  "462":"MV","466":"ML","470":"MT","504":"MA","480":"MU","478":"MR","583":"FM",
  "498":"MD","492":"MC","496":"MN","499":"ME","508":"MZ","104":"MM","484":"MX",
  "516":"NA","520":"NR","524":"NP","558":"NI","562":"NE","566":"NG","578":"NO",
  "554":"NZ","512":"OM","586":"PK","585":"PW","591":"PA","598":"PG","600":"PY",
  "528":"NL","604":"PE","616":"PL","620":"PT","826":"GB","630":"PR",
  "646":"RW","642":"RO","643":"RU","882":"WS","659":"KN","674":"SM","670":"VC",
  "662":"LC","678":"ST","686":"SN","688":"RS","690":"SC","694":"SL","702":"SG",
  "760":"SY","706":"SO","144":"LK","748":"SZ","710":"ZA","729":"SD","728":"SS",
  "752":"SE","756":"CH","740":"SR","764":"TH","834":"TZ","762":"TJ","626":"TL",
  "768":"TG","776":"TO","780":"TT","795":"TM","792":"TR","798":"TV","788":"TN",
  "804":"UA","800":"UG","858":"UY","860":"UZ","548":"VU","336":"VA","862":"VE",
  "704":"VN","887":"YE","894":"ZM","716":"ZW",
};

// [lon, lat, name, capital, size] — 196 países con coordenadas precisas
const COUNTRIES_ALL = [
  [-67.7,33.9,"AFGANISTÁN","Kabul",2],
  [19.8,41.3,"ALBANIA","Tirana",1],
  [3.0,36.7,"ARGELIA","Argel",3],
  [1.5,42.5,"ANDORRA","Andorra la Vella",1],
  [17.8,-11.2,"ANGOLA","Luanda",2],
  [-61.8,17.1,"ANTIGUA Y BARBUDA","St. John's",1],
  [-63.6,-38.4,"ARGENTINA","Buenos Aires",3],
  [44.5,40.2,"ARMENIA","Ereván",1],
  [133.7,-25.3,"AUSTRALIA","Canberra",3],
  [16.4,48.2,"AUSTRIA","Viena",2],
  [47.6,40.4,"AZERBAIYÁN","Bakú",2],
  [-77.4,24.3,"BAHAMAS","Nassau",1],
  [50.5,26.0,"BARÉIN","Manama",1],
  [90.4,23.7,"BANGLADÉS","Dhaka",2],
  [-59.6,13.2,"BARBADOS","Bridgetown",1],
  [27.6,53.9,"BIELORRUSIA","Minsk",2],
  [4.5,50.5,"BÉLGICA","Bruselas",2],
  [-88.7,17.2,"BELICE","Belmopán",1],
  [2.3,9.3,"BENÍN","Porto-Novo",1],
  [90.4,27.5,"BUTÁN","Timbu",1],
  [-63.6,-16.3,"BOLIVIA","La Paz",2],
  [17.5,44.2,"BOSNIA Y HERZ.","Sarajevo",1],
  [24.7,-22.3,"BOTSUANA","Gaborone",1],
  [-51.9,-14.2,"BRASIL","Brasilia",3],
  [114.7,4.5,"BRUNÉI","Bandar S.B.",1],
  [25.5,42.7,"BULGARIA","Sofía",2],
  [-1.6,12.4,"BURKINA FASO","Uagadugú",2],
  [29.9,-3.4,"BURUNDI","Buyumbura",1],
  [-23.6,15.1,"CABO VERDE","Praia",1],
  [104.9,12.5,"CAMBOYA","Nom Pen",2],
  [12.3,3.9,"CAMERÚN","Yaundé",2],
  [-96.8,56.1,"CANADÁ","Ottawa",3],
  [51.2,25.3,"CATAR","Doha",1],
  [17.5,15.5,"CHAD","N'Djamena",2],
  [-71.5,-35.6,"CHILE","Santiago",3],
  [104.2,35.8,"CHINA","Pekín",3],
  [33.4,35.1,"CHIPRE","Nicosia",1],
  [-74.1,4.7,"COLOMBIA","Bogotá",2],
  [43.3,-11.6,"COMORAS","Moroni",1],
  [15.3,-0.2,"CONGO","Brazzaville",1],
  [23.6,-2.9,"R.D. CONGO","Kinshasa",3],
  [127.8,37.6,"COREA DEL SUR","Seúl",2],
  [125.7,39.0,"COREA DEL N.","Pyongyang",2],
  [-84.1,9.9,"COSTA RICA","San José",1],
  [-5.6,6.8,"COSTA DE MARFIL","Yamousukro",2],
  [15.9,45.8,"CROACIA","Zagreb",1],
  [-82.4,23.1,"CUBA","La Habana",2],
  [14.5,50.1,"CHEQUIA","Praga",2],
  [12.6,55.7,"DINAMARCA","Copenhague",2],
  [43.0,11.8,"YIBUTI","Yibuti",1],
  [-61.4,15.4,"DOMINICA","Roseau",1],
  [-69.9,18.5,"REP. DOMINICANA","Santo Domingo",2],
  [-78.1,-0.2,"ECUADOR","Quito",2],
  [31.2,30.0,"EGIPTO","El Cairo",3],
  [-89.2,13.7,"EL SALVADOR","San Salvador",1],
  [54.4,24.5,"EMIRATOS Á.U.","Abu Dabi",2],
  [39.2,15.3,"ERITREA","Asmara",1],
  [24.7,59.4,"ESTONIA","Talín",1],
  [38.7,9.0,"ETIOPÍA","Adís Abeba",2],
  [120.9,14.6,"FILIPINAS","Manila",2],
  [25.7,60.2,"FINLANDIA","Helsinki",2],
  [178.1,-18.1,"FIYI","Suva",1],
  [2.4,48.9,"FRANCIA","París",3],
  [11.6,-1.0,"GABÓN","Libreville",1],
  [-15.3,13.4,"GAMBIA","Banjul",1],
  [44.8,41.7,"GEORGIA","Tiflis",1],
  [-0.2,5.5,"GHANA","Acra",2],
  [-61.7,12.1,"GRANADA","St. George's",1],
  [23.7,37.9,"GRECIA","Atenas",2],
  [-90.2,14.6,"GUATEMALA","Ciudad de Guatemala",1],
  [-10.8,10.0,"GUINEA","Conakri",1],
  [-15.2,11.8,"GUINEA-BISÁU","Bisáu",1],
  [10.3,1.6,"GUINEA ECUATORIAL","Malabo",1],
  [-58.9,4.9,"GUYANA","Georgetown",1],
  [-72.3,18.9,"HAITÍ","Puerto Príncipe",1],
  [-86.2,14.5,"HONDURAS","Tegucigalpa",1],
  [19.0,47.5,"HUNGRÍA","Budapest",2],
  [77.2,28.6,"INDIA","Nueva Delhi",3],
  [106.8,-6.2,"INDONESIA","Yakarta",3],
  [51.4,35.7,"IRÁN","Teherán",3],
  [44.4,33.3,"IRAK","Bagdad",2],
  [-6.3,53.3,"IRLANDA","Dublín",2],
  [-21.9,64.2,"ISLANDIA","Reikiavik",1],
  [35.2,31.8,"ISRAEL","Jerusalén",1],
  [12.5,41.9,"ITALIA","Roma",3],
  [-77.0,18.1,"JAMAICA","Kingston",1],
  [139.8,35.7,"JAPÓN","Tokio",3],
  [35.9,31.9,"JORDANIA","Ammán",1],
  [71.4,51.2,"KAZAJISTÁN","Astana",3],
  [36.8,-1.3,"KENIA","Nairobi",2],
  [74.6,42.9,"KIRGUISTÁN","Biskek",1],
  [173.0,-1.4,"KIRIBATI","Tarawa",1],
  [47.5,29.4,"KUWAIT","Kuwait",1],
  [104.9,17.9,"LAOS","Vientián",1],
  [28.3,-29.6,"LESOTO","Maseru",1],
  [24.1,56.9,"LETONIA","Riga",1],
  [35.5,33.9,"LÍBANO","Beirut",1],
  [-10.8,6.3,"LIBERIA","Monrovia",1],
  [17.2,32.9,"LIBIA","Trípoli",2],
  [9.5,47.1,"LIECHTENSTEIN","Vaduz",1],
  [25.3,54.7,"LITUANIA","Vilna",1],
  [6.1,49.8,"LUXEMBURGO","Luxemburgo",1],
  [21.7,41.7,"MACEDONIA DEL N.","Skopie",1],
  [47.5,-19.0,"MADAGASCAR","Antananarivo",2],
  [101.7,3.2,"MALASIA","Kuala Lumpur",2],
  [34.3,-13.3,"MALAUI","Lilongüe",1],
  [73.5,4.2,"MALDIVAS","Malé",1],
  [-1.3,17.6,"MALI","Bamako",2],
  [14.4,35.9,"MALTA","La Valeta",1],
  [-6.8,33.9,"MARRUECOS","Rabat",2],
  [57.6,-20.3,"MAURICIO","Port Louis",1],
  [-10.9,20.3,"MAURITANIA","Nuakchot",2],
  [158.2,6.9,"MICRONESIA","Palikir",1],
  [28.4,47.0,"MOLDAVIA","Chisináu",1],
  [7.4,43.7,"MÓNACO","Mónaco",1],
  [106.9,47.9,"MONGOLIA","Ulán Bator",2],
  [19.3,42.4,"MONTENEGRO","Podgorica",1],
  [35.3,-18.7,"MOZAMBIQUE","Maputo",2],
  [95.9,16.9,"MYANMAR","Naipyidó",2],
  [-102.6,23.6,"MÉXICO","Ciudad de México",3],
  [17.1,-22.6,"NAMIBIA","Windhoek",1],
  [85.3,27.7,"NEPAL","Katmandú",2],
  [-85.2,12.1,"NICARAGUA","Managua",1],
  [2.1,13.5,"NÍGER","Niamey",2],
  [7.5,9.1,"NIGERIA","Abuya",3],
  [10.8,59.9,"NORUEGA","Oslo",2],
  [174.9,-41.3,"NUEVA ZELANDA","Wellington",2],
  [57.1,21.5,"OMÁN","Mascate",1],
  [69.2,33.7,"PAKISTÁN","Islamabad",2],
  [134.6,7.3,"PALAOS","Ngerulmud",1],
  [-79.5,8.9,"PANAMÁ","Ciudad de Panamá",1],
  [144.8,-6.3,"PAPÚA N.GUINEA","Port Moresby",1],
  [-58.2,-25.3,"PARAGUAY","Asunción",2],
  [4.9,52.4,"PAÍSES BAJOS","Ámsterdam",2],
  [-75.7,-12.0,"PERÚ","Lima",2],
  [21.0,52.2,"POLONIA","Varsovia",2],
  [-9.1,38.7,"PORTUGAL","Lisboa",2],
  [51.5,25.2,"QATAR","Doha",1],
  [26.1,44.4,"RUMANÍA","Bucarest",2],
  [37.6,55.8,"RUSIA","Moscú",3],
  [-13.1,-2.0,"RUANDA","Kigali",1],
  [-172.0,-13.8,"SAMOA","Apia",1],
  [12.4,43.9,"SAN MARINO","San Marino",1],
  [-61.2,12.2,"SAN VICENTE Y GRAN.","Kingstown",1],
  [-60.9,13.9,"SANTA LUCÍA","Castries",1],
  [6.6,0.3,"SANTO TOMÉ Y PRÍNCIPE","Santo Tomé",1],
  [46.7,24.7,"ARABIA SAUDÍ","Riad",3],
  [-14.5,14.7,"SENEGAL","Dakar",2],
  [20.9,44.8,"SERBIA","Belgrado",1],
  [55.5,-4.7,"SEYCHELLES","Victoria",1],
  [-11.8,8.5,"SIERRA LEONA","Freetown",1],
  [103.9,1.4,"SINGAPUR","Singapur",1],
  [19.1,48.2,"ESLOVAQUIA","Bratislava",1],
  [14.8,46.1,"ESLOVENIA","Liubliana",1],
  [-3.7,40.4,"ESPAÑA","Madrid",3],
  [35.2,31.9,"PALESTINA","Ramala",1],
  [-99.1,38.9,"ESTADOS UNIDOS","Washington D.C.",3],
  [38.6,35.0,"SIRIA","Damasco",2],
  [45.3,2.1,"SOMALIA","Mogadiscio",1],
  [28.3,-25.7,"SUDÁFRICA","Pretoria",3],
  [32.5,15.5,"SUDÁN","Jartún",2],
  [30.2,6.9,"SUDÁN DEL SUR","Yuba",1],
  [18.1,59.3,"SUECIA","Estocolmo",2],
  [8.2,46.9,"SUIZA","Berna",2],
  [-56.2,4.0,"SURINAM","Paramaribo",1],
  [101.0,13.7,"TAILANDIA","Bangkok",2],
  [39.3,-6.2,"TANZANIA","Dodoma",2],
  [71.3,38.9,"TAYIKISTÁN","Dusambé",1],
  [124.9,-8.7,"TIMOR ORIENTAL","Dili",1],
  [0.8,6.1,"TOGO","Lomé",1],
  [-175.2,-21.1,"TONGA","Nukualofa",1],
  [-61.2,10.7,"TRINIDAD Y TOBAGO","Puerto España",1],
  [58.4,37.7,"TURKMENISTÁN","Asjabad",2],
  [32.9,39.9,"TURQUÍA","Ankara",3],
  [10.2,36.8,"TÚNEZ","Túnez",2],
  [30.5,50.4,"UCRANIA","Kiev",2],
  [32.3,0.3,"UGANDA","Kampala",1],
  [-56.2,-32.5,"URUGUAY","Montevideo",2],
  [64.0,41.3,"UZBEKISTÁN","Taskent",2],
  [167.2,-15.9,"VANUATU","Port Vila",1],
  [12.4,41.8,"VATICANO","Vaticano",1],
  [-66.6,6.4,"VENEZUELA","Caracas",2],
  [105.8,21.0,"VIETNAM","Hanói",2],
  [48.2,15.5,"YEMEN","Saná",2],
  [28.3,-13.1,"ZAMBIA","Lusaka",1],
  [29.2,-19.0,"ZIMBABUE","Harare",1],
  // ── TERRITORIOS / MICROESTADOS que faltaban ──
  [-53.1,3.9,"GUAYANA FRANCESA","Cayena",1],
  [166.9,-0.5,"NAURU","Yaren",1],
  [179.2,-8.5,"TUVALU","Funafuti",1],
  [31.5,-26.5,"ESUATINI","Mbabane",1],
];

function isVisible(lon, lat, rotX, rotY) {
  // El globo usa rotate: [-rotX, -rotY, 0], por lo que el CENTRO de la vista
  // está en (rotX, rotY) — coords lon/lat del mundo real.
  const r = d => d * Math.PI / 180;
  const φ1 = r(lat), λ1 = r(lon);      // punto del país
  const φ0 = r(rotY), λ0 = r(rotX);    // centro de la vista (donde mira el usuario)
  // Producto escalar: > 0 = mismo hemisferio (visible). Usamos -0.1 para mostrar
  // un poco más allá del borde — así no desaparecen prematuramente al rotar.
  const cosAngle = Math.sin(φ0)*Math.sin(φ1) + Math.cos(φ0)*Math.cos(φ1)*Math.cos(λ1 - λ0);
  return cosAngle > -0.1;
}

export default function InteractiveGlobe({ visitedCountries = [], size = 300, trips = [], onTripClick }) {
  const visitedSet = useMemo(() => new Set(visitedCountries), [visitedCountries]);

  const countryToTrip = useMemo(() => {
    const map = {};
    [...trips].sort((a,b) => new Date(b.created_date||0)-new Date(a.created_date||0)).forEach(t => {
      if (t.destination_country && !map[t.destination_country]) map[t.destination_country] = t.id;
    });
    return map;
  }, [trips]);

  // Start on prime meridian, 20°N — spins east→west only
  const INIT_ROT = [0, 20];
  const [rotation, setRotation] = useState(INIT_ROT);
  const [zoom, setZoom] = useState(1);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const rotRef = useRef([...INIT_ROT]);
  const zoomRef = useRef(1);

  useEffect(() => {
    let alive = true;
    function tick() {
      if (!alive) return;
      if (!isDragging.current && zoomRef.current <= 1.05) {
        // Only spin on X axis (east→west). Dampen Y back toward 20° (equatorial view)
        velocity.current.x *= 0.96;
        velocity.current.y *= 0.90; // dampen tilt faster
        if (Math.abs(velocity.current.x) < 0.04) velocity.current.x = 0.12;
        // Gently return latitude toward 20° when not dragging
        const targetLat = 20;
        const curLat = rotRef.current[1];
        const returnY = (targetLat - curLat) * 0.02;
        rotRef.current = [
          rotRef.current[0] - velocity.current.x,
          curLat + velocity.current.y + returnY,
        ];
        setRotation([...rotRef.current]);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { alive = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  const onMouseDown = useCallback((e) => {
    isDragging.current = true; hasMoved.current = false;
    lastPos.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x, dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true;
    velocity.current = { x: dx * 0.25, y: dy * 0.25 };
    rotRef.current = [
      rotRef.current[0] - dx * 0.35,
      Math.max(-70, Math.min(70, rotRef.current[1] + dy * 0.35)),
    ];
    setRotation([...rotRef.current]);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    isDragging.current = true; hasMoved.current = false;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    velocity.current = { x: 0, y: 0 };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - lastPos.current.x, dy = e.touches[0].clientY - lastPos.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasMoved.current = true;
    velocity.current = { x: dx * 0.25, y: dy * 0.25 };
    rotRef.current = [
      rotRef.current[0] - dx * 0.35,
      Math.max(-70, Math.min(70, rotRef.current[1] + dy * 0.35)),
    ];
    setRotation([...rotRef.current]);
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  // Zoom: 1 → 13 (antes 10). Step 0.3.
  const ZOOM_MAX = 13;
  const onWheel = useCallback((e) => {
    e.preventDefault();
    zoomRef.current = Math.max(1, Math.min(ZOOM_MAX, zoomRef.current + (e.deltaY < 0 ? 0.3 : -0.3)));
    setZoom(zoomRef.current);
  }, []);

  const doZoom = (delta) => {
    zoomRef.current = Math.max(1, Math.min(ZOOM_MAX, zoomRef.current + delta));
    setZoom(zoomRef.current);
  };

  const handleCountryClick = useCallback((alpha2) => {
    if (!hasMoved.current && visitedSet.has(alpha2)) {
      const tripId = countryToTrip[alpha2];
      if (tripId && onTripClick) onTripClick(tripId);
    }
  }, [visitedSet, countryToTrip, onTripClick]);

  const baseScale = (size / 2) * 0.92;
  const scale = baseScale * zoom;

  // PRIMERAS 2 AMPLIACIONES (zoom 1 → 1.6): SIN nombres. Limpio.
  // A partir de la 3ª ampliación (zoom >= 1.9): empiezan a salir nombres.
  // Mostramos por niveles según tamaño del país:
  //   zoom 1.9-2.5: solo países grandes (sz=3)
  //   zoom 2.5-3.5: grandes + medianos (sz>=2)
  //   zoom >= 3.5: todos (sz>=1)
  // Esto evita solapes en zooms iniciales y deja ver todo cuando hay sitio.
  const minSize = zoom >= 3.5 ? 1 : zoom >= 2.5 ? 2 : zoom >= 1.9 ? 3 : 99;
  const showCapitals = zoom >= 2.8;
  // Tamaño de fuente proporcional al zoom, con tope para que no se vea enorme
  const labelSize = Math.max(6, Math.min(11, 3.2 * zoom));

  // Renderizar todos los labels que cumplen criterios — sin memoización para evitar stale rotation
  // Directamente en el map render (abajo) para asegurar rotación actual

  return (
    <div style={{ width: size, height: size, position: 'relative', userSelect: 'none' }}>
      <div
        style={{
          width: size, height: size, borderRadius: '50%', overflow: 'hidden',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.08)',
          cursor: isDragging.current ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp} onWheel={onWheel}
      >
        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ scale, rotate: [-rotation[0], -rotation[1], 0] }}
          width={size} height={size}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Sphere id="ocean" fill="#b8cfe0" stroke="#8aafc7" strokeWidth={0.8} />
          <Graticule stroke="#9ab8cc" strokeWidth={0.25} step={[20, 20]} />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const alpha2 = N2A[String(geo.id || '').padStart(3, '0')];
                const visited = alpha2 ? visitedSet.has(alpha2) : false;
                return (
                  <Geography key={geo.rsmKey} geography={geo}
                    onClick={() => alpha2 && handleCountryClick(alpha2)}
                    fill={visited ? '#eab308' : '#c8d0d8'}
                    stroke="#ffffff" strokeWidth={0.4}
                    style={{
                      default: { outline: 'none', cursor: visited ? 'pointer' : 'default' },
                      hover: { outline: 'none', fill: visited ? '#f0c030' : '#dde3e8', cursor: visited ? 'pointer' : 'default' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {(() => {
            // ── Anti-solapamiento ──
            // Prioridad: en zoom alto los pequeños valen más (son los difíciles de ver).
            // En zoom medio los grandes priman. Los pequeños prueban posiciones alternativas si solapan.
            if (minSize > 3) return null;

            const projection = geoOrthographic()
              .translate([size / 2, size / 2])
              .scale(scale)
              .rotate([-rotation[0], -rotation[1], 0]);

            const candidates = [];
            for (const [lon, lat, name, capital, sz] of COUNTRIES_ALL) {
              if (sz < minSize) continue;
              if (!isVisible(lon, lat, rotation[0], rotation[1])) continue;
              const p = projection([lon, lat]);
              if (!p) continue;
              const [x, y] = p;
              const w = name.length * labelSize * 0.55;
              const h = labelSize * (showCapitals ? 2.2 : 1.1);
              candidates.push({ lon, lat, name, capital, sz, x, y, w, h });
            }

            // ZOOM ALTO (>= 5): los pequeños primero (más valiosos, no se ven habitualmente)
            // ZOOM MEDIO (< 5): los grandes primero (referencia)
            if (zoom >= 5) {
              candidates.sort((a, b) => a.sz - b.sz);
            } else {
              candidates.sort((a, b) => b.sz - a.sz);
            }

            const placed = [];
            const shown = [];
            // Posiciones alternativas para probar si el label solapa (offsets en y)
            const offsets = [0, -labelSize * 1.4, labelSize * 1.4, -labelSize * 2.5, labelSize * 2.5];
            for (const c of candidates) {
              let placedOk = false;
              for (const offY of offsets) {
                const tryY = c.y + offY;
                const cBox = { x1: c.x - c.w / 2, x2: c.x + c.w / 2, y1: tryY - c.h / 2, y2: tryY + c.h / 2 };
                let overlaps = false;
                for (const p of placed) {
                  if (cBox.x1 < p.x2 && cBox.x2 > p.x1 && cBox.y1 < p.y2 && cBox.y2 > p.y1) {
                    overlaps = true; break;
                  }
                }
                if (!overlaps) {
                  placed.push(cBox);
                  shown.push({ ...c, labelOffsetY: offY });
                  placedOk = true;
                  break;
                }
              }
            }

            return shown.map(c => (
              <Marker key={`${c.lon},${c.lat}`} coordinates={[c.lon, c.lat]}>
                {/* Label del país (con offset si hubo conflicto) */}
                <text textAnchor="middle" y={(c.labelOffsetY || 0) - 3}
                  style={{
                    fontSize: labelSize, fontWeight: 700, fill: '#0f172a',
                    fontFamily: 'system-ui, sans-serif', letterSpacing: '0.03em',
                    pointerEvents: 'none', paintOrder: 'stroke',
                    stroke: 'rgba(255,255,255,0.95)', strokeWidth: 3, strokeLinejoin: 'round',
                  }}
                >{c.name}</text>
                {/* Líneas si el label está movido del país (conector visual) */}
                {Math.abs(c.labelOffsetY || 0) > 1 && (
                  <line x1={0} y1={0} x2={0} y2={(c.labelOffsetY || 0) + (c.labelOffsetY > 0 ? -labelSize : labelSize * 0.3)}
                    stroke="#0f172a" strokeWidth={0.4} opacity={0.4} strokeDasharray="1.5,1.5" />
                )}
                {showCapitals && (
                  <>
                    <circle r={1.5} fill="#dc2626" stroke="#fff" strokeWidth={0.7} />
                    <text textAnchor="middle" y={(c.labelOffsetY || 0) + labelSize + 5}
                      style={{
                        fontSize: labelSize * 0.72, fontWeight: 400, fill: '#334155',
                        fontFamily: 'system-ui, sans-serif', pointerEvents: 'none',
                        paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.9)',
                        strokeWidth: 2.5, strokeLinejoin: 'round',
                      }}
                    >★ {c.capital}</text>
                  </>
                )}
              </Marker>
            ));
          })()}

        </ComposableMap>
      </div>

      {/* Botones de zoom — [+]/[−] en columna, [⊙] a la derecha alineado abajo */}
      <div style={{ position: 'absolute', bottom: 10, right: 8, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}>
        {/* Columna +/− (no se mueve nunca) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { label: '+', fn: () => doZoom(0.5) },
            { label: '−', fn: () => doZoom(-0.5) },
          ].map(({ label, fn }) => (
            <button key={label}
              onMouseDown={e => e.stopPropagation()}
              onClick={fn}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.15)',
                fontSize: 18, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)', color: '#1e293b', lineHeight: 1,
              }}
            >{label}</button>
          ))}
        </div>
        {/* Botón resetear ⊙ a la derecha, alineado con el [−] */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => { zoomRef.current = 1; setZoom(1); }}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.15)',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', color: '#1e293b', lineHeight: 1,
            opacity: zoom <= 1.1 ? 0.35 : 1,
            pointerEvents: zoom <= 1.1 ? 'none' : 'auto',
          }}
          title="Restablecer zoom"
        >⊙</button>
      </div>
    </div>
  );
}
