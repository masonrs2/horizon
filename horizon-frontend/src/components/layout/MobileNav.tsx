import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Bell, Mail, PenSquare, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const navItems = [
    {
      icon: Home,
      path: '/',
      label: 'Home'
    },
    {
      icon: Search,
      path: '/explore',
      label: 'Explore'
    },
    {
      icon: Bell,
      path: '/notifications',
      label: 'Notifications',
      requiresAuth: true
    },
    {
      icon: User,
      path: isAuthenticated && user ? `/profile/${user?.username}` : '/profile',
      label: 'Profile',
      requiresAuth: true
    }
  ];
  
  return (
    <>
      {/* Floating post button for mobile */}
      {isAuthenticated ? (
        <Button 
          size="icon" 
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full z-50 shadow-lg sunset-gradient btn-hover-effect border border-primary/20"
          onClick={() => navigate('/compose')}
        >
          <PenSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Button 
          className="md:hidden fixed bottom-20 right-4 h-14 px-6 rounded-full z-50 shadow-lg sunset-gradient btn-hover-effect border border-primary/20"
          onClick={() => navigate('/login')}
        >
          Sign up
        </Button>
      )}
    
      {/* Bottom navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-background/80 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2">
        {navItems
          .filter(item => !item.requiresAuth || isAuthenticated)
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-full h-full"
            >
              <div className={cn(
                "flex flex-col items-center justify-center rounded-full p-2 transition-all duration-200",
                isActive(item.path) 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}>
                <item.icon className={cn(
                  "h-6 w-6 mb-1",
                  isActive(item.path) && "stroke-[2.5px]"
                )} />
                <span className="text-xs">{item.label}</span>
              </div>
            </Link>
          ))}

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div className="flex flex-col items-center justify-center rounded-full p-2 transition-all duration-200 text-muted-foreground hover:text-destructive">
              <LogOut className="h-6 w-6 mb-1" />
              <span className="text-xs">Logout</span>
            </div>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div className="flex flex-col items-center justify-center rounded-full p-2 transition-all duration-200 text-muted-foreground hover:text-primary">
              <LogOut className="h-6 w-6 mb-1 rotate-180" />
              <span className="text-xs">Login</span>
            </div>
          </Link>
        )}
      </div>
    </>
  );
} 