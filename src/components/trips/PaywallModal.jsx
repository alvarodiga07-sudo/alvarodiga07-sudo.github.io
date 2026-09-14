import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, X } from 'lucide-react';
import { toast } from 'sonner';
import { startCheckout } from '@/lib/billing';
import { useT } from '@/lib/i18n';

// Se muestra cuando el usuario ya gastó su viaje gratis del mes y no tiene
// suscripción activa ni créditos. Ofrece pagar solo este viaje o suscribirse.
export default function PaywallModal({ open, onClose }) {
  const { t } = useT();
  const [loadingMode, setLoadingMode] = useState(null);

  const pay = async (mode) => {
    setLoadingMode(mode);
    try {
      await startCheckout(mode);
    } catch (e) {
      console.error(e);
      toast.error(t('No se pudo iniciar el pago. Inténtalo de nuevo.'));
      setLoadingMode(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="w-full sm:max-w-md sm:rounded-3xl bg-background rounded-t-3xl p-5 pb-8 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{t('Ya usaste tu viaje gratis de este mes')}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              {t('Puedes pagar solo este viaje o suscribirte para no volver a pensarlo.')}
            </p>

            <button onClick={() => pay('payment')} disabled={!!loadingMode}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 text-left transition-colors disabled:opacity-60">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('Pagar solo este viaje — 2,99€')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Pago único, sin suscripción')}</p>
              </div>
              {loadingMode === 'payment' && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            </button>

            <button onClick={() => pay('subscription')} disabled={!!loadingMode}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 text-left transition-colors disabled:opacity-60">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t('Waddle Pro — 4,99€/mes')}</p>
                <p className="text-[11px] text-muted-foreground">{t('Viajes ilimitados, cancela cuando quieras')}</p>
              </div>
              {loadingMode === 'subscription' && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
