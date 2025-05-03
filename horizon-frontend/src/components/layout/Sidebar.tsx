import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  Bookmark, 
  User, 
  PenSquare,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export function Sidebar() {
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
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications', requiresAuth: true },
    { icon: Mail, label: 'Messages', path: '/messages', requiresAuth: true },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks', requiresAuth: true },
    { 
      icon: User, 
      label: 'Profile', 
      path: isAuthenticated && user ? `/profile/${user.username}` : '/profile',
      requiresAuth: true 
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-[275px] border-r border-border hidden md:flex flex-col p-4 bg-gradient-to-b from-background to-background/95">
      <div className="mb-6 px-2">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text sunset-gradient">
          Horizon
        </h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems
          .filter(item => !item.requiresAuth || isAuthenticated)
          .map((item) => (
          <Link 
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-4 px-4 py-3 text-lg rounded-full transition-all duration-200",
              isActive(item.path) 
                ? "font-semibold text-primary bg-primary/10" 
                : "text-foreground hover:bg-accent/5 btn-hover-effect"
            )}
          >
            <item.icon className={cn(
              "h-6 w-6",
              isActive(item.path) && "text-primary"
            )} />
            <span>{item.label}</span>
          </Link>
        ))}

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 text-lg rounded-full transition-all duration-200 text-foreground hover:bg-destructive/10 hover:text-destructive w-full text-left btn-hover-effect"
          >
            <LogOut className="h-6 w-6" />
            <span>Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-4 px-4 py-3 text-lg rounded-full transition-all duration-200 text-foreground hover:bg-primary/10 hover:text-primary w-full text-left btn-hover-effect"
          >
            <LogOut className="h-6 w-6 rotate-180" />
            <span>Login</span>
          </Link>
        )}
      </nav>

      {isAuthenticated ? (
        <Button 
          className="mt-4 rounded-full w-full py-6 text-lg gap-2 btn-hover-effect sunset-gradient"
          onClick={() => navigate('/compose')}
        >
          <PenSquare className="h-5 w-5" />
          <span>Post</span>
        </Button>
      ) : (
        <Button 
          className="mt-4 rounded-full w-full py-6 text-lg gap-2 btn-hover-effect sunset-gradient"
          onClick={() => navigate('/login')}
        >
          <span>Sign up for Horizon</span>
        </Button>
      )}
    </div>
  );
} 