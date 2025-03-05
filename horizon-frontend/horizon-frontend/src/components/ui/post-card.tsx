import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Repeat, Share } from "lucide-react";
import { useState } from "react";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    is_private: boolean;
    media_urls: string[];
    like_count: number;
    repost_count: number;
    user?: {
      username: string;
      display_name: string;
      avatar_url: string;
    };
  };
  onLike?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onReply?: (postId: string) => void;
}

export function PostCard({ post, onLike, onRepost, onReply }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  
  // This would actually come from your backend/auth state
  const currentUserId = "user123"; 

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
    
    if (onLike) {
      onLike(post.id);
    }
  };

  // Format the created date
  const timeAgo = post.created_at ? 
    formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : 
    "recently";

  return (
    <Card className="p-4 mb-4 border-b hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="flex space-x-3">
        {/* User avatar */}
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={post.user?.avatar_url || ""} 
            alt={post.user?.username || "User"} 
          />
          <AvatarFallback>
            {post.user?.display_name?.[0] || post.user?.username?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          {/* User info and post time */}
          <div className="flex items-center justify-between">
            <div className="font-semibold">
              {post.user?.display_name || post.user?.username || "User"}
            </div>
            <div className="text-xs text-gray-500">{timeAgo}</div>
          </div>
          
          {/* Username */}
          <div className="text-sm text-gray-500 mb-2">
            @{post.user?.username || "username"}
          </div>
          
          {/* Post content */}
          <div className="mb-3 whitespace-pre-wrap">{post.content}</div>
          
          {/* Media content if available */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-3 rounded-lg overflow-hidden">
              {post.media_urls.length === 1 ? (
                <img 
                  src={post.media_urls[0]} 
                  alt="Post media" 
                  className="w-full h-auto rounded-lg max-h-96 object-cover"
                />
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {post.media_urls.slice(0, 4).map((url, index) => (
                    <img 
                      key={index} 
                      src={url} 
                      alt={`Post media ${index + 1}`} 
                      className="w-full h-40 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex space-x-6 mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-gray-500 hover:text-red-500"
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
              onClick={() => onReply?.(post.id)}
            >
              <MessageCircle className="h-4 w-4" />
              {/* If we had reply count, we would show it here */}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-gray-500 hover:text-green-500"
              onClick={() => onRepost?.(post.id)}
            >
              <Repeat className="h-4 w-4" />
              {post.repost_count > 0 && (
                <span className="text-xs">{post.repost_count}</span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
} 