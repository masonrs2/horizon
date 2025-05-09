import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

// Testimonial data
const testimonials = [
  {
    quote: "Connecting with like-minded creators has never been easier. Horizon helps me share my journey and discover amazing content.",
    author: "Sarah Jensen",
    role: "Photographer & Content Creator"
  },
  {
    quote: "As a developer, I've found an incredible community on Horizon. The UI is sleek and the conversations are meaningful.",
    author: "Alex Chen",
    role: "Senior Developer at TechCorp"
  },
  {
    quote: "Horizon's clean interface makes sharing ideas and discussing important topics so much more enjoyable than other platforms.",
    author: "Maya Johnson",
    role: "AI Ethics Researcher"
  }
];

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  // Use first testimonial for now, could implement carousel functionality
  const testimonial = testimonials[0];
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
      {/* Overlay pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px]" />
      
      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Authentication form */}
        <div className="w-full lg:w-1/2 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <Link to="/" className="inline-block">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
                  <span className="text-xl font-bold">H</span>
                </div>
                <span className="text-white text-xl font-bold">Horizon</span>
              </div>
            </Link>
            <ThemeToggle />
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md p-8 rounded-2xl bg-card/90 backdrop-blur-sm border border-white/10 shadow-xl">
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mb-6">{subtitle}</p>
              )}
              
              {children}
              
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="flex items-center justify-center gap-4">
                  <button className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 hover:bg-background transition-colors">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" className="w-5 h-5" alt="Google" />
                  </button>
                  <a
                    href="https://github.com/masonrs2/horizon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 hover:bg-background transition-colors"
                  >
                    <img
                      src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                      className="w-5 h-5"
                      alt="GitHub"
                    />
                  </a>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center bg-background/50 hover:bg-background transition-colors">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" className="w-5 h-5" alt="Facebook" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="py-4 text-center text-sm text-white/70">
            <p>
              &copy; {new Date().getFullYear()} Horizon. All rights reserved.
            </p>
            <div className="mt-2 space-x-4">
              <Link to="/terms" className="hover:text-white">Terms</Link>
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
            </div>
          </footer>
        </div>
        
        {/* Right side - Testimonials, only visible on larger screens */}
        <div className="hidden lg:flex lg:w-1/2 bg-black/30 backdrop-blur-sm flex-col p-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md p-8">
              <h2 className="text-3xl font-bold text-white mb-6">What our users say.</h2>
              
              <div className="relative">
                <blockquote className="text-xl text-white/90 mb-6">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center">
                  <div className="mr-4 w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500"></div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-white/70 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-2">
                  <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                    <ArrowLeft className="h-5 w-5 text-white" />
                  </button>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
                    <ArrowRight className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>
              
              <div className="mt-12 p-6 rounded-xl bg-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-3">
                  Join our growing community
                </h3>
                <p className="text-white/80">
                  Be among the first to experience the next generation of social networking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 