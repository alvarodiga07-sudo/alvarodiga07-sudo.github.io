import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Users, Edit3, Save, Plus, Image,
  Video, Map, FileText, Trash2, Check, Plane, Hotel, ChevronDown,
  ChevronUp, Clock, DollarSign, Info, Utensils, Star, Sparkles, RefreshCw,
  Share2, Eye, PencilLine, Link as LinkIcon, Camera, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { format } from 'date-fns';
import { getDateLocale as __gdl } from '@/lib/i18n';
const es = undefined; // locale ahora dinámico
import TripMap from '@/components/trips/TripMap';
import TripVideoTab from '@/components/trips/TripVideoTab';
import { toast } from 'sonner';
import { generateItinerary, analyzeTicketImage, hasApiKey } from '@/lib/claudeAI';
import { COUNTRIES } from '@/lib/countries';
import { buildSearchLinks } from '@/lib/searchLinks';
import { buildShareUrl } from '@/lib/shareTrip';
import { TRIP_TYPES, BUDGETS, INTERESTS, DIET, Chip } from './TripWizard';
import { useT } from '@/lib/i18n';

const STATUS_LABELS = { planning: 'Planeando', active: 'Activo', completed: 'Completado' };
const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  completed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

// ─── Itinerario IA completo ────────────────────────────────────────────────
// Sección plegable reutilizable: cabecera clicable (color + icono + título + chevron)
// y cuerpo que se despliega/pliega. Colapsada por defecto para no saturar la pantalla.
function CollapsibleSection({ headerBg, icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left ${headerBg} ${open ? 'border-b border-border' : ''}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="text-sm font-bold text-foreground truncate">{title}</span>
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mis billetes ── El usuario guarda su vuelo YA COMPRADO (nº de vuelo, horas,
// localizador). Con las horas reales, ajustar el día 1 y el último del itinerario
// deja de ser un misterio. Se guarda en trip.flight_info.
const EMPTY_FLIGHT_INFO = {
  airline: '', out_flight: '', out_dep: '', out_arr: '',
  ret_flight: '', ret_dep: '', ret_arr: '', booking_ref: '', notes: '',
};

const DT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function TicketInfo({ trip, tripId, queryClient }) {
  const { t } = useT();
  const saved = trip.flight_info || null;
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(saved || EMPTY_FLIGHT_INFO);
  const up = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [scanning, setScanning] = useState(false);
  const [scanWarning, setScanWarning] = useState(null);
  const [scannedFields, setScannedFields] = useState(new Set());
  const fileInputRef = React.useRef(null);

  // Lee la foto del billete con Claude (visión) y precarga SOLO lo que
  // literalmente encuentra escrito — nunca inventa nada. El usuario revisa y
  // corrige en el formulario antes de guardar; no se guarda automáticamente.
  const handleScanTicket = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!hasApiKey()) {
      toast.error(t('Conecta tu clave de Claude en Ajustes para escanear billetes'));
      return;
    }
    setScanning(true);
    setScanWarning(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await analyzeTicketImage(file_url);
      const filled = new Set();
      const next = { ...f };
      const TEXT_FIELDS = ['airline', 'out_flight', 'ret_flight', 'booking_ref', 'notes'];
      const DT_FIELDS = ['out_dep', 'out_arr', 'ret_dep', 'ret_arr'];
      TEXT_FIELDS.forEach(k => {
        if (result[k] && typeof result[k] === 'string' && result[k].trim()) {
          next[k] = result[k].trim();
          filled.add(k);
        }
      });
      DT_FIELDS.forEach(k => {
        if (result[k] && DT_RE.test(result[k])) {
          next[k] = result[k];
          filled.add(k);
        }
      });
      setF(next);
      setScannedFields(filled);
      setEditing(true);
      if (filled.size === 0) {
        setScanWarning(result.warning || t('No he podido leer datos de vuelo en esta imagen. Prueba con una foto más clara del billete.'));
      } else {
        setScanWarning(result.warning || null);
        toast.success(t('Billete leído — revisa los datos antes de guardar'));
      }
    } catch (err) {
      if (err.message === 'NO_API_KEY' || err.message === 'API_KEY_INVALID') {
        toast.error(t('Conecta tu clave de Claude en Ajustes para escanear billetes'));
      } else {
        toast.error(t('No se pudo leer la imagen. Inténtalo de nuevo o rellénalo a mano.'));
      }
    }
    setScanning(false);
  };

  const save = async () => {
    const updates = { flight_info: f };
    // Si hay itinerario y horas reales de llegada/vuelta, reajustamos el día 1
    // y el último día para que sean coherentes con el vuelo real (#3).
    if (trip.ai_itinerary && (f.out_arr || f.ret_dep)) {
      updates.ai_itinerary = adjustItineraryForFlights(trip.ai_itinerary, f);
    }
    await base44.entities.Trip.update(tripId, updates);
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    setEditing(false);
    setScannedFields(new Set());
    setScanWarning(null);
    toast.success(updates.ai_itinerary ? t('Billetes guardados y el plan del día se ha ajustado a tu vuelo') : t('Billetes guardados en el viaje'));
  };

  const fmtDT = (v) => {
    if (!v) return null;
    try { return format(new Date(v), "dd MMM · HH:mm", { locale: __gdl() }); } catch { return v; }
  };

  if (!saved && !editing) {
    return (
      <div className="bg-card border border-dashed border-primary/40 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🎫</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t('¿Ya tienes los billetes?')}</p>
            <p className="text-[11px] text-muted-foreground">{t('Guarda tu vuelo (números, horas) y ajusta el plan del primer y último día.')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanTicket} />
          <Button size="sm" variant="outline" disabled={scanning} onClick={() => fileInputRef.current?.click()} className="flex-1 h-9 rounded-xl text-xs">
            {scanning ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
            {scanning ? t('Leyendo...') : t('Escanear foto')}
          </Button>
          <Button size="sm" onClick={() => { setF(EMPTY_FLIGHT_INFO); setEditing(true); }} className="flex-1 h-9 rounded-xl text-xs">
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />{t('Escribir a mano')}
          </Button>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-border">
          <span className="flex items-center gap-2 text-sm font-bold text-foreground">🎫 {t('Mis billetes')}</span>
          <button onClick={() => { setF(saved); setEditing(true); }} className="text-xs text-primary font-semibold hover:underline">{t('Editar')}</button>
        </div>
        <div className="p-4 space-y-2 text-xs">
          {saved.airline && <p><span className="font-semibold">Aerolínea:</span> {saved.airline}</p>}
          {(saved.out_flight || saved.out_dep) && (
            <p>✈️ <span className="font-semibold">Ida:</span> {saved.out_flight}{saved.out_dep ? ` · sale ${fmtDT(saved.out_dep)}` : ''}{saved.out_arr ? ` · llega ${fmtDT(saved.out_arr)}` : ''}</p>
          )}
          {(saved.ret_flight || saved.ret_dep) && (
            <p>🛬 <span className="font-semibold">Vuelta:</span> {saved.ret_flight}{saved.ret_dep ? ` · sale ${fmtDT(saved.ret_dep)}` : ''}{saved.ret_arr ? ` · llega ${fmtDT(saved.ret_arr)}` : ''}</p>
          )}
          {saved.booking_ref && <p><span className="font-semibold">Localizador:</span> <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">{saved.booking_ref}</span></p>}
          {saved.notes && <p className="text-muted-foreground">{saved.notes}</p>}
          {(saved.out_arr || saved.ret_dep) && trip.ai_itinerary && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              ✅ {t('El itinerario del día 1 y del último día ya está ajustado a estas horas.')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const fieldClass = (key) => `w-full h-9 px-2 text-xs rounded-lg border bg-background ${
    scannedFields.has(key) ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`;

  return (
    <div className="bg-card rounded-2xl border border-primary/40 p-4 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">🎫 {t('Datos de tus billetes')}</p>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanTicket} />
        <button type="button" disabled={scanning} onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline disabled:opacity-50">
          {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {scanning ? t('Leyendo...') : t('Escanear foto')}
        </button>
      </div>

      {scannedFields.size > 0 && !scanWarning && (
        <p className="text-[11px] text-primary bg-primary/10 rounded-lg px-2.5 py-1.5">
          ✅ {t('He rellenado lo que se lee en la foto (marcado en color) — revisa que esté bien antes de guardar.')}
        </p>
      )}
      {scanWarning && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{scanWarning}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground">{t('Aerolínea')}</label>
          <input value={f.airline} onChange={e => up('airline', e.target.value)} placeholder="ej. Iberia"
            className={fieldClass('airline')} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">{t('Nº vuelo ida')}</label>
          <input value={f.out_flight} onChange={e => up('out_flight', e.target.value)} placeholder="IB6801"
            className={fieldClass('out_flight')} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">{t('Nº vuelo vuelta')}</label>
          <input value={f.ret_flight} onChange={e => up('ret_flight', e.target.value)} placeholder="IB6802"
            className={fieldClass('ret_flight')} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">{t('Ida: salida')}</label>
          <input type="datetime-local" value={f.out_dep} onChange={e => up('out_dep', e.target.value)}
            className={fieldClass('out_dep')} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">{t('Ida: llegada')}</label>
          <input type="datetime-local" value={f.out_arr} onChange={e => up('out_arr', e.target.value)}
            className={fieldClass('out_arr')} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">{t('Vuelta: salida')}</label>
          <input type="datetime-local" value={f.ret_dep} onChange={e => up('ret_dep', e.target.value)}
            className={fieldClass('ret_dep')} />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">{t('Vuelta: llegada')}</label>
          <input type="datetime-local" value={f.ret_arr} onChange={e => up('ret_arr', e.target.value)}
            className={fieldClass('ret_arr')} />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground">{t('Localizador / referencia (opcional)')}</label>
          <input value={f.booking_ref} onChange={e => up('booking_ref', e.target.value)} placeholder="ABC123"
            className={fieldClass('booking_ref')} />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] text-muted-foreground">{t('Notas (terminal, asientos, escalas...)')}</label>
          <input value={f.notes} onChange={e => up('notes', e.target.value)} placeholder="T4, asientos 12A-12B"
            className={fieldClass('notes')} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} className="flex-1 h-9 rounded-lg text-xs">
          <Save className="w-3 h-3 mr-1" />{t('Guardar billetes')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setEditing(false); setScannedFields(new Set()); setScanWarning(null); }} className="h-9 rounded-lg text-xs px-3">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Helpers para la cascada de horarios al editar el itinerario (#5) ───
// "1h30" / "2h" / "45min" / "1h-2h" (rango → coge el primer valor) → minutos
function parseDuration(str) {
  if (!str) return 60;
  const s = String(str).trim();
  const h = s.match(/(\d+)\s*h\s*(\d+)?/i);
  if (h) return (Number(h[1]) || 0) * 60 + (Number(h[2]) || 0);
  const min = s.match(/(\d+)\s*min/i);
  if (min) return Number(min[1]) || 0;
  return 60;
}
function parseTime(str) {
  const m = String(str || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
function formatTime(mins) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// Ajusta el día 1 y el último día del itinerario a las horas REALES del vuelo
// (llegas de noche → no puedes hacer el plan de la mañana; sales muy pronto →
// no puedes hacer el de la tarde). Recorta lo inviable y reencadena lo que
// queda para que el día siga siendo coherente (nada de cenar a las 5 de la
// mañana). Guarda el plan original en `_pre_flight_actividades` la primera
// vez, así si luego cambias la hora del vuelo se recalcula siempre desde el
// plan completo — nunca desde una versión ya recortada.
function adjustItineraryForFlights(itinerary, flightInfo) {
  if (!itinerary?.dias?.length) return itinerary;
  const dias = itinerary.dias.map(d => ({ ...d }));

  const timeOfDay = (dt) => {
    if (!dt) return null;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? null : d.getHours() * 60 + d.getMinutes();
  };

  // ── Día 1: recorta lo anterior a "listo para salir" (llegada + ~2h traslado/check-in) ──
  const arrivalMin = timeOfDay(flightInfo?.out_arr);
  if (arrivalMin != null && dias[0]) {
    const day = dias[0];
    const pristine = day._pre_flight_actividades || day.actividades || [];
    const readyMin = Math.min(arrivalMin + 120, 23 * 60 + 30);
    let acts = pristine.filter(a => {
      const h = parseTime(a.hora);
      return h == null || h >= readyMin;
    });
    if (acts.length === 0) {
      acts = [{
        hora: formatTime(readyMin), franja: readyMin >= 20 * 60 ? 'noche' : 'tarde',
        nombre: 'Check-in y descanso', tipo: 'descanso', duracion: '1h',
        descripcion: 'Llegada tardía: hoy toca instalarse y descansar para arrancar fuerte mañana.',
        consejo: 'Busca algo ligero cerca del hotel — sin planes ambiciosos hoy.', coste: 'Gratis',
      }];
    } else {
      let cursor = readyMin;
      acts = acts.map(a => {
        const shifted = { ...a, hora: formatTime(cursor) };
        cursor += parseDuration(a.duracion);
        return shifted;
      });
    }
    dias[0] = { ...day, _pre_flight_actividades: pristine, actividades: acts,
      nota_del_dia: `✈️ Ajustado a tu llegada real (${formatTime(arrivalMin)}): el plan de antes de esa hora no era viable.` };
  }

  // ── Último día: recorta lo posterior a "hora de salir hacia el aeropuerto" ──
  const departureMin = timeOfDay(flightInfo?.ret_dep);
  if (departureMin != null && dias.length) {
    const lastIdx = dias.length - 1;
    const day = dias[lastIdx];
    const pristine = day._pre_flight_actividades || day.actividades || [];
    const mustLeaveMin = Math.max(0, departureMin - 150);
    let acts = pristine.filter(a => {
      const h = parseTime(a.hora);
      return h == null || h < mustLeaveMin;
    });
    if (acts.length === 0) {
      acts = [{
        hora: formatTime(Math.max(0, mustLeaveMin - 30)), franja: 'mañana',
        nombre: 'Desayuno rápido y traslado al aeropuerto', tipo: 'transporte', duracion: '30min',
        descripcion: 'Salida muy temprana: hoy no hay tiempo para plan, solo para llegar bien al vuelo.',
        consejo: 'Deja la maleta lista la noche antes y pide el desayuno para llevar si el hotel lo ofrece.', coste: 'Gratis',
      }];
    }
    dias[lastIdx] = { ...day, _pre_flight_actividades: pristine, actividades: acts,
      nota_del_dia: `✈️ Sales a las ${formatTime(departureMin)} — sal hacia el aeropuerto sobre las ${formatTime(mustLeaveMin)}.` };
  }

  return { ...itinerary, dias };
}

// Exportado (además del default de la página) para que SharedTrip.jsx pueda
// reutilizar exactamente el mismo render del itinerario en modo readOnly.
export function AIItinerary({ itinerary, trip, user, onRegenerate, regenerating, tripId, queryClient, readOnly = false }) {
  const { t } = useT();
  const [openDay, setOpenDay] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEditChoice, setShowEditChoice] = useState(false);
  const [showPrefsEditor, setShowPrefsEditor] = useState(false);
  const links = buildSearchLinks(trip, user);

  const displayData = editMode && editData ? editData : itinerary;

  const startEdit = () => {
    setEditData(JSON.parse(JSON.stringify(itinerary)));
    setEditMode(true);
  };
  const cancelEdit = () => { setEditData(null); setEditMode(false); };
  const saveEdit = async () => {
    setSaving(true);
    try {
      await base44.entities.Trip.update(tripId, { ai_itinerary: editData });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      setEditMode(false);
      setEditData(null);
      toast.success(t('Itinerario actualizado'));
    } catch { toast.error('Error al guardar'); }
    setSaving(false);
  };
  const updateActivity = (dayIdx, actIdx, field, value) => {
    setEditData(prev => ({
      ...prev, dias: prev.dias.map((d, di) => {
        if (di !== dayIdx) return d;
        let acts = d.actividades.map((a, ai) => ai !== actIdx ? a : { ...a, [field]: value });
        // Al cambiar la hora O la duración de una actividad, las siguientes del
        // día se reencadenan a partir de ahí (hora + duración = inicio de la
        // siguiente) — antes se quedaban con su hora vieja y el día dejaba de
        // tener sentido (dos actividades a la vez, huecos raros...).
        if (field === 'hora' || field === 'duracion') {
          const startMin = parseTime(acts[actIdx].hora);
          if (startMin != null) {
            let cursor = startMin + parseDuration(acts[actIdx].duracion);
            acts = acts.map((a, ai) => {
              if (ai <= actIdx) return a;
              const shifted = { ...a, hora: formatTime(cursor) };
              cursor += parseDuration(a.duracion);
              return shifted;
            });
          }
        }
        return { ...d, actividades: acts };
      })
    }));
  };
  const deleteActivity = (dayIdx, actIdx) => {
    setEditData(prev => ({
      ...prev, dias: prev.dias.map((d, di) => di !== dayIdx ? d : {
        ...d, actividades: d.actividades.filter((_, ai) => ai !== actIdx)
      })
    }));
  };
  const moveActivity = (dayIdx, actIdx, dir) => {
    setEditData(prev => ({
      ...prev, dias: prev.dias.map((d, di) => {
        if (di !== dayIdx) return d;
        const acts = [...d.actividades];
        const t2 = actIdx + dir;
        if (t2 < 0 || t2 >= acts.length) return d;
        [acts[actIdx], acts[t2]] = [acts[t2], acts[actIdx]];
        return { ...d, actividades: acts };
      })
    }));
  };
  const addActivity = (dayIdx) => {
    setEditData(prev => ({
      ...prev, dias: prev.dias.map((d, di) => di !== dayIdx ? d : {
        ...d, actividades: [...d.actividades, { hora: '12:00', nombre: t('Nueva actividad'), tipo: 'visita', duracion: '1h', descripcion: '', coste: '' }]
      })
    }));
  };
  const updateDay = (dayIdx, field, value) => {
    setEditData(prev => ({
      ...prev, dias: prev.dias.map((d, di) => di !== dayIdx ? d : { ...d, [field]: value })
    }));
  };

  if (!itinerary) return (
    <div className="bg-card rounded-2xl border border-dashed border-primary/30 p-8 text-center">
      <Sparkles className="w-10 h-10 text-primary/40 mx-auto mb-3" />
      <p className="text-sm font-semibold text-foreground mb-1">{t('Sin itinerario IA todavía')}</p>
      <p className="text-xs text-muted-foreground mb-4">Genera uno con un clic — incluye actividades, restaurantes, vuelos y hoteles</p>
      <Button onClick={onRegenerate} disabled={regenerating} className="rounded-xl h-9 text-xs">
        {regenerating ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generando...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />{t('Generar itinerario con IA')}</>}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Botones editar / guardar / regenerar — ocultos en vista de enlace compartido (readOnly) */}
      {!readOnly && <div className="flex items-center justify-between gap-2">
        {editMode ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
              <Edit3 className="w-3.5 h-3.5" />{t('Modo edición')}
            </div>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 rounded-xl text-xs">{t('Cancelar')}</Button>
            <Button size="sm" onClick={saveEdit} disabled={saving} className="h-8 rounded-xl text-xs">
              {saving ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              {t('Guardar')}
            </Button>
          </div>
        ) : (
          <>
            <div />
            <div className="flex gap-2">
              <Button onClick={() => setShowEditChoice(true)} variant="outline" size="sm" className="h-8 rounded-xl text-xs">
                <Edit3 className="w-3 h-3 mr-1" />{t('Editar')}
              </Button>
              <Button onClick={onRegenerate} disabled={regenerating} variant="outline" size="sm" className="h-8 rounded-xl text-xs">
                {regenerating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                {t('Regenerar')}
              </Button>
            </div>
          </>
        )}
      </div>}

      {/* Resumen */}
      {itinerary.resumen && (
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-4">
          <p className="text-sm font-medium text-foreground leading-relaxed">{itinerary.resumen}</p>
        </div>
      )}

      {/* Precio total destacado — por persona y grupo (#10) */}
      {(itinerary.precio_total_persona || itinerary.precio_total_grupo) && (
        <div className="bg-foreground text-background rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">{t('Coste estimado del viaje')}</p>
          <div className="flex items-end justify-between gap-3 flex-wrap">
            {itinerary.precio_total_persona && (
              <div>
                <p className="text-[10px] opacity-60">{t('Por persona')}</p>
                <p className="text-lg font-bold">{itinerary.precio_total_persona}</p>
              </div>
            )}
            {itinerary.precio_total_grupo && (
              <div className="text-right">
                <p className="text-[10px] opacity-60">{t('Total grupo')}</p>
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
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{t('Presupuesto est.')}</p>
            <p className="text-xs font-bold text-foreground">{itinerary.presupuesto_estimado}</p>
          </div>
        )}
        {itinerary.clima_temporada && (
          <div className="bg-card rounded-xl border border-border p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{t('Clima')}</p>
            <p className="text-xs font-bold text-foreground">{itinerary.clima_temporada}</p>
          </div>
        )}
        {itinerary.mejor_epoca && (
          <div className="bg-card rounded-xl border border-border p-3 col-span-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{t('Mejor época para ir')}</p>
            <p className="text-xs text-foreground">{itinerary.mejor_epoca}</p>
          </div>
        )}
      </div>

      {/* Desglose de presupuesto */}
      {itinerary.desglose_presupuesto && (
        <CollapsibleSection
          headerBg="bg-green-50 dark:bg-green-900/20"
          icon={<DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />}
          title={t('Desglose del presupuesto')}
        >
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
        </CollapsibleSection>
      )}

      {/* Vuelos */}
      {itinerary.vuelos && (
        <CollapsibleSection
          headerBg="bg-blue-50 dark:bg-blue-900/20"
          icon={<Plane className="w-4 h-4 text-blue-600 flex-shrink-0" />}
          title={t('Vuelos')}
        >
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {links?.vuelos.aviasales && (
                <a href={links.vuelos.aviasales} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Plane className="w-3 h-3" /> Aviasales →
                </a>
              )}
              {(links?.vuelos.skyscanner || itinerary.vuelos.url_busqueda) && (
                <a href={links?.vuelos.skyscanner || itinerary.vuelos.url_busqueda} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Plane className="w-3 h-3" /> Skyscanner →
                </a>
              )}
              {(links?.vuelos.kiwi || itinerary.vuelos.url_busqueda_kiwi) && (
                <a href={links?.vuelos.kiwi || itinerary.vuelos.url_busqueda_kiwi} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Plane className="w-3 h-3" /> Kiwi.com →
                </a>
              )}
              {(links?.vuelos.google || itinerary.vuelos.url_busqueda_google) && (
                <a href={links?.vuelos.google || itinerary.vuelos.url_busqueda_google} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Plane className="w-3 h-3" /> Google Flights →
                </a>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Hoteles */}
      {itinerary.hoteles && (
        <CollapsibleSection
          headerBg="bg-amber-50 dark:bg-amber-900/20"
          icon={<Hotel className="w-4 h-4 text-amber-600 flex-shrink-0" />}
          title={t('Alojamiento')}
        >
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {(links?.hoteles.booking || itinerary.hoteles.url_busqueda) && (
                <a href={links?.hoteles.booking || itinerary.hoteles.url_busqueda} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Hotel className="w-3 h-3" /> Booking.com →
                </a>
              )}
              {(links?.hoteles.airbnb || itinerary.hoteles.url_busqueda_airbnb) && (
                <a href={links?.hoteles.airbnb || itinerary.hoteles.url_busqueda_airbnb} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Hotel className="w-3 h-3" /> Airbnb →
                </a>
              )}
              {(links?.hoteles.expedia || itinerary.hoteles.url_busqueda_expedia) && (
                <a href={links?.hoteles.expedia || itinerary.hoteles.url_busqueda_expedia} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Hotel className="w-3 h-3" /> Expedia →
                </a>
              )}
              {(links?.hoteles.hotelscom || itinerary.hoteles.url_busqueda_hotelscom) && (
                <a href={links?.hoteles.hotelscom || itinerary.hoteles.url_busqueda_hotelscom} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
                  <Hotel className="w-3 h-3" /> Hotels.com →
                </a>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Extras (Bloque B): coches, eSIM, actividades, traslados, tren/bus, seguro.
          Se calculan al vuelo (links.extras) para que también aparezcan en viajes
          creados antes de esta función. */}
      {(links?.extras || itinerary.extras) && (
        <CollapsibleSection
          headerBg="bg-secondary"
          icon={<span className="text-base">🧰</span>}
          title={t('Completa tu viaje')}
        >
          <div className="p-4 space-y-2.5">
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">
              {t('Todo lo demás que puedes necesitar. Los marcados con ✨ se abren ya con tu destino puesto.')}
            </p>
            {[
              { key: 'actividades', icon: '🎟️', titulo: t('Actividades y tours') },
              { key: 'esim', icon: '📱', titulo: t('eSIM / datos móviles') },
              { key: 'coches', icon: '🚗', titulo: t('Alquiler de coche') },
              { key: 'traslados', icon: '🚕', titulo: t('Traslado del aeropuerto') },
              { key: 'transporte', icon: '🚆', titulo: t('Tren / bus entre ciudades') },
              { key: 'seguro', icon: '🛡️', titulo: t('Seguro de viaje') },
            ].filter(row => (links?.extras || itinerary.extras)[row.key]).map(row => {
              const ex = (links?.extras || itinerary.extras)[row.key];
              return (
                <a key={row.key} href={ex.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-primary/50 transition-all">
                  <span className="text-xl flex-shrink-0">{row.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">{row.titulo}</p>
                      {ex.prellenado && <span className="text-[10px]" title="Se abre con tu destino ya puesto">✨</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{ex.desc}</p>
                    {ex.marca && <p className="text-[10px] text-primary font-medium mt-0.5">vía {ex.marca}</p>}
                  </div>
                  <span className="text-muted-foreground flex-shrink-0 text-xs">→</span>
                </a>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Consejos de ahorro */}
      {itinerary.consejos_ahorro?.length > 0 && (
        <CollapsibleSection
          headerBg="bg-green-50 dark:bg-green-900/20"
          icon={<span className="text-base">💡</span>}
          title={t('Consejos de ahorro')}
        >
          <div className="p-4">
            {itinerary.consejos_ahorro.map((c, i) => (
              <p key={i} className="text-xs text-foreground flex items-start gap-1.5 mb-1.5 last:mb-0">
                <span className="text-green-600">•</span>{c}
              </p>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Días del itinerario */}
      {displayData?.dias?.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">📅 {t('Itinerario día a día')}</h3>
          <div className="space-y-3">
            {displayData.dias.map((dia, idx) => (
              <div key={idx} className={`bg-card rounded-2xl border overflow-hidden ${editMode ? 'border-primary/30' : 'border-border'}`}>
                <button
                  onClick={() => setOpenDay(openDay === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${editMode ? 'bg-primary/20' : 'bg-primary/10'}`}>
                      <span className="text-xs font-bold text-primary">{dia.dia}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {editMode ? (
                        <input value={dia.titulo || ''} onClick={e => e.stopPropagation()}
                          onChange={e => updateDay(idx, 'titulo', e.target.value)}
                          className="text-sm font-semibold text-foreground bg-transparent border-b border-primary/30 focus:border-primary outline-none w-full" />
                      ) : (
                        <p className="text-sm font-semibold text-foreground truncate">{dia.titulo}</p>
                      )}
                      {dia.descripcion_dia && !editMode && <p className="text-xs text-muted-foreground truncate">{dia.descripcion_dia}</p>}
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
                        {(dia.actividades?.length > 0 || editMode) && (
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Plan del día</p>
                            <div className="space-y-2">
                              {(dia.actividades || []).map((act, ai) => {
                                if (editMode) {
                                  return (
                                    <div key={ai} className="flex gap-2 bg-secondary/40 rounded-xl p-3 border border-border">
                                      <div className="flex flex-col items-center gap-1">
                                        <input value={act.hora || ''} onChange={e => updateActivity(idx, ai, 'hora', e.target.value)}
                                          className="w-14 h-7 text-[10px] font-mono text-center rounded-lg border border-border bg-background focus:border-primary outline-none" />
                                        <button onClick={() => moveActivity(idx, ai, -1)} disabled={ai === 0}
                                          className="w-6 h-5 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-20 rounded">
                                          <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => moveActivity(idx, ai, 1)} disabled={ai === (dia.actividades || []).length - 1}
                                          className="w-6 h-5 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-20 rounded">
                                          <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <div className="flex-1 space-y-1.5 min-w-0">
                                        <input value={act.nombre || ''} onChange={e => updateActivity(idx, ai, 'nombre', e.target.value)}
                                          className="w-full h-7 px-2 text-xs font-semibold rounded-lg border border-border bg-background focus:border-primary outline-none" placeholder={t('Nombre')} />
                                        <input value={act.descripcion || ''} onChange={e => updateActivity(idx, ai, 'descripcion', e.target.value)}
                                          className="w-full h-7 px-2 text-[11px] rounded-lg border border-border bg-background focus:border-primary outline-none" placeholder={t('Descripción')} />
                                        <div className="flex gap-1.5">
                                          <input value={act.duracion || ''} onChange={e => updateActivity(idx, ai, 'duracion', e.target.value)}
                                            className="w-16 h-6 px-1.5 text-[10px] rounded-lg border border-border bg-background focus:border-primary outline-none" placeholder="2h" />
                                          <input value={act.coste || ''} onChange={e => updateActivity(idx, ai, 'coste', e.target.value)}
                                            className="w-20 h-6 px-1.5 text-[10px] rounded-lg border border-border bg-background focus:border-primary outline-none" placeholder="~10€" />
                                        </div>
                                      </div>
                                      <button onClick={() => deleteActivity(idx, ai)}
                                        className="self-start p-1.5 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                }
                                const franjaColors = {
                                  'mañana': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
                                  'mediodía': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
                                  'tarde': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                                  'atardecer': 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
                                  'noche': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
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
                            {editMode && (
                              <button onClick={() => addActivity(idx)}
                                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 text-xs text-primary font-medium border border-dashed border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                                <Plus className="w-3.5 h-3.5" />{t('Añadir actividad')}
                              </button>
                            )}
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

      <EditChoiceSheet
        open={showEditChoice}
        onClose={() => setShowEditChoice(false)}
        onEditItinerary={() => { setShowEditChoice(false); startEdit(); }}
        onEditPreferences={() => { setShowEditChoice(false); setShowPrefsEditor(true); }}
      />
      <EditPreferencesSheet
        open={showPrefsEditor}
        trip={trip}
        tripId={tripId}
        queryClient={queryClient}
        onClose={() => setShowPrefsEditor(false)}
      />
    </div>
  );
}

// ─── Elegir QUÉ editar: el itinerario en sí, o las preferencias/encuesta del viaje ──
function EditChoiceSheet({ open, onClose, onEditItinerary, onEditPreferences }) {
  const { t } = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="w-full bg-background rounded-t-3xl p-5 pb-8 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-foreground mb-1">{t('¿Qué quieres editar?')}</h3>
            <button onClick={onEditItinerary}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 text-left transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><Edit3 className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('El itinerario')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Cambia horas, actividades, restaurantes... día a día')}</p>
              </div>
            </button>
            <button onClick={onEditPreferences}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 text-left transition-colors">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><Sparkles className="w-4 h-4 text-foreground" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('Las preferencias del viaje')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Tipo, presupuesto, intereses, dieta... y regenera si quieres')}</p>
              </div>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Editar las respuestas del "cuestionario" (preferencias) sin repetir el wizard ──
function EditPreferencesSheet({ open, trip, tripId, queryClient, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reinicia el formulario cada vez que se abre, con los datos actuales del viaje
  React.useEffect(() => {
    if (open && trip) {
      setForm({
        trip_type: trip.trip_type || '',
        duration_days: trip.duration_days || 7,
        budget_type: trip.preferences?.budget_type || 'mid',
        interests: trip.preferences?.interests || [],
        diet: trip.preferences?.diet || [],
      });
    }
  }, [open, trip]);

  if (!open || !form) return null;

  const toggle = (key, id) => setForm(f => ({
    ...f, [key]: f[key].includes(id) ? f[key].filter(x => x !== id) : [...f[key], id],
  }));

  const buildUpdates = () => ({
    trip_type: form.trip_type,
    duration_days: Number(form.duration_days),
    preferences: { ...trip.preferences, budget_type: form.budget_type, interests: form.interests, diet: form.diet },
  });

  const save = async (regenerate) => {
    setSaving(true);
    try {
      const updates = buildUpdates();
      await base44.entities.Trip.update(tripId, updates);
      // El viaje actualizado en memoria (no el `trip` de props, que puede
      // quedarse un tick desfasado) — evita regenerar con las preferencias
      // VIEJAS si "Guardar y regenerar" se pulsa justo después de guardar.
      const freshTrip = { ...trip, ...updates };
      onClose();
      if (regenerate) {
        const countryData = COUNTRIES.find(c => c.code === freshTrip.destination_country);
        const originData = COUNTRIES.find(c => c.code === freshTrip.origin_country);
        toast.success(t('Regenerando itinerario con las nuevas preferencias...'));
        const ai = await generateItinerary({
          ...freshTrip,
          destination_country: countryData?.name || freshTrip.destination_country,
          origin_country: originData?.name || freshTrip.origin_country,
        }, () => {});
        if (ai) await base44.entities.Trip.update(tripId, { ai_itinerary: ai });
        toast.success(t('¡Itinerario regenerado!'));
      } else {
        toast.success(t('Preferencias actualizadas'));
      }
      await queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    } catch {
      toast.error(t('Error al guardar'));
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30 }}
          className="w-full bg-background rounded-t-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-bold text-foreground">{t('Preferencias del viaje')}</h3>
            <button onClick={onClose} className="text-muted-foreground text-xl leading-none">×</button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">{t('Tipo de viaje')}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {TRIP_TYPES.map(ty => (
                  <button key={ty.id} onClick={() => setForm(f => ({ ...f, trip_type: ty.id }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${form.trip_type === ty.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                    <span className="text-lg">{ty.icon}</span>
                    <span className="text-[9px] font-semibold text-center leading-tight">{t(ty.label)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">{t('Presupuesto')}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {BUDGETS.map(b => (
                  <button key={b.id} onClick={() => setForm(f => ({ ...f, budget_type: b.id }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 ${form.budget_type === b.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
                    <span className="text-lg">{b.icon}</span>
                    <span className="text-[9px] font-semibold text-center leading-tight">{t(b.label)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">{t('Duración')}</p>
              <div className="flex items-center gap-4 bg-secondary/50 rounded-xl p-2.5">
                <button onClick={() => setForm(f => ({ ...f, duration_days: Math.max(1, Number(f.duration_days) - 1) }))}
                  className="w-8 h-8 rounded-full bg-background border border-border text-base font-bold flex items-center justify-center">−</button>
                <span className="flex-1 text-center text-lg font-bold">{form.duration_days} <span className="text-xs font-normal text-muted-foreground">{t('días')}</span></span>
                <button onClick={() => setForm(f => ({ ...f, duration_days: Number(f.duration_days) + 1 }))}
                  className="w-8 h-8 rounded-full bg-background border border-border text-base font-bold flex items-center justify-center">+</button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">{t('¿Qué te gusta hacer?')}</p>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map(i => <Chip key={i.id} {...i} selected={form.interests.includes(i.id)} onClick={() => toggle('interests', i.id)} />)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">{t('Restricciones dietéticas y alergias')}</p>
              <div className="flex flex-wrap gap-1.5">
                {DIET.map(d => <Chip key={d.id} {...d} selected={form.diet.includes(d.id)} onClick={() => toggle('diet', d.id)} />)}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-border flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => save(false)} disabled={saving} className="flex-1 h-10 rounded-xl text-xs">
              {t('Guardar')}
            </Button>
            <Button onClick={() => save(true)} disabled={saving} className="flex-1 h-10 rounded-xl text-xs">
              {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
              {t('Guardar y regenerar')}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Tracker de gastos ──────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  { key: 'food', label: 'Comida', icon: '🍽️', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { key: 'transport', label: 'Transporte', icon: '🚌', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { key: 'accommodation', label: 'Alojamiento', icon: '🏨', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { key: 'activities', label: 'Actividades', icon: '🎟️', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { key: 'shopping', label: 'Compras', icon: '🛍️', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' },
  { key: 'other', label: 'Otros', icon: '📦', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300' },
];

function ExpenseTracker({ trip, tripId, queryClient }) {
  const { t } = useT();
  const expenses = trip.expenses || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', category: 'food', description: '', date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.key).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    count: expenses.filter(e => e.category === cat.key).length,
  })).filter(c => c.count > 0);

  const budget = trip.ai_itinerary?.presupuesto_estimado;

  const addExpense = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    const newExpense = { ...form, amount: Number(form.amount), id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };
    try {
      await base44.entities.Trip.update(tripId, { expenses: [...expenses, newExpense] });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      setForm({ amount: '', category: 'food', description: '', date: new Date().toISOString().slice(0, 10) });
      setShowForm(false);
      toast.success(t('Gasto añadido'));
    } catch { toast.error('Error'); }
    setSaving(false);
  };

  const deleteExpense = async (id) => {
    try {
      await base44.entities.Trip.update(tripId, { expenses: expenses.filter(e => e.id !== id) });
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    } catch { toast.error('Error'); }
  };

  const getCat = (key) => EXPENSE_CATEGORIES.find(c => c.key === key) || EXPENSE_CATEGORIES[5];

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-primary/20 p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{t('Total gastado')}</p>
        <p className="text-2xl font-bold text-foreground">{total.toFixed(2)}€</p>
        {budget && <p className="text-xs text-muted-foreground mt-1">{t('Presupuesto estimado')}: {budget}</p>}
      </div>

      {/* Desglose por categoría */}
      {byCategory.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {byCategory.map(cat => (
            <div key={cat.key} className={`rounded-xl px-3 py-2 ${cat.color}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-xs font-semibold">{t(cat.label)}</span>
              </div>
              <p className="text-sm font-bold mt-0.5">{cat.total.toFixed(2)}€</p>
              <p className="text-[10px] opacity-70">{cat.count} {cat.count === 1 ? t('gasto') : t('gastos')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Botón añadir */}
      <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'default'} className="w-full rounded-xl h-9 text-xs">
        <Plus className="w-3.5 h-3.5 mr-1" />{showForm ? t('Cancelar') : t('Añadir gasto')}
      </Button>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('Cantidad')} (€)</label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00" className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('Fecha')}</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('Categoría')}</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.key} onClick={() => setForm(f => ({ ...f, category: cat.key }))}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${form.category === cat.key
                        ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      {cat.icon} {t(cat.label)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t('Descripción')}</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('ej. Cena en restaurante...')}
                  className="w-full mt-1 h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <Button onClick={addExpense} disabled={saving || !form.amount} className="w-full rounded-xl h-9 text-xs">
                {saving ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
                {t('Guardar gasto')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de gastos */}
      {expenses.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('Historial')}</h3>
          {[...expenses].reverse().map(exp => {
            const cat = getCat(exp.category);
            return (
              <div key={exp.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{exp.description || t(cat.label)}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.date}</p>
                </div>
                <p className="text-sm font-bold text-foreground whitespace-nowrap">{Number(exp.amount).toFixed(2)}€</p>
                <button onClick={() => deleteExpense(exp.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : !showForm && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground mb-1">{t('Sin gastos registrados')}</p>
          <p className="text-xs text-muted-foreground">{t('Añade tus gastos para controlar el presupuesto')}</p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
// ─── Hoja de compartir (#6) — sin backend: el enlace lleva el viaje dentro ───
function ShareSheet({ trip, onClose }) {
  const { t } = useT();
  const share = async (permission) => {
    try {
      const url = await buildShareUrl(trip, permission);
      if (navigator.share) {
        await navigator.share({ title: trip.title || t('Mi viaje en Waddle'), url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t('Enlace copiado'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('No se pudo generar el enlace'));
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {trip && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={onClose}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="w-full bg-background rounded-t-3xl p-5 pb-8 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{t('Compartir viaje')}</h3>
            </div>
            <p className="text-xs text-muted-foreground -mt-1 mb-2">
              {t('El enlace lleva el viaje dentro. Quien lo abra puede verlo o guardarse su propia copia — no es edición compartida en tiempo real.')}
            </p>
            <button onClick={() => share('view')}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 text-left transition-colors">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><Eye className="w-4 h-4 text-foreground" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('Solo ver')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Puede consultar el itinerario, no editar')}</p>
              </div>
            </button>
            <button onClick={() => share('edit')}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 text-left transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><PencilLine className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('Ver y editar')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Se lo guarda como su copia y la edita libremente')}</p>
              </div>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TripDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();
  const { id: tripId } = useParams();   // funciona con HashRouter (el id NO está en pathname)
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmCount, setDeleteConfirmCount] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [dateForm, setDateForm] = useState({ start_date:'', end_date:'' });
  const [showShareSheet, setShowShareSheet] = useState(false);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => { const trips = await base44.entities.Trip.filter({ id: tripId }); return trips[0]; },
    enabled: !!tripId,
  });

  // Necesario como fallback de origin_country: algunos viajes (sobre todo
  // "Destino sorpresa" o antiguos) nunca guardaron el país de salida, y sin
  // él los enlaces de vuelo (Aviasales/Skyscanner/Kiwi) no pueden prellenar
  // fecha+origen+destino+pasajeros y caen todos al enlace genérico sin datos.
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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
    // Asegurar que existe el sello del pasaporte para este viaje (viajes antiguos
    // o creados por otras vías pueden no tenerlo — sin sello, el pasaporte no lo muestra).
    try {
      const existing = await base44.entities.PassportStamp.filter({ trip_id: tripId });
      const countryData = COUNTRIES.find(c => c.code === trip?.destination_country);
      const validStamp = existing?.find(s => s.country_code === trip?.destination_country);
      if (!validStamp && countryData) {
        // Corrige sellos rotos (p. ej. viajes "Destino sorpresa" creados con un
        // bug que guardaba country_code vacío) además de crear el que falte.
        for (const bad of existing || []) {
          await base44.entities.PassportStamp.delete(bad.id);
        }
        await base44.entities.PassportStamp.create({
          country_code: trip.destination_country,
          country_name: countryData.name,
          trip_id: tripId,
          visit_date: trip.start_date || new Date().toISOString().split('T')[0],
        });
      }
    } catch (e) {
      console.warn('No se pudo asegurar el sello del pasaporte:', e);
    }
    // Mantener countries_visited en sincronía (lo usan Perfil, Recap y el contador)
    try {
      const me = await base44.auth.me();
      const visited = me?.countries_visited || [];
      if (trip?.destination_country && !visited.includes(trip.destination_country)) {
        await base44.auth.updateMe({ countries_visited: [...visited, trip.destination_country] });
      }
    } catch (e) {
      console.warn('No se pudo actualizar countries_visited:', e);
    }
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    queryClient.invalidateQueries({ queryKey: ['stamps'] });
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    toast.success(t('Viaje completado — sello añadido al pasaporte'));
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
          <Button variant="ghost" size="icon" onClick={() => setShowShareSheet(true)} title={t('Compartir viaje')}
            className="bg-card/60 backdrop-blur rounded-full h-9 w-9">
            <Share2 className="w-4 h-4" />
          </Button>
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
            {trip.status && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[trip.status] || STATUS_COLORS.planning}`}>{t(STATUS_LABELS[trip.status])}</span>}
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
            <TabsTrigger value="notes" className="flex-1 text-xs gap-1"><FileText className="w-3 h-3" />{t('Notas')}</TabsTrigger>
            <TabsTrigger value="photos" className="flex-1 text-xs gap-1"><Image className="w-3 h-3" />{t('Fotos')}</TabsTrigger>
            <TabsTrigger value="map" className="flex-1 text-xs gap-1"><Map className="w-3 h-3" />{t('Mapa')}</TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 text-xs gap-1"><Video className="w-3 h-3" />{t('Video')}</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1 text-xs gap-1"><DollarSign className="w-3 h-3" />{t('Gastos')}</TabsTrigger>
          </TabsList>

          {/* ── Itinerario IA ── */}
          <TabsContent value="itinerary" className="mt-4">
            {regenerating && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-4 py-3 mb-4">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs font-medium text-primary">{t('Generando itinerario con IA...')}</span>
              </div>
            )}
            <TicketInfo trip={trip} tripId={tripId} queryClient={queryClient} />
            <AIItinerary
              itinerary={trip.ai_itinerary}
              trip={trip}
              user={currentUser}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
              tripId={tripId}
              queryClient={queryClient}
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

          {/* ── Gastos ── */}
          <TabsContent value="expenses" className="mt-4">
            <ExpenseTracker trip={trip} tripId={tripId} queryClient={queryClient} />
          </TabsContent>
        </Tabs>
      </div>

      <ShareSheet trip={showShareSheet ? trip : null} onClose={() => setShowShareSheet(false)} />
    </div>
  );
}
