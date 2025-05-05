import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard, PostCardSkeleton } from '@/components/post/PostCard';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { Button } from '@/components/ui/button';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { Post } from '@/types';
import { MessageCircle } from 'lucide-react';

export function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { currentPost: post, replies, isLoading, error, fetchPostById, fetchReplies } = usePostStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (postId) {
      fetchPostById(postId);
    }
  }, [postId, fetchPostById]);

  const handleRefresh = () => {
    if (postId) {
      fetchPostById(postId);
    }
  };

  const handleReplySuccess = () => {
    if (postId) {
      // Fetch both post and replies to ensure counts are up to date
      fetchPostById(postId);
      fetchReplies(postId);
    }
  };

  const renderContent = () => {
    if (isLoading && !post) {
      return (
        <div className="space-y-4">
          <PostCardSkeleton />
          <div className="p-4">
            <div className="h-20 bg-accent/5 animate-pulse rounded-md" />
          </div>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      );
    }

    if (error && !post) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-destructive mb-4">Failed to load post</p>
          <Button onClick={handleRefresh} variant="outline" className="rounded-full btn-hover-effect">Try again</Button>
        </div>
      );
    }

    if (!post) {
      return null;
    }

    return (
      <div className="divide-y divide-border/40">
        {/* Main post */}
        <PostCard post={post} hideActions={false} />
        
        {/* Reply form */}
        {isAuthenticated && (
          <div className="p-4">
            <CreatePostForm placeholder="Write your reply..." replyToPostId={post.id} onSuccess={handleReplySuccess} />
          </div>
        )}
        
        {/* Replies header */}
        <div className="p-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Replies</h2>
        </div>
        
        {/* Replies */}
        {isLoading ? (
          <div className="space-y-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : replies.length > 0 ? (
          replies.map((reply) => (
            <PostCard key={reply.id} post={reply} isReply={true} />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <p>No replies yet. Be the first to reply!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout 
      title="Post" 
      showBackButton 
    >
      {renderContent()}
    </MainLayout>
  );
} 