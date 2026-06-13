import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { isSupabaseEnabled } from '@/lib/supabaseConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (isSupabaseEnabled) {
      // Modo nube: comprobar sesión y escuchar cambios (login/logout, vuelta de OAuth)
      base44.auth.getSession().then(({ data }) => {
        setSession(data?.session || null);
        setLoading(false);
      });
      const { data: sub } = base44.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession || null);
        setLoading(false);
      });
      return () => sub?.subscription?.unsubscribe?.();
    }
    // Modo demo (localStorage): siempre resuelve al instante
    base44.auth.me().finally(() => setLoading(false));
  }, []);

  const value = {
    isLoadingAuth: loading,
    isLoadingPublicSettings: false,
    authError: null,
    navigateToLogin: () => {},
    session,
    // Solo se exige login cuando hay backend configurado y no hay sesión
    needsLogin: isSupabaseEnabled && !loading && !session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
