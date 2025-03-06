import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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
}

export function MainLayout({ 
  children, 
  title,
  showBackButton,
  showTabs,
  tabs
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - hidden on mobile, visible from md breakpoint */}
      <div className="hidden md:block md:w-64 lg:w-72 shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col border-x-0 md:border-x max-w-screen-md mx-auto">
        <Header 
          title={title} 
          showBackButton={showBackButton}
          showTabs={showTabs}
          tabs={tabs}
        />
        
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>
      
      {/* Third column - only visible on large screens */}
      <div className="hidden lg:block lg:w-80 xl:w-96">
        <div className="sticky top-0 p-4">
          <div className="rounded-xl bg-accent/5 p-4">
            <h2 className="font-semibold text-lg mb-4">Who to follow</h2>
            {/* This could be populated with suggested users */}
            <p className="text-muted-foreground">Suggestions will appear here</p>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation - only visible on mobile */}
      <MobileNav />
    </div>
  );
} 