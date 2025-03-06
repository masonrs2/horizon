import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaSearch, 
  FaBell, 
  FaEnvelope, 
  FaBookmark, 
  FaUser, 
  FaEllipsisH,
  FaFeather
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const menuItems = [
    {
      icon: <FaHome size={20} />,
      text: 'Home',
      path: '/'
    },
    {
      icon: <FaSearch size={20} />,
      text: 'Explore',
      path: '/explore'
    },
    {
      icon: <FaBell size={20} />,
      text: 'Notifications',
      path: '/notifications'
    },
    {
      icon: <FaEnvelope size={20} />,
      text: 'Messages',
      path: '/messages'
    },
    {
      icon: <FaBookmark size={20} />,
      text: 'Bookmarks',
      path: '/bookmarks'
    },
    {
      icon: <FaUser size={20} />,
      text: 'Profile',
      path: user ? `/profile/${user.username}` : '/profile'
    }
  ];
  
  return (
    <div className="h-screen flex flex-col justify-between p-4 sticky top-0">
      <div>
        {/* Logo */}
        <Link to="/" className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="text-xl font-bold">H</span>
          </div>
        </Link>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-full text-lg hover:bg-accent/10 transition-colors ${
                isActive(item.path) ? 'font-semibold' : ''
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.text}</span>
            </Link>
          ))}
        </nav>
        
        {/* Post button */}
        <Button className="w-full mt-4 rounded-full py-6 md:py-3" size="lg">
          <FaFeather className="md:hidden" size={20} />
          <span className="hidden md:inline">Post</span>
        </Button>
      </div>
      
      {/* User menu */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-3 rounded-full hover:bg-accent/10">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                  <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="font-medium">{user.display_name || user.username}</p>
                  <p className="text-muted-foreground text-sm">@{user.username}</p>
                </div>
              </div>
              <FaEllipsisH className="hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-destructive">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
} 