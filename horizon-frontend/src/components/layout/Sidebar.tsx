import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  Bookmark, 
  User, 
  PenSquare,
  LogOut,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    <div className="fixed left-0 top-0 h-screen w-[275px] border-r border-border hidden md:flex flex-col p-4 pl-8 bg-gradient-to-b from-background to-background/95">
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
              "flex items-center gap-4 px-4 py-3 text-lg rounded-full transition-all duration-200 ml-2",
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
            className="flex items-center gap-4 px-4 py-3 text-lg rounded-full transition-all duration-200 text-foreground hover:bg-destructive/10 hover:text-destructive w-full text-left btn-hover-effect ml-2"
          >
            <LogOut className="h-6 w-6" />
            <span>Logout</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-4 px-4 py-3 text-lg rounded-full transition-all duration-200 text-foreground hover:bg-primary/10 hover:text-primary w-full text-left btn-hover-effect ml-2"
          >
            <LogOut className="h-6 w-6 rotate-180" />
            <span>Login</span>
          </Link>
        )}
      </nav>

      {isAuthenticated ? (
        <>
          <Button 
            className="mt-4 rounded-full w-full py-6 text-lg gap-2 btn-hover-effect sunset-gradient"
            onClick={() => navigate('/compose')}
          >
            <PenSquare className="h-5 w-5" />
            <span>Post</span>
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mt-4 flex items-center gap-3 p-3 w-full rounded-full hover:bg-accent/5 transition-colors">
                  <Avatar className="h-10 w-10">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.display_name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium leading-none">{user.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      ) : (
        <Button 
          className="mt-4 rounded-full w-full py-6 text-lg gap-2 btn-hover-effect sunset-gradient"
          onClick={() => navigate('/register')}
        >
          <span>Sign up for Horizon</span>
        </Button>
      )}
    </div>
  );
} 