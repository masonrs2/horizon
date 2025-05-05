import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Home, Search, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export function Navbar() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const { unreadCount, loadUnreadCount, resetCount } = useNotificationStore();

  useEffect(() => {
    // Reset or load count when auth state changes
    if (!isAuthenticated) {
      console.log('User not authenticated, resetting count');
      resetCount();
    } else {
      console.log('User authenticated, loading count');
      loadUnreadCount();
    }
  }, [isAuthenticated, loadUnreadCount, resetCount]);

  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('Setting up notification polling and listeners');

    // Poll for new notifications every minute
    const interval = setInterval(() => {
      console.log('Polling for notifications');
      loadUnreadCount();
    }, 60000);

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      console.log('Notification update event received');
      loadUnreadCount();
    };
    window.addEventListener('notifications-updated', handleNotificationUpdate);

    return () => {
      console.log('Cleaning up notification listeners');
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleNotificationUpdate);
    };
  }, [isAuthenticated, loadUnreadCount]);

  // Debug logging for badge calculation
  useEffect(() => {
    console.log('Auth status:', isAuthenticated);
    console.log('Unread count:', unreadCount);
    console.log('Should show badge:', isAuthenticated && unreadCount > 0);
    console.log('Badge value:', isAuthenticated && unreadCount > 0 ? unreadCount : undefined);
  }, [isAuthenticated, unreadCount]);

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
      badge: unreadCount,  // Simplified badge logic
      requiresAuth: true,
    },
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
      requiresAuth: true,
    },
  ];

  // Filter nav items based on auth status
  const filteredNavItems = navItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background md:top-0 md:h-screen md:w-64 md:border-r md:border-t-0">
      <div className="flex h-full items-center justify-around md:flex-col md:items-start md:justify-start md:p-4">
        {filteredNavItems.map(({ icon: Icon, label, href, badge }) => {
          console.log(`Rendering ${label} with badge:`, badge); // Debug log
          
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'group flex items-center gap-4 p-4 transition-colors hover:text-foreground md:w-full md:rounded-lg md:hover:bg-muted',
                location.pathname === href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <div className="relative inline-flex">
                <Icon className="h-6 w-6" />
                {isAuthenticated && badge > 0 && (  // Modified condition
                  <div className="absolute -right-3 -top-2.5 min-w-[20px] h-5 rounded-full bg-red-500 flex items-center justify-center px-1">
                    <span className="text-[11px] font-medium leading-none text-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  </div>
                )}
              </div>
              <span className="hidden text-lg md:block">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 