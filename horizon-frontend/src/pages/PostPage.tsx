import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard, PostCardSkeleton } from '@/components/post/PostCard';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { Button } from '@/components/ui/button';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { Post as PostType } from '@/types';
import { MessageCircle } from 'lucide-react';

interface PostCardPost {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  reposts_count: number;
  liked_by_user: boolean;
  reposted_by_user: boolean;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

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
      // Just fetch the replies, no need to fetch the entire post
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

    // Transform the API post data to match PostCard's expected format
    const postCardPost: PostCardPost = {
      id: post.id,
      content: post.content,
      created_at: post.created_at,
      likes_count: post.like_count || 0,
      replies_count: replies.length,
      reposts_count: post.repost_count || 0,
      liked_by_user: post.has_liked || false,
      reposted_by_user: false, // TODO: Add reposted_by_user to API
      user: post.user ? {
        id: post.user.id,
        username: post.user.username,
        display_name: post.user.display_name || post.user.username,
        avatar_url: post.user.avatar_url || ''
      } : {
        id: 'unknown',
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: ''
      }
    };

    const transformReply = (reply: PostType): PostCardPost => ({
      id: reply.id,
      content: reply.content,
      created_at: reply.created_at,
      likes_count: reply.like_count || 0,
      replies_count: 0,
      reposts_count: reply.repost_count || 0,
      liked_by_user: false,
      reposted_by_user: false,
      user: reply.user ? {
        id: reply.user.id,
        username: reply.user.username,
        display_name: reply.user.display_name || reply.user.username,
        avatar_url: reply.user.avatar_url || ''
      } : {
        id: 'unknown',
        username: 'unknown',
        display_name: 'Unknown User',
        avatar_url: ''
      }
    });

    return (
      <div className="divide-y divide-border/40">
        {/* Main post */}
        <PostCard post={postCardPost} hideActions={false} />
        
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
            <PostCard key={reply.id} post={transformReply(reply)} isReply={true} />
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