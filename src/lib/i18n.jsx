// Sistema de idiomas de Waddle (ES/EN).
// - El idioma vive en localStorage ('waddle_lang') para aplicarse al instante
//   y se sincroniza con user.language al guardarlo en Ajustes.
// - useT() devuelve t(clave) → texto en el idioma activo. Si una clave no está
//   traducida, cae al español (nunca se ve una clave "pelada" en pantalla).
import React, { createContext, useContext, useState, useCallback } from 'react';
import { MESSAGES } from './translations';
import { es as dfnsEs, enUS as dfnsEn } from 'date-fns/locale';

const LANG_KEY = 'waddle_lang';

// Locale de date-fns según el idioma activo (para "23 jul" vs "Jul 23").
// Se lee en render: al cambiar de idioma el contexto re-renderiza y se re-evalúa.
export const getDateLocale = () =>
  (localStorage.getItem(LANG_KEY) || 'es') === 'en' ? dfnsEn : dfnsEs;
const LanguageContext = createContext({ lang: 'es', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'es');

  const setLang = useCallback((l) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);

  const t = useCallback((key) => {
    return MESSAGES[lang]?.[key] ?? MESSAGES.es[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useT = () => useContext(LanguageContext);
