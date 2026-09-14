import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Video, MapPin, Plane } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { COUNTRIES } from '@/lib/countries';
import { toast } from 'sonner';

export default function CreatePostModal({ open, onClose, trips = [] }) {
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [tripId, setTripId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tope REAL del proyecto: Supabase Free Plan fija el límite global de subida en
  // 50MB, sin excepción (Dashboard → Storage → Settings lo confirma como no editable
  // salvo pasando a Pro, $25/mes — decisión pendiente del usuario, no de código).
  // Subir este número no serviría de nada mientras el proyecto siga en Free.
  const MAX_VIDEO_MB = 50;

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const previewUrls = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...previewUrls]);
    setUploading(true);
    const urls = await Promise.all(
      files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      })
    );
    setImages(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const removeImage = (i) => {
    setImages(imgs => imgs.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`El vídeo pesa demasiado (máx. ${MAX_VIDEO_MB}MB)`);
      return;
    }
    setVideoPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
    } catch {
      toast.error('Error al subir el vídeo');
      setVideoPreview('');
    }
    setUploading(false);
  };

  const removeVideo = () => {
    setVideoUrl('');
    setVideoPreview('');
  };

  const handleSave = async () => {
    if (!images.length && !videoUrl && !caption) return;
    setSaving(true);
    const me = await base44.auth.me();
    await base44.entities.Post.create({
      caption,
      images,
      video_url: videoUrl || undefined,
      post_type: videoUrl ? 'video' : images.length > 1 ? 'carousel' : images.length === 1 ? 'photo' : 'text',
      country_code: countryCode || undefined,
      trip_id: tripId || undefined,
      is_highlighted: false,
      visibility: 'public',
      created_by: me?.email,
    });
    queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    toast.success('Publicación creada');
    setSaving(false);
    handleClose();
  };

  const handleClose = () => {
    setCaption('');
    setImages([]);
    setPreviews([]);
    setVideoUrl('');
    setVideoPreview('');
    setCountryCode('');
    setTripId('');
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-card rounded-t-3xl border-t border-border pb-safe overflow-hidden"
        >
          {/* Handle */}
          <div className="flex items-center justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-foreground">Nueva publicación</h3>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || uploading || (!images.length && !videoUrl && !caption)}
              className="h-8 px-4 rounded-xl text-xs"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : 'Publicar'}
            </Button>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Video picker (excluyente con fotos: un post es o carrusel de fotos o un vídeo) */}
            {!images.length && (
              <div>
                {videoPreview ? (
                  <div className="relative w-full aspect-[9/16] max-h-64 mx-auto">
                    <video src={videoPreview} className="w-full h-full object-cover rounded-xl bg-black" controls muted />
                    <button
                      onClick={removeVideo}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideo} />
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Video className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Subir vídeo (máx. {MAX_VIDEO_MB}MB)</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            )}

            {/* Image picker (excluyente con vídeo) */}
            {!videoUrl && !videoPreview && (
              <div>
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Image className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">Añadir</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Caption */}
            <Textarea
              placeholder="Escribe sobre este viaje..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="rounded-xl resize-none min-h-[80px]"
              rows={3}
            />

            {/* Country tag */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">País</span>
              </div>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="h-10 rounded-xl text-sm">
                  <SelectValue placeholder="Elige el país..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trip link */}
            {trips.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Plane className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Vincular a viaje</span>
                </div>
                <Select value={tripId} onValueChange={setTripId}>
                  <SelectTrigger className="h-10 rounded-xl text-sm">
                    <SelectValue placeholder="Elige un viaje..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
