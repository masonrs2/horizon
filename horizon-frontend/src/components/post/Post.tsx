import { useEffect, useState } from 'react';
import { ArrowLeft, MoreHorizontal, Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { formatNumber } from '@/lib/utils';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { postApi } from '@/api';

interface PostProps {
  post?: {
    id: string;
    content: string;
    author: {
      username: string;
      handle: string;
      avatarUrl: string;
      verified?: boolean;
    };
    createdAt: string;
    stats: {
      replies: number;
      reposts: number;
      likes: number;
      views: number;
    };
  };
}

export function Post({ post: propPost }: PostProps) {
  const navigate = useNavigate();
  const { postId } = useParams();
  const { currentPost, isLoading, error, fetchPostById, repostPost } = usePostStore();
  const { user } = useAuthStore();

  // Initialize liked state from either prop post or current post
  const [liked, setLiked] = useState(() => {
    if (propPost?.stats?.likes) {
      return propPost.stats.likes > 0;
    }
    return currentPost?.has_liked || false;
  });
  const [reposted, setReposted] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPostById(postId);
    }
  }, [postId, fetchPostById]);

  // Update liked state when currentPost changes
  useEffect(() => {
    if (currentPost) {
      setLiked(currentPost.has_liked || false);
    }
  }, [currentPost]);

  // If post is provided as prop, use that, otherwise use the fetched post
  const post = propPost || (currentPost ? {
    id: currentPost.id,
    content: currentPost.content,
    author: currentPost.user ? {
      username: currentPost.user.display_name || currentPost.user.username || 'Unknown User',
      handle: currentPost.user.username || 'unknown',
      avatarUrl: currentPost.user.avatar_url || '',
      verified: false // TODO: Add verification status to user model
    } : {
      username: 'Unknown User',
      handle: 'unknown',
      avatarUrl: '',
      verified: false
    },
    createdAt: currentPost.created_at,
    stats: {
      replies: currentPost.reply_count || 0,
      reposts: currentPost.repost_count || 0,
      likes: currentPost.like_count || 0,
      views: 0 // TODO: Add view count to post model
    }
  } : null);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !post) return;
    
    try {
      if (liked) {
        await postApi.unlikePost(post.id);
      } else {
        await postApi.likePost(post.id);
      }
      
      // Update local state immediately for better UX
      setLiked(!liked);
      
      // Update the post stats by fetching the latest state
      if (postId) {
        fetchPostById(postId);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert local state if the API call failed
      setLiked(liked);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !post) return;
    
    try {
      await repostPost(post.id, user.id);
      setReposted(!reposted);
    } catch (error) {
      console.error('Failed to repost:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Post</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading post...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Post</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-destructive">Failed to load post</p>
          <Button 
            onClick={() => postId && fetchPostById(postId)}
            variant="outline" 
            className="rounded-full"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Post</h1>
      </div>

      {/* Post Content */}
      <div className="flex flex-col p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              {post.author.avatarUrl ? (
                <img src={post.author.avatarUrl} alt={post.author.username} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  {post.author.username.charAt(0).toUpperCase()}
                </div>
              )}
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{post.author.username}</span>
                {post.author.verified && (
                  <span className="text-primary">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M8.52 3.59a.75.75 0 0 1 .93-.5l1.69.53L12 2.5l.86 1.12 1.69-.53a.75.75 0 0 1 .93.5l.53 1.69L17.5 6l-1.12.86.53 1.69a.75.75 0 0 1-.5.93l-1.69.53L14.5 12l1.12.86-.53 1.69a.75.75 0 0 1-.93.5l-1.69-.53L12 15.5l-.86-1.12-1.69.53a.75.75 0 0 1-.93-.5l-.53-1.69L6.5 12l1.12-.86-.53-1.69a.75.75 0 0 1 .5-.93l1.69-.53L10.5 6 9.38 5.14l.53-1.69ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                    </svg>
                  </span>
                )}
              </div>
              <span className="text-muted-foreground">@{post.author.handle}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="mt-3 text-xl">{post.content}</div>

        <div className="mt-4 text-sm text-muted-foreground">
          {post.createdAt} · {formatNumber(post.stats.views)} views
        </div>

        <div className="flex items-center justify-between max-w-md mt-4 py-4 border-y">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full gap-1.5 btn-hover-effect"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">{formatNumber(post.stats.replies)}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "rounded-full gap-1.5 btn-hover-effect",
              reposted 
                ? "text-green-500 hover:text-green-600 hover:bg-green-100/20" 
                : "text-muted-foreground hover:text-green-500 hover:bg-green-100/10"
            )}
            onClick={handleRepost}
          >
            <Repeat2 className="h-5 w-5" />
            <span className="font-semibold">{formatNumber(post.stats.reposts)}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "rounded-full gap-1.5 btn-hover-effect",
              liked 
                ? "text-primary hover:text-primary/90 hover:bg-primary/10" 
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
            onClick={handleLike}
          >
            <Heart className={cn("h-5 w-5", liked && "fill-current")} />
            <span className="font-semibold">{formatNumber(post.stats.likes)}</span>
          </Button>
          
          <Button 
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full btn-hover-effect"
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Reply Input */}
      <div className="flex items-start gap-3 p-4 border-b">
        <Avatar className="h-8 w-8" />
        <div className="flex-1">
          <input
            type="text"
            placeholder="Post your reply"
            className="w-full bg-transparent border-none outline-none text-lg"
          />
        </div>
        <Button size="sm" className="rounded-full">
          Reply
        </Button>
      </div>
    </div>
  );
}