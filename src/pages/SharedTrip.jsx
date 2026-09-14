// Vista de un viaje compartido por enlace (#6). El viaje vive en la tabla
// "shared_trips" (lectura pública, ver src/lib/shareTrip.js) — quien abre el
// enlace ve un snapshot de solo lectura y, si quiere, se guarda SU PROPIA copia
// editable en su planificador (no hay edición colaborativa en tiempo real).
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { fetchSharedTrip } from '@/lib/shareTrip';
import { AIItinerary } from './TripDetail';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';

export default function SharedTrip() {
  const { data: encoded } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['shared-trip', encoded],
    queryFn: () => fetchSharedTrip(encoded),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="text-5xl">🔗💔</div>
        <h2 className="text-lg font-bold text-foreground">{t('Este enlace no es válido')}</h2>
        <p className="text-sm text-muted-foreground max-w-xs">{t('El enlace está incompleto o dañado. Pide a quien te lo envió que lo comparta de nuevo.')}</p>
        <Button onClick={() => navigate('/')} className="rounded-xl mt-2">{t('Ir a Waddle')}</Button>
      </div>
    );
  }

  const canEdit = trip.p === 'edit';

  const saveToMyTrips = async () => {
    setSaving(true);
    try {
      const newTrip = await base44.entities.Trip.create({
        title: trip.title, destination_country: trip.destination_country,
        destination_cities: trip.destination_cities, destination_city: trip.destination_city,
        origin_country: trip.origin_country, start_date: trip.start_date, end_date: trip.end_date,
        duration_days: trip.duration_days, trip_type: trip.trip_type,
        travelers_count: trip.travelers_count, preferences: trip.preferences,
        status: 'planning', ai_itinerary: trip.ai_itinerary,
      });
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      setSaved(true);
      toast.success(t('¡Viaje añadido a tu planificador!'));
      setTimeout(() => navigate(`/trip/${newTrip.id}`), 600);
    } catch {
      toast.error(t('Error al guardar'));
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="absolute top-4 left-4 rounded-full bg-background/70 backdrop-blur h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-6xl">{getCountryEmoji(trip.destination_country)}</span>
      </div>

      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full">
              {t('Viaje compartido')}
            </span>
          </div>
          <h1 className="text-lg font-bold text-foreground mb-1">{trip.title || t('Viaje sin título')}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{getCountryName(trip.destination_country)}{trip.destination_city && ` · ${trip.destination_city}`}</span>
            {trip.duration_days && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{trip.duration_days} {t('días')}</span>}
          </div>
        </div>

        <div className="bg-secondary/50 rounded-xl p-3 mb-4 flex items-start gap-2.5">
          <span className="text-base">{canEdit ? '✏️' : '👀'}</span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {canEdit
              ? t('Quien te envió este enlace te deja editarlo. Al guardarlo se copia a tu planificador — es tu propia copia, no se sincroniza con la suya.')
              : t('Estás viendo este viaje en modo lectura. Guárdalo para tener tu propia copia editable.')}
          </p>
        </div>

        <Button onClick={saveToMyTrips} disabled={saving || saved} className="w-full h-11 rounded-xl mb-5">
          {saved ? <><Check className="w-4 h-4 mr-1.5" />{t('Guardado')}</> : <><Copy className="w-4 h-4 mr-1.5" />{saving ? t('Guardando...') : t('Guardar en mis viajes')}</>}
        </Button>

        <AIItinerary itinerary={trip.ai_itinerary} trip={trip} readOnly />

        <div className="h-10" />
      </div>
    </div>
  );
}
