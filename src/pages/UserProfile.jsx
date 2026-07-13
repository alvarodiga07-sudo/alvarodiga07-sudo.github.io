import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, UserPlus, UserCheck, Grid3X3, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import MiniWorldMap from '@/components/profile/MiniWorldMap';
import { useT } from '@/lib/i18n';

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();

  const cloudReady = !!base44.entities.User?.search;

  const { data: me } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: cloudReady,
  });

  const { data: target, isLoading } = useQuery({
    queryKey: ['viewedUser', username],
    queryFn: async () => {
      const byUsername = await base44.entities.User.filter({ username });
      if (byUsername[0]) return byUsername[0];
      try { return await base44.entities.User.get(username); } catch { return null; }
    },
    enabled: cloudReady && !!username,
  });

  const isMe = !!me && !!target && me.id === target.id;
  useEffect(() => {
    if (isMe) navigate('/profile', { replace: true });
  }, [isMe, navigate]);

  const { data: posts = [] } = useQuery({
    queryKey: ['userPosts', target?.email],
    queryFn: () => base44.entities.Post.filter({ created_by: target.email }),
    enabled: cloudReady && !!target?.email && !isMe,
  });
  const publicPosts = posts.filter((p) => p.visibility === 'public' || p.is_public === true);

  const { data: followers = [] } = useQuery({
    queryKey: ['userFollowers', target?.email],
    queryFn: () => base44.entities.Follow.filter({ following_email: target.email }),
    enabled: cloudReady && !!target?.email,
  });
  const { data: myFollowing = [] } = useQuery({
    queryKey: ['myFollowingRows'],
    queryFn: () => base44.entities.Follow.filter({ follower_email: me.email }),
    enabled: cloudReady && !!me?.email,
  });
  const followRow = myFollowing.find((f) => f.following_email === target?.email);
  const isFollowing = !!followRow;

  const handleToggleFollow = async () => {
    try {
      if (followRow) {
        await base44.entities.Follow.delete(followRow.id);
      } else {
        await base44.entities.Follow.create({ follower_email: me.email, following_email: target.email });
      }
      queryClient.invalidateQueries({ queryKey: ['myFollowingRows'] });
      queryClient.invalidateQueries({ queryKey: ['userFollowers', target.email] });
    } catch (e) {
      console.error(e);
    }
  };

  if (!cloudReady) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="mx-5 mt-8 bg-card rounded-2xl border border-border p-8 text-center">
          <Cloud className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">{t('Necesitas estar conectado a la nube')}</p>
          <p className="text-xs text-muted-foreground">{t('Ver perfiles de otros viajeros estará disponible cuando actives tu cuenta.')}</p>
        </div>
      </div>
    );
  }

  if (isLoading || isMe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="mx-5 mt-8 text-center py-12">
          <p className="text-sm font-semibold text-foreground">{t('Usuario no encontrado')}</p>
        </div>
      </div>
    );
  }

  const initials = (target.display_name || target.full_name || 'U').slice(0, 2).toUpperCase();
  const visitedCount = target.countries_visited?.length || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">@{target.username || t('usuario')}</h1>
      </div>

      <div className="px-5">
        <div className="flex items-center gap-5">
          <Avatar className="w-20 h-20 border-4 border-primary/20">
            <AvatarImage src={target.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 grid grid-cols-3 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{visitedCount}</p>
              <p className="text-[10px] text-muted-foreground">{t('Países')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{followers.length}</p>
              <p className="text-[10px] text-muted-foreground">{t('Seguidores')}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{publicPosts.length}</p>
              <p className="text-[10px] text-muted-foreground">{t('Posts')}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-bold text-foreground">{target.display_name || target.full_name}</h3>
          {target.bio && <p className="text-sm text-muted-foreground mt-0.5">{target.bio}</p>}
          {target.country_of_origin && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{getCountryEmoji(target.country_of_origin)} {getCountryName(target.country_of_origin)}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleToggleFollow}
          variant={isFollowing ? 'outline' : 'default'}
          className="w-full h-10 rounded-xl text-sm font-semibold gap-2 mt-4"
        >
          {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {isFollowing ? t('Siguiendo') : t('Seguir')}
        </Button>
      </div>

      <MiniWorldMap visitedCountries={target.countries_visited || []} trips={[]} />

      <div className="px-5 mt-4">
        <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
          <Grid3X3 className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">{t('Posts')}</span>
        </div>
        {publicPosts.length === 0 ? (
          <div className="text-center py-10 bg-secondary/30 rounded-xl">
            <p className="text-xs text-muted-foreground">{t('Sin publicaciones todavía')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
            {publicPosts.map((post) => (
              <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square bg-secondary">
                {post.images?.[0] ? (
                  <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center">
                    {post.caption?.slice(0, 30)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
