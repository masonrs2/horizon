import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';
import { MessageCircle, Heart, Repeat2, MoreVertical, Trash, Bookmark } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import { Post } from '@/types';
import { postApi } from '@/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: Post;
  hideActions?: boolean;
  isReply?: boolean;
  compact?: boolean;
}

// Add the PostCardSkeleton component
export function PostCardSkeleton() {
  return (
    <div className="px-6 py-4 border-b border-border/40">
      <div className="flex gap-4">
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-full bg-accent/10 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-32 bg-accent/10 rounded animate-pulse" />
            <div className="h-5 w-24 bg-accent/10 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-full bg-accent/10 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-accent/10 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-8 pt-3">
            <div className="h-4 w-16 bg-accent/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-accent/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-accent/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post, hideActions = false, isReply = false, compact = false }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { likePost, unlikePost, repostPost } = usePostStore();
  
  // Initialize state with post data
  const [isLiked, setIsLiked] = useState(post.has_liked);
  const [likeCount, setLikeCount] = useState(Number(post.like_count) || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [repostsCount, setRepostsCount] = useState(Number(post.repost_count) || 0);
  const [bookmarked, setBookmarked] = useState(post.has_bookmarked);

  // Only update state when the post ID changes or initial mount
  useEffect(() => {
    setIsLiked(post.has_liked);
    setLikeCount(Number(post.like_count) || 0);
    setRepostsCount(Number(post.repost_count) || 0);
    setBookmarked(post.has_bookmarked);
  }, [post.id]); // Only run when post ID changes

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking || !currentUser) return;

    const newIsLiked = !isLiked;
    const currentCount = Number(likeCount) || 0;
    const newLikeCount = currentCount + (newIsLiked ? 1 : -1);

    // Optimistically update UI
    setIsLiking(true);
    setIsLiked(newIsLiked);
    setLikeCount(newLikeCount);

    try {
      if (newIsLiked) {
        await likePost(post.id, currentUser.id);
      } else {
        await unlikePost(post.id, currentUser.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikeCount(currentCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || reposted) return;

    const newRepostCount = repostsCount + 1;
    
    // Optimistically update UI
    setReposted(true);
    setRepostsCount(newRepostCount);

    try {
      await repostPost(post.id, currentUser.id);
    } catch (error) {
      console.error('Failed to repost:', error);
      // Revert on error
      setReposted(false);
      setRepostsCount(repostsCount);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    // Optimistically update UI
    setBookmarked(!bookmarked);

    try {
      if (!bookmarked) {
        await postApi.bookmarkPost(post.id);
      } else {
        await postApi.unbookmarkPost(post.id);
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
      // Revert on error
      setBookmarked(bookmarked);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user?.username) {
      navigate(`/${post.user.username}`);
    }
  };

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Add delete post functionality
    console.log('Delete post:', post.id);
  };

  // Early return if no user data
  if (!post.user) {
    return null;
  }

  // Get the avatar initial safely
  const getAvatarInitial = () => {
    if (post.user?.display_name && post.user.display_name.length > 0) {
      return post.user.display_name[0].toUpperCase();
    }
    if (post.user?.username && post.user.username.length > 0) {
      return post.user.username[0].toUpperCase();
    }
    return 'U';
  };

  const isOwnPost = currentUser?.id === post.user_id;

  // Ensure we have valid numbers for display
  const displayLikeCount = Number(likeCount) || 0;
  const displayReplyCount = Number(post.reply_count) || 0;
  const displayRepostCount = Number(repostsCount) || 0;

  return (
    <div 
      className={cn(
        "group px-6 py-4 hover:bg-accent/5 transition-colors cursor-pointer border-b border-border/40",
        compact && "py-3 px-4"
      )}
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex gap-4">
        <div 
          className="shrink-0" 
          onClick={handleUserClick}
        >
          <Avatar className={cn("w-12 h-12", compact && "w-10 h-10")}>
            {post.user.avatar_url ? (
              <AvatarImage src={post.user.avatar_url} alt={post.user.display_name || post.user.username} />
            ) : (
              <AvatarFallback>
                {getAvatarInitial()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[15px] min-w-0">
              <span 
                className="font-semibold truncate hover:underline"
                onClick={handleUserClick}
              >
                {post.user.display_name || post.user.username}
              </span>
              <span className="text-muted-foreground truncate">@{post.user.username}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground hover:underline">
                {formatRelativeTime(new Date(post.created_at))}
              </span>
            </div>

            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className="opacity-0 group-hover:opacity-100 -mr-2 h-8 w-8 flex items-center justify-center rounded-full hover:bg-primary/10 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={handleDeletePost}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {isReply && post.reply_to_post_id && post.parent_post?.user && (
            <div className="text-sm text-muted-foreground mt-0.5 mb-2">
              Replying to <span className="text-primary hover:underline">@{post.parent_post.user.username}</span>
            </div>
          )}
          
          <div className={cn(
            "mt-2 text-[15px] whitespace-pre-wrap break-words leading-normal",
            compact && "text-sm"
          )}>
            {post.content}
          </div>
          
          {!hideActions && (
            <div className="flex items-center gap-1 mt-3">
              <button
                className="group/action flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/post/${post.id}`);
                }}
              >
                <div className="p-2 rounded-full group-hover/action:bg-primary/10">
                  <MessageCircle className="w-[18px] h-[18px]" />
                </div>
                <span className="text-sm">{formatNumber(displayReplyCount)}</span>
              </button>
              
              <button
                className={cn(
                  "group/action flex items-center gap-1 text-muted-foreground transition-colors ml-6",
                  reposted ? "text-green-500" : "hover:text-green-500"
                )}
                onClick={handleRepost}
              >
                <div className="p-2 rounded-full group-hover/action:bg-green-500/10">
                  <Repeat2 className="w-[18px] h-[18px]" />
                </div>
                <span className="text-sm">{formatNumber(displayRepostCount)}</span>
              </button>
              
              <button
                className={cn(
                  "group/action flex items-center gap-1 text-muted-foreground transition-colors ml-6",
                  isLiked ? "text-red-500" : "hover:text-red-500"
                )}
                onClick={handleLike}
              >
                <div className="p-2 rounded-full group-hover/action:bg-red-500/10">
                  <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} />
                </div>
                <span className="text-sm">{formatNumber(displayLikeCount)}</span>
              </button>

              <button
                className={cn(
                  "group/action flex items-center gap-1 text-muted-foreground transition-colors ml-auto",
                  bookmarked ? "text-primary" : "hover:text-primary"
                )}
                onClick={handleBookmark}
              >
                <div className="p-2 rounded-full group-hover/action:bg-primary/10">
                  <Bookmark className={cn("w-[18px] h-[18px]", bookmarked && "fill-current")} />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}