import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, MapPin, Camera, Edit2, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getCountryEmoji, getCountryName } from '@/lib/countries';

export default function ProfileHeader({ user, followersCount = 0, followingCount = 0 }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ display_name: user?.display_name || user?.full_name || '', bio: user?.bio || '' });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Crear crop cuadrado sin distorsión
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
            toast.success('Foto actualizada');
            setUploading(false);
          }, 'image/jpeg', 0.85);
        };
        img.src = event.target?.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error('Error al subir foto');
      setUploading(false);
    }
  };

  const handleSaveEdits = async () => {
    await base44.auth.updateMe(form);
    queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    toast.success('Perfil actualizado');
    setEditMode(false);
  };
  const initials = (user?.display_name || user?.full_name || 'U').slice(0, 2).toUpperCase();
  const visitedCount = user?.countries_visited?.length || 0;

  return (
    <div className="px-5 pt-5">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground">@{user?.username || 'usuario'}</h2>
        {!editMode && (
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Avatar and stats */}
      <div className="flex items-center gap-5">
        <label className="relative cursor-pointer group">
          <Avatar className="w-20 h-20 border-4 border-primary/20">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
        </label>

        <div className="flex-1 grid grid-cols-3 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{visitedCount}</p>
            <p className="text-[10px] text-muted-foreground">Países</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{followersCount}</p>
            <p className="text-[10px] text-muted-foreground">Seguidores</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{followingCount}</p>
            <p className="text-[10px] text-muted-foreground">Siguiendo</p>
          </div>
        </div>
      </div>

      {/* Name and bio */}
      <div className="mt-4">
        {editMode ? (
          <div className="space-y-3">
            <Input
              placeholder="Nombre"
              value={form.display_name}
              onChange={(e) => setForm(p => ({ ...p, display_name: e.target.value }))}
              className="h-10 rounded-xl text-sm"
            />
            <Textarea
              placeholder="Biografía"
              value={form.bio}
              onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))}
              className="h-20 rounded-xl text-xs resize-none"
            />
          </div>
        ) : (
          <>
            <h3 className="font-bold text-foreground">{form.display_name || user?.display_name || user?.full_name}</h3>
            {form.bio && <p className="text-sm text-muted-foreground mt-0.5">{form.bio}</p>}
            {user?.country_of_origin && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{getCountryEmoji(user.country_of_origin)} {getCountryName(user.country_of_origin)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit button */}
      <div className="flex gap-2 mt-4">
        {editMode ? (
          <>
            <Button onClick={handleSaveEdits} className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1">
              <Check className="w-4 h-4" /> Guardar
            </Button>
            <Button variant="outline" onClick={() => setEditMode(false)} className="h-9 rounded-xl text-xs font-semibold px-3">
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => setEditMode(true)} variant="outline" className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1">
              <Edit2 className="w-4 h-4" /> Editar perfil
            </Button>
            <Button variant="outline" className="h-9 rounded-xl text-xs font-semibold px-4">
              Compartir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}