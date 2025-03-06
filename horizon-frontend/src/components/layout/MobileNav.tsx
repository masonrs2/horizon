import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaSearch, 
  FaBell, 
  FaUser,
  FaFeather
} from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CreatePostForm } from '@/components/post/CreatePostForm';

export function MobileNav() {
  const { user } = useAuthStore();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    {
      icon: <FaHome size={22} />,
      path: '/'
    },
    {
      icon: <FaSearch size={22} />,
      path: '/explore'
    },
    {
      icon: <FaBell size={22} />,
      path: '/notifications'
    },
    {
      icon: <FaUser size={22} />,
      path: user ? `/profile/${user.username}` : '/profile'
    }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-10">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex items-center justify-center p-3 flex-1 ${
              isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
          </Link>
        ))}
        
        <Sheet>
          <SheetTrigger asChild>
            <Button className="rounded-full h-10 w-10 p-0 flex-1" size="icon">
              <FaFeather size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl">
            <div className="py-4">
              <CreatePostForm />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 