import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatNumber } from '@/lib/utils';
import { Post as ApiPost } from '@/types';

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

interface PostCardProps {
  post: PostCardPost | ApiPost;
  isReply?: boolean;
  hideActions?: boolean;
}

export function PostCard({ post: rawPost, isReply = false, hideActions = false }: PostCardProps) {
  // Transform API post to PostCardPost if needed
  const post: PostCardPost = 'like_count' in rawPost ? {
    id: rawPost.id,
    content: rawPost.content,
    created_at: rawPost.created_at,
    likes_count: rawPost.like_count || 0,
    replies_count: 0, // TODO: Add reply count to API
    reposts_count: rawPost.repost_count || 0,
    liked_by_user: false, // TODO: Add liked_by_user to API
    reposted_by_user: false, // TODO: Add reposted_by_user to API
    user: rawPost.user ? {
      id: rawPost.user.id,
      username: rawPost.user.username,
      display_name: rawPost.user.display_name || rawPost.user.username,
      avatar_url: rawPost.user.avatar_url || ''
    } : {
      id: 'unknown',
      username: 'unknown',
      display_name: 'Unknown User',
      avatar_url: ''
    }
  } : rawPost as PostCardPost;

  const [liked, setLiked] = useState(post.liked_by_user);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [reposted, setReposted] = useState(post.reposted_by_user);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // In a real app, you would call an API here
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // In a real app, you would call an API here
    setReposted(!reposted);
    setRepostsCount(reposted ? repostsCount - 1 : repostsCount + 1);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // In a real app, you would implement sharing functionality
    console.log('Share post:', post.id);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d');
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <Link 
      to={`/post/${post.id}`} 
      className="block hover:bg-accent/5 transition-all duration-200"
    >
      <article className={cn(
        "p-4 border-b border-border/40", 
        isReply && "pt-2 pb-4"
      )}>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Link 
              to={`/profile/${post.user.username}`} 
              className="block gradient-hover rounded-full" 
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={post.user.avatar_url} alt={post.user.username} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {post.user.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <Link 
                to={`/profile/${post.user.username}`} 
                className="font-semibold truncate hover:underline hover:text-primary transition-colors duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {post.user.display_name}
              </Link>
              <span className="text-muted-foreground">@{post.user.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground text-sm">{formatDate(post.created_at)}</span>
            </div>
            
            <div className="whitespace-pre-wrap break-words mb-3">{post.content}</div>
            
            {!hideActions && (
              <div className="flex justify-between max-w-md -ml-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full gap-1.5 btn-hover-effect"
                  onClick={(e) => {e.preventDefault(); e.stopPropagation()}}
                >
                  <MessageCircle className="h-4 w-4" />
                  {post.replies_count > 0 && (
                    <span className="text-xs">{formatNumber(post.replies_count)}</span>
                  )}
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
                  <Repeat2 className="h-4 w-4" />
                  {repostsCount > 0 && (
                    <span className="text-xs">{formatNumber(repostsCount)}</span>
                  )}
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
                  <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                  {likesCount > 0 && (
                    <span className="text-xs">{formatNumber(likesCount)}</span>
                  )}
                </Button>
                
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full btn-hover-effect"
                  onClick={handleShare}
                >
                  <Share className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="p-4 border-b border-border/40">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}