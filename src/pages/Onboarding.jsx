import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft, User, Globe, Heart, Check } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const LOGO_URL = "https://media.base44.com/images/public/user_69aea125734ce6b1da596dd5/ce9f50f11_IMG_05283.png";

const INTERESTS = [
  { id: 'beach', label: 'Playa', icon: '🏖️' },
  { id: 'mountain', label: 'Montaña', icon: '🏔️' },
  { id: 'city', label: 'Ciudad', icon: '🏙️' },
  { id: 'culture', label: 'Cultura', icon: '🏛️' },
  { id: 'food', label: 'Gastronomía', icon: '🍽️' },
  { id: 'adventure', label: 'Aventura', icon: '🧗' },
  { id: 'nature', label: 'Naturaleza', icon: '🌿' },
  { id: 'nightlife', label: 'Vida nocturna', icon: '🎶' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'history', label: 'Historia', icon: '📜' },
  { id: 'sport', label: 'Deporte', icon: '⚽' },
  { id: 'wellness', label: 'Bienestar', icon: '🧘' },
];

const STEPS = ['welcome', 'profile', 'origin', 'interests'];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    country_of_origin: '',
    passport_country: '',
    language: 'es',
    theme: 'system',
    travel_interests: [],
  });

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleInterest = (id) => {
    setForm(prev => ({
      ...prev,
      travel_interests: prev.travel_interests.includes(id)
        ? prev.travel_interests.filter(i => i !== id)
        : [...prev.travel_interests, id]
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    const uname = form.username.trim().toLowerCase();

    // #3 — Comprobar que el nombre de usuario no esté cogido por otra persona
    try {
      if (base44.auth.isUsernameTaken) {
        const me = await base44.auth.me().catch(() => null);
        const taken = await base44.auth.isUsernameTaken(uname, me?.id);
        if (taken) {
          setLoading(false);
          toast.error('Ese nombre de usuario ya está cogido. Elige otro.');
          setStep(1); // volver al paso del perfil
          return;
        }
      }
    } catch { /* si la comprobación falla, no bloqueamos el registro */ }

    // Guardar perfil (username normalizado en minúsculas) y marcar onboarding completo
    try {
      await base44.auth.updateMe({
        ...form,
        username: uname,
        onboarding_complete: true,
      });
      // Refetch ANTES de navegar para que onboarding_complete=true esté ya cargado (evita el bucle)
      await queryClient.refetchQueries({ queryKey: ['currentUser'] });
    } catch (e) {
      console.error('Error guardando onboarding:', e);
      setLoading(false);
      toast.error('No se pudo guardar tu perfil. Inténtalo de nuevo.');
      return;
    }

    setLoading(false);
    navigate('/');
  };

  const canNext = () => {
    if (step === 1) return form.username.length >= 3 && form.display_name.length >= 2;
    if (step === 2) return form.country_of_origin && form.passport_country;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      {step > 0 && (
        <div className="px-6 pt-4">
          <div className="flex gap-1.5">
            {STEPS.slice(1).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: i < step ? '100%' : '0%' }}
                  className="h-full bg-primary rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-sm"
            >
              <motion.img
                src={LOGO_URL}
                alt="Waddle"
                className="w-24 h-24 mx-auto mb-6 rounded-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              />
              <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenido a Waddle</h1>
              <p className="text-muted-foreground mb-8">
                Tu compañero de viaje inteligente. Planifica, explora, recuerda y comparte.
              </p>
              <Button
                onClick={() => setStep(1)}
                className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
              >
                Empezar
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm space-y-5"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tu perfil</h2>
                <p className="text-sm text-muted-foreground mt-1">Cuéntanos sobre ti</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nombre de usuario</Label>
                  <Input
                    placeholder="@miusuario"
                    value={form.username}
                    onChange={(e) => updateForm('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Nombre visible</Label>
                  <Input
                    placeholder="Tu nombre"
                    value={form.display_name}
                    onChange={(e) => updateForm('display_name', e.target.value)}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Bio (opcional)</Label>
                  <Textarea
                    placeholder="Cuéntanos algo sobre ti..."
                    value={form.bio}
                    onChange={(e) => updateForm('bio', e.target.value)}
                    className="mt-1.5 rounded-xl resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="origin"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm space-y-5"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tu origen</h2>
                <p className="text-sm text-muted-foreground mt-1">Para personalizar tu experiencia</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">País de origen</Label>
                  <Select value={form.country_of_origin} onValueChange={(v) => updateForm('country_of_origin', v)}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                      <SelectValue placeholder="Selecciona tu país" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.emoji} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">País de pasaporte</Label>
                  <Select value={form.passport_country} onValueChange={(v) => updateForm('passport_country', v)}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                      <SelectValue placeholder="Selecciona tu pasaporte" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.emoji} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Idioma</Label>
                  <Select value={form.language} onValueChange={(v) => updateForm('language', v)}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                      <SelectItem value="pt">🇵🇹 Português</SelectItem>
                      <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-sm space-y-5"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Tus intereses</h2>
                <p className="text-sm text-muted-foreground mt-1">¿Qué te gusta cuando viajas?</p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {INTERESTS.map(interest => {
                  const selected = form.travel_interests.includes(interest.id);
                  return (
                    <motion.button
                      key={interest.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleInterest(interest.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                    >
                      <span className="text-2xl">{interest.icon}</span>
                      <span className="text-xs font-medium">{interest.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      {step > 0 && (
        <div className="p-6 pt-0 flex gap-3 max-w-sm mx-auto w-full">
          <Button
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            className="h-12 rounded-xl px-6"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={step === 3 ? handleFinish : () => setStep(s => s + 1)}
            disabled={!canNext() || loading}
            className="flex-1 h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : step === 3 ? (
              <>Comenzar aventura <ChevronRight className="w-5 h-5 ml-1" /></>
            ) : (
              <>Siguiente <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}