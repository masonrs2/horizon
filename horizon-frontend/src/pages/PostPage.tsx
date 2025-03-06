import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/post/PostCard';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { Separator } from '@/components/ui/separator';

export function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { currentPost, fetchPostById, isLoading, error } = usePostStore();
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
  
  return (
    <MainLayout title="Post" showBackButton>
      <div>
        {/* Loading State */}
        {isLoading && !currentPost && (
          <div className="p-4 space-y-6">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        )}
        
        {/* Post */}
        {currentPost && (
          <div>
            <PostCard post={currentPost} showActions={false} />
            
            <div className="px-4 py-3 flex justify-between text-sm text-muted-foreground border-b">
              <div>{currentPost.like_count} likes</div>
              <div>{currentPost.repost_count} reposts</div>
            </div>
            
            <div className="flex justify-evenly py-3 border-b">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Like
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Repost
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Share
              </Button>
            </div>
            
            {/* Reply Form */}
            {isAuthenticated && (
              <div className="p-4 border-b">
                <CreatePostForm 
                  replyToPostId={currentPost.id} 
                  onSuccess={handleRefresh}
                />
              </div>
            )}
            
            {/* Replies would go here */}
            <div className="p-6 text-center text-muted-foreground">
              <p>No replies yet</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 