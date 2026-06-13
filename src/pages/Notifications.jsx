import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, UserPlus, Heart, Plane, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPE_ICONS = {
  follow: UserPlus,
  like: Heart,
  trip_reminder: Plane,
  annual_summary: Gift,
};

export default function Notifications() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter({ recipient_email: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Notificaciones</h1>
      </div>

      <div className="px-5">
        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Sin notificaciones</h3>
            <p className="text-sm text-muted-foreground">Aquí aparecerán tus notificaciones</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const Icon = TYPE_ICONS[notif.type] || Bell;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                    notif.is_read ? 'bg-card' : 'bg-primary/5 border border-primary/10'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    {notif.message && <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}