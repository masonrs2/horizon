import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHome } from 'react-icons/fa';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showTabs?: boolean;
  tabs?: {
    id: string;
    label: string;
  }[];
}

export function Header({ 
  title, 
  showBackButton = false, 
  showTabs = false,
  tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' }
  ]
}: HeaderProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  
  const isHomePage = location.pathname === '/';
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const displayTitle = title || (isHomePage ? 'Home' : '');
  
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center h-14 px-4">
        {showBackButton ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-4"
            onClick={handleBack}
          >
            <FaArrowLeft />
          </Button>
        ) : isHomePage && user ? (
          <Avatar className="h-8 w-8 mr-4 md:hidden">
            <AvatarImage src={user.avatar_url || ''} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        ) : null}
        
        <h1 className="text-xl font-semibold flex-1">{displayTitle}</h1>
        
        {isHomePage && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex text-primary"
          >
            <FaHome size={20} />
          </Button>
        )}
      </div>
      
      {showTabs && (
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex-1 h-12 font-medium text-sm relative ${
                activeTab === tab.id 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full mx-auto w-16" />
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
} 