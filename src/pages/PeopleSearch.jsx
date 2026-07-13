import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, UserPlus, UserCheck, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getCountryEmoji, getCountryName } from '@/lib/countries';
import { useT } from '@/lib/i18n';

export default function PeopleSearch() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useT();
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(input.trim()), 350);
    return () => clearTimeout(id);
  }, [input]);

  const { data: me } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // La búsqueda de personas necesita la nube (tabla "profiles" con todos los
  // usuarios reales); en modo local solo existe "tú", así que no tiene sentido.
  const cloudReady = !!base44.entities.User?.search;

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['peopleSearch', debounced],
    queryFn: () => base44.entities.User.search(debounced, { excludeId: me?.id }),
    enabled: cloudReady && debounced.length >= 2,
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ['myFollowingRows'],
    queryFn: () => base44.entities.Follow.filter({ follower_email: me.email }),
    enabled: cloudReady && !!me?.email,
  });
  const followingMap = new Map(myFollowing.map((f) => [f.following_email, f.id]));

  const handleToggleFollow = async (target) => {
    const followId = followingMap.get(target.email);
    try {
      if (followId) {
        await base44.entities.Follow.delete(followId);
      } else {
        await base44.entities.Follow.create({ follower_email: me.email, following_email: target.email });
      }
      queryClient.invalidateQueries({ queryKey: ['myFollowingRows'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">{t('Buscar personas')}</h1>
      </div>

      {!cloudReady ? (
        <div className="mx-5 mt-8 bg-card rounded-2xl border border-border p-8 text-center">
          <Cloud className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">{t('Necesitas estar conectado a la nube')}</p>
          <p className="text-xs text-muted-foreground">{t('Buscar y seguir a otros viajeros estará disponible cuando actives tu cuenta.')}</p>
        </div>
      ) : (
        <>
          <div className="px-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder={t('Buscar por nombre de usuario...')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="px-5 mt-4 space-y-2">
            {debounced.length < 2 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                {t('Escribe al menos 2 letras para buscar viajeros')}
              </p>
            ) : isFetching ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : results.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-10">
                {t('No se encontraron viajeros para')} "{debounced}"
              </p>
            ) : (
              results.map((u, i) => {
                const isFollowing = followingMap.has(u.email);
                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
                  >
                    <button onClick={() => navigate(`/u/${u.username || u.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Avatar className="w-11 h-11 flex-shrink-0">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {(u.display_name || u.full_name || 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {u.display_name || u.full_name || u.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{u.username || t('usuario')}
                          {u.country_of_origin && ` · ${getCountryEmoji(u.country_of_origin)} ${getCountryName(u.country_of_origin)}`}
                        </p>
                      </div>
                    </button>
                    <Button
                      size="sm"
                      variant={isFollowing ? 'outline' : 'default'}
                      onClick={() => handleToggleFollow(u)}
                      className="rounded-xl text-xs gap-1 flex-shrink-0"
                    >
                      {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {isFollowing ? t('Siguiendo') : t('Seguir')}
                    </Button>
                  </motion.div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
