import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, User, Globe, Moon, Sun, Shield, LogOut, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { COUNTRIES } from '@/lib/countries';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    country_of_origin: '',
    passport_country: '',
    language: 'es',
    theme: 'system',
    profile_visibility: 'public', // 'public' | 'private'
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        display_name: user.display_name || user.full_name || '',
        bio: user.bio || '',
        country_of_origin: user.country_of_origin || '',
        passport_country: user.passport_country || '',
        language: user.language || 'es',
        theme: user.theme || 'system',
        profile_visibility: user.profile_visibility || 'public',
      });
    }
  }, [user]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    // Aplicar tema inmediatamente al guardar
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = form.theme === 'dark' || (form.theme === 'system' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    toast.success('Perfil actualizado');
    setSaving(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Crop cuadrado sin distorsión
      const img = new Image();
      const reader = new FileReader();

      reader.onload = async (event) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

          // Convertir a blob
          canvas.toBlob(async (blob) => {
            const croppedFile = new File([blob], file.name, { type: 'image/jpeg' });
            const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
            await base44.auth.updateMe({ avatar_url: file_url });
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            setUploading(false);
          }, 'image/jpeg', 0.85);
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const initials = (user?.display_name || user?.full_name || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Ajustes</h1>
      </div>

      <div className="max-w-lg mx-auto px-5 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <label className="relative cursor-pointer group">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
          {uploading && <p className="text-xs text-muted-foreground mt-2">Subiendo...</p>}
        </div>

        {/* Profile info */}
        <Section title="Perfil" icon={<User className="w-4 h-4" />}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nombre de usuario</Label>
              <Input value={form.username} onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="mt-1 h-10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Nombre visible</Label>
              <Input value={form.display_name} onChange={(e) => update('display_name', e.target.value)} className="mt-1 h-10 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} className="mt-1 rounded-xl resize-none" rows={2} />
            </div>
          </div>
        </Section>

        <Separator />

        {/* Location */}
        <Section title="Origen" icon={<Globe className="w-4 h-4" />}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">País de origen</Label>
              <Select value={form.country_of_origin} onValueChange={(v) => update('country_of_origin', v)}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">País de pasaporte</Label>
              <Select value={form.passport_country} onValueChange={(v) => update('passport_country', v)}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.emoji} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Idioma</Label>
              <Select value={form.language} onValueChange={(v) => update('language', v)}>
                <SelectTrigger className="mt-1 h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                  <SelectItem value="pt">🇵🇹 Português</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        <Separator />

        {/* Theme */}
        <Section title="Apariencia" icon={<Moon className="w-4 h-4" />}>
          <div className="flex gap-2">
            {['light', 'dark', 'system'].map(theme => (
              <Button
                key={theme}
                variant={form.theme === theme ? 'default' : 'outline'}
                onClick={() => update('theme', theme)}
                className="flex-1 h-10 rounded-xl text-xs"
              >
                {theme === 'light' && <Sun className="w-4 h-4 mr-1" />}
                {theme === 'dark' && <Moon className="w-4 h-4 mr-1" />}
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Oscuro' : 'Sistema'}
              </Button>
            ))}
          </div>
        </Section>

        <Separator />

        {/* Privacy */}
        <Section title="Privacidad" icon={<Shield className="w-4 h-4" />}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => update('profile_visibility', 'public')}
                className={`flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-left ${form.profile_visibility === 'public' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <span className="text-xl">🌍</span>
                <span className="text-xs font-bold text-foreground">Público</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">
                  Tu mapa, itinerarios públicos, fotos y videos son visibles para todos
                </span>
              </button>
              <button
                onClick={() => update('profile_visibility', 'private')}
                className={`flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-left ${form.profile_visibility === 'private' ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
              >
                <span className="text-xl">🔒</span>
                <span className="text-xs font-bold text-foreground">Privado</span>
                <span className="text-[10px] text-muted-foreground leading-tight text-center">
                  Solo se ve tu número de países, seguidores y seguidos
                </span>
              </button>
            </div>
            {form.profile_visibility === 'public' && (
              <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3 text-xs text-green-700 dark:text-green-400">
                ✓ Tu perfil es público — otros usuarios pueden ver tus itinerarios y compartirlos
              </div>
            )}
          </div>
        </Section>

        <Separator />

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Guardar cambios</>
          )}
        </Button>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 rounded-xl text-base font-semibold text-destructive border-destructive/20 hover:bg-destructive/5"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}