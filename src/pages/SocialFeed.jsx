// TikTok-style social feed para Waddle: vertical, scroll-snap, fotos/videos de viajes
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Send, Share2, MapPin, ArrowLeft,
  Plus, Volume2, VolumeX, User, Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function SocialFeed() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeIdx, setActiveIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const [showComments, setShowComments] = useState(null);
  const containerRef = useRef(null);

  // Posts públicos de TODOS los usuarios (acepta visibility o is_public)
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['publicFeed'],
    queryFn: async () => {
      const all = await base44.entities.Post.list('-created_date');
      return all.filter(p => p.visibility === 'public' || p.is_public === true);
    },
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Detectar cuál está visible al hacer scroll (snap)
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => {
      const h = c.clientHeight;
      const idx = Math.round(c.scrollTop / h);
      setActiveIdx(idx);
    };
    c.addEventListener('scroll', onScroll);
    return () => c.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-black to-zinc-900 flex flex-col items-center justify-center text-white p-6">
        <div className="text-5xl mb-4">🌍</div>
        <h2 className="text-xl font-bold mb-2">Aún no hay contenido</h2>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Sé el primero en compartir tus aventuras de viaje
        </p>
        <Button onClick={() => navigate('/profile')} className="rounded-full">
          <Plus className="w-4 h-4 mr-1" /> Crear publicación
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4 text-white">
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {/* Top bar fijo */}
      <div className="fixed top-0 left-0 right-0 z-30 px-4 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-base font-bold">✈️ Para ti</h1>
        <button onClick={() => setMuted(!muted)} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {posts.map((post, idx) => (
        <FeedItem
          key={post.id}
          post={post}
          active={idx === activeIdx}
          muted={muted}
          currentUser={user}
          onCommentsClick={() => setShowComments(post)}
          queryClient={queryClient}
        />
      ))}

      {/* Modal de comentarios */}
      <CommentsDrawer
        post={showComments}
        currentUser={user}
        onClose={() => setShowComments(null)}
      />
    </div>
  );
}

// ─── Item del feed (foto/video a pantalla completa) ───
function FeedItem({ post, active, muted, currentUser, onCommentsClick, queryClient }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.liked_by?.includes(currentUser?.email) || false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [slideIdx, setSlideIdx] = useState(0);

  // Slideshow automático si es video_slideshow
  useEffect(() => {
    if (!active || !post.is_video_slideshow || !post.images || post.images.length < 2) return;
    const t = setInterval(() => {
      setSlideIdx(i => (i + 1) % post.images.length);
    }, 2500);
    return () => clearInterval(t);
  }, [active, post]);

  // Música de fondo del slideshow (post.music_track)
  const musicRef = useRef(null);
  useEffect(() => {
    if (!active || !post.music_track || post.music_track === 'none') {
      if (musicRef.current) { musicRef.current.pause(); musicRef.current = null; }
      return;
    }
    if (!musicRef.current) {
      const audio = new Audio(`/music/${post.music_track}.mp3`);
      audio.loop = true;
      audio.volume = muted ? 0 : 0.65;
      musicRef.current = audio;
      audio.play().catch(() => {});
    }
    if (musicRef.current) musicRef.current.volume = muted ? 0 : 0.65;
    return () => {
      if (musicRef.current) { musicRef.current.pause(); musicRef.current = null; }
    };
  }, [active, post.music_track, muted]);

  // Autor del post
  const { data: author } = useQuery({
    queryKey: ['author', post.created_by],
    queryFn: async () => {
      if (!post.created_by) return null;
      const users = await base44.entities.User.filter({ email: post.created_by });
      return users[0];
    },
    enabled: !!post.created_by,
  });

  // Viaje vinculado (si lo hay)
  const { data: relatedTrip } = useQuery({
    queryKey: ['post-trip', post.trip_id],
    queryFn: async () => {
      if (!post.trip_id) return null;
      const trips = await base44.entities.Trip.filter({ id: post.trip_id });
      return trips[0];
    },
    enabled: !!post.trip_id,
  });

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => c + (newLiked ? 1 : -1));
    try {
      const likedBy = post.liked_by || [];
      const updatedLikedBy = newLiked
        ? [...likedBy, currentUser?.email]
        : likedBy.filter(e => e !== currentUser?.email);
      await base44.entities.Post.update(post.id, {
        liked_by: updatedLikedBy,
        likes_count: updatedLikedBy.length,
      });
      queryClient.invalidateQueries({ queryKey: ['publicFeed'] });
    } catch (err) {
      // revertir UI si falla
      setLiked(!newLiked);
      setLikeCount(c => c + (newLiked ? -1 : 1));
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/social?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mira esto en Waddle', text: post.caption || '', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Enlace copiado');
      }
    } catch (e) {}
  };

  const initials = (author?.display_name || author?.full_name || 'U').slice(0, 2).toUpperCase();
  // Es video real solo si tiene video_url. Si es video_slideshow, usamos slideshow de imágenes.
  const isRealVideo = post.post_type === 'video' && !!post.video_url;
  const isSlideshow = post.is_video_slideshow && post.images?.length > 1;
  const mediaUrl = post.video_url || post.images?.[0];

  return (
    <div className="h-screen w-full snap-start relative flex items-end">
      {/* Media de fondo (full screen) */}
      {isRealVideo ? (
        <video
          src={mediaUrl}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={active}
          loop
          muted={muted}
          playsInline
        />
      ) : isSlideshow ? (
        <>
          {post.images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: i === slideIdx ? 1 : 0 }}
            />
          ))}
          {/* Indicadores de slides arriba */}
          <div className="absolute top-16 left-3 right-3 flex gap-1 z-10">
            {post.images.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all ${i === slideIdx ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </>
      ) : mediaUrl ? (
        <img src={mediaUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-zinc-900 flex items-center justify-center">
          <span className="text-6xl opacity-30">📸</span>
        </div>
      )}

      {/* Overlay degradado para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

      {/* Info inferior izquierda */}
      <div className="relative z-10 p-4 pb-24 flex-1 max-w-[80%]">
        {/* Usuario */}
        <button
          onClick={() => navigate(`/u/${author?.username || author?.email}`)}
          className="flex items-center gap-2 mb-2"
        >
          <Avatar className="w-9 h-9 border-2 border-white">
            <AvatarImage src={author?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-white text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-bold text-white drop-shadow">@{author?.username || 'usuario'}</p>
            {author?.country_of_origin && (
              <p className="text-[10px] text-white/70">{getCountryEmoji(author.country_of_origin)} {getCountryName(author.country_of_origin)}</p>
            )}
          </div>
        </button>

        {/* País destino del post */}
        {(relatedTrip?.destination_country || post.country_code) && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-white" />
            <span className="text-xs font-semibold text-white drop-shadow">
              {getCountryEmoji(relatedTrip?.destination_country || post.country_code)}{' '}
              {getCountryName(relatedTrip?.destination_country || post.country_code)}
              {relatedTrip?.destination_city && ` · ${relatedTrip.destination_city}`}
            </span>
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-white drop-shadow-lg leading-snug whitespace-pre-line">
            {post.caption}
          </p>
        )}

        {/* Fecha */}
        {post.created_date && (
          <p className="text-[10px] text-white/60 mt-2">
            {format(new Date(post.created_date), "d MMM yyyy", { locale: es })}
          </p>
        )}
      </div>

      {/* Acciones laterales (derecha) */}
      <div className="relative z-10 flex flex-col items-center gap-5 pr-4 pb-24">
        <ActionButton icon={<Heart className={`w-7 h-7 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />} count={likeCount} onClick={handleLike} />
        <ActionButton icon={<MessageCircle className="w-7 h-7 text-white" />} count={post.comments_count || 0} onClick={onCommentsClick} />
        <ActionButton icon={<Share2 className="w-7 h-7 text-white" />} label="Compartir" onClick={handleShare} />
        <ActionButton icon={<Bookmark className="w-7 h-7 text-white" />} label="Guardar" onClick={() => toast.success('Guardado')} />
      </div>
    </div>
  );
}

function ActionButton({ icon, count, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform">
      <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur flex items-center justify-center">
        {icon}
      </div>
      {(count !== undefined || label) && (
        <span className="text-[10px] font-bold text-white drop-shadow">
          {count !== undefined ? formatCount(count) : label}
        </span>
      )}
    </button>
  );
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}

// ─── Drawer de comentarios ───
function CommentsDrawer({ post, currentUser, onClose }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post?.id],
    queryFn: () => post?.id ? base44.entities.Comment.filter({ post_id: post.id }) : [],
    enabled: !!post?.id,
  });

  const handleSend = async () => {
    if (!text.trim() || !post) return;
    setSending(true);
    try {
      await base44.entities.Comment.create({
        post_id: post.id,
        text: text.trim(),
        author_email: currentUser?.email,
        author_name: currentUser?.display_name || currentUser?.full_name,
        author_avatar: currentUser?.avatar_url,
      });
      // Actualizar contador
      await base44.entities.Post.update(post.id, {
        comments_count: (post.comments_count || 0) + 1,
      });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['publicFeed'] });
    } catch (err) {
      toast.error('Error al enviar');
    }
    setSending(false);
  };

  return (
    <AnimatePresence>
      {post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="w-full bg-background rounded-t-3xl max-h-[75vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Comentarios</h3>
              <button onClick={onClose} className="text-muted-foreground text-xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Sé el primero en comentar
                </p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={c.author_avatar} />
                      <AvatarFallback className="text-[10px]">{(c.author_name || 'U').slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{c.author_name || c.author_email}</p>
                      <p className="text-xs text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
                      {c.created_date && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(c.created_date), "d MMM · HH:mm", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-3 flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder="Añade un comentario..."
                className="flex-1 h-10 rounded-full"
              />
              <Button onClick={handleSend} disabled={!text.trim() || sending} size="icon" className="h-10 w-10 rounded-full">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
