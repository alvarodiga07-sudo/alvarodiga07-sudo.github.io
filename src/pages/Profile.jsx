import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Grid3X3, Bookmark, Film, Search, Plus, Lock, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProfileHeader from '@/components/profile/ProfileHeader';
import MiniWorldMap from '@/components/profile/MiniWorldMap';
import CreatePostModal from '@/components/profile/CreatePostModal';

export default function Profile() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['myPosts'],
    queryFn: () => base44.entities.Post.list('-created_date'),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('-created_date'),
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: async () => { if (!user?.email) return []; return base44.entities.Follow.filter({ following_email: user.email }); },
    enabled: !!user?.email,
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: async () => { if (!user?.email) return []; return base44.entities.Follow.filter({ follower_email: user.email }); },
    enabled: !!user?.email,
  });

  // Públicos: visibility=='public' o is_public==true (compat). Privados: lo demás.
  const isPublic = (p) => p.visibility === 'public' || p.is_public === true;
  const publicPosts = posts.filter(isPublic);
  const privatePosts = posts.filter(p => !isPublic(p));

  // Helpers: un post es "video" si post_type === 'video' o es slideshow con música
  const isVideoLike = (p) => p.post_type === 'video' || p.is_video_slideshow === true;

  const photoPosts = publicPosts.filter(p => !isVideoLike(p) && (!p.post_type || p.post_type === 'photo' || p.post_type === 'carousel'));
  const highlightedPosts = publicPosts.filter(p => p.is_highlighted);
  const videoPosts = publicPosts.filter(isVideoLike);

  const privateVideos = privatePosts.filter(isVideoLike);
  const privatePhotosPosts = privatePosts.filter(p => !isVideoLike(p));

  const filteredPhotoPosts = photoPosts.filter(p =>
    !searchQuery || p.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <ProfileHeader
        user={user}
        followersCount={followers.length}
        followingCount={following.length}
      />

      <MiniWorldMap visitedCountries={user?.countries_visited || []} trips={trips} />

      <div className="px-5 mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar publicaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <Button
          onClick={() => setShowCreatePost(true)}
          className="h-10 w-10 rounded-xl p-0 flex-shrink-0"
          title="Nueva publicacion"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-5 mt-4">
        <Tabs defaultValue="posts">
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="posts" className="flex-1" title="Publicaciones"><Grid3X3 className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="highlights" className="flex-1" title="Destacados"><Bookmark className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="videos" className="flex-1" title="Videos"><Film className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="private" className="flex-1" title="Privado (solo tú)"><Lock className="w-4 h-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-3">
            {filteredPhotoPosts.length === 0 ? (
              <EmptyState icon={<Grid3X3 className="w-10 h-10" />} title="Sin publicaciones" desc="Comparte tus momentos de viaje" action={() => setShowCreatePost(true)} actionLabel="Crear publicacion" />
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {filteredPhotoPosts.map(post => (
                  <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedPost(post)} className="aspect-square bg-secondary cursor-pointer relative">
                    {post.images?.[0] ? (
                      <>
                        <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                        {post.images?.length > 1 && <div className="absolute top-1 right-1 bg-black/50 rounded px-1 text-[9px] text-white font-bold">{post.images.length}</div>}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-secondary p-2 text-center">{post.caption?.slice(0, 40) || 'Sin imagen'}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="highlights" className="mt-3">
            {highlightedPosts.length === 0 ? (
              <EmptyState icon={<Bookmark className="w-10 h-10" />} title="Sin destacados" desc="Marca tus mejores momentos como destacados" />
            ) : (
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {highlightedPosts.map(post => (
                  <div key={post.id} className="aspect-square bg-secondary">
                    {post.images?.[0] ? <img src={post.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-secondary">*</div>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-3">
            {videoPosts.length === 0 ? (
              <EmptyState icon={<Film className="w-10 h-10" />} title="Sin videos" desc="Graba y comparte videos de tus viajes" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {videoPosts.map(post => (
                  <div key={post.id} className="aspect-video bg-secondary rounded-xl overflow-hidden relative">
                    {post.images?.[0] && <img src={post.images[0]} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* PRIVADOS — solo el dueño los ve */}
          <TabsContent value="private" className="mt-3 space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Solo tú puedes ver esto
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                Tu colección personal de fotos y videos privados de tus viajes.
              </p>
            </div>

            {/* Videos privados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">📹 Videos privados</p>
                <span className="text-[10px] text-muted-foreground">{privateVideos.length}</span>
              </div>
              {privateVideos.length === 0 ? (
                <div className="text-center py-6 bg-secondary/30 rounded-xl">
                  <Film className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Sin videos privados</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">Crea uno desde un viaje → tab Video → "Guardar privado"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {privateVideos.map(post => (
                    <div key={post.id} className="aspect-video bg-secondary rounded-xl overflow-hidden relative cursor-pointer" onClick={() => setSelectedPost(post)}>
                      {post.images?.[0] && <img src={post.images[0]} alt="" className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="w-8 h-8 text-white" fill="white" />
                      </div>
                      <div className="absolute top-1 right-1 bg-black/60 backdrop-blur rounded-full p-1">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publicaciones privadas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">🖼️ Publicaciones privadas</p>
                <span className="text-[10px] text-muted-foreground">{privatePhotosPosts.length}</span>
              </div>
              {privatePhotosPosts.length === 0 ? (
                <div className="text-center py-6 bg-secondary/30 rounded-xl">
                  <Grid3X3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Sin publicaciones privadas</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">Crea una y selecciona "Privado" al publicar</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {privatePhotosPosts.map(post => (
                    <div key={post.id} className="aspect-square bg-secondary cursor-pointer relative" onClick={() => setSelectedPost(post)}>
                      {post.images?.[0] ? (
                        <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center">{post.caption?.slice(0, 30) || 'Sin imagen'}</div>
                      )}
                      <div className="absolute top-1 right-1 bg-black/60 backdrop-blur rounded-full p-1">
                        <Lock className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPost(null)}>
          <div className="bg-card rounded-2xl overflow-hidden max-w-sm w-full" onClick={e => e.stopPropagation()}>
            {selectedPost.images?.[0] && <img src={selectedPost.images[0]} alt="" className="w-full aspect-square object-cover" />}
            {selectedPost.caption && <div className="p-4"><p className="text-sm text-foreground">{selectedPost.caption}</p></div>}
          </div>
        </div>
      )}

      <CreatePostModal open={showCreatePost} onClose={() => setShowCreatePost(false)} trips={trips} />
    </div>
  );
}

function EmptyState({ icon, title, desc, action, actionLabel }) {
  return (
    <div className="text-center py-12">
      <div className="text-muted-foreground/20 flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      {action && <button onClick={action} className="mt-3 text-xs text-primary font-medium">{actionLabel}</button>}
    </div>
  );
}
