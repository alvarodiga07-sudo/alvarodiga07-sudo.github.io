import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Trips from './pages/Trips';
import TripWizard from './pages/TripWizard';
import TripDetail from './pages/TripDetail';
import Passport from './pages/Passport';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import AnnualRecap from './pages/AnnualRecap';
import SocialFeed from './pages/SocialFeed';
import PeopleSearch from './pages/PeopleSearch';
import UserProfile from './pages/UserProfile';

// Layout
import AppLayout from './components/layout/AppLayout';
import { LanguageProvider } from './lib/i18n';
import ErrorBoundary from './components/ErrorBoundary';

const LOGO_URL = "/brand/logo.png";

// Hook para aplicar el tema oscuro/claro al <html>
function useThemeApplier() {
  useEffect(() => {
    async function applyTheme() {
      try {
        const user = await base44.auth.me();
        const theme = user?.theme || 'system';
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);
        // Escuchar cambios del sistema si está en modo auto
        if (theme === 'system') {
          const mq = window.matchMedia('(prefers-color-scheme: dark)');
          const handler = e => document.documentElement.classList.toggle('dark', e.matches);
          mq.addEventListener('change', handler);
          return () => mq.removeEventListener('change', handler);
        }
      } catch {}
    }
    applyTheme();
  }, []);
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, needsLogin } = useAuth();
  useThemeApplier();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={LOGO_URL} alt="Waddle" className="w-16 h-16 rounded-2xl animate-pulse-soft" />
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Backend en la nube y sin sesión → mostrar pantalla de login
  if (needsLogin) return <Login />;

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/trip-wizard" element={<TripWizard />} />
      {/* SocialFeed va FUERA del layout para ocupar pantalla completa (estilo TikTok) */}
      <Route path="/social" element={<SocialFeed />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trip/:id" element={<TripDetail />} />
        <Route path="/passport" element={<Passport />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/recap" element={<AnnualRecap />} />
        <Route path="/search" element={<PeopleSearch />} />
        <Route path="/u/:username" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
        <SonnerToaster position="bottom-center" richColors />
    </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
