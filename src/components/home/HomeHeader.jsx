import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const LOGO_URL = "https://media.base44.com/images/public/user_69aea125734ce6b1da596dd5/ce9f50f11_IMG_05283.png";

export default function HomeHeader({ user, notificationCount = 0 }) {
  const initials = (user?.display_name || user?.full_name || 'U').slice(0, 2).toUpperCase();

  return (
    <header className="flex items-center justify-between px-5 pt-4 pb-2">
      <div className="flex items-center gap-3">
        <img src={LOGO_URL} alt="Waddle" className="w-9 h-9 rounded-full object-cover" />
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Waddle</h1>
          <p className="text-[11px] text-muted-foreground -mt-0.5">Explore the world</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/notifications" className="relative p-2 rounded-full hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </Link>
        <Link to="/settings" className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>
        <Link to="/profile">
          <Avatar className="w-8 h-8 border-2 border-primary/20">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}