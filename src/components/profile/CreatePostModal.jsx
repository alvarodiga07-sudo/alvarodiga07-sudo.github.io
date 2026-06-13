import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, MapPin, Plane, Check } from 'lucide-react';
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
  const [countryCode, setCountryCode] = useState('');
  const [tripId, setTripId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!images.length && !caption) return;
    setSaving(true);
    await base44.entities.Post.create({
      caption,
      images,
      post_type: images.length > 1 ? 'carousel' : images.length === 1 ? 'photo' : 'text',
      country_code: countryCode || undefined,
      trip_id: tripId || undefined,
      is_highlighted: false,
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
              disabled={saving || uploading || (!images.length && !caption)}
              className="h-8 px-4 rounded-xl text-xs"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : 'Publicar'}
            </Button>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Image picker */}
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
