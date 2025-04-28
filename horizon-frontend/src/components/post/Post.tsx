import { useEffect } from 'react';
import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { formatNumber } from '@/lib/utils';
import { usePostStore } from '@/store/postStore';

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
  const { currentPost, isLoading, error, fetchPostById } = usePostStore();

  useEffect(() => {
    if (postId) {
      fetchPostById(postId);
    }
  }, [postId, fetchPostById]);

  // If post is provided as prop, use that, otherwise use the fetched post
  const post = propPost || (currentPost && currentPost.user ? {
    id: currentPost.id,
    content: currentPost.content,
    author: {
      username: currentPost.user.display_name || currentPost.user.username,
      handle: currentPost.user.username,
      avatarUrl: currentPost.user.avatar_url || '',
      verified: false // TODO: Add verification status to user model
    },
    createdAt: currentPost.created_at,
    stats: {
      replies: 0, // TODO: Add reply count to post model
      reposts: currentPost.repost_count || 0,
      likes: currentPost.like_count || 0,
      views: 0 // TODO: Add view count to post model
    }
  } : null);

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
              <img src={post.author.avatarUrl} alt={post.author.username} />
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

        <div className="flex items-center gap-6 mt-4 py-4 border-y">
          <div className="flex items-center gap-1">
            <span className="font-semibold">{formatNumber(post.stats.replies)}</span>
            <span className="text-muted-foreground">Replies</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{formatNumber(post.stats.reposts)}</span>
            <span className="text-muted-foreground">Reposts</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{formatNumber(post.stats.likes)}</span>
            <span className="text-muted-foreground">Likes</span>
          </div>
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