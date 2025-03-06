import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { PostCard } from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';

export function HomePage() {
  const { posts, fetchFeed, isLoading, error } = usePostStore();
  const { user, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('for-you');
  
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);
  
  const handleRefresh = () => {
    fetchFeed();
  };
  
  // Tabs for the feed
  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' }
  ];
  
  return (
    <MainLayout 
      title="Home" 
      showTabs 
      tabs={tabs}
    >
      <div className="">
        {/* Create Post Form */}
        {isAuthenticated && (
          <div className="p-4 border-b">
            <CreatePostForm />
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && posts.length === 0 && (
          <div className="p-4 space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && posts.length === 0 && (
          <div className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Welcome to Horizon!</h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === 'for-you' 
                ? "There aren't any posts yet. Be the first to post!"
                : "You're not following anyone yet. Find people to follow!"}
            </p>
            {!isAuthenticated && (
              <div className="space-y-2">
                <p className="text-muted-foreground">Join the conversation!</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" asChild>
                    <a href="/login">Sign in</a>
                  </Button>
                  <Button asChild>
                    <a href="/signup">Create account</a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Posts List */}
        {posts.length > 0 && (
          <div>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 