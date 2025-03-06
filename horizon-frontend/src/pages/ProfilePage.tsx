import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/post/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { userApi } from '@/api';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { User } from '@/types';
import { FaCalendarAlt, FaLink } from 'react-icons/fa';
import { format } from 'date-fns';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { userPosts, fetchUserPosts, isLoading: postsLoading } = usePostStore();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  
  const isOwnProfile = currentUser?.username === username;
  
  // Tabs for the profile
  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Media' },
    { id: 'likes', label: 'Likes' }
  ];
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const userData = await userApi.getUserByUsername(username);
        setUser(userData);
        fetchUserPosts(username);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [username, fetchUserPosts]);
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'MMMM yyyy');
  };
  
  const renderProfileHeader = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-32 bg-accent/10"></div>
          <div className="px-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-24 w-24 rounded-full -mt-12 border-4 border-background" />
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (error || !user) {
      return (
        <div className="p-6 text-center">
          <p className="text-destructive">{error || 'User not found'}</p>
        </div>
      );
    }
    
    return (
      <div>
        {/* Cover image */}
        <div className="h-32 bg-accent/10"></div>
        
        {/* Profile info */}
        <div className="px-4">
          <div className="flex justify-between items-start">
            <Avatar className="h-24 w-24 -mt-12 border-4 border-background">
              <AvatarImage src={user.avatar_url || ''} alt={user.username} />
              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            {isOwnProfile ? (
              <Button variant="outline" className="mt-3">
                Edit profile
              </Button>
            ) : (
              <Button className="mt-3">
                Follow
              </Button>
            )}
          </div>
          
          <div className="mt-3">
            <h1 className="text-xl font-bold">{user.display_name || user.username}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            
            {user.bio && (
              <p className="mt-3 whitespace-pre-wrap">{user.bio}</p>
            )}
            
            <div className="flex gap-4 mt-3 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                <FaCalendarAlt />
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
            </div>
            
            <div className="flex gap-4 mt-3">
              <div className="flex gap-1">
                <span className="font-semibold">123</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex gap-1">
                <span className="font-semibold">456</span>
                <span className="text-muted-foreground">Followers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <MainLayout 
      title={user?.display_name || username || 'Profile'} 
      showBackButton
      showTabs
      tabs={tabs}
    >
      <div>
        {renderProfileHeader()}
        
        {/* Profile Tabs */}
        <div className="mt-4">
          {postsLoading && (
            <div className="p-4 space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!postsLoading && userPosts.length === 0 && (
            <div className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                When they post, their posts will show up here.
              </p>
            </div>
          )}
          
          {userPosts.length > 0 && (
            <div>
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
} 