import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX, Upload, Lock, Globe, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

// Pistas locales sin copyright (Kevin MacLeod, CC-BY) — siempre suenan, sin internet
const MUSIC_TRACKS = [
  { id: 'none', name: 'Sin música', icon: '🔇', url: null },
  { id: 'adventure', name: 'Aventura', icon: '⛰️', url: '/music/adventure.mp3' },
  { id: 'chill', name: 'Relajante', icon: '🌊', url: '/music/chill.mp3' },
  { id: 'romantic', name: 'Romántico', icon: '💕', url: '/music/romantic.mp3' },
  { id: 'upbeat', name: 'Animado', icon: '🎉', url: '/music/upbeat.mp3' },
  { id: 'cinematic', name: 'Cinemático', icon: '🎬', url: '/music/cinematic.mp3' },
  { id: 'tropical', name: 'Tropical', icon: '🏝️', url: '/music/tropical.mp3' },
  { id: 'epic', name: 'Épico', icon: '⚔️', url: '/music/epic.mp3' },
  { id: 'lofi', name: 'Lo-Fi', icon: '🎧', url: '/music/lofi.mp3' },
  { id: 'indie', name: 'Indie', icon: '🌻', url: '/music/indie.mp3' },
  { id: 'discovery', name: 'Explorar', icon: '🔍', url: '/music/discovery.mp3' },
  { id: 'memories', name: 'Recuerdos', icon: '📷', url: '/music/memories.mp3' },
  { id: 'custom', name: 'Personalizada', icon: '🎵', url: 'CUSTOM' },
];

// URLs sugeridas (todas sin copyright / dominio público)
const NO_COPYRIGHT_SOURCES = [
  { name: 'Pixabay Music', url: 'https://pixabay.com/music/', desc: 'Miles de pistas gratis' },
  { name: 'Free Music Archive', url: 'https://freemusicarchive.org/', desc: 'Música libre legal' },
  { name: 'YouTube Audio Library', url: 'https://studio.youtube.com/channel/UC/music', desc: 'De YouTube, gratis' },
  { name: 'Incompetech', url: 'https://incompetech.com/music/royalty-free/music.html', desc: 'Kevin MacLeod CC-BY' },
];

export default function TripVideoTab({ photos, tripTitle, tripId }) {
  const queryClient = useQueryClient();
  const [playing, setPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedMusic, setSelectedMusic] = useState('none');
  const [customMusicUrl, setCustomMusicUrl] = useState('');
  const [customMusicConfirmed, setCustomMusicConfirmed] = useState(''); // URL realmente activa
  const [customStart, setCustomStart] = useState(0); // segundos desde donde empieza
  const [customDuration, setCustomDuration] = useState(30); // duración del clip
  const [showCustomMusic, setShowCustomMusic] = useState(false);
  const [volume, setVolume] = useState(0.85); // Volumen más alto por defecto
  const [muted, setMuted] = useState(false);
  const [visibility, setVisibility] = useState('private'); // 'private' | 'public'
  const [uploading, setUploading] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Slideshow timer
  useEffect(() => {
    if (playing && photos.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx(i => (i + 1) % photos.length);
      }, 3000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, photos.length]);

  // Music playback — con reintentos en caso de autoplay block
  useEffect(() => {
    const track = MUSIC_TRACKS.find(t => t.id === selectedMusic);
    // Si es custom, usa la URL CONFIRMADA (no la que está escribiendo)
    const finalUrl = track?.url === 'CUSTOM' ? customMusicConfirmed : track?.url;
    if (!finalUrl) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      return;
    }
    const audioId = track.id === 'custom' ? `custom:${finalUrl}:${customStart}` : track.id;
    if (!audioRef.current || audioRef.current.dataset.id !== audioId) {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(finalUrl);
      audio.loop = true;
      audio.volume = muted ? 0 : volume;
      audio.dataset.id = audioId;
      // Aplicar recorte de inicio + duración para custom
      if (track.id === 'custom') {
        audio.addEventListener('loadedmetadata', () => {
          audio.currentTime = Math.min(customStart, (audio.duration || 0) - 1);
        });
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime - customStart >= customDuration) {
            audio.currentTime = customStart; // bucle dentro del rango
          }
        });
      }
      audioRef.current = audio;
    }

    if (playing && audioRef.current) {
      // Reintentar reproducción si falla (navegador puede bloquear autoplay)
      const play = () => audioRef.current.play()
        .catch(e => {
          console.warn('Audio play blocked, retrying...', e);
          setTimeout(play, 500);
        });
      play();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
    return () => {};
  }, [playing, selectedMusic, volume, muted, customMusicConfirmed, customStart, customDuration]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Cleanup on unmount
  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  const togglePlay = () => setPlaying(p => !p);
  const prev = () => setCurrentIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrentIdx(i => (i + 1) % photos.length);

  const handleUploadToProfile = async () => {
    if (!photos.length) return;
    setUploading(true);
    try {
      await base44.entities.Post.create({
        caption: `🎬 ${tripTitle}`,
        images: photos.slice(0, 10).map(p => p.image_url),
        post_type: 'video',                            // ← marcar como video (no carousel)
        is_video_slideshow: true,
        music_track: selectedMusic,
        visibility: visibility,                        // ← 'public' | 'private' (unificado)
        is_public: visibility === 'public',            // mantenemos por compat
        trip_id: tripId,
      });
      // Invalidar TODOS los caches que muestran posts
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['publicFeed'] });
      toast.success(visibility === 'public' ? '¡Publicado! Ya está en Descubre' : 'Guardado en tu perfil (privado)');
    } catch (e) {
      toast.error('Error al publicar');
    }
    setUploading(false);
  };

  if (!photos.length) return (
    <div className="bg-card rounded-xl border border-border p-8 text-center">
      <Sparkles className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground mb-1">Añade fotos al viaje</p>
      <p className="text-xs text-muted-foreground">Con tus fotos la IA generará un vídeo-resumen con música</p>
    </div>
  );

  const currentPhoto = photos[currentIdx];

  return (
    <div className="space-y-4">
      {/* Slideshow player */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="relative aspect-video bg-black">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentIdx}
              src={currentPhoto?.image_url}
              alt=""
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white font-bold text-sm">{tripTitle}</p>
            <p className="text-white/60 text-xs">{currentIdx + 1} / {photos.length}</p>
          </div>

          {/* Music playing indicator */}
          {playing && selectedMusic !== 'none' && !muted && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full px-2 py-1 flex items-center gap-1">
              <div className="flex gap-0.5 items-end h-3">
                {[1,2,3].map(i => (
                  <motion.div key={i} className="w-1 bg-white rounded-full"
                    animate={{ height: ['4px', '10px', '6px', '12px', '4px'] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
              <span className="text-white text-[10px]">{MUSIC_TRACKS.find(t=>t.id===selectedMusic)?.name}</span>
            </div>
          )}
        </div>

        {/* Playback controls */}
        <div className="p-3 flex items-center gap-3">
          <button onClick={prev} className="text-muted-foreground hover:text-foreground"><SkipBack className="w-5 h-5" /></button>
          <button onClick={togglePlay} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            {playing ? <Pause className="w-5 h-5 text-primary-foreground" /> : <Play className="w-5 h-5 text-primary-foreground" />}
          </button>
          <button onClick={next} className="text-muted-foreground hover:text-foreground"><SkipForward className="w-5 h-5" /></button>

          {/* Photo dots */}
          <div className="flex-1 flex justify-center gap-1">
            {photos.slice(0, 8).map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? 'bg-primary w-3' : 'bg-muted-foreground/30'}`} />
            ))}
          </div>

          {/* Volume */}
          <button onClick={() => setMuted(m => !m)} className="text-muted-foreground hover:text-foreground">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
            onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
            className="w-16 h-1 accent-primary" />
        </div>
      </div>

      {/* Music selection */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Música de fondo</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MUSIC_TRACKS.map(track => (
            <button key={track.id} onClick={() => {
              if (track.id === 'custom') {
                setShowCustomMusic(true);
                // No selecciona "custom" hasta que confirme con AÑADIR
                if (selectedMusic !== 'custom') setSelectedMusic('none');
              } else {
                setSelectedMusic(track.id);
                setShowCustomMusic(false);
              }
            }}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all text-center ${selectedMusic === track.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30 hover:border-primary/30'}`}>
              <span className="text-lg">{track.icon}</span>
              <span className="text-[10px] font-semibold">{track.name}</span>
            </button>
          ))}
        </div>

        {/* Panel de música personalizada — solo cuando se pulsa "Personalizada" */}
        {showCustomMusic && (
          <div className="mt-3 p-3 bg-secondary/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">🎵 Audio personalizado</p>
              <button onClick={() => setShowCustomMusic(false)} className="text-xs text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">URL del audio MP3</label>
              <input
                type="url"
                value={customMusicUrl}
                onChange={(e) => setCustomMusicUrl(e.target.value)}
                placeholder="https://ejemplo.com/mi-cancion.mp3"
                className="w-full mt-1 h-9 px-3 text-xs rounded-lg border border-border bg-background outline-none focus:border-primary"
              />
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1.5 leading-tight">
                ⚠️ <strong>Spotify y YouTube NO funcionan</strong> por restricciones DRM. Usa solo archivos MP3 directos de las fuentes sin copyright de abajo.
              </p>
            </div>

            {/* Recorte de inicio + duración */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Empezar en (seg)</label>
                <input
                  type="number"
                  min="0"
                  value={customStart}
                  onChange={(e) => setCustomStart(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full mt-1 h-9 px-3 text-xs rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground">Duración (seg)</label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Math.max(5, Math.min(180, Number(e.target.value) || 30)))}
                  className="w-full mt-1 h-9 px-3 text-xs rounded-lg border border-border bg-background"
                />
              </div>
            </div>

            {/* Botón AÑADIR */}
            <Button
              onClick={() => {
                if (!customMusicUrl.trim()) {
                  toast.error('Pega primero una URL válida');
                  return;
                }
                if (customMusicUrl.includes('youtube.com') || customMusicUrl.includes('youtu.be') || customMusicUrl.includes('spotify.com')) {
                  toast.error('YouTube y Spotify no funcionan. Usa un MP3 directo.');
                  return;
                }
                setCustomMusicConfirmed(customMusicUrl);
                setSelectedMusic('custom');
                toast.success('Audio personalizado añadido');
              }}
              className="w-full h-10 rounded-xl text-sm font-semibold"
            >
              ✓ Añadir audio al video
            </Button>

            {customMusicConfirmed && selectedMusic === 'custom' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 text-[10px] text-green-700 dark:text-green-300">
                ✓ Audio activo: empezará en {customStart}s, durará {customDuration}s
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Fuentes recomendadas (gratis):</p>
              <div className="grid grid-cols-2 gap-1.5">
                {NO_COPYRIGHT_SOURCES.map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="block p-2 bg-card border border-border rounded-lg hover:border-primary text-left">
                    <p className="text-[10px] font-bold text-primary">{s.name}</p>
                    <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload to profile */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Subir al perfil</p>
        <div className="flex gap-2">
          {[
            { id: 'private', label: 'Privado', icon: <Lock className="w-3.5 h-3.5" />, desc: 'Solo tú lo ves' },
            { id: 'public', label: 'Público', icon: <Globe className="w-3.5 h-3.5" />, desc: 'Todo el mundo' },
          ].map(v => (
            <button key={v.id} onClick={() => setVisibility(v.id)}
              className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${visibility === v.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
              <div className="flex items-center gap-1 text-foreground">{v.icon}<span className="text-xs font-bold">{v.label}</span></div>
              <span className="text-[10px] text-muted-foreground">{v.desc}</span>
            </button>
          ))}
        </div>
        <Button onClick={handleUploadToProfile} disabled={uploading} className="w-full h-10 rounded-xl">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Subiendo...' : `Subir como ${visibility === 'public' ? 'publicación pública' : 'guardado privado'}`}
        </Button>
      </div>
    </div>
  );
}
