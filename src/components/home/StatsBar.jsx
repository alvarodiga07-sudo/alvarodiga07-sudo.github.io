import React from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, Percent } from 'lucide-react';
import { TOTAL_COUNTRIES } from '@/lib/countries';

export default function StatsBar({ visitedCount = 0 }) {
  const percentage = ((visitedCount / TOTAL_COUNTRIES) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-5 bg-card rounded-2xl border border-border p-4 shadow-sm"
    >
      <div className="flex items-center justify-center mb-3">
        <h3 className="text-sm font-bold text-foreground tracking-widest uppercase">Progreso Mundial</h3>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold text-foreground">{TOTAL_COUNTRIES}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Países totales</span>
        </div>
        <div className="text-center border-x border-border">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold text-primary">{visitedCount}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Países visitados</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Percent className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold text-foreground">{percentage}</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">% Explorado</span>
        </div>
      </div>
    </motion.div>
  );
}