import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { PostCard } from '@/components/post/PostCard';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { Spinner } from '@/components/ui/Spinner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useAuthStore } from '@/store/authStore';
import { Post as PostType } from '@/types';
import { postApi } from '@/api/postApi';

const POSTS_PER_PAGE = 20;

export function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  // Load initial posts
  useEffect(() => {
    if (isAuthenticated) {
      loadPosts(0);
    }
  }, [activeTab, isAuthenticated]); // Reload when tab changes or auth state changes

  // Load posts
  const loadPosts = async (offset: number) => {
    try {
      setLoading(true);
      // For now, we'll use getPosts for both tabs since we haven't implemented following feed yet
      const newPosts = await postApi.getPosts(POSTS_PER_PAGE, offset);
      
      if (offset === 0) {
        setPosts(newPosts);
      } else {
        setPosts(prev => {
          // Ensure we don't have duplicate posts
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
      setHasMore(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more posts when scrolling
  const loadMore = () => {
    if (!loading && hasMore && isAuthenticated) {
      loadPosts(posts.length);
    }
  };

  // Set up infinite scroll
  const { observerRef } = useInfiniteScroll(loadMore);

  // Handle post creation success
  const handlePostSuccess = () => {
    loadPosts(0); // Reload posts from the beginning
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' }
  ];

  return (
    <MainLayout
      title="Home"
      showTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId as 'for-you' | 'following')}
      rightContent={<RightSidebar />}
    >
        {/* Create Post Form */}
        <div className="border-b p-4">
          <CreatePostForm onSuccess={handlePostSuccess} />
        </div>

        {/* Posts */}
        <div className="divide-y">
          {posts.map(post => (
            <PostCard 
              key={`${post.id}-${post.updated_at || post.created_at}`} 
              post={post} 
            />
          ))}

          {loading && posts.length === 0 && (
            <div className="flex h-[200px] items-center justify-center">
              <Spinner />
            </div>
          )}

          {hasMore && !loading && (
            <div ref={observerRef} className="flex justify-center p-4">
              <Spinner />
            </div>
          )}

          {!hasMore && posts.length === 0 && !loading && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <p className="text-lg font-medium">
                {activeTab === 'following' 
                  ? "You're not following anyone yet"
                  : "No posts yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'following'
                  ? "When you follow people, you'll see their posts here."
                  : "Be the first one to post something!"}
              </p>
            </div>
          )}
        </div>
    </MainLayout>
  );
} 