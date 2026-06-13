import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users } from 'lucide-react';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const STATUS_LABELS = {
  planning: { label: 'Planificando', class: 'bg-primary/10 text-primary' },
  active: { label: 'En curso', class: 'bg-green-500/10 text-green-600' },
  completed: { label: 'Completado', class: 'bg-muted text-muted-foreground' },
};

const TYPE_LABELS = {
  leisure: 'Ocio', adventure: 'Aventura', work: 'Trabajo',
  family: 'Familiar', romantic: 'Romántico', relaxation: 'Desconexión',
};

export default function TripCard({ trip, onClick, index = 0 }) {
  const status = STATUS_LABELS[trip.status] || STATUS_LABELS.planning;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className="w-full bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 text-left"
    >
      {/* Cover */}
      <div className="h-32 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary relative flex items-center justify-center">
        <span className="text-5xl">{getCountryEmoji(trip.destination_country)}</span>
        <Badge className={`absolute top-3 right-3 ${status.class} border-0 text-[10px] font-semibold`}>
          {status.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-base mb-1 truncate">{trip.title}</h3>
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs">{getCountryName(trip.destination_country)}</span>
          {trip.destination_city && (
            <span className="text-xs">· {trip.destination_city}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {trip.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(trip.start_date), 'dd MMM yyyy')}</span>
            </div>
          )}
          {trip.travelers_count > 1 && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{trip.travelers_count}</span>
            </div>
          )}
          {trip.trip_type && (
            <Badge variant="outline" className="text-[10px] h-5">
              {TYPE_LABELS[trip.trip_type] || trip.trip_type}
            </Badge>
          )}
        </div>
      </div>
    </motion.button>
  );
}