// ─────────────────────────────────────────────────────────────────────
// Información práctica VERAZ por país.
// Estructura: fallback por región + datos específicos sobrescriben.
// Todos los datos: visado/sanidad/seguridad/idioma/enchufe/propina + clima/agua/conducción.
// Fuente: Sanidad Exterior, Recomendaciones MAE España, world-factbook (CIA, públicos).
// Estado: Junio 2026 - actualizado para uso real.
// ─────────────────────────────────────────────────────────────────────

// ── FALLBACK POR REGIÓN (todos los países heredan de aquí si no tienen entrada) ──
export const REGION_DEFAULTS = {
  europa_oeste: {
    visa: 'Schengen — sin visado para ciudadanos UE. No-UE: comprueba lista Schengen.',
    health: 'Sin vacunas obligatorias. Tarjeta Sanitaria Europea (TSE) válida.',
    safety: 'Muy seguro. Carteristas en transporte público y zonas turísticas.',
    language: 'Idioma local; inglés ampliamente extendido en turismo.',
    plug: 'Tipo C/F (230V) — mismo que España.',
    tip: '5-10% en restaurantes; redondear en taxis.',
    water: 'Agua del grifo potable.',
    drive: 'Conducción derecha (excepto UK, Irlanda, Malta, Chipre).',
  },
  europa_este: {
    visa: 'UE: sin visado. No-UE: comprueba en consulado.',
    health: 'Sin vacunas obligatorias. TSE válida en países UE.',
    safety: 'Seguro. Atención a estafas con taxis sin taxímetro.',
    language: 'Idioma local; inglés moderado en ciudades.',
    plug: 'Tipo C/F (230V).',
    tip: '10% en restaurantes.',
    water: 'Agua del grifo potable en general; comprobar en zonas rurales.',
    drive: 'Conducción derecha.',
  },
  europa_norte: {
    visa: 'Schengen — sin visado UE. Reino Unido: ETA online desde 2024.',
    health: 'Sin vacunas. TSE válida en UE.',
    safety: 'De los más seguros del mundo.',
    language: 'Idioma local; inglés muy extendido.',
    plug: 'Tipo C/F (230V); UK e Irlanda tipo G — adaptador necesario.',
    tip: 'Servicio incluido; redondear opcional.',
    water: 'Agua del grifo de excelente calidad.',
    drive: 'Derecha (UK e Irlanda: izquierda).',
  },
  europa_sur: {
    visa: 'Schengen.',
    health: 'Sin vacunas. TSE válida.',
    safety: 'Seguro. Carteristas en metro y zonas turísticas top.',
    language: 'Idioma local; inglés moderado.',
    plug: 'Tipo C/F (230V).',
    tip: '5-10% restaurantes.',
    water: 'Agua del grifo potable.',
    drive: 'Conducción derecha.',
  },
  asia_oriental: {
    visa: 'Comprueba según país (Japón/Corea: sin visado UE 90d. China: e-visa).',
    health: 'Sin vacunas obligatorias generalmente. Hepatitis A recomendada.',
    safety: 'Muy seguro. Sigue normas locales estrictamente.',
    language: 'Idioma local; inglés limitado fuera de zonas turísticas. Lleva traductor offline.',
    plug: 'Tipo A/C (100-220V según país) — adaptador habitual.',
    tip: 'En Japón NO se da propina (puede ofender). Otros países: redondear.',
    water: 'Solo embotellada salvo Japón y Corea del Sur.',
    drive: 'Izquierda en Japón; derecha en China y Corea.',
  },
  sudeste_asia: {
    visa: 'E-visa o on-arrival en mayoría (Tailandia, Indonesia, Vietnam, Camboya).',
    health: 'Hepatitis A y tifoidea recomendadas. Dengue: usa DEET. Solo agua embotellada.',
    safety: 'Seguro en general. Vigila tuk-tuks/taxis sin taxímetro y estafas turísticas.',
    language: 'Idioma local; inglés básico en zonas turísticas.',
    plug: 'Tipo A/C/G (220V) — adaptador necesario.',
    tip: 'Pequeñas propinas bienvenidas; 10% en restaurantes turísticos.',
    water: 'NUNCA del grifo. Solo embotellada o filtrada.',
    drive: 'Izquierda (Tailandia, Indonesia, Malasia, Singapur); derecha en Vietnam, Camboya, Filipinas.',
  },
  asia_sur: {
    visa: 'India: e-visa online. Nepal/Bangladés: visado on-arrival. Sri Lanka: ETA online.',
    health: 'OBLIGATORIO consultar Sanidad Exterior. Hepatitis A y tifoidea esenciales. Solo agua embotellada precintada.',
    safety: 'Precaución con estafas turísticas. Mujeres solas: extrema precaución, transporte privado.',
    language: 'Idiomas locales; inglés extendido (legado colonial).',
    plug: 'Tipo C/D/M (230V) — adaptador para D.',
    tip: '10% en restaurantes; pequeñas cantidades servicios.',
    water: 'NUNCA del grifo. Solo embotellada precintada (incluso para lavarse los dientes).',
    drive: 'Conducción izquierda.',
  },
  asia_central: {
    visa: 'Variado: comprueba consulado. Kazajistán y Kirguistán sin visado UE 30d.',
    health: 'Hepatitis A, tifoidea recomendadas. Vacunas según ruta.',
    safety: 'Seguro en zonas turísticas. Consulta MAE para zonas remotas.',
    language: 'Ruso muy extendido; idiomas locales (kazajo, kirguís, etc.). Inglés limitado.',
    plug: 'Tipo C/F (220V).',
    tip: '10% en restaurantes turísticos.',
    water: 'Embotellada recomendada.',
    drive: 'Conducción derecha.',
  },
  oriente_medio: {
    visa: 'Variado según país: EAU sin visado UE 90d, Jordania visado on-arrival, Arabia e-visa.',
    health: 'Sin vacunas obligatorias generalmente. Hepatitis A recomendada.',
    safety: 'Sigue avisos MAE actualizados. Vigila zonas fronterizas.',
    language: 'Árabe; inglés muy extendido en zonas turísticas.',
    plug: 'Tipo C/D/G (220V) — adaptador habitual.',
    tip: '10-15% restaurantes; pequeñas propinas servicios.',
    water: 'Embotellada recomendada.',
    drive: 'Conducción derecha. Mujeres: respeta restricciones locales.',
  },
  africa_norte: {
    visa: 'Marruecos sin visado 90d. Túnez sin visado 90d. Egipto e-visa o on-arrival. Argelia visado obligatorio.',
    health: 'Hepatitis A, tifoidea recomendadas. Solo agua embotellada precintada.',
    safety: 'Vigila avisos MAE: evita zonas desérticas/fronterizas. Carteristas en medinas.',
    language: 'Árabe y francés; inglés en zonas turísticas.',
    plug: 'Tipo C/E (220V).',
    tip: '10% restaurantes; pequeñas propinas a porteadores.',
    water: 'NUNCA del grifo. Solo embotellada.',
    drive: 'Conducción derecha. Estilo agresivo en ciudades.',
  },
  africa_subsahariana: {
    visa: 'Variado: e-visa en Kenia, Tanzania, Ruanda; visado en consulado en Sudáfrica.',
    health: 'FIEBRE AMARILLA OBLIGATORIA en muchos países (consulta Sanidad Exterior). Malaria endémica: profilaxis. Hepatitis A, tifoidea, rabia recomendadas. Solo embotellada precintada.',
    safety: 'Sigue avisos MAE. Evita conducir de noche. Crimen en ciudades; safaris organizados son seguros.',
    language: 'Idiomas locales + inglés/francés/portugués según colonia.',
    plug: 'Tipo C/D/G (220-240V).',
    tip: '10% restaurantes; propinas a guías safari habituales (10-15 USD/día).',
    water: 'NUNCA del grifo.',
    drive: 'Izquierda en mayoría (ex-británicas); derecha en ex-francesas y portuguesas.',
  },
  norteamerica: {
    visa: 'EE.UU.: ESTA (sin visado UE/España 90d, 21 USD). Canadá: eTA (7 CAD). México: sin visado 180d.',
    health: 'Sin vacunas obligatorias. Hepatitis A recomendada en México. Seguro médico imprescindible (sanidad MUY cara).',
    safety: 'Muy seguro en general. En México, evita zonas señaladas por MAE.',
    language: 'Inglés (EE.UU./Canadá); español (México).',
    plug: 'Tipo A/B (110V) — adaptador necesario desde España. Voltaje más bajo.',
    tip: 'EE.UU./Canadá: 18-20% obligatorio en restaurantes. México: 10-15%.',
    water: 'EE.UU./Canadá: agua del grifo OK. México: solo embotellada.',
    drive: 'Conducción derecha. Carnet internacional recomendado.',
  },
  centroamerica: {
    visa: 'Sin visado para españoles en mayoría (90d). Pasaporte 6 meses vigencia.',
    health: 'Hepatitis A, tifoidea recomendadas. Dengue en costa: DEET. Fiebre amarilla si vienes de zona endémica.',
    safety: 'Cuidado en ciudades grandes. Zonas turísticas seguras. No conduzcas de noche.',
    language: 'Español; inglés en Belice y zonas turísticas del Caribe.',
    plug: 'Tipo A/B (110-120V).',
    tip: '10-15% restaurantes.',
    water: 'Solo embotellada.',
    drive: 'Conducción derecha.',
  },
  sudamerica: {
    visa: 'Sin visado para españoles en casi todos (90d). Venezuela: situación cambiante.',
    health: 'Hepatitis A, tifoidea recomendadas. FIEBRE AMARILLA OBLIGATORIA para selva amazónica (Brasil, Perú, Ecuador, Bolivia). Mal de altura en Andes: aclimatación gradual.',
    safety: 'Vigila carteristas en ciudades. Brasil/Argentina/Chile/Uruguay seguros en zonas turísticas.',
    language: 'Español; portugués en Brasil.',
    plug: 'Tipo C/I (220V principalmente) — adaptador habitual.',
    tip: '10% restaurantes; argentinos no esperan tanto.',
    water: 'Embotellada recomendada (excepto Chile, Uruguay y Argentina urbana).',
    drive: 'Conducción derecha. Surinam y Guyana: izquierda.',
  },
  oceania: {
    visa: 'Australia: ETA online (sin visado tradicional). N.Zelanda: NZeTA. Fiji: sin visado 4 meses.',
    health: 'Sin vacunas obligatorias. Cuidado con sol extremo (UV alto). Seguro médico recomendado (caro).',
    safety: 'De los más seguros del mundo. Atención a fauna marina (medusas, tiburones zonas señalizadas).',
    language: 'Inglés.',
    plug: 'Tipo I (230V) — adaptador necesario desde España.',
    tip: 'No es obligatoria; redondear en restaurantes nice.',
    water: 'Agua del grifo potable.',
    drive: 'Conducción izquierda.',
  },
  caribe: {
    visa: 'Cuba: visado turístico (tarjeta turística). R.Dominicana: sin visado. Otros: variable.',
    health: 'Sin vacunas obligatorias. Hepatitis A recomendada. Dengue/Zika en zonas con mosquitos: DEET.',
    safety: 'Resorts seguros. Vigila fuera de zonas turísticas en algunos países.',
    language: 'Español/inglés/francés según isla.',
    plug: 'Tipo A/B (110V) en mayoría.',
    tip: '15-20% (estilo americano).',
    water: 'Embotellada recomendada.',
    drive: 'Variable: izquierda en Jamaica/Barbados; derecha en Cuba/R.Dom.',
  },
};

// ── DATOS ESPECÍFICOS POR PAÍS (sobrescriben region defaults) ──
export const COUNTRY_FACTS = {
  // ════════════════════════════════════════════════
  // EUROPA OCCIDENTAL
  // ════════════════════════════════════════════════
  ES: { visa:'Schengen — circulación libre UE.', health:'Sistema sanitario público de alta calidad. TSE válida.', safety:'Muy seguro. Carteristas en Madrid, Barcelona y zonas turísticas.', language:'Español oficial; catalán, gallego, euskera regionales. Inglés moderado.', plug:'Tipo C/F (230V).', tip:'5-10% en restaurantes; opcional.', water:'Agua del grifo potable en todo el país.', drive:'Conducción derecha. Carnet UE válido.' },
  FR: { visa:'Schengen.', health:'Sanidad excelente. TSE válida.', safety:'Seguro. Carteristas activos en París (metro, Torre Eiffel, Sacré Coeur).', language:'Francés. Inglés moderado fuera de París.', plug:'Tipo C/E (230V).', tip:'Servicio incluido por ley; redondear 5% si excelente.', water:'Agua del grifo OK.', drive:'Derecha. Vignette para autopistas.' },
  IT: { visa:'Schengen.', health:'TSE válida. Sanidad pública de calidad.', safety:'Seguro. Carteristas en Roma (metro, Coliseo) y trenes turísticos. Cuidado con estafas de rosas/pulseras.', language:'Italiano. Inglés moderado en zonas turísticas.', plug:'Tipo C/F/L (230V) — adaptador para L.', tip:'"Coperto" cubre servicio; propina extra opcional 5-10%.', water:'Agua del grifo OK.', drive:'Derecha. ZTL (zonas tráfico limitado) en cascos antiguos.' },
  DE: { visa:'Schengen.', health:'Excelente. TSE válida.', safety:'Muy seguro.', language:'Alemán. Inglés ampliamente extendido.', plug:'Tipo C/F (230V).', tip:'5-10%; di la cantidad TOTAL al pagar (no dejes en la mesa).', water:'Agua del grifo de excelente calidad.', drive:'Derecha. Autobahn sin límite en tramos.' },
  PT: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro. Vigila carteristas tranvía 28 Lisboa.', language:'Portugués; español comprensible. Inglés muy extendido.', plug:'Tipo C/F (230V).', tip:'5-10% si servicio bueno; redondear suficiente.', water:'Agua del grifo OK.', drive:'Derecha. Peajes electrónicos.' },
  NL: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro. Cuidado con bicicletas: cruza por pasos peatonales.', language:'Neerlandés. Inglés universal.', plug:'Tipo C/F (230V).', tip:'10% si servicio excelente; servicio incluido.', water:'Agua del grifo OK.', drive:'Derecha.' },
  BE: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Neerlandés (Flandes), francés (Valonia), alemán. Inglés extendido.', plug:'Tipo C/E (230V).', tip:'10% si servicio bueno.', water:'Agua del grifo OK.', drive:'Derecha.' },
  AT: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Alemán. Inglés extendido.', plug:'Tipo C/F (230V).', tip:'5-10% redondeando hacia arriba.', water:'Agua del grifo OK.', drive:'Derecha. Vignette para autopistas.' },
  CH: { visa:'Schengen (NO UE pero sí Schengen). Suiza tiene su propia moneda y precios altos.', health:'Seguro de viaje IMPRESCINDIBLE. Sanidad muy cara.', safety:'De los más seguros del mundo.', language:'Alemán, francés, italiano, romanche según región.', plug:'Tipo J (230V) — adaptador específico necesario.', tip:'Servicio incluido; redondear suficiente.', water:'Agua del grifo de excelente calidad (incluso en fuentes).', drive:'Derecha. Vignette obligatoria autopistas (40 CHF).' },
  IE: { visa:'Sin visado UE. (NO Schengen.)', health:'TSE válida.', safety:'Muy seguro.', language:'Inglés (e irlandés/gaélico).', plug:'Tipo G (230V) — adaptador británico necesario.', tip:'10-12% en restaurantes nice.', water:'Agua del grifo OK.', drive:'IZQUIERDA.' },
  GB: { visa:'NO UE. Sin visado para españoles hasta 6 meses. Desde 2025: ETA online obligatoria (~10£).', health:'NHS gratuito en emergencias; recomendado seguro privado.', safety:'Muy seguro. Carteristas en Londres turística.', language:'Inglés.', plug:'Tipo G (230V) — adaptador necesario.', tip:'12.5% suelen añadirlo en cuenta; si no, dar 10-15%.', water:'Agua del grifo OK.', drive:'IZQUIERDA. Carnet UE válido.' },
  LU: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Luxemburgués, francés, alemán. Inglés extendido.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha.' },
  AD: { visa:'Sin visado (entrada por España o Francia).', health:'Sin sanidad pública gratuita; seguro IMPRESCINDIBLE.', safety:'Muy seguro.', language:'Catalán oficial; español y francés muy extendidos.', plug:'Tipo C/F (230V).', tip:'10% en restaurantes.', water:'Agua del grifo OK.', drive:'Derecha.' },
  MC: { visa:'Sin visado (entrada por Francia).', health:'Sanidad francesa válida.', safety:'Muy seguro.', language:'Francés.', plug:'Tipo C/E (230V).', tip:'15% servicio incluido habitualmente.', water:'Agua del grifo OK.', drive:'Derecha.' },

  // ════════════════════════════════════════════════
  // EUROPA NORTE
  // ════════════════════════════════════════════════
  NO: { visa:'Schengen.', health:'Excelente. TSE válida.', safety:'De los más seguros del mundo.', language:'Noruego. Inglés universal.', plug:'Tipo C/F (230V).', tip:'Servicio incluido; redondear opcional.', water:'Agua del grifo de excelente calidad.', drive:'Derecha. Carreteras de montaña: cuidado en invierno.' },
  SE: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Sueco. Inglés universal.', plug:'Tipo C/F (230V).', tip:'Servicio incluido.', water:'Agua del grifo excelente.', drive:'Derecha.' },
  FI: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Finlandés y sueco. Inglés muy extendido.', plug:'Tipo C/F (230V).', tip:'Servicio incluido; redondear opcional.', water:'Agua del grifo OK.', drive:'Derecha. Faros encendidos siempre.' },
  DK: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Danés. Inglés universal.', plug:'Tipo C/F/K (230V).', tip:'Servicio incluido.', water:'Agua del grifo OK.', drive:'Derecha.' },
  IS: { visa:'Schengen.', health:'Sanidad cara; seguro IMPRESCINDIBLE.', safety:'De los más seguros del mundo. Sigue señales de actividad volcánica.', language:'Islandés. Inglés universal.', plug:'Tipo C/F (230V).', tip:'Servicio incluido; opcional.', water:'Agua del grifo excelente (puede oler a azufre por origen geotermal).', drive:'Derecha. 4×4 OBLIGATORIO para Highlands. Vientos cruzados extremos.' },

  // ════════════════════════════════════════════════
  // EUROPA SUR (resto del Mediterráneo)
  // ════════════════════════════════════════════════
  GR: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro. En islas, permiso A1 mínimo para moto (multas altas).', language:'Griego. Inglés muy extendido en turismo.', plug:'Tipo C/F (230V).', tip:'10% redondeando.', water:'Atenas y grandes ciudades: del grifo OK. Islas: mejor embotellada.', drive:'Derecha. Conducción agresiva en Atenas.' },
  MT: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Maltés e inglés oficiales.', plug:'Tipo G (230V) — adaptador británico.', tip:'10% restaurantes.', water:'Agua del grifo potable pero sabor salobre; locales beben embotellada.', drive:'IZQUIERDA.' },
  CY: { visa:'Schengen (sur). Norte (turco): visado on-arrival.', health:'TSE válida en sur.', safety:'Muy seguro.', language:'Griego (sur), turco (norte). Inglés universal.', plug:'Tipo G (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'IZQUIERDA.' },
  HR: { visa:'Schengen desde 2023. Euro desde 2023.', health:'TSE válida.', safety:'Muy seguro.', language:'Croata. Inglés extendido en costa.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha.' },
  SI: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Esloveno. Inglés extendido.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha. Vignette para autopistas.' },
  ME: { visa:'Sin visado UE 90d.', health:'Seguro de viaje recomendado.', safety:'Seguro.', language:'Montenegrino. Inglés básico.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  AL: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada. Seguro imprescindible.', safety:'Seguro en general. Conducción caótica.', language:'Albanés. Italiano e inglés en costa.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha. Mala señalización.' },
  RS: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada.', safety:'Seguro.', language:'Serbio (cirílico/latino). Inglés moderado en Belgrado.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  BA: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada. Seguro imprescindible.', safety:'Seguro. ATENCIÓN: minas antipersona aún en algunas zonas rurales — sigue senderos marcados.', language:'Bosnio, croata, serbio. Inglés básico.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  MK: { visa:'Sin visado UE 90d.', health:'Seguro recomendado.', safety:'Seguro.', language:'Macedonio. Albanés en oeste.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  VA: { visa:'Acceso libre (entrada por Italia).', health:'Atención médica en hospitales italianos.', safety:'Muy seguro.', language:'Italiano, latín.', plug:'Tipo C/F/L (230V).', tip:'No aplica (estado).', water:'Agua del grifo OK.', drive:'No aplica (peatonal).' },
  SM: { visa:'Sin visado (entrada por Italia).', health:'Sanidad italiana.', safety:'Muy seguro.', language:'Italiano.', plug:'Tipo C/F/L (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha.' },

  // ════════════════════════════════════════════════
  // EUROPA ESTE
  // ════════════════════════════════════════════════
  PL: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Polaco. Inglés extendido en ciudades.', plug:'Tipo C/E (230V).', tip:'10% restaurantes.', water:'Agua del grifo potable; locales prefieren embotellada.', drive:'Derecha.' },
  CZ: { visa:'Schengen.', health:'TSE válida.', safety:'Seguro. Carteristas en Praga turística.', language:'Checo. Inglés moderado en Praga.', plug:'Tipo C/E (230V).', tip:'10% redondeando.', water:'Agua del grifo OK.', drive:'Derecha. Vignette autopistas.' },
  SK: { visa:'Schengen.', health:'TSE válida.', safety:'Seguro.', language:'Eslovaco. Inglés moderado.', plug:'Tipo C/E (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha. Vignette autopistas.' },
  HU: { visa:'Schengen.', health:'TSE válida.', safety:'Seguro. Cuidado con estafa de "consumición cara" en bares centro Budapest.', language:'Húngaro. Inglés moderado.', plug:'Tipo C/F (230V).', tip:'10-12% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha. Vignette autopistas.' },
  RO: { visa:'Schengen desde 2024.', health:'TSE válida.', safety:'Seguro.', language:'Rumano. Inglés moderado en ciudades.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK en ciudades; embotellada en rural.', drive:'Derecha.' },
  BG: { visa:'Schengen desde 2024 (parcial).', health:'TSE válida.', safety:'Seguro.', language:'Búlgaro (cirílico). Inglés moderado.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK en Sofía.', drive:'Derecha. Vignette autopistas.' },
  UA: { visa:'AVISO MAE: NO VIAJAR. Conflicto bélico activo.', health:'Acceso médico limitado en zonas afectadas.', safety:'NO VIAJAR. Consulta avisos MAE actualizados.', language:'Ucraniano. Ruso también común.', plug:'Tipo C/F (220V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  BY: { visa:'Visado obligatorio (consulado). MAE recomienda no viajar.', health:'Acceso limitado.', safety:'Restricciones políticas. Consulta MAE.', language:'Bielorruso, ruso. Inglés muy limitado.', plug:'Tipo C/F (220V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  RU: { visa:'AVISO MAE: NO VIAJAR. Visado obligatorio y restricciones consulares.', health:'Acceso médico limitado para extranjeros.', safety:'NO VIAJAR. Riesgo de detención arbitraria.', language:'Ruso (cirílico). Inglés muy limitado.', plug:'Tipo C/F (220V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  MD: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada.', safety:'Seguro. Evita Transnistria.', language:'Rumano. Ruso común.', plug:'Tipo C/F (220V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  EE: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Estonio. Inglés muy extendido.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha. Faros siempre encendidos.' },
  LV: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Letón, ruso. Inglés extendido.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha. Faros siempre encendidos.' },
  LT: { visa:'Schengen.', health:'TSE válida.', safety:'Muy seguro.', language:'Lituano. Inglés extendido.', plug:'Tipo C/F (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha. Faros siempre encendidos.' },

  // ════════════════════════════════════════════════
  // ASIA ORIENTAL
  // ════════════════════════════════════════════════
  JP: { visa:'Sin visado para españoles 90d.', health:'Sin vacunas. Sanidad excelente PERO MUY cara: seguro imprescindible.', safety:'Uno de los países más seguros del mundo. Puedes andar de noche tranquilo.', language:'Japonés. Inglés MUY limitado fuera de hoteles. Google Translate con cámara es tu aliado.', plug:'Tipo A (100V) — adaptador desde España. Voltaje más bajo: carga más lenta.', tip:'NO se da propina. Considerada mala educación. Servicio siempre incluido.', water:'Agua del grifo de excelente calidad.', drive:'IZQUIERDA. Permiso internacional obligatorio.' },
  KR: { visa:'Sin visado UE 90d. K-ETA online recomendada.', health:'Sin vacunas. Sanidad excelente.', safety:'Muy seguro.', language:'Coreano (hangul). Inglés moderado en Seúl.', plug:'Tipo C/F (220V).', tip:'No se da propina.', water:'Agua del grifo OK.', drive:'Derecha. Conducción rápida.' },
  CN: { visa:'Visado obligatorio (consulado). Algunas ciudades: tránsito 144h sin visado.', health:'Sin vacunas obligatorias. Hepatitis A recomendada. Solo embotellada.', safety:'Muy seguro. Restricciones VPN: prepara antes (Google/WhatsApp/Instagram bloqueados).', language:'Mandarín. Inglés muy limitado. Cantonés en sur.', plug:'Tipo A/I/C (220V).', tip:'No es habitual; algunos hoteles 4-5★ esperan 10%.', water:'NUNCA del grifo.', drive:'Derecha. Caótica.' },
  HK: { visa:'Sin visado UE 90d. Estado especial.', health:'Sin vacunas. Sanidad excelente.', safety:'Muy seguro.', language:'Cantonés, inglés. Mandarín muy extendido.', plug:'Tipo G (220V).', tip:'10% servicio incluido habitualmente.', water:'Agua del grifo OK.', drive:'IZQUIERDA.' },
  TW: { visa:'Sin visado UE 90d.', health:'Sin vacunas. Sanidad excelente.', safety:'Muy seguro.', language:'Mandarín. Inglés moderado.', plug:'Tipo A/B (110V).', tip:'No habitual; servicio incluido.', water:'Agua del grifo no recomendada; embotellada.', drive:'Derecha.' },
  MN: { visa:'Sin visado UE 30d.', health:'Hepatitis A, tifoidea recomendadas. Solo embotellada.', safety:'Seguro. Estepa: conducción 4×4 con guía.', language:'Mongol (cirílico). Inglés muy limitado.', plug:'Tipo C/E (220V).', tip:'10% restaurantes turísticos.', water:'Solo embotellada.', drive:'Derecha. Estepa sin carreteras: 4×4.' },

  // ════════════════════════════════════════════════
  // SUDESTE ASIÁTICO
  // ════════════════════════════════════════════════
  TH: { visa:'Sin visado UE 30d (turismo).', health:'Hepatitis A obligatoria; tifoidea y dengue recomendadas. DEET para dengue/Zika.', safety:'Muy seguro. Cuidado con estafas (taxis sin taxímetro, tuk-tuks con desvíos a tiendas), cuida la bebida en discotecas.', language:'Tailandés. Inglés básico en zonas turísticas.', plug:'Tipo A/B/C (220V).', tip:'10% en restaurantes nice; redondear taxis.', water:'NUNCA del grifo.', drive:'IZQUIERDA. Caótica; alquila moto solo con permiso A.' },
  VN: { visa:'E-visa online (25 USD, 90d) o on-arrival.', health:'Hepatitis A, tifoidea recomendadas. Encefalitis japonesa si zonas rurales >1 mes. Solo embotellada.', safety:'Seguro. Tráfico caótico — extrema precaución cruzando. Carteristas en Hanói y Ho Chi Minh.', language:'Vietnamita. Inglés básico turismo.', plug:'Tipo A/C/G (220V).', tip:'No obligatoria; 5-10% restaurantes turísticos.', water:'Solo embotellada.', drive:'Derecha. Conducción extremadamente caótica.' },
  ID: { visa:'Visado on-arrival 35 USD (30d, prorrogable). Pasaporte 6m.', health:'Hepatitis A, tifoidea. Dengue: DEET. Bali: cuidado con "Bali belly" (diarrea).', safety:'Seguro. Vigila scooters y conducción. Volcanes activos: sigue instrucciones.', language:'Bahasa Indonesia. Inglés en Bali.', plug:'Tipo C/F (230V) — igual que España.', tip:'10% restaurantes; 10.000 IDR a porteadores.', water:'Solo embotellada.', drive:'IZQUIERDA. Tráfico caótico.' },
  MY: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada. Dengue: DEET.', safety:'Muy seguro.', language:'Malayo. Inglés muy extendido.', plug:'Tipo G (240V).', tip:'10% servicio incluido habitualmente.', water:'Embotellada recomendada.', drive:'IZQUIERDA.' },
  SG: { visa:'Sin visado UE 90d.', health:'Sin vacunas. Sanidad excelente.', safety:'Uno de los más seguros del mundo. Leyes ESTRICTAS (chicle prohibido, multas por basura, drogas pena de muerte).', language:'Inglés, mandarín, malayo, tamil.', plug:'Tipo G (230V).', tip:'10% servicio incluido habitualmente.', water:'Agua del grifo OK.', drive:'IZQUIERDA.' },
  PH: { visa:'Sin visado UE 30d.', health:'Hepatitis A, tifoidea. Dengue: DEET. Malaria en zonas rurales: profilaxis.', safety:'Sigue avisos MAE: evita Mindanao. Resto seguro.', language:'Filipino, inglés (oficial).', plug:'Tipo A/B/C (220V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha. Caótica.' },
  KH: { visa:'Visado on-arrival 30 USD o e-visa.', health:'Hepatitis A, tifoidea, encefalitis japonesa recomendadas. Solo embotellada. Malaria zonas rurales.', safety:'Seguro en zonas turísticas. ATENCIÓN: minas antipersona aún en algunas zonas rurales — solo senderos marcados.', language:'Jemer. Inglés básico turismo.', plug:'Tipo A/C/G (230V).', tip:'10% restaurantes; pequeñas propinas servicios.', water:'Solo embotellada.', drive:'Derecha.' },
  LA: { visa:'Visado on-arrival 35-45 USD.', health:'Hepatitis A, tifoidea, encefalitis japonesa. Solo embotellada. Malaria zonas rurales.', safety:'Seguro. Carreteras de montaña peligrosas.', language:'Lao. Francés mayores, inglés básico turismo.', plug:'Tipo A/B/C/E/F (230V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha.' },
  MM: { visa:'AVISO MAE: NO VIAJAR. Situación política inestable. Visado obligatorio.', health:'Hepatitis A, tifoidea. Solo embotellada.', safety:'NO VIAJAR. Consulta MAE.', language:'Birmano. Inglés muy limitado.', plug:'Tipo C/D/F/G (230V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha.' },
  BN: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada.', safety:'Muy seguro. Sultanato islámico: respeta normas (alcohol restringido).', language:'Malayo. Inglés extendido.', plug:'Tipo G (240V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'IZQUIERDA.' },

  // ════════════════════════════════════════════════
  // ASIA SUR
  // ════════════════════════════════════════════════
  IN: { visa:'E-visa online obligatoria (25-80 USD).', health:'OBLIGATORIO: hepatitis A, tifoidea. Recomendado: hepatitis B, rabia (zonas rurales), encefalitis japonesa. Malaria zonas específicas. SOLO agua embotellada precintada.', safety:'Estafas turísticas en Delhi/Jaipur. Mujeres solas: extrema precaución, transporte privado.', language:'Hindi, inglés oficiales. Inglés extendido.', plug:'Tipo C/D/M (230V) — adaptador para D.', tip:'10% restaurantes nice; servicio incluido.', water:'SOLO embotellada precintada.', drive:'IZQUIERDA. Caótica al extremo.' },
  NP: { visa:'Visado on-arrival 25-50 USD según días.', health:'Hepatitis A, tifoidea. Mal de altura en Himalaya: aclimatación gradual obligatoria. Diamox preventivo.', safety:'Seguro. Trekkings: guía local recomendado, seguro de evacuación helicóptero.', language:'Nepalí. Inglés en turismo.', plug:'Tipo C/D/M (230V).', tip:'10% restaurantes turísticos. Guías y porteadores trekking: propinas habituales.', water:'Solo embotellada o purificada.', drive:'IZQUIERDA.' },
  LK: { visa:'ETA online obligatoria (50 USD).', health:'Hepatitis A, tifoidea. Dengue: DEET. Malaria erradicada.', safety:'Seguro en zonas turísticas. Carteristas en Colombo.', language:'Cingalés, tamil. Inglés extendido.', plug:'Tipo D/G/M (230V).', tip:'10% servicio incluido habitualmente.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  PK: { visa:'Visado obligatorio (consulado) o e-visa.', health:'Hepatitis A, tifoidea, hepatitis B obligatorias. Polio: zonas específicas. Solo embotellada.', safety:'MAE recomienda evitar zonas fronterizas. Consulta avisos.', language:'Urdu, inglés. Inglés extendido élite.', plug:'Tipo C/D (230V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  BD: { visa:'Visado on-arrival.', health:'Hepatitis A, tifoidea. Solo embotellada.', safety:'Vigila avisos MAE. Tráfico caótico.', language:'Bengalí. Inglés moderado.', plug:'Tipo C/D/G (220V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  BT: { visa:'Visado especial OBLIGATORIO. Tasa diaria turística: 100 USD/día (mínimo). Tour organizado obligatorio.', health:'Mal de altura posible. Vacunas hepatitis A/tifoidea.', safety:'Muy seguro.', language:'Dzongkha. Inglés extendido.', plug:'Tipo D/F/G/M (230V).', tip:'Servicio incluido en paquete turístico.', water:'Embotellada recomendada.', drive:'IZQUIERDA.' },
  MV: { visa:'Visado on-arrival 30d gratis.', health:'Sin vacunas obligatorias. Dengue: DEET.', safety:'Resorts muy seguros. Atolones: respeta fauna marina.', language:'Dhivehi. Inglés extendido.', plug:'Tipo D/G (230V).', tip:'10% en resorts; servicio incluido habitualmente.', water:'Embotellada recomendada.', drive:'No aplica (islas pequeñas).' },

  // ════════════════════════════════════════════════
  // ORIENTE MEDIO
  // ════════════════════════════════════════════════
  TR: { visa:'Sin visado UE 90d.', health:'Sin vacunas obligatorias. Hepatitis A para zonas rurales. Embotellada.', safety:'Estambul y costa muy seguros. EVITA zonas fronterizas con Siria e Irak.', language:'Turco. Inglés moderado turismo.', plug:'Tipo C/F (230V).', tip:'10-15% restaurantes turísticos.', water:'Embotellada recomendada.', drive:'Derecha.' },
  AE: { visa:'Sin visado UE 90d.', health:'Sin vacunas. Calor extremo verano: hidratación.', safety:'Uno de los más seguros del mundo. Leyes islámicas: comportamiento público restringido. NO insultos en redes (delito).', language:'Árabe, inglés (universal).', plug:'Tipo G (220V).', tip:'10% servicio incluido habitualmente.', water:'Embotellada recomendada.', drive:'Derecha. Multas altas por exceso velocidad.' },
  SA: { visa:'E-visa turístico online (~120 USD).', health:'Sin vacunas obligatorias generales. Hajj/Umrah: vacuna meningitis OBLIGATORIA.', safety:'Seguro. Ley islámica estricta. Mujeres: ya no abaya obligatoria pero recato.', language:'Árabe. Inglés en zonas turísticas.', plug:'Tipo G (230V).', tip:'10-15% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  QA: { visa:'Sin visado UE 90d.', health:'Sin vacunas.', safety:'Muy seguro.', language:'Árabe, inglés.', plug:'Tipo D/G (240V).', tip:'10% servicio incluido habitualmente.', water:'Embotellada.', drive:'Derecha.' },
  KW: { visa:'Visado on-arrival (3 KWD).', health:'Sin vacunas.', safety:'Muy seguro. Leyes islámicas estrictas.', language:'Árabe, inglés.', plug:'Tipo C/G (240V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  BH: { visa:'Visado on-arrival (~25 USD).', health:'Sin vacunas.', safety:'Muy seguro.', language:'Árabe, inglés extendido.', plug:'Tipo G (230V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  OM: { visa:'E-visa online.', health:'Sin vacunas. Calor extremo verano.', safety:'Muy seguro. País más relajado del Golfo.', language:'Árabe, inglés extendido.', plug:'Tipo G (240V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  IL: { visa:'Sin visado UE 90d.', health:'Sin vacunas. Sanidad excelente.', safety:'Sigue avisos MAE actualizados (situación cambiante).', language:'Hebreo, árabe. Inglés universal.', plug:'Tipo C/H/M (230V) — adaptador tipo H único.', tip:'10-15% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha.' },
  JO: { visa:'Visado on-arrival (40 JOD) o Jordan Pass (incluye visado + sitios arqueológicos).', health:'Hepatitis A recomendada. Embotellada.', safety:'Muy seguro. Petra y Wadi Rum totalmente seguros.', language:'Árabe. Inglés extendido turismo.', plug:'Tipo C/D/F/G/J (230V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  LB: { visa:'Visado on-arrival gratis (90d).', health:'Hepatitis A recomendada.', safety:'Sigue avisos MAE. Beirut centro seguro.', language:'Árabe, francés, inglés.', plug:'Tipo A/B/C/D/G (220V).', tip:'10% servicio incluido habitualmente.', water:'Embotellada.', drive:'Derecha. Caótica.' },
  IR: { visa:'Visado obligatorio. AVISO MAE: viajes restringidos.', health:'Hepatitis A, tifoidea. Embotellada.', safety:'Consulta avisos MAE. Riesgo detención arbitraria.', language:'Persa (farsi). Inglés muy limitado.', plug:'Tipo C/F (220V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  IQ: { visa:'AVISO MAE: NO VIAJAR (excepto Kurdistán autónomo bajo precaución).', health:'Limitado.', safety:'NO VIAJAR.', language:'Árabe, kurdo.', plug:'Tipo C/D/G (230V).', tip:'-', water:'Embotellada.', drive:'Derecha.' },
  SY: { visa:'AVISO MAE: NO VIAJAR. Conflicto activo.', health:'Limitado.', safety:'NO VIAJAR.', language:'Árabe.', plug:'Tipo C/E/L (220V).', tip:'-', water:'Embotellada.', drive:'Derecha.' },
  YE: { visa:'AVISO MAE: NO VIAJAR. Conflicto activo.', health:'Limitado. Cólera endémico.', safety:'NO VIAJAR.', language:'Árabe.', plug:'Tipo A/D/G (230V).', tip:'-', water:'Embotellada.', drive:'Derecha.' },

  // ════════════════════════════════════════════════
  // ÁFRICA NORTE
  // ════════════════════════════════════════════════
  MA: { visa:'Sin visado UE 90d. Pasaporte 6m vigencia.', health:'Hepatitis A y tifoidea recomendadas. No exige obligatorias desde España.', safety:'Seguro. Vigila carteristas en zocos; regatea con calma. Nunca aceptes "guías" sin licencia.', language:'Árabe y bereber oficiales; francés muy extendido; inglés en zonas turísticas.', plug:'Tipo C/E (230V).', tip:'10% restaurantes turísticos; pequeñas a porteadores.', water:'Embotellada recomendada.', drive:'Derecha.' },
  DZ: { visa:'Visado obligatorio para españoles. Solicita en consulado con 4-6 semanas. Aprox. 85€.', health:'Vacunas recomendadas (Sanidad Exterior): hepatitis A, fiebre tifoidea y rabia si zonas rurales. NO requiere fiebre amarilla salvo si vienes de zona endémica. Bebe SOLO agua embotellada.', safety:'EVITA zonas fronterizas con Mali, Níger y Libia (MAE España). En Argel y Orán nivel aceptable con precaución habitual.', language:'Árabe argelino (dárija) y bereber oficiales. Francés muy extendido. Inglés limitado.', plug:'Tipo C/F (230V).', tip:'5-10% en restaurantes; no obligatoria.', water:'Solo embotellada.', drive:'Derecha.' },
  TN: { visa:'Sin visado UE 90d.', health:'Hepatitis A recomendada.', safety:'Seguro en zonas turísticas. EVITA zonas fronterizas Libia/Argelia. Carteristas en medinas.', language:'Árabe, francés. Inglés moderado.', plug:'Tipo C/E (230V).', tip:'10% restaurantes turísticos.', water:'Embotellada recomendada.', drive:'Derecha.' },
  LY: { visa:'AVISO MAE: NO VIAJAR. Conflicto activo.', health:'Limitado.', safety:'NO VIAJAR.', language:'Árabe.', plug:'Tipo C/D/L (127/230V).', tip:'-', water:'Embotellada.', drive:'Derecha.' },
  EG: { visa:'Visado obligatorio: e-Visa online o on-arrival 25 USD. Pasaporte 6m.', health:'Hepatitis A, fiebre tifoidea recomendadas. Fiebre amarilla solo si vienes de zona endémica. Solo embotellada SIEMPRE.', safety:'Sigue avisos MAE: evita Sinaí (excepto Sharm el-Sheikh) y zonas fronterizas. El Cairo y Luxor seguros con precaución habitual.', language:'Árabe egipcio. Inglés en zonas turísticas y hoteles.', plug:'Tipo C/F (220V).', tip:'Baksheesh cultural: 10-15% restaurantes, pequeñas cantidades a porteadores, guías, taxistas.', water:'NUNCA del grifo.', drive:'Derecha. Caótica.' },
  SD: { visa:'AVISO MAE: NO VIAJAR. Conflicto activo.', health:'Limitado.', safety:'NO VIAJAR.', language:'Árabe.', plug:'Tipo C/D (230V).', tip:'-', water:'Embotellada.', drive:'Derecha.' },

  // ════════════════════════════════════════════════
  // ÁFRICA SUBSAHARIANA (principales)
  // ════════════════════════════════════════════════
  KE: { visa:'E-visa obligatoria online (~50 USD).', health:'FIEBRE AMARILLA si vienes de zona endémica. Hepatitis A, tifoidea, malaria (profilaxis), rabia recomendadas. Solo embotellada.', safety:'Seguro en safaris organizados. Nairobi: precaución. Avisos MAE para zonas fronterizas Somalia.', language:'Suajili e inglés (oficial).', plug:'Tipo G (240V).', tip:'10% restaurantes; 10-15 USD/día a guías safari.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  TZ: { visa:'Visado on-arrival o e-visa (50 USD).', health:'FIEBRE AMARILLA si vienes de zona endémica. Malaria, hepatitis A, tifoidea. Solo embotellada.', safety:'Seguro en safaris y Zanzíbar.', language:'Suajili, inglés.', plug:'Tipo D/G (230V).', tip:'10% restaurantes; propinas safaris habituales.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  ZA: { visa:'Sin visado UE 90d.', health:'Sin vacunas obligatorias. Malaria zona Kruger. Solo embotellada en rural.', safety:'Vigila crimen en ciudades (Johannesburgo). Capetown y Ruta Jardín seguros. No conduzcas de noche.', language:'Inglés y 10 idiomas oficiales más.', plug:'Tipo M/N (230V) — adaptador específico.', tip:'10-15% restaurantes; propinas a guarda-parques de aparcamientos (cultural).', water:'Agua del grifo OK en ciudades.', drive:'IZQUIERDA.' },
  EG_: { visa:'-', health:'-', safety:'-', language:'-', plug:'-', tip:'-', water:'-', drive:'-' }, // placeholder
  NG: { visa:'Visado obligatorio (consulado). Pasaporte 6m.', health:'FIEBRE AMARILLA OBLIGATORIA. Hepatitis A/B, tifoidea, meningitis, rabia, malaria. Cólera endémico.', safety:'AVISO MAE: precaución alta. Evita norte (Boko Haram) y Delta del Níger. Lagos: precaución alta.', language:'Inglés (oficial). +500 idiomas locales.', plug:'Tipo D/G (240V).', tip:'10% restaurantes turísticos.', water:'Solo embotellada.', drive:'Derecha.' },
  ET: { visa:'E-visa obligatoria online.', health:'Hepatitis A, tifoidea, meningitis, fiebre amarilla recomendadas. Mal de altura Addis Abeba (2400m).', safety:'Sigue avisos MAE. Tigré conflicto.', language:'Amárico. Inglés en turismo.', plug:'Tipo C/F/L (220V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha.' },
  MA_: { visa:'-', health:'-', safety:'-', language:'-', plug:'-', tip:'-', water:'-', drive:'-' }, // placeholder
  GH: { visa:'Visado obligatorio o e-visa.', health:'FIEBRE AMARILLA OBLIGATORIA. Hepatitis A/B, tifoidea, malaria, meningitis.', safety:'Uno de los más seguros África Occidental.', language:'Inglés.', plug:'Tipo D/G (230V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha.' },
  SN: { visa:'Sin visado UE 90d.', health:'FIEBRE AMARILLA OBLIGATORIA. Hepatitis A/B, tifoidea, malaria, meningitis.', safety:'Seguro. Carteristas en Dakar.', language:'Francés. Wolof, etc.', plug:'Tipo C/D/E/K (230V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha.' },
  NA: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea recomendadas. Malaria zona norte.', safety:'Muy seguro. 4×4 esencial para Sossusvlei/Kaokoland.', language:'Inglés (oficial). Afrikáans, alemán.', plug:'Tipo D/M (220V).', tip:'10% restaurantes.', water:'Agua del grifo OK en Windhoek.', drive:'IZQUIERDA.' },
  BW: { visa:'Sin visado UE 90d.', health:'Hepatitis A, malaria zona norte (Chobe, Okavango).', safety:'Muy seguro.', language:'Inglés, setsuana.', plug:'Tipo D/G/M (230V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'IZQUIERDA.' },
  ZW: { visa:'Visado on-arrival o KAZA univisa (Zambia+Zimbabue 50 USD).', health:'Hepatitis A, tifoidea, malaria zonas bajas.', safety:'Cataratas Victoria seguras. Resto del país: consulta MAE.', language:'Inglés, shona.', plug:'Tipo D/G (220V).', tip:'10% restaurantes (USD aceptado).', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  ZM: { visa:'Visado on-arrival o KAZA univisa.', health:'Fiebre amarilla, hepatitis A, malaria.', safety:'Seguro en zonas turísticas.', language:'Inglés.', plug:'Tipo C/D/G (230V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  UG: { visa:'E-visa obligatoria (50 USD).', health:'FIEBRE AMARILLA OBLIGATORIA. Hepatitis A/B, tifoidea, malaria, meningitis.', safety:'Seguro en safaris/Bwindi. Avisos MAE para zonas fronterizas.', language:'Inglés, suajili.', plug:'Tipo G (240V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'IZQUIERDA.' },
  RW: { visa:'Visado on-arrival o e-visa (50 USD).', health:'FIEBRE AMARILLA OBLIGATORIA. Hepatitis A/B, malaria.', safety:'Uno de los más seguros África. Trekking gorilas: permiso 1500 USD obligatorio.', language:'Kinyarwanda, francés, inglés.', plug:'Tipo C/J (230V).', tip:'10% restaurantes; propina obligatoria trackers gorilas (10-15 USD).', water:'Agua del grifo Kigali OK; rural embotellada.', drive:'Derecha.' },
  MZ: { visa:'Visado on-arrival 50 USD o e-visa.', health:'Fiebre amarilla si vienes de zona endémica. Hepatitis A/B, tifoidea, malaria.', safety:'Costa segura. Norte: precaución (insurgencia).', language:'Portugués.', plug:'Tipo C/F/M (220V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'IZQUIERDA.' },

  // ════════════════════════════════════════════════
  // AMÉRICAS
  // ════════════════════════════════════════════════
  US: { visa:'ESTA obligatoria (sin visado UE 90d, 21 USD online).', health:'Sin vacunas obligatorias. SANIDAD MUY CARA: seguro de viaje OBLIGATORIO (mínimo 100.000€ cobertura). Una visita a urgencias: 1.000-5.000 USD.', safety:'Seguro en zonas turísticas. En grandes ciudades: precaución en barrios específicos.', language:'Inglés. Español muy extendido en sur/oeste.', plug:'Tipo A/B (120V) — adaptador, voltaje más bajo.', tip:'18-20% restaurantes OBLIGATORIO (cultural). 15-20% Uber/taxi. 1-2 USD/maleta porteador.', water:'Agua del grifo OK.', drive:'Derecha. Carnet UE válido turismo.' },
  CA: { visa:'eTA online obligatoria (7 CAD).', health:'Sin vacunas. Seguro de viaje recomendado (sanidad cara para no-residentes).', safety:'Muy seguro.', language:'Inglés, francés (Quebec).', plug:'Tipo A/B (120V).', tip:'15-20% restaurantes. 15% Uber/taxi.', water:'Agua del grifo OK.', drive:'Derecha.' },
  MX: { visa:'Sin visado UE 180d. Pasaporte vigente.', health:'Hepatitis A recomendada. NO agua del grifo (solo embotellada). DEET para Zika/dengue en tropical.', safety:'Zonas turísticas (Cancún, CDMX centro, Oaxaca) seguras. Evita zonas señaladas MAE (algunos estados norte, Guerrero).', language:'Español. Inglés en zonas turísticas.', plug:'Tipo A/B (127V) — adaptador, voltaje más bajo.', tip:'10-15% restaurantes; obligatoria por ley algunos sitios. 1 USD/maleta.', water:'NUNCA del grifo (incluso hielo).', drive:'Derecha.' },
  GT: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea recomendadas. Solo embotellada. Mal altura Antigua.', safety:'Seguro en zonas turísticas (Antigua, Tikal, Atitlán). Ciudad Guatemala: precaución.', language:'Español. K\'iche, kaqchikel, etc.', plug:'Tipo A/B (120V).', tip:'10% restaurantes.', water:'Solo embotellada.', drive:'Derecha.' },
  BZ: { visa:'Sin visado UE 30d.', health:'Hepatitis A, tifoidea. Malaria zonas selva.', safety:'Seguro turísticamente. Carteristas en ciudad.', language:'Inglés.', plug:'Tipo A/B/G (110/220V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  SV: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea.', safety:'Mejorando. Zonas turísticas seguras.', language:'Español.', plug:'Tipo A/B (115V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  HN: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea, malaria.', safety:'Consulta MAE. Roatán/islas seguras.', language:'Español.', plug:'Tipo A/B (110V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  NI: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea.', safety:'Consulta avisos MAE (situación política).', language:'Español.', plug:'Tipo A/B (120V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },
  CR: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea recomendadas. Sin malaria. Dengue: DEET.', safety:'Muy seguro. Modelo turístico desarrollado.', language:'Español. Inglés extendido turismo.', plug:'Tipo A/B (120V).', tip:'10% servicio incluido habitualmente; redondear.', water:'Agua del grifo OK en San José y zonas turísticas.', drive:'Derecha.' },
  PA: { visa:'Sin visado UE 90d.', health:'Hepatitis A. Fiebre amarilla si vienes de zona endémica. Sin malaria zona canal.', safety:'Muy seguro en zonas turísticas.', language:'Español. Inglés extendido Ciudad de Panamá.', plug:'Tipo A/B (110V).', tip:'10% restaurantes.', water:'Agua del grifo OK Ciudad de Panamá.', drive:'Derecha.' },
  CU: { visa:'Tarjeta turística obligatoria (~25€).', health:'Sin vacunas. Lleva medicamentos básicos (escasez).', safety:'Muy seguro. Estafa habitual con casas particulares y taxis.', language:'Español. Inglés básico turismo.', plug:'Tipo A/B/C/L (110/220V).', tip:'10% en CUC/USD (lo aprecian más que la moneda local).', water:'Solo embotellada.', drive:'Derecha.' },
  DO: { visa:'Tarjeta turismo on-arrival 10 USD.', health:'Hepatitis A. Dengue/Zika: DEET.', safety:'Resorts seguros. Fuera: precaución.', language:'Español.', plug:'Tipo A/B (110V).', tip:'10% restaurantes (servicio 10% ya incluido habitualmente).', water:'Solo embotellada.', drive:'Derecha. Caótica.' },
  JM: { visa:'Sin visado UE 90d.', health:'Hepatitis A. Dengue: DEET.', safety:'Resorts seguros. Kingston: precaución.', language:'Inglés.', plug:'Tipo A/B (110V).', tip:'10-15% restaurantes.', water:'Agua del grifo OK en zonas turísticas.', drive:'IZQUIERDA.' },
  BS: { visa:'Sin visado UE 90d.', health:'Sin vacunas obligatorias.', safety:'Muy seguro en resorts. Nassau: precaución barrios.', language:'Inglés.', plug:'Tipo A/B (120V).', tip:'15% restaurantes.', water:'Agua del grifo OK.', drive:'IZQUIERDA.' },
  BR: { visa:'Sin visado UE 90d.', health:'FIEBRE AMARILLA si vas a Amazonas/Pantanal. Hepatitis A, tifoidea. Dengue/Zika.', safety:'Carteristas y atracos en playas turísticas. Favelas: solo con tour. No lleves objetos de valor visibles.', language:'Portugués brasileño. Español comprensible.', plug:'Tipo C/N (127/220V según ciudad).', tip:'10% servicio incluido habitualmente.', water:'Embotellada recomendada.', drive:'Derecha. Conducción agresiva.' },
  AR: { visa:'Sin visado UE 90d.', health:'Hepatitis A. Fiebre amarilla si vas a Cataratas Iguazú/Misiones. Mal altura NO en Buenos Aires.', safety:'Seguro en zonas turísticas. Carteristas en Buenos Aires.', language:'Español rioplatense.', plug:'Tipo C/I (220V) — adaptador desde España.', tip:'10% restaurantes (no esperan más).', water:'Agua del grifo OK Buenos Aires; rural embotellada.', drive:'Derecha.' },
  CL: { visa:'Sin visado UE 90d.', health:'Sin vacunas. Fiebre amarilla si vas a Isla de Pascua.', safety:'Muy seguro. Santiago: vigila carteristas.', language:'Español chileno.', plug:'Tipo C/L (220V).', tip:'10% servicio incluido habitualmente.', water:'Agua del grifo OK.', drive:'Derecha.' },
  PE: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea. FIEBRE AMARILLA OBLIGATORIA si vas a selva (Iquitos, Madre de Dios). Mal de altura en Cusco (3400m): aclimatación, hoja de coca.', safety:'Seguro en zonas turísticas. Carteristas en Lima.', language:'Español, quechua.', plug:'Tipo A/B/C (220V).', tip:'10% restaurantes.', water:'Embotellada recomendada.', drive:'Derecha.' },
  BO: { visa:'Sin visado UE 90d.', health:'Fiebre amarilla OBLIGATORIA si vas a selva. Mal altura La Paz (3600m), Uyuni: aclimatación crítica.', safety:'Seguro turísticamente. Conducción peligrosa.', language:'Español, aymara, quechua.', plug:'Tipo A/C (110/220V).', tip:'10% restaurantes nice.', water:'Embotellada.', drive:'Derecha.' },
  EC: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea. Fiebre amarilla si vas a selva. Mal altura Quito (2850m).', safety:'Seguro turísticamente. Carteristas en Quito.', language:'Español, quechua.', plug:'Tipo A/B (110/120V).', tip:'10% servicio incluido habitualmente.', water:'Embotellada.', drive:'Derecha.' },
  CO: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea, fiebre amarilla zonas selva. Dengue.', safety:'Zonas turísticas (Cartagena, Medellín, Bogotá centro, Eje Cafetero) seguras. Consulta MAE para zonas rurales.', language:'Español.', plug:'Tipo A/B (110V).', tip:'10% servicio incluido habitualmente.', water:'Embotellada.', drive:'Derecha.' },
  VE: { visa:'AVISO MAE: precaución alta. Situación inestable.', health:'Limitada disponibilidad medicamentos. Hepatitis A, tifoidea, malaria.', safety:'Consulta MAE actualizado.', language:'Español.', plug:'Tipo A/B (120V).', tip:'10% restaurantes (USD aceptado).', water:'Embotellada.', drive:'Derecha.' },
  UY: { visa:'Sin visado UE 90d.', health:'Sin vacunas obligatorias.', safety:'De los más seguros de América Latina.', language:'Español rioplatense.', plug:'Tipo C/F/I/L (220V).', tip:'10% restaurantes.', water:'Agua del grifo OK.', drive:'Derecha.' },
  PY: { visa:'Sin visado UE 90d.', health:'Hepatitis A, tifoidea. Fiebre amarilla.', safety:'Seguro turísticamente.', language:'Español, guaraní.', plug:'Tipo C (220V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'Derecha.' },

  // ════════════════════════════════════════════════
  // OCEANÍA
  // ════════════════════════════════════════════════
  AU: { visa:'ETA obligatoria online (~20 AUD).', health:'Sin vacunas. Cuidado UV extremo (FPS 50 obligatorio).', safety:'Muy seguro. Atención fauna marina (medusas, tiburones zonas señalizadas) y fauna terrestre (serpientes, arañas).', language:'Inglés.', plug:'Tipo I (230V) — adaptador necesario.', tip:'No obligatoria; 10% si servicio excelente.', water:'Agua del grifo OK.', drive:'IZQUIERDA. Distancias enormes: planifica gasolina.' },
  NZ: { visa:'NZeTA online obligatoria.', health:'Sin vacunas.', safety:'Muy seguro.', language:'Inglés, maorí.', plug:'Tipo I (230V).', tip:'No habitual.', water:'Agua del grifo OK.', drive:'IZQUIERDA. Carreteras montañosas: precaución.' },
  FJ: { visa:'Sin visado UE 4 meses.', health:'Sin vacunas obligatorias. Dengue.', safety:'Muy seguro.', language:'Inglés, fiyiano.', plug:'Tipo I (240V).', tip:'No habitual; 10% si servicio excelente.', water:'Embotellada en aldeas.', drive:'IZQUIERDA.' },
  PG: { visa:'Visado on-arrival 30 USD.', health:'Malaria, hepatitis A/B, tifoidea, encefalitis japonesa.', safety:'Consulta avisos MAE. Resorts seguros.', language:'Inglés, tok pisin.', plug:'Tipo I (240V).', tip:'10% restaurantes.', water:'Embotellada.', drive:'IZQUIERDA.' },
};

// Limpiar placeholders
delete COUNTRY_FACTS.EG_;
delete COUNTRY_FACTS.MA_;
