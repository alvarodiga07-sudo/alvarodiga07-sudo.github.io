import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, UserPlus, Heart, Plane, Gift, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { computeLocalNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/notifications';

const TYPE_ICONS = {
  follow: UserPlus,
  like: Heart,
  trip_reminder: Plane,
  annual_summary: Gift,
};

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useT();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: () => base44.entities.Trip.list('start_date'),
  });

  // Notificaciones remotas (follow/like) sólo existen cuando la nube está
  // activa y algo las crea (p.ej. al seguir a alguien); en modo local no hay
  // otros usuarios así que esta lista siempre estará vacía, sin romper nada.
  const { data: remoteNotifications = [] } = useQuery({
    queryKey: ['remoteNotifications'],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        return await base44.entities.Notification.filter({ recipient_email: user.email }, '-created_date');
      } catch {
        return [];
      }
    },
    enabled: !!user?.email,
  });

  // computeLocalNotifications lee el estado de "leído" de localStorage, no de
  // React state — sin este contador, marcar como leído no se reflejaría hasta
  // el próximo cambio real de `trips` (invalidateQueries no basta: si los
  // datos no cambian, React Query no vuelve a renderizar).
  const [, setReadTick] = useState(0);
  const localNotifications = computeLocalNotifications(trips, t);
  const notifications = [...localNotifications, ...remoteNotifications].sort(
    (a, b) => new Date(b.sortDate || b.created_date) - new Date(a.sortDate || a.created_date)
  );
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpen = (notif) => {
    if (!notif.is_read) {
      markNotificationRead(notif.id);
      setReadTick((tk) => tk + 1);
    }
    if (notif.trip_id) navigate(`/trip/${notif.trip_id}`);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(notifications);
    setReadTick((tk) => tk + 1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground flex-1">{t('Notificaciones')}</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs gap-1 rounded-xl">
            <Check className="w-3.5 h-3.5" /> {t('Marcar todo leído')}
          </Button>
        )}
      </div>

      <div className="px-5">
        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('Sin notificaciones')}</h3>
            <p className="text-sm text-muted-foreground">{t('Aquí aparecerán tus notificaciones')}</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const Icon = TYPE_ICONS[notif.type] || Bell;
              return (
                <motion.button
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleOpen(notif)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
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
                  {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}