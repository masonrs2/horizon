import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Home, Search, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { notificationApi } from '../../api/notificationApi';

export function Navbar() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread notification count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await notificationApi.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to load unread notification count:', error);
      }
    };

    loadUnreadCount();
    // Poll for new notifications every minute
    const interval = setInterval(loadUnreadCount, 60000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
    },
    {
      icon: Search,
      label: 'Search',
      href: '/search',
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:top-0 md:h-screen md:w-64 md:border-r md:border-t-0">
      <div className="flex h-full items-center justify-around md:flex-col md:items-start md:justify-start md:p-4">
        {navItems.map(({ icon: Icon, label, href, badge }) => (
          <Link
            key={href}
            to={href}
            className={cn(
              'group flex items-center gap-4 p-4 transition-colors hover:text-foreground md:w-full md:rounded-lg md:hover:bg-muted',
              location.pathname === href ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            <div className="relative">
              <Icon className="h-6 w-6" />
              {badge !== undefined && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className="hidden text-lg md:block">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
} 