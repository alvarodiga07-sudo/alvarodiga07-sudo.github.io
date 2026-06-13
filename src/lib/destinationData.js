// ─────────────────────────────────────────────────────────────────────────
// Base de datos de destinos — datos reales curados para generar itinerarios
// de calidad SIN depender de IA externa (gratis, instantáneo, siempre funciona)
// ─────────────────────────────────────────────────────────────────────────

// Regiones gastronómicas / culturales — para opciones CONTEXTUALES al país
export const REGIONS = {
  europa_sur:   { food: ['Tapas y pintxos','Pasta fresca','Mariscos','Vino local','Jamón ibérico','Paella','Gelato','Pizza napolitana'], experiences: ['Catas de vino','Mercados locales','Pueblos medievales','Costa mediterránea','Arte renacentista','Siesta y terrazas'] },
  europa_oeste: { food: ['Croissants y panadería','Quesos artesanos','Bistró francés','Cerveza belga','Chocolate','Vino y champán'], experiences: ['Museos de arte','Castillos','Cafés históricos','Mercadillos vintage','Rutas en bici','Jardines'] },
  europa_norte: { food: ['Salmón y pescado','Pan de centeno','Cocina nórdica','Cervezas artesanas','Cinnamon buns'], experiences: ['Auroras boreales','Saunas','Fiordos','Diseño nórdico','Naturaleza salvaje','Sol de medianoche'] },
  europa_este:  { food: ['Pierogi','Goulash','Cerveza checa','Sopas','Repostería'], experiences: ['Cascos históricos','Castillos','Termas','Música clásica','Mercados navideños'] },
  asia_oriental:{ food: ['Sushi y sashimi','Ramen','Dim sum','Street food','Té tradicional','Barbacoa coreana','Dumplings'], experiences: ['Templos y santuarios','Onsen / baños termales','Barrios tradicionales','Tecnología y neón','Jardines zen','Cerezos / temporada'] },
  sudeste_asia: { food: ['Pad thai','Curry','Pho','Street food','Frutas tropicales','Satay','Mango sticky rice'], experiences: ['Templos budistas','Playas paradisíacas','Mercados flotantes','Buceo y snorkel','Masajes','Selva y arrozales'] },
  asia_sur:     { food: ['Curry y tandoori','Thali','Street food','Chai','Dosas','Biryani'], experiences: ['Templos y palacios','Mercados de especias','Safari','Yoga y espiritualidad','Trekking Himalaya','Ríos sagrados'] },
  oriente_medio:{ food: ['Hummus y falafel','Kebab','Mezze','Té de menta','Dátiles','Baklava'], experiences: ['Zocos y bazares','Desierto y dunas','Ciudades antiguas','Mezquitas','Baños turcos','Mar Muerto'] },
  africa_norte: { food: ['Tajín','Cuscús','Té de menta','Pastela','Harira','Dátiles'], experiences: ['Medinas y zocos','Desierto del Sáhara','Riads','Montañas del Atlas','Oasis','Artesanía'] },
  africa_sub:   { food: ['Cocina local','Carnes a la brasa','Frutas tropicales','Platos de maíz'], experiences: ['Safari y vida salvaje','Playas vírgenes','Tribus y cultura','Cataratas','Parques nacionales','Atardeceres en sabana'] },
  norteamerica: { food: ['Burgers gourmet','BBQ','Comida fusión','Brunch','Craft beer','Tacos'], experiences: ['Rascacielos y skylines','Parques nacionales','Música en vivo','Compras','Road trips','Museos'] },
  latam:        { food: ['Tacos y ceviche','Asado','Arepas','Empanadas','Mezcal/pisco','Frutas exóticas'], experiences: ['Ruinas precolombinas','Selva amazónica','Playas caribeñas','Mercados artesanales','Salsa y baile','Volcanes'] },
  oceania:      { food: ['Mariscos frescos','Brunch','BBQ','Vino','Cocina aborigen'], experiences: ['Playas y surf','Arrecifes de coral','Naturaleza salvaje','Vida marina','Senderismo','Cultura maorí/aborigen'] },
};

// Mapeo país → región
export const COUNTRY_REGION = {
  ES:'europa_sur', IT:'europa_sur', PT:'europa_sur', GR:'europa_sur', MT:'europa_sur', HR:'europa_sur', CY:'europa_sur',
  FR:'europa_oeste', DE:'europa_oeste', NL:'europa_oeste', BE:'europa_oeste', CH:'europa_oeste', AT:'europa_oeste', GB:'europa_oeste', IE:'europa_oeste', LU:'europa_oeste',
  NO:'europa_norte', SE:'europa_norte', FI:'europa_norte', DK:'europa_norte', IS:'europa_norte',
  PL:'europa_este', CZ:'europa_este', HU:'europa_este', RO:'europa_este', BG:'europa_este', SK:'europa_este', SI:'europa_este', RS:'europa_este', EE:'europa_este', LV:'europa_este', LT:'europa_este', UA:'europa_este',
  JP:'asia_oriental', CN:'asia_oriental', KR:'asia_oriental', TW:'asia_oriental', MN:'asia_oriental',
  TH:'sudeste_asia', VN:'sudeste_asia', ID:'sudeste_asia', MY:'sudeste_asia', SG:'sudeste_asia', PH:'sudeste_asia', KH:'sudeste_asia', LA:'sudeste_asia', MM:'sudeste_asia',
  IN:'asia_sur', NP:'asia_sur', LK:'asia_sur', PK:'asia_sur', BD:'asia_sur', BT:'asia_sur', MV:'asia_sur',
  TR:'oriente_medio', AE:'oriente_medio', SA:'oriente_medio', JO:'oriente_medio', IL:'oriente_medio', QA:'oriente_medio', OM:'oriente_medio', LB:'oriente_medio', KW:'oriente_medio', BH:'oriente_medio',
  MA:'africa_norte', EG:'africa_norte', TN:'africa_norte', DZ:'africa_norte', LY:'africa_norte',
  ZA:'africa_sub', KE:'africa_sub', TZ:'africa_sub', NG:'africa_sub', GH:'africa_sub', ET:'africa_sub', SN:'africa_sub', UG:'africa_sub', NA:'africa_sub', BW:'africa_sub', ZW:'africa_sub', MZ:'africa_sub', RW:'africa_sub',
  US:'norteamerica', CA:'norteamerica',
  MX:'latam', BR:'latam', AR:'latam', PE:'latam', CO:'latam', CL:'latam', EC:'latam', BO:'latam', UY:'latam', PY:'latam', VE:'latam', CR:'latam', PA:'latam', GT:'latam', CU:'latam', DO:'latam',
  AU:'oceania', NZ:'oceania', FJ:'oceania',
};

// Monedas por país
export const CURRENCIES = {
  // Eurozona (verificado 2026)
  ES:'EUR €', FR:'EUR €', IT:'EUR €', DE:'EUR €', PT:'EUR €', NL:'EUR €', GR:'EUR €', IE:'EUR €', AT:'EUR €', BE:'EUR €', FI:'EUR €',
  LU:'EUR €', MT:'EUR €', CY:'EUR €', SK:'EUR €', SI:'EUR €', EE:'EUR €', LV:'EUR €', LT:'EUR €', HR:'EUR €', AD:'EUR €', MC:'EUR €', SM:'EUR €', VA:'EUR €',
  // Europa no euro
  GB:'Libra esterlina £ (GBP)', CH:'Franco suizo CHF', NO:'Corona noruega NOK', SE:'Corona sueca SEK', DK:'Corona danesa DKK',
  IS:'Corona islandesa ISK', PL:'Zloty PLN', CZ:'Corona checa CZK', HU:'Forinto HUF', RO:'Leu RON', BG:'Lev BGN',
  RU:'Rublo RUB', UA:'Grivna UAH', BY:'Rublo bielorruso BYN', AL:'Lek ALL', RS:'Dinar serbio RSD', BA:'Marco convertible BAM', MK:'Denar MKD', MD:'Leu moldavo MDL',
  // Asia
  JP:'Yen japonés ¥ (JPY)', CN:'Yuan ¥ (CNY/RMB)', KR:'Won ₩ (KRW)', TH:'Baht ฿ (THB)', VN:'Dong ₫ (VND)', ID:'Rupia indonesia IDR',
  MY:'Ringgit MYR', SG:'Dólar de Singapur S$ (SGD)', PH:'Peso filipino ₱ (PHP)', IN:'Rupia india ₹ (INR)', NP:'Rupia nepalesa NPR', BD:'Taka BDT',
  LK:'Rupia LKR', PK:'Rupia pakistaní PKR', KH:'Riel KHR (US$ aceptado)', LA:'Kip LAK', MM:'Kyat MMK', BT:'Ngultrum BTN', MV:'Rufiyaa MVR',
  MN:'Tugrik MNT', HK:'Dólar HK$ (HKD)', TW:'Dólar taiwanés TWD', BN:'Dólar de Brunei BND',
  KZ:'Tenge KZT', UZ:'Sum UZS', KG:'Som KGS', TJ:'Somoni TJS', TM:'Manat TMT', AF:'Afgani AFN',
  // Oriente Medio
  TR:'Lira turca ₺ (TRY)', AE:'Dirham emiratí AED', SA:'Riyal saudí SAR', QA:'Riyal qatarí QAR', KW:'Dinar kuwaití KWD',
  BH:'Dinar bahreiní BHD', OM:'Riyal omaní OMR', IL:'Shéquel ₪ (ILS)', JO:'Dinar jordano JOD', LB:'Libra libanesa LBP (US$ común)',
  IR:'Rial iraní IRR', IQ:'Dinar iraquí IQD', SY:'Libra siria SYP', YE:'Riyal yemení YER',
  // África
  EG:'Libra egipcia EGP (£E)', MA:'Dirham marroquí MAD (DH)', TN:'Dinar tunecino TND',
  DZ:'Dinar argelino DZD (DA)', LY:'Dinar libio LYD',
  ZA:'Rand sudafricano ZAR (R)', NG:'Naira ₦ (NGN)', KE:'Chelín keniano KES', TZ:'Chelín tanzano TZS',
  ET:'Birr ETB', GH:'Cedi ghanés GHS', SN:'Franco CFA XOF', CI:'Franco CFA XOF', CM:'Franco CFA XAF',
  UG:'Chelín ugandés UGX', RW:'Franco ruandés RWF', MZ:'Metical MZN', NA:'Dólar namibio NAD', BW:'Pula BWP', ZW:'US$ (dolarizado)',
  AO:'Kwanza AOA', ZM:'Kwacha ZMW', SD:'Libra sudanesa SDG', MG:'Ariary MGA',
  // Américas
  US:'Dólar estadounidense $ (USD)', CA:'Dólar canadiense C$ (CAD)', MX:'Peso mexicano $ (MXN)',
  BR:'Real brasileño R$ (BRL)', AR:'Peso argentino $ (ARS)', PE:'Sol peruano S/ (PEN)', CO:'Peso colombiano $ (COP)',
  CL:'Peso chileno $ (CLP)', UY:'Peso uruguayo $U (UYU)', PY:'Guaraní ₲ (PYG)', VE:'Bolívar VES (US$ común)',
  BO:'Boliviano Bs (BOB)', EC:'Dólar estadounidense $ (USD)', CR:'Colón ₡ (CRC)', PA:'Balboa PAB / Dólar $ (USD)',
  GT:'Quetzal Q (GTQ)', HN:'Lempira L (HNL)', NI:'Córdoba C$ (NIO)', SV:'Dólar $ (USD)',
  CU:'Peso cubano CUP / US$ no oficial', DO:'Peso dominicano RD$ (DOP)', JM:'Dólar jamaicano J$ (JMD)',
  // Oceanía
  AU:'Dólar australiano A$ (AUD)', NZ:'Dólar neozelandés NZ$ (NZD)', FJ:'Dólar fiyiano FJD', PG:'Kina PGK',
};

// ─── Atracciones reales por CIUDAD (destinos top) ───
// type: monumento|museo|barrio|naturaleza|mirador|experiencia|ocio
export const CITY_ATTRACTIONS = {
  // ── JAPÓN ──
  'Tokio': [
    { n:'Templo Sensō-ji (Asakusa)', t:'monumento', dur:'2h', desc:'El templo más antiguo de Tokio, con la icónica puerta Kaminarimon y la calle Nakamise.', tip:'Ve temprano para evitar multitudes.', cost:'Gratis' },
    { n:'Cruce de Shibuya', t:'experiencia', dur:'1h', desc:'El cruce peatonal más famoso del mundo. Sube al Shibuya Sky para vistas aéreas.', tip:'Mejor de noche con los neones.', cost:'~20€ mirador' },
    { n:'Santuario Meiji', t:'monumento', dur:'1.5h', desc:'Oasis de calma rodeado de bosque en pleno centro.', tip:'Combínalo con un paseo por Harajuku.', cost:'Gratis' },
    { n:'Barrio de Akihabara', t:'barrio', dur:'2h', desc:'La meca de la electrónica, el anime y los videojuegos.', tip:'Visita las tiendas de varias plantas.', cost:'Gratis' },
    { n:'Mercado de Tsukiji', t:'experiencia', dur:'1.5h', desc:'Puestos de sushi fresquísimo y street food japonés.', tip:'Desayuna sushi aquí.', cost:'~15€' },
    { n:'TeamLab Planets', t:'museo', dur:'2h', desc:'Museo digital inmersivo de arte y luz.', tip:'Reserva entradas online con antelación.', cost:'~25€' },
    { n:'Templo de Senso y Ueno', t:'naturaleza', dur:'2h', desc:'Parque de Ueno con museos, lago y templos.', tip:'Ideal en temporada de cerezos.', cost:'Gratis' },
  ],
  'Kioto': [
    { n:'Fushimi Inari Taisha', t:'monumento', dur:'2.5h', desc:'Miles de puertas torii rojas que suben la montaña.', tip:'Ve al amanecer, es mágico y sin gente.', cost:'Gratis' },
    { n:'Bosque de bambú de Arashiyama', t:'naturaleza', dur:'2h', desc:'Sendero entre cañas de bambú gigantes.', tip:'Combínalo con el templo Tenryū-ji.', cost:'Gratis' },
    { n:'Templo Kinkaku-ji (Pabellón Dorado)', t:'monumento', dur:'1h', desc:'Pabellón cubierto de pan de oro sobre un estanque.', tip:'Reflejo perfecto en días sin viento.', cost:'~4€' },
    { n:'Barrio de Gion', t:'barrio', dur:'2h', desc:'El distrito de las geishas, casas de té tradicionales.', tip:'Al atardecer puedes ver maikos.', cost:'Gratis' },
    { n:'Templo Kiyomizu-dera', t:'monumento', dur:'1.5h', desc:'Templo de madera con vistas sobre Kioto.', tip:'Las callejuelas de subida son preciosas.', cost:'~4€' },
  ],
  'Osaka': [
    { n:'Castillo de Osaka', t:'monumento', dur:'2h', desc:'Imponente castillo rodeado de jardines y foso.', tip:'Sube a la torre para las vistas.', cost:'~6€' },
    { n:'Dotonbori', t:'barrio', dur:'2h', desc:'Distrito de neones, street food y el famoso cartel Glico.', tip:'Prueba takoyaki y okonomiyaki.', cost:'~15€' },
    { n:'Mercado Kuromon Ichiba', t:'experiencia', dur:'1.5h', desc:'Mercado cubierto con marisco y wagyu a la parrilla.', tip:'Ve con hambre.', cost:'~20€' },
  ],
  // ── ITALIA ──
  'Roma': [
    { n:'Coliseo', t:'monumento', dur:'2h', desc:'El anfiteatro romano más famoso del mundo.', tip:'Compra entrada combinada con el Foro y reserva franja horaria.', cost:'~18€' },
    { n:'Foro Romano y Palatino', t:'monumento', dur:'2h', desc:'El corazón de la antigua Roma entre ruinas milenarias.', tip:'Lleva agua y calzado cómodo.', cost:'Incluido con Coliseo' },
    { n:'Fontana di Trevi', t:'monumento', dur:'0.5h', desc:'La fuente barroca más bella; lanza una moneda.', tip:'Ve muy temprano o de noche.', cost:'Gratis' },
    { n:'Vaticano y Capilla Sixtina', t:'museo', dur:'3h', desc:'Museos Vaticanos, la Capilla Sixtina y la Basílica de San Pedro.', tip:'Reserva online sin colas; hombros y rodillas cubiertos.', cost:'~20€' },
    { n:'Panteón', t:'monumento', dur:'0.75h', desc:'Templo romano con la cúpula de hormigón más grande de la antigüedad.', tip:'La luz del óculo es espectacular.', cost:'~5€' },
    { n:'Barrio del Trastevere', t:'barrio', dur:'2h', desc:'Callejones empedrados, trattorias y ambiente bohemio.', tip:'Ideal para cenar.', cost:'Gratis' },
  ],
  'Florencia': [
    { n:'Galería Uffizi', t:'museo', dur:'2.5h', desc:'Obras maestras del Renacimiento: Botticelli, Da Vinci, Miguel Ángel.', tip:'Reserva con antelación.', cost:'~25€' },
    { n:'Duomo y Cúpula de Brunelleschi', t:'monumento', dur:'1.5h', desc:'La catedral con su icónica cúpula; sube los 463 escalones.', tip:'Reserva la subida a la cúpula.', cost:'~20€' },
    { n:'Ponte Vecchio', t:'monumento', dur:'0.5h', desc:'Puente medieval con joyerías sobre el río Arno.', tip:'Atardecer desde Ponte Santa Trinita.', cost:'Gratis' },
    { n:'Piazzale Michelangelo', t:'mirador', dur:'1h', desc:'La mejor panorámica de Florencia.', tip:'Sube al atardecer.', cost:'Gratis' },
  ],
  'Venecia': [
    { n:'Plaza y Basílica de San Marcos', t:'monumento', dur:'1.5h', desc:'El corazón de Venecia con mosaicos dorados.', tip:'Sube al Campanile para vistas.', cost:'~12€' },
    { n:'Paseo en góndola', t:'experiencia', dur:'0.5h', desc:'Recorre los canales en la embarcación más icónica.', tip:'Comparte para abaratar; negocia antes.', cost:'~80€/góndola' },
    { n:'Puente de Rialto', t:'monumento', dur:'0.5h', desc:'El puente más famoso sobre el Gran Canal.', tip:'Mercado cercano por la mañana.', cost:'Gratis' },
  ],
  // ── ESPAÑA ──
  'Madrid': [
    { n:'Museo del Prado', t:'museo', dur:'2.5h', desc:'Una de las mejores pinacotecas del mundo: Velázquez, Goya, El Bosco.', tip:'Gratis las últimas 2h; reserva online.', cost:'~15€' },
    { n:'Parque del Retiro', t:'naturaleza', dur:'1.5h', desc:'El gran pulmón verde con su Palacio de Cristal y estanque.', tip:'Alquila una barca.', cost:'Gratis' },
    { n:'Palacio Real', t:'monumento', dur:'1.5h', desc:'La residencia oficial más grande de Europa Occidental.', tip:'Cambio de guardia los miércoles.', cost:'~14€' },
    { n:'Mercado de San Miguel', t:'experiencia', dur:'1h', desc:'Mercado gourmet de tapas y vinos.', tip:'Ve con hambre a media tarde.', cost:'~20€' },
    { n:'Barrio de La Latina', t:'barrio', dur:'2h', desc:'Tapeo, terrazas y el ambiente más castizo.', tip:'Domingos: Rastro por la mañana.', cost:'Gratis' },
  ],
  'Barcelona': [
    { n:'Sagrada Familia', t:'monumento', dur:'2h', desc:'La obra maestra inacabada de Gaudí.', tip:'Reserva entrada con horario; sube a las torres.', cost:'~26€' },
    { n:'Park Güell', t:'naturaleza', dur:'1.5h', desc:'Parque modernista con mosaicos y vistas a la ciudad.', tip:'Reserva la zona monumental online.', cost:'~10€' },
    { n:'Barrio Gótico', t:'barrio', dur:'2h', desc:'Callejones medievales, la Catedral y plazas escondidas.', tip:'Piérdete sin mapa.', cost:'Gratis' },
    { n:'La Rambla y Boquería', t:'experiencia', dur:'1.5h', desc:'El paseo más famoso y su mercado de colores.', tip:'Cuidado con carteristas.', cost:'~15€' },
    { n:'Playa de la Barceloneta', t:'naturaleza', dur:'2h', desc:'Playa urbana con chiringuitos.', tip:'Paella frente al mar.', cost:'Gratis' },
  ],
  'Sevilla': [
    { n:'Catedral y Giralda', t:'monumento', dur:'1.5h', desc:'La catedral gótica más grande del mundo; sube a la Giralda.', tip:'Tumba de Colón en el interior.', cost:'~12€' },
    { n:'Real Alcázar', t:'monumento', dur:'2h', desc:'Palacio mudéjar de patios y jardines de ensueño.', tip:'Escenario de Juego de Tronos; reserva online.', cost:'~13€' },
    { n:'Plaza de España', t:'monumento', dur:'1h', desc:'Espectacular plaza semicircular con azulejos.', tip:'Atardecer dorado.', cost:'Gratis' },
    { n:'Barrio de Santa Cruz', t:'barrio', dur:'1.5h', desc:'La antigua judería de callejones blancos y naranjos.', tip:'Flamenco por la noche.', cost:'Gratis' },
  ],
  'Granada': [
    { n:'La Alhambra', t:'monumento', dur:'3h', desc:'El conjunto palaciego nazarí más bello del mundo.', tip:'Reserva con MUCHA antelación; entrada a los Nazaríes con hora.', cost:'~14€' },
    { n:'Mirador de San Nicolás', t:'mirador', dur:'1h', desc:'La vista clásica de la Alhambra con Sierra Nevada detrás.', tip:'Atardecer imbatible.', cost:'Gratis' },
    { n:'Barrio del Albaicín', t:'barrio', dur:'1.5h', desc:'El antiguo barrio morisco, patrimonio de la humanidad.', tip:'Tapas gratis con cada bebida.', cost:'Gratis' },
  ],
  // ── FRANCIA ──
  'París': [
    { n:'Torre Eiffel', t:'monumento', dur:'2h', desc:'El símbolo de París; sube a la cima o admírala desde el Trocadéro.', tip:'Reserva online; de noche brilla cada hora.', cost:'~28€' },
    { n:'Museo del Louvre', t:'museo', dur:'3h', desc:'El museo más visitado del mundo, con la Gioconda.', tip:'Entra por Porte des Lions (menos cola).', cost:'~22€' },
    { n:'Catedral de Notre-Dame y Île de la Cité', t:'monumento', dur:'1h', desc:'El corazón histórico de París junto al Sena.', tip:'Pasea por los muelles.', cost:'Gratis exterior' },
    { n:'Montmartre y Sacré-Cœur', t:'barrio', dur:'2h', desc:'El barrio bohemio con la basílica blanca y vistas.', tip:'Pintores en la Place du Tertre.', cost:'Gratis' },
    { n:'Barrio Latino y Museo de Orsay', t:'museo', dur:'2h', desc:'Impresionistas en una antigua estación de tren.', tip:'No te pierdas a Monet y Van Gogh.', cost:'~16€' },
  ],
  'Niza': [
    { n:'Paseo de los Ingleses', t:'experiencia', dur:'1.5h', desc:'El paseo marítimo icónico de la Riviera.', tip:'Alquila bici.', cost:'Gratis' },
    { n:'Casco viejo (Vieux Nice)', t:'barrio', dur:'1.5h', desc:'Callejuelas coloridas y mercado de flores.', tip:'Prueba la socca.', cost:'Gratis' },
    { n:'Colina del Castillo', t:'mirador', dur:'1h', desc:'Vistas sobre la Bahía de los Ángeles.', tip:'Atardecer.', cost:'Gratis' },
  ],
  // ── REINO UNIDO ──
  'Londres': [
    { n:'Torre de Londres', t:'monumento', dur:'2.5h', desc:'Fortaleza milenaria que guarda las Joyas de la Corona.', tip:'Reserva online; tours con los Beefeaters.', cost:'~35€' },
    { n:'British Museum', t:'museo', dur:'2.5h', desc:'Tesoros de toda la humanidad: la Piedra Rosetta, momias.', tip:'Entrada gratuita.', cost:'Gratis' },
    { n:'Westminster y Big Ben', t:'monumento', dur:'1h', desc:'El Parlamento, la Abadía y el reloj más famoso.', tip:'Cruza el puente para la foto.', cost:'Gratis exterior' },
    { n:'London Eye y South Bank', t:'mirador', dur:'1.5h', desc:'La noria gigante con vistas del Támesis.', tip:'Atardecer.', cost:'~32€' },
    { n:'Mercado de Camden', t:'barrio', dur:'2h', desc:'Mercado alternativo de moda, música y street food.', tip:'Comida del mundo en los puestos.', cost:'~15€' },
  ],
  // ── ALEMANIA ──
  'Berlín': [
    { n:'Puerta de Brandeburgo', t:'monumento', dur:'0.5h', desc:'El símbolo de la reunificación alemana.', tip:'De noche iluminada.', cost:'Gratis' },
    { n:'Muro de Berlín (East Side Gallery)', t:'experiencia', dur:'1.5h', desc:'El tramo de muro convertido en galería de arte.', tip:'No te pierdas el beso fraternal.', cost:'Gratis' },
    { n:'Isla de los Museos', t:'museo', dur:'3h', desc:'Cinco museos de fama mundial, incluido el Pérgamo.', tip:'Pase combinado.', cost:'~19€' },
    { n:'Reichstag', t:'monumento', dur:'1h', desc:'El Parlamento con su cúpula de cristal.', tip:'Reserva gratis online la cúpula.', cost:'Gratis' },
  ],
  'Múnich': [
    { n:'Marienplatz', t:'monumento', dur:'1h', desc:'La plaza central con el carillón del ayuntamiento.', tip:'Carillón a las 11:00.', cost:'Gratis' },
    { n:'Jardín Inglés', t:'naturaleza', dur:'1.5h', desc:'Uno de los parques urbanos más grandes; surferos en el río.', tip:'Cerveza en el Biergarten.', cost:'Gratis' },
  ],
  // ── PORTUGAL ──
  'Lisboa': [
    { n:'Barrio de Alfama', t:'barrio', dur:'2h', desc:'El alma de Lisboa: callejones, fado y miradores.', tip:'Coge el tranvía 28.', cost:'~3€ tranvía' },
    { n:'Torre de Belém y Monasterio dos Jerónimos', t:'monumento', dur:'2h', desc:'Joyas manuelinas de la era de los descubrimientos.', tip:'Pastéis de Belém al lado.', cost:'~12€' },
    { n:'Mirador de Santa Luzia', t:'mirador', dur:'0.5h', desc:'Vistas sobre los tejados y el Tajo.', tip:'Atardecer con fado en directo.', cost:'Gratis' },
    { n:'Time Out Market', t:'experiencia', dur:'1.5h', desc:'Mercado gourmet con lo mejor de la cocina portuguesa.', tip:'Ve fuera de horas punta.', cost:'~18€' },
  ],
  'Oporto': [
    { n:'Ribeira y Puente Don Luís I', t:'barrio', dur:'1.5h', desc:'El casco histórico junto al Duero, patrimonio mundial.', tip:'Cruza el puente a pie arriba.', cost:'Gratis' },
    { n:'Bodegas de vino de Oporto (Vila Nova de Gaia)', t:'experiencia', dur:'1.5h', desc:'Cata del famoso vino en las bodegas históricas.', tip:'Reserva tour con cata.', cost:'~15€' },
    { n:'Librería Lello', t:'monumento', dur:'0.5h', desc:'Una de las librerías más bellas del mundo.', tip:'Compra entrada online; inspiró a Harry Potter.', cost:'~8€' },
  ],
  // ── GRECIA ──
  'Atenas': [
    { n:'Acrópolis y Partenón', t:'monumento', dur:'2.5h', desc:'El símbolo de la civilización occidental.', tip:'Ve a primera hora; entrada combinada.', cost:'~20€' },
    { n:'Barrio de Plaka', t:'barrio', dur:'1.5h', desc:'El barrio más antiguo, bajo la Acrópolis.', tip:'Tabernas con música en directo.', cost:'Gratis' },
    { n:'Museo de la Acrópolis', t:'museo', dur:'1.5h', desc:'Las esculturas originales del Partenón.', tip:'Suelo de cristal sobre ruinas.', cost:'~10€' },
  ],
  'Santorini': [
    { n:'Puesta de sol en Oía', t:'experiencia', dur:'2h', desc:'El atardecer más famoso del mundo sobre la caldera.', tip:'Llega 1h antes para sitio.', cost:'Gratis' },
    { n:'Fira y sendero a Oía', t:'naturaleza', dur:'3h', desc:'Sendero por el borde de la caldera entre pueblos blancos.', tip:'Lleva agua y gorra.', cost:'Gratis' },
    { n:'Playa Roja', t:'naturaleza', dur:'1.5h', desc:'Playa de arena volcánica roja.', tip:'Calzado para las rocas.', cost:'Gratis' },
  ],
  // ── TAILANDIA ──
  'Bangkok': [
    { n:'Gran Palacio y Wat Phra Kaew', t:'monumento', dur:'2.5h', desc:'El complejo real con el Buda Esmeralda.', tip:'Hombros y rodillas cubiertos.', cost:'~13€' },
    { n:'Wat Arun', t:'monumento', dur:'1h', desc:'El templo del amanecer junto al río.', tip:'Atardecer desde la otra orilla.', cost:'~3€' },
    { n:'Mercado Chatuchak', t:'experiencia', dur:'2.5h', desc:'Uno de los mercados más grandes del mundo (fin de semana).', tip:'Regatea.', cost:'Gratis' },
    { n:'Khao San Road', t:'barrio', dur:'1.5h', desc:'La calle mochilera con street food y ambiente nocturno.', tip:'Prueba pad thai callejero.', cost:'~8€' },
  ],
  'Chiang Mai': [
    { n:'Templo Doi Suthep', t:'monumento', dur:'2h', desc:'Templo dorado en la montaña con vistas a la ciudad.', tip:'305 escalones de naga.', cost:'~2€' },
    { n:'Santuario ético de elefantes', t:'experiencia', dur:'4h', desc:'Cuida elefantes rescatados (sin montar).', tip:'Elige santuarios éticos certificados.', cost:'~60€' },
    { n:'Mercado nocturno de domingo', t:'experiencia', dur:'2h', desc:'Artesanía y street food por el casco antiguo.', tip:'Ve con hambre.', cost:'~10€' },
  ],
  'Phuket': [
    { n:'Islas Phi Phi en lancha', t:'naturaleza', dur:'6h', desc:'Excursión a las playas paradisíacas de Maya Bay.', tip:'Reserva tour de día completo.', cost:'~40€' },
    { n:'Playa de Patong', t:'naturaleza', dur:'2h', desc:'La playa más animada con deportes acuáticos.', tip:'Atardecer con cóctel.', cost:'Gratis' },
  ],
  // ── MÉXICO ──
  'Ciudad de México': [
    { n:'Zócalo y Catedral', t:'monumento', dur:'1.5h', desc:'La plaza mayor, una de las más grandes del mundo.', tip:'Sube a una terraza cercana.', cost:'Gratis' },
    { n:'Teotihuacán', t:'monumento', dur:'4h', desc:'Las pirámides del Sol y la Luna a las afueras.', tip:'Ve temprano; lleva gorra.', cost:'~5€' },
    { n:'Museo Frida Kahlo (Casa Azul)', t:'museo', dur:'1.5h', desc:'La casa de la artista en Coyoacán.', tip:'Compra entrada online.', cost:'~14€' },
    { n:'Xochimilco', t:'experiencia', dur:'3h', desc:'Paseo en trajinera por los canales con mariachis.', tip:'Comparte trajinera.', cost:'~25€' },
  ],
  'Cancún': [
    { n:'Chichén Itzá', t:'monumento', dur:'5h', desc:'Una de las 7 maravillas: la pirámide de Kukulcán.', tip:'Ve muy temprano; combina con cenote.', cost:'~30€' },
    { n:'Cenote sagrado', t:'naturaleza', dur:'2h', desc:'Nada en un cenote de agua cristalina.', tip:'Lleva repelente biodegradable.', cost:'~15€' },
    { n:'Playa Delfines', t:'naturaleza', dur:'2h', desc:'Playa de arena blanca y agua turquesa.', tip:'Menos masificada.', cost:'Gratis' },
  ],
  // ── EEUU ──
  'Nueva York': [
    { n:'Estatua de la Libertad y Ellis Island', t:'monumento', dur:'4h', desc:'El símbolo de la libertad en ferry.', tip:'Reserva acceso al pedestal.', cost:'~24€' },
    { n:'Central Park', t:'naturaleza', dur:'2h', desc:'El parque más famoso del mundo en pleno Manhattan.', tip:'Alquila bici.', cost:'Gratis' },
    { n:'Times Square y Broadway', t:'experiencia', dur:'2h', desc:'El corazón luminoso de la ciudad.', tip:'Musical de Broadway por la noche.', cost:'Gratis' },
    { n:'Top of the Rock / Empire State', t:'mirador', dur:'1.5h', desc:'Las mejores vistas del skyline.', tip:'Atardecer; reserva horario.', cost:'~40€' },
    { n:'Puente de Brooklyn y DUMBO', t:'experiencia', dur:'2h', desc:'Cruza a pie el puente icónico hacia Brooklyn.', tip:'Foto en Washington St.', cost:'Gratis' },
  ],
  // ── PERÚ ──
  'Cusco': [
    { n:'Machu Picchu', t:'monumento', dur:'6h', desc:'La ciudadela inca, una de las 7 maravillas.', tip:'Reserva entrada y tren con MUCHA antelación.', cost:'~50€' },
    { n:'Valle Sagrado (Pisac y Ollantaytambo)', t:'monumento', dur:'5h', desc:'Ruinas incas y mercados andinos.', tip:'Aclimátate a la altura antes.', cost:'~20€' },
    { n:'Plaza de Armas y Barrio de San Blas', t:'barrio', dur:'2h', desc:'El corazón colonial e inca de Cusco.', tip:'Prueba el cuy si te atreves.', cost:'Gratis' },
  ],
  // ── MARRUECOS ──
  'Marrakech': [
    { n:'Plaza Jemaa el-Fna', t:'experiencia', dur:'2h', desc:'El zoco vivo: encantadores de serpientes, puestos y caos mágico.', tip:'Terraza con vistas al atardecer.', cost:'Gratis' },
    { n:'Jardín Majorelle', t:'naturaleza', dur:'1.5h', desc:'El jardín azul de Yves Saint Laurent.', tip:'Reserva online; ve temprano.', cost:'~16€' },
    { n:'Medina y zocos', t:'barrio', dur:'2.5h', desc:'Laberinto de callejones con artesanía y especias.', tip:'Regatea siempre.', cost:'Gratis' },
    { n:'Palacio de la Bahía', t:'monumento', dur:'1h', desc:'Palacio del s.XIX con patios y mosaicos.', tip:'Luz de media mañana.', cost:'~7€' },
  ],
  // ── EGIPTO ──
  'El Cairo': [
    { n:'Pirámides de Giza y la Esfinge', t:'monumento', dur:'4h', desc:'La última maravilla del mundo antiguo en pie.', tip:'Ve al amanecer; opción de entrar a una pirámide.', cost:'~20€' },
    { n:'Museo Egipcio', t:'museo', dur:'2.5h', desc:'El tesoro de Tutankamón y las momias reales.', tip:'Contrata guía egiptólogo.', cost:'~15€' },
    { n:'Bazar Khan el-Khalili', t:'barrio', dur:'1.5h', desc:'Zoco histórico de especias, cobre y recuerdos.', tip:'Té en el café El Fishawy.', cost:'Gratis' },
  ],
  // ── PAÍSES BAJOS ──
  'Ámsterdam': [
    { n:'Casa de Ana Frank', t:'museo', dur:'1.5h', desc:'La casa-escondite convertida en museo conmovedor.', tip:'Reserva online semanas antes.', cost:'~16€' },
    { n:'Museo Van Gogh', t:'museo', dur:'2h', desc:'La mayor colección del genio neerlandés.', tip:'Reserva franja horaria.', cost:'~20€' },
    { n:'Paseo en barco por los canales', t:'experiencia', dur:'1h', desc:'Recorre los canales patrimonio de la humanidad.', tip:'Atardecer.', cost:'~18€' },
    { n:'Barrio del Jordaan', t:'barrio', dur:'1.5h', desc:'Calles encantadoras, cafés y mercadillos.', tip:'Mercado Noordermarkt los sábados.', cost:'Gratis' },
  ],
  // ── TURQUÍA ──
  'Estambul': [
    { n:'Santa Sofía (Hagia Sophia)', t:'monumento', dur:'1.5h', desc:'Basílica y mezquita milenaria, joya bizantina.', tip:'Ve temprano.', cost:'~25€' },
    { n:'Mezquita Azul', t:'monumento', dur:'1h', desc:'Famosa por sus seis minaretes y azulejos de Iznik.', tip:'Respeta horarios de rezo; cúbrete.', cost:'Gratis' },
    { n:'Gran Bazar', t:'experiencia', dur:'2h', desc:'Uno de los mercados cubiertos más grandes y antiguos.', tip:'Regatea con té de por medio.', cost:'Gratis' },
    { n:'Crucero por el Bósforo', t:'experiencia', dur:'2h', desc:'Navega entre Europa y Asia.', tip:'Atardecer.', cost:'~15€' },
    { n:'Palacio Topkapi', t:'monumento', dur:'2h', desc:'El palacio de los sultanes otomanos.', tip:'No te pierdas el harén.', cost:'~20€' },
  ],
  // ── EAU ──
  'Dubái': [
    { n:'Burj Khalifa', t:'mirador', dur:'1.5h', desc:'El edificio más alto del mundo (828 m).', tip:'Reserva piso 124/148 al atardecer.', cost:'~40€' },
    { n:'Safari por el desierto', t:'experiencia', dur:'5h', desc:'Dunas en 4x4, camellos y cena beduina.', tip:'Tour de tarde con barbacoa.', cost:'~55€' },
    { n:'Dubai Mall y la Fuente', t:'ocio', dur:'2h', desc:'El centro comercial gigante con acuario y espectáculo de agua.', tip:'Fuente cada 30 min al anochecer.', cost:'Gratis' },
  ],
};

// ─── Platos / restaurantes típicos por ciudad (refuerzan lo regional) ───
export const CITY_FOOD = {
  'Tokio': ['Sushi en Tsukiji','Ramen tonkotsu','Tempura','Izakaya en Shinjuku'],
  'Kioto': ['Kaiseki tradicional','Tofu yudofu','Matcha y wagashi'],
  'Roma': ['Cacio e pepe','Carbonara','Supplì','Gelato artesano'],
  'Madrid': ['Cocido madrileño','Bocata de calamares','Tapas en La Latina','Churros con chocolate'],
  'Barcelona': ['Paella','Tapas','Pa amb tomàquet','Crema catalana'],
  'París': ['Croissant','Coq au vin','Macarons','Quesos y vino'],
  'Bangkok': ['Pad thai','Tom yum','Mango sticky rice','Curry verde'],
  'Marrakech': ['Tajín de cordero','Cuscús','Pastela','Té de menta'],
  'Estambul': ['Kebab','Mezze','Baklava','Té turco'],
  'Ciudad de México': ['Tacos al pastor','Mole','Chiles en nogada','Mezcal'],
};

// ─── Ciudades principales por país (cobertura amplia para sugerencias) ───
export const CITIES_BY_COUNTRY = {
  // EUROPA
  ES:['Madrid','Barcelona','Sevilla','Granada','Valencia','Bilbao','Málaga','San Sebastián'],
  FR:['París','Niza','Lyon','Marsella','Burdeos','Estrasburgo'],
  IT:['Roma','Venecia','Florencia','Milán','Nápoles','Sicilia','Cinque Terre'],
  DE:['Berlín','Múnich','Hamburgo','Colonia','Núremberg','Fráncfort'],
  GB:['Londres','Edimburgo','Manchester','Bath','Liverpool','York'],
  PT:['Lisboa','Oporto','Algarve','Sintra','Madeira','Coímbra'],
  GR:['Atenas','Santorini','Mykonos','Creta','Rodas','Tesalónica'],
  NL:['Ámsterdam','Róterdam','La Haya','Utrecht','Maastricht'],
  CH:['Zúrich','Ginebra','Interlaken','Lucerna','Berna','Zermatt'],
  AT:['Viena','Salzburgo','Innsbruck','Hallstatt','Graz'],
  BE:['Bruselas','Brujas','Amberes','Gante'],
  IE:['Dublín','Galway','Cork','Killarney'],
  CZ:['Praga','Brno','Český Krumlov','Karlovy Vary'],
  HU:['Budapest','Eger','Pécs','Debrecen'],
  PL:['Cracovia','Varsovia','Gdansk','Wroclaw','Zakopane'],
  HR:['Dubrovnik','Split','Hvar','Zagreb','Zadar'],
  NO:['Oslo','Bergen','Tromsø','Lofoten','Stavanger'],
  SE:['Estocolmo','Gotemburgo','Malmö','Kiruna'],
  FI:['Helsinki','Rovaniemi','Turku','Tampere'],
  DK:['Copenhague','Aarhus','Odense'],
  IS:['Reikiavik','Vík','Akureyri','Húsavík'],
  RO:['Bucarest','Brasov','Sibiu','Cluj-Napoca'],
  BG:['Sofía','Plovdiv','Varna','Bansko'],
  RS:['Belgrado','Novi Sad','Niš'],
  SK:['Bratislava','Košice','Tatras'],
  SI:['Liubliana','Bled','Piran'],
  EE:['Tallin','Tartu','Pärnu'],
  LV:['Riga','Jurmala'],
  LT:['Vilna','Kaunas','Klaipeda'],
  UA:['Kiev','Leópolis','Odesa'],
  AL:['Tirana','Sarandë','Berat'],
  MT:['La Valeta','Mdina','Gozo'],
  CY:['Nicosia','Limasol','Pafos','Ayia Napa'],
  LU:['Luxemburgo'],
  AD:['Andorra la Vella','Encamp','Soldeu'],
  // ASIA
  JP:['Tokio','Kioto','Osaka','Hiroshima','Nara','Hakone','Sapporo'],
  CN:['Pekín','Shanghái','Hong Kong','Xian','Guilin','Chengdú'],
  KR:['Seúl','Busan','Jeju','Gyeongju'],
  TH:['Bangkok','Chiang Mai','Phuket','Krabi','Koh Samui','Ayutthaya'],
  VN:['Hanói','Ho Chi Minh','Hoi An','Ha Long','Da Nang','Sapa'],
  ID:['Bali','Yakarta','Lombok','Yogyakarta','Komodo'],
  MY:['Kuala Lumpur','Penang','Langkawi','Malaca','Borneo'],
  SG:['Singapur'],
  PH:['Manila','Cebú','Palawan','Boracay','Bohol'],
  KH:['Nom Pen','Siem Riep','Sihanoukville'],
  LA:['Vientián','Luang Prabang','Vang Vieng'],
  MM:['Yangón','Bagan','Mandalay','Inle'],
  IN:['Delhi','Agra','Jaipur','Goa','Kerala','Bombay','Varanasi','Udaipur'],
  NP:['Katmandú','Pokhara','Chitwan'],
  LK:['Colombo','Kandy','Galle','Ella','Sigiriya'],
  PK:['Islamabad','Lahore','Karachi','Hunza'],
  BD:['Dhaka','Chittagong','Cox’s Bazar'],
  BT:['Timbu','Paro','Punakha'],
  MV:['Malé','Atolón de Ari'],
  MN:['Ulán Bator','Desierto del Gobi'],
  KZ:['Astaná','Almaty'],
  UZ:['Taskent','Samarcanda','Bujará'],
  GE:['Tiflis','Batumi','Kazbegi'],
  AM:['Ereván','Dilijan'],
  AZ:['Bakú','Gabalá'],
  // ORIENTE MEDIO
  TR:['Estambul','Capadocia','Antalya','Bodrum','Éfeso','Pamukkale'],
  AE:['Dubái','Abu Dabi','Sharjah'],
  IL:['Jerusalén','Tel Aviv','Haifa','Eilat'],
  JO:['Amán','Petra','Wadi Rum','Mar Muerto','Aqaba'],
  SA:['Riad','Yeda','La Meca','AlUla'],
  QA:['Doha'],
  OM:['Mascate','Nizwa','Salalah'],
  LB:['Beirut','Biblos','Baalbek'],
  // ÁFRICA
  MA:['Marrakech','Fez','Chefchaouen','Casablanca','Esauira','Rabat'],
  EG:['El Cairo','Luxor','Asuán','Hurghada','Sharm el Sheij','Alejandría'],
  TN:['Túnez','Sidi Bou Said','Cartago','Yerba'],
  DZ:['Argel','Orán','Constantina','Tamanrasset'],
  ZA:['Ciudad del Cabo','Johannesburgo','Durban','Kruger','Ruta Jardín'],
  KE:['Nairobi','Mombasa','Masái Mara','Diani'],
  TZ:['Zanzíbar','Serengeti','Kilimanjaro','Arusha'],
  NG:['Lagos','Abuya','Calabar'],
  GH:['Acra','Kumasi','Cabo Costa'],
  ET:['Adís Abeba','Lalibela','Gondar'],
  SN:['Dakar','Saint-Louis','Saly'],
  NA:['Windhoek','Sossusvlei','Swakopmund'],
  BW:['Gaborone','Delta del Okavango','Chobe'],
  ZW:['Cataratas Victoria','Harare','Hwange'],
  MZ:['Maputo','Islas Bazaruto','Tofo'],
  RW:['Kigali','Volcanes'],
  UG:['Kampala','Bwindi','Jinja'],
  // AMÉRICA
  US:['Nueva York','Los Ángeles','Miami','San Francisco','Las Vegas','Chicago','Orlando','Hawái'],
  CA:['Toronto','Vancouver','Montreal','Quebec','Banff','Cataratas del Niágara'],
  MX:['Ciudad de México','Cancún','Oaxaca','Tulum','Guadalajara','Puerto Vallarta','Mérida'],
  BR:['Río de Janeiro','São Paulo','Salvador','Foz de Iguazú','Florianópolis','Manaos'],
  AR:['Buenos Aires','Mendoza','Bariloche','Ushuaia','Cataratas del Iguazú','Salta'],
  PE:['Lima','Cusco','Arequipa','Puno','Máncora'],
  CO:['Bogotá','Cartagena','Medellín','Santa Marta','Eje Cafetero'],
  CL:['Santiago','San Pedro de Atacama','Valparaíso','Patagonia','Isla de Pascua'],
  EC:['Quito','Galápagos','Cuenca','Baños'],
  BO:['La Paz','Salar de Uyuni','Sucre','Copacabana'],
  UY:['Montevideo','Punta del Este','Colonia'],
  PY:['Asunción','Encarnación'],
  VE:['Caracas','Isla Margarita','Salto Ángel'],
  CR:['San José','La Fortuna','Manuel Antonio','Tamarindo','Monteverde'],
  PA:['Ciudad de Panamá','Bocas del Toro','San Blas'],
  GT:['Antigua','Tikal','Lago Atitlán'],
  CU:['La Habana','Varadero','Trinidad','Viñales'],
  DO:['Punta Cana','Santo Domingo','Samaná'],
  // OCEANÍA
  AU:['Sídney','Melbourne','Brisbane','Cairns','Gold Coast','Uluru','Perth'],
  NZ:['Auckland','Queenstown','Wellington','Rotorua','Christchurch'],
  FJ:['Nadi','Islas Mamanuca','Suva'],
};

// Códigos IATA de aeropuerto principal por ciudad (para deep-links de vuelos)
export const CITY_IATA = {
  'Madrid':'MAD','Barcelona':'BCN','Sevilla':'SVQ','Valencia':'VLC','Bilbao':'BIO','Málaga':'AGP',
  'París':'PAR','Niza':'NCE','Lyon':'LYS','Marsella':'MRS','Burdeos':'BOD',
  'Roma':'ROM','Venecia':'VCE','Florencia':'FLR','Milán':'MIL','Nápoles':'NAP',
  'Berlín':'BER','Múnich':'MUC','Hamburgo':'HAM','Fráncfort':'FRA','Colonia':'CGN',
  'Londres':'LON','Edimburgo':'EDI','Manchester':'MAN',
  'Lisboa':'LIS','Oporto':'OPO','Madeira':'FNC',
  'Atenas':'ATH','Santorini':'JTR','Mykonos':'JMK','Creta':'HER',
  'Ámsterdam':'AMS','Róterdam':'RTM',
  'Zúrich':'ZRH','Ginebra':'GVA','Viena':'VIE','Bruselas':'BRU','Dublín':'DUB',
  'Praga':'PRG','Budapest':'BUD','Cracovia':'KRK','Varsovia':'WAW',
  'Dubrovnik':'DBV','Split':'SPU','Zagreb':'ZAG',
  'Oslo':'OSL','Estocolmo':'STO','Helsinki':'HEL','Copenhague':'CPH','Reikiavik':'REK',
  'Bucarest':'BUH','Sofía':'SOF','Tallin':'TLL','Riga':'RIX','Vilna':'VNO','Kiev':'IEV',
  'Tokio':'TYO','Kioto':'OSA','Osaka':'OSA','Hiroshima':'HIJ','Sapporo':'SPK',
  'Pekín':'BJS','Shanghái':'SHA','Hong Kong':'HKG','Xian':'XIY',
  'Seúl':'SEL','Busan':'PUS','Jeju':'CJU',
  'Bangkok':'BKK','Chiang Mai':'CNX','Phuket':'HKT','Krabi':'KBV',
  'Hanói':'HAN','Ho Chi Minh':'SGN','Da Nang':'DAD',
  'Bali':'DPS','Yakarta':'JKT','Lombok':'LOP',
  'Kuala Lumpur':'KUL','Penang':'PEN','Langkawi':'LGK','Singapur':'SIN',
  'Manila':'MNL','Cebú':'CEB',
  'Delhi':'DEL','Bombay':'BOM','Goa':'GOI','Jaipur':'JAI',
  'Katmandú':'KTM','Colombo':'CMB','Malé':'MLE',
  'Estambul':'IST','Capadocia':'NAV','Antalya':'AYT',
  'Dubái':'DXB','Abu Dabi':'AUH','Doha':'DOH','Mascate':'MCT',
  'Jerusalén':'TLV','Tel Aviv':'TLV','Amán':'AMM','Riad':'RUH','Yeda':'JED',
  'Marrakech':'RAK','Fez':'FEZ','Casablanca':'CMN','Rabat':'RBA',
  'El Cairo':'CAI','Luxor':'LXR','Hurghada':'HRG','Alejandría':'ALY',
  'Túnez':'TUN','Argel':'ALG','Orán':'ORN',
  'Ciudad del Cabo':'CPT','Johannesburgo':'JNB','Durban':'DUR',
  'Nairobi':'NBO','Mombasa':'MBA','Zanzíbar':'ZNZ','Adís Abeba':'ADD',
  'Lagos':'LOS','Abuya':'ABV','Acra':'ACC','Dakar':'DKR','Windhoek':'WDH',
  'Nueva York':'NYC','Los Ángeles':'LAX','Miami':'MIA','San Francisco':'SFO','Las Vegas':'LAS','Chicago':'CHI','Orlando':'MCO',
  'Toronto':'YTO','Vancouver':'YVR','Montreal':'YMQ',
  'Ciudad de México':'MEX','Cancún':'CUN','Oaxaca':'OAX','Guadalajara':'GDL',
  'Río de Janeiro':'RIO','São Paulo':'SAO','Salvador':'SSA',
  'Buenos Aires':'BUE','Mendoza':'MDZ','Bariloche':'BRC','Ushuaia':'USH',
  'Lima':'LIM','Cusco':'CUZ','Bogotá':'BOG','Cartagena':'CTG','Medellín':'MDE',
  'Santiago':'SCL','Quito':'UIO','La Paz':'LPB','Montevideo':'MVD',
  'San José':'SJO','Ciudad de Panamá':'PTY','La Habana':'HAV','Punta Cana':'PUJ',
  'Sídney':'SYD','Melbourne':'MEL','Brisbane':'BNE','Cairns':'CNS',
  'Auckland':'AKL','Queenstown':'ZQN','Wellington':'WLG','Nadi':'NAN',
};

// IATA del país de origen (capital/aeropuerto principal) para la URL de salida
export const ORIGIN_IATA = {
  ES:'MAD', FR:'PAR', IT:'ROM', DE:'FRA', GB:'LON', PT:'LIS', NL:'AMS', BE:'BRU',
  CH:'ZRH', AT:'VIE', IE:'DUB', US:'NYC', CA:'YTO', MX:'MEX', BR:'SAO', AR:'BUE',
  JP:'TYO', CN:'BJS', AU:'SYD', IN:'DEL', RU:'MOW', PL:'WAW', SE:'STO', NO:'OSL',
};

// Helpers
export function getRegion(countryCode) {
  return COUNTRY_REGION[countryCode] || 'europa_oeste';
}
export function getCityIata(city) { return CITY_IATA[city] || ''; }
export function getOriginIata(countryCode) { return ORIGIN_IATA[countryCode] || ''; }
export function getRegionData(countryCode) {
  return REGIONS[getRegion(countryCode)] || REGIONS.europa_oeste;
}
export function getCurrency(countryCode) {
  return CURRENCIES[countryCode] || 'moneda local';
}
