import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaRegHeart, FaHeart, FaRetweet, FaRegComment, FaEllipsisH } from 'react-icons/fa';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Post } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { usePostStore } from '@/store/postStore';

interface PostCardProps {
  post: Post;
  showActions?: boolean;
}

export function PostCard({ post, showActions = true }: PostCardProps) {
  const { user } = useAuthStore();
  const { likePost, repostPost } = usePostStore();
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);

  const handleLike = () => {
    if (!user) return;
    likePost(post.id, user.id);
    setIsLiked(true);
  };

  const handleRepost = () => {
    if (!user) return;
    repostPost(post.id, user.id);
    setIsReposted(true);
  };

  const handleReply = () => {
    // This would open a reply dialog or navigate to a reply page
    console.log('Reply to post', post.id);
  };

  // Get the first letter of the username for the avatar fallback
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Format the date to a relative time (e.g., "2 hours ago")
  const formattedDate = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <Card className="mb-4 border-0 border-b rounded-none hover:bg-accent/5 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={`/profile/${post.user?.username || ''}`} className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.user?.avatar_url || ''} alt={post.user?.username || ''} />
              <AvatarFallback>{getInitials(post.user?.username || 'U')}</AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <Link 
                  to={`/profile/${post.user?.username || ''}`} 
                  className="font-semibold hover:underline"
                >
                  {post.user?.display_name || post.user?.username || 'Unknown User'}
                </Link>
                <span className="text-muted-foreground">
                  @{post.user?.username || 'unknown'}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{formattedDate}</span>
              </div>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <FaEllipsisH className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Copy link</DropdownMenuItem>
                    {user?.id === post.user_id && (
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <div className="mt-1 text-base whitespace-pre-wrap break-words">
              {post.content}
            </div>
            
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-3 rounded-md overflow-hidden">
                {post.media_urls.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt="Post media" 
                    className="w-full h-auto rounded-md"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="p-0 px-4 pb-2">
          <div className="flex justify-between w-full">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={handleReply}
            >
              <FaRegComment className="mr-1 h-4 w-4" />
              <span className="text-xs">{post.reply_to_post_id ? '1' : '0'}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${isReposted ? 'text-green-500' : 'text-muted-foreground'} hover:text-green-500 hover:bg-green-500/10`}
              onClick={handleRepost}
            >
              <FaRetweet className="mr-1 h-4 w-4" />
              <span className="text-xs">{post.repost_count}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500 hover:bg-red-500/10`}
              onClick={handleLike}
            >
              {isLiked ? (
                <FaHeart className="mr-1 h-4 w-4" />
              ) : (
                <FaRegHeart className="mr-1 h-4 w-4" />
              )}
              <span className="text-xs">{post.like_count}</span>
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}