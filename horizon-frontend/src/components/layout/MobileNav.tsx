import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, PenSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function MobileNav() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
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
      label: 'Notifications'
    },
    {
      icon: Mail,
      path: '/messages',
      label: 'Messages'
    },
  ];
  
  return (
    <>
      {/* Floating post button for mobile */}
      <Button 
        size="icon" 
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 rounded-full z-50 shadow-lg sunset-gradient btn-hover-effect border border-primary/20"
      >
        <PenSquare className="h-6 w-6" />
      </Button>
    
      {/* Bottom navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-background/80 backdrop-blur-md border-t border-border z-40 flex items-center justify-around px-2">
        {navItems.map((item) => (
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
      </div>
    </>
  );
} 