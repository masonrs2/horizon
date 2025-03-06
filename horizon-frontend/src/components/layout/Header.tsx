import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showTabs?: boolean;
  tabs?: {
    id: string;
    label: string;
  }[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  rightContent?: ReactNode;
}

export function Header({ 
  title, 
  showBackButton = false, 
  showTabs = false, 
  tabs = [],
  activeTab = '',
  onTabChange,
  rightContent
}: HeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/60">
      <div className="flex items-center h-14 px-4">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-2 rounded-full btn-hover-effect"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        
        {title && (
          <h1 className="font-semibold text-lg">{title}</h1>
        )}
        
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {rightContent && rightContent}
        </div>
      </div>
      
      {showTabs && tabs.length > 0 && (
        <div className="flex border-b border-border/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "flex-1 py-3 px-6 text-center relative font-medium text-sm transition-all duration-200 hover:bg-accent/5",
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 sunset-gradient mx-auto w-16 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
} 