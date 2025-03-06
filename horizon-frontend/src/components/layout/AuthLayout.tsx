import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white mx-auto">
                <span className="text-xl font-bold">H</span>
              </div>
            </Link>
            <h1 className="mt-6 text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          {children}
        </div>
      </div>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Horizon. All rights reserved.
        </p>
        <div className="mt-2 space-x-4">
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
        </div>
      </footer>
    </div>
  );
} 