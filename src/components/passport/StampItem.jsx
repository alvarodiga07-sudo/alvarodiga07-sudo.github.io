import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getStampDesign, getStampPngUrl } from '@/lib/stampDesigns';
import { format } from 'date-fns';
import { getDateLocale } from '@/lib/i18n';

export default function StampItem({ stamp, onClick, index = 0, durationDays }) {
  const design = getStampDesign(stamp.country_code);
  const pngUrl = getStampPngUrl(stamp.country_code);
  const [imgError, setImgError] = useState(false);
  const showPng = pngUrl && !imgError;

  // Fecha de SALIDA del viaje (día en que empieza) — sin año: el sello ya se
  // agrupa por página/temporada, el año sobra en el espacio reducido del sello.
  const dateLabel = stamp.visit_date
    ? format(new Date(stamp.visit_date), "d 'de' MMMM", { locale: getDateLocale() })
    : null;
  const durationLabel = durationDays
    ? `${durationDays} día${durationDays !== 1 ? 's' : ''}`
    : null;
  // "3 días · 27 de febrero" en una sola línea; si falta un dato, se muestra solo el otro.
  const combinedLabel = [durationLabel, dateLabel].filter(Boolean).join(' · ');

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: (index % 3 - 1) * 3 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05, rotate: 0 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5"
    >
      {showPng ? (
        /* WebP (~50KB) con fallback automático a PNG (~400KB) en navegadores viejos */
        <picture>
          <source srcSet={pngUrl.replace(/\.png$/i, '.webp')} type="image/webp" />
          <img
            src={pngUrl}
            alt={stamp.country_name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full max-w-[150px] aspect-square object-contain drop-shadow-md"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}
          />
        </picture>
      ) : (
        <div
          className={`${design.shape === 'circle' ? 'rounded-full' : 'rounded-xl'} w-full max-w-[140px] aspect-square
            border-4 border-dashed flex flex-col items-center justify-center gap-1 p-3`}
          style={{ borderColor: design.color, backgroundColor: `${design.color}10` }}
        >
          <span className="text-2xl">{design.icon}</span>
          <span className="text-[10px] font-extrabold tracking-wider uppercase" style={{ color: design.color }}>
            {design.label}
          </span>
          <span className="text-[8px] font-medium opacity-70" style={{ color: design.color }}>
            {design.subtitle}
          </span>
        </div>
      )}

      {/* Duración + fecha de salida debajo del sello, en una sola línea */}
      <div className="flex items-center justify-center min-h-[16px] px-1">
        {combinedLabel && (
          <span className="text-[10px] font-bold text-foreground/80 tracking-wide text-center">
            {combinedLabel}
          </span>
        )}
      </div>

      <div
        className="absolute inset-0 rounded-full opacity-10 mix-blend-multiply pointer-events-none"
        style={{ background: `radial-gradient(circle, ${design.color} 0%, transparent 70%)` }}
      />
    </motion.button>
  );
}
