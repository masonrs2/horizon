import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard, PostCardSkeleton } from '@/components/post/PostCard';
import { postApi } from '@/api';
import { Post } from '@/types';
import { Bookmark } from 'lucide-react';

export function BookmarksPage() {
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setIsLoading(true);
        const posts = await postApi.getUserBookmarks();
        setBookmarkedPosts(posts);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
        setError('Failed to load bookmarks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return Array(3).fill(0).map((_, i) => (
        <PostCardSkeleton key={i} />
      ));
    }

    if (error) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-destructive mb-2">{error}</p>
          <p>Please try again later.</p>
        </div>
      );
    }

    if (bookmarkedPosts.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
            <Bookmark className="h-12 w-12 text-primary/40" />
          </div>
          <p className="text-lg font-semibold mb-2">No bookmarks yet</p>
          <p>When you bookmark posts, they will show up here.</p>
        </div>
      );
    }

    return bookmarkedPosts.map(post => (
      <PostCard key={post.id} post={post} />
    ));
  };

  return (
    <MainLayout
      title="Bookmarks"
      showBackButton
      rightContent={
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card shadow-sm border border-border/40 hover:border-border/60 transition-colors duration-300">
            <h2 className="font-semibold text-lg mb-2">About Bookmarks</h2>
            <p className="text-muted-foreground text-sm">
              Save posts for later by bookmarking them. Bookmarked posts are private and only visible to you.
            </p>
          </div>
        </div>
      }
    >
      <div className="divide-y divide-border/40">
        {renderContent()}
      </div>
    </MainLayout>
  );
} 