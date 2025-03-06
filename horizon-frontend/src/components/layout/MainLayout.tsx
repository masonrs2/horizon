import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface MainLayoutProps {
  children: ReactNode;
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

export function MainLayout({ 
  children, 
  title,
  showBackButton,
  showTabs,
  tabs,
  activeTab,
  onTabChange,
  rightContent
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - hidden on mobile */}
      <Sidebar />
      
      {/* Main content area */}
      <main className="flex-1 md:ml-[275px] flex flex-col min-h-screen border-x border-border/40 md:max-w-2xl relative bg-background">
        <Header 
          title={title} 
          showBackButton={showBackButton} 
          showTabs={showTabs}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        <div className="flex-1 bg-background">
          {children}
        </div>
      </main>
      
      {/* Right sidebar - hidden on mobile */}
      {rightContent && (
        <aside className="hidden lg:block w-[350px] p-4 sticky top-0 h-screen overflow-y-auto bg-background">
          <div className="space-y-4">
            {rightContent}
          </div>
        </aside>
      )}
      
      {/* Mobile navigation - visible only on mobile */}
      <MobileNav />
    </div>
  );
} 