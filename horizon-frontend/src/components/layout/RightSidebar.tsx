import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  return (
    <aside className={cn("w-[350px]", className)}>
      <div className={cn("w-[350px]", className)}>
        <div className="fixed w-[350px] pl-4 pr-2 pt-2">
          {/* Search bar */}
          <div className="sticky top-0 z-10 bg-background/95 px-4 pb-4 pt-2 backdrop-blur">
            <div className="relative">
              <input
                type="search"
                placeholder="Search"
                className="w-full rounded-full border bg-muted px-4 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="px-4">
            {/* Who to follow section */}
            <Card className="mb-4">
              <div className="p-4">
                <h2 className="mb-4 text-xl font-bold">Who to follow</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <div className="bg-primary/10 text-primary h-full w-full flex items-center justify-center">
                            U{i}
                          </div>
                        </Avatar>
                        <div>
                          <p className="font-medium">User {i}</p>
                          <p className="text-sm text-muted-foreground">@user{i}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full">
                        Follow
                      </Button>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-primary">
                    Show more
                  </Button>
                </div>
              </div>
            </Card>

            {/* Trending section */}
            <Card className="mb-4">
              <div className="p-4">
                <h2 className="mb-4 text-xl font-bold">What's happening</h2>
                <div className="space-y-4">
                  {[
                    { category: 'Technology', topic: '#AI', posts: '100K' },
                    { category: 'Trending', topic: '#WebDev', posts: '50K' },
                    { category: 'Science', topic: '#Space', posts: '25K' },
                  ].map((trend, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-sm text-muted-foreground">{trend.category}</p>
                      <p className="font-medium">{trend.topic}</p>
                      <p className="text-sm text-muted-foreground">{trend.posts} posts</p>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-primary">
                    Show more
                  </Button>
                </div>
              </div>
            </Card>

            {/* Footer links */}
            <div className="text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-2">
                <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                  Terms
                </Button>
                <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                  Privacy
                </Button>
                <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                  Cookies
                </Button>
                <Button variant="link" className="h-auto p-0 text-xs text-muted-foreground">
                  About
                </Button>
              </div>
              <p className="mt-2">© 2024 Horizon</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
} 