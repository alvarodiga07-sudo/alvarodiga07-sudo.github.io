import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Download, Key } from 'lucide-react';
import { detectAI } from '@/lib/claudeAI';

export default function AISetupBanner() {
  const navigate = useNavigate();
  const [ai, setAI] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('ai_banner_dismissed') === '1');

  useEffect(() => {
    detectAI().then(setAI);
  }, []);

  if (dismissed || !ai || ai.provider === 'ollama' || ai.provider === 'claude') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="mx-5 mt-3 bg-gradient-to-r from-primary/15 to-accent/10 rounded-2xl border border-primary/20 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">Activa el itinerario con IA</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              La IA genera actividades, restaurantes, vuelos y consejos locales personalizados para tu viaje.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigate('/ai-setup')}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Configurar IA gratis
              </button>
              <button
                onClick={() => { navigate('/settings'); }}
                className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-foreground px-3 py-1.5 rounded-xl hover:bg-secondary/80 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                API Key
              </button>
            </div>
          </div>
          <button
            onClick={() => { sessionStorage.setItem('ai_banner_dismissed', '1'); setDismissed(true); }}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
