import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard, PostCardSkeleton } from '@/components/post/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { CalendarDays, MapPin, Link as LinkIcon, User as UserIcon, Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { userApi, postApi } from '@/api';
import { FollowListModal } from '@/components/ui/FollowListModal';
import { Post } from '@/types';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  location?: string;
  website?: string;
  created_at: string;
  followers_count: number;
  following_count: number;
}

interface ProfilePagePost {
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

interface ReplyWithParent {
  reply: Post;
  parentPost: Post;
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const { isAuthenticated, user } = useAuthStore();
  const isOwnProfile = isAuthenticated && user && user.username === username;
  const [posts, setPosts] = useState<ProfilePagePost[]>([]);
  const [replies, setReplies] = useState<ReplyWithParent[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isLoadingLikes, setIsLoadingLikes] = useState(false);
  
  // Add state for follow list modal
  const [followListModalOpen, setFollowListModalOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch user data
        const user = await userApi.getUserByUsername(username);
        
        // Transform user data to match ProfileData interface
        const profileData: ProfileData = {
          id: user.id,
          username: user.username,
          display_name: user.display_name || user.username,
          avatar_url: user.avatar_url || '',
          bio: user.bio || '',
          location: '', // Not implemented yet
          website: '', // Not implemented yet
          created_at: user.created_at,
          followers_count: user.followers_count,
          following_count: user.following_count
        };

        setUserData(profileData);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        if (err.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load user profile');
        }
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [username]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!username) return;

      try {
        if (activeTab === 'posts') {
          const userPosts = await postApi.getUserPosts(username);
          setPosts(userPosts.map(post => ({
            ...post,
            user: {
              id: post.user?.id || post.user_id,
              username: post.user?.username || username,
              display_name: post.user?.display_name || username,
              avatar_url: post.user?.avatar_url || ''
            }
          })));
        } else if (activeTab === 'replies') {
          setIsLoadingReplies(true);
          const userReplies = await postApi.getUserReplies(username);
          setReplies(userReplies);
          setIsLoadingReplies(false);
        } else if (activeTab === 'likes') {
          setIsLoadingLikes(true);
          const likes = await postApi.getUserLikes(username);
          setLikedPosts(likes);
          setIsLoadingLikes(false);
        }
      } catch (err) {
        console.error('Failed to fetch content:', err);
      }
    };

    fetchContent();
  }, [username, activeTab]);

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!username || !isAuthenticated) return;
      
      try {
        const status = await userApi.getFollowStatus(username);
        setIsFollowing(status.is_following);
      } catch (err) {
        console.error('Failed to fetch follow status:', err);
      }
    };

    fetchFollowStatus();
  }, [username, isAuthenticated]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const tabs = [
    { id: 'posts', label: 'Posts' },
    { id: 'replies', label: 'Replies' },
    { id: 'media', label: 'Media' },
    { id: 'likes', label: 'Likes' }
  ];

  const handleFollowListClick = (type: 'followers' | 'following') => {
    setFollowListType(type);
    setFollowListModalOpen(true);
  };

  const handleFollowToggle = async () => {
    if (!username || !isAuthenticated) return;
    
    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        await userApi.unfollowUser(username);
        setIsFollowing(false);
      } else {
        const response = await userApi.followUser(username);
        setIsFollowing(response.is_accepted);
      }
      
      // Refresh user data to update counts
      const updatedUser = await userApi.getUserByUsername(username);
      setUserData(prevData => ({
        ...prevData!,
        followers_count: updatedUser.followers_count,
        following_count: updatedUser.following_count
      }));
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const renderProfileHeader = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4 border-b border-border/40">
          <div className="h-40 w-full bg-accent/5 rounded-lg animate-pulse" />
          <div className="flex justify-between items-end">
            <div className="h-24 w-24 rounded-full bg-accent/10 border-4 border-background animate-pulse -mt-12" />
            <div className="h-10 w-24 rounded-full bg-accent/10 animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-6 w-1/3 bg-accent/10 rounded animate-pulse" />
            <div className="h-4 w-1/4 bg-accent/10 rounded animate-pulse" />
            <div className="h-4 w-full bg-accent/10 rounded animate-pulse mt-4" />
            <div className="h-4 w-2/3 bg-accent/10 rounded animate-pulse" />
          </div>
        </div>
      );
    }
    
    if (error || !userData) {
      return (
        <div className="p-8 text-center border-b border-border/40">
          <div className="text-destructive mb-4">{error || 'Failed to load profile'}</div>
          <Button variant="outline" className="rounded-full btn-hover-effect" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      );
    }
    
    return (
      <div className="border-b border-border/40">
        {/* Cover image */}
        <div className="h-40 w-full bg-gradient-to-r from-primary/20 to-accent/30 overflow-hidden">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1502790671504-542ad42d5189?auto=format&fit=crop&w=800&q=60')] bg-cover bg-center opacity-60"></div>
        </div>
        
        {/* Profile info section */}
        <div className="px-4 pb-4">
          <div className="flex justify-between items-end mb-3">
            <Avatar className="h-24 w-24 border-4 border-background -mt-12 shadow-md">
              {userData.avatar_url ? (
                <AvatarImage src={userData.avatar_url} alt={userData.display_name} />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {userData.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            {isOwnProfile ? (
              <Button variant="outline" className="rounded-full btn-hover-effect">
                Edit profile
              </Button>
            ) : (
              <Button 
                className={`rounded-full ${isFollowing ? 'bg-primary/10 hover:bg-primary/20 text-primary' : 'sunset-gradient'} btn-hover-effect`}
                onClick={handleFollowToggle}
                disabled={isLoadingFollow}
              >
                {isLoadingFollow ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isFollowing ? (
                  'Following'
                ) : (
                  'Follow'
                )}
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            <div>
              <h1 className="text-xl font-bold">{userData.display_name}</h1>
              <p className="text-muted-foreground">@{userData.username}</p>
            </div>
            
            {userData.bio && (
              <p>{userData.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {userData.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{userData.location}</span>
                </div>
              )}
              
              {userData.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  <a href={userData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {userData.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>Joined {formatDate(userData.created_at)}</span>
              </div>
            </div>
            
            <div className="flex gap-4 text-sm">
              <button
                onClick={() => handleFollowListClick('following')}
                className="hover:underline cursor-pointer"
              >
                <span className="font-semibold">{formatNumber(userData.following_count)}</span>{' '}
                <span className="text-muted-foreground">Following</span>
              </button>
              <button
                onClick={() => handleFollowListClick('followers')}
                className="hover:underline cursor-pointer"
              >
                <span className="font-semibold">{formatNumber(userData.followers_count)}</span>{' '}
                <span className="text-muted-foreground">Followers</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading || (activeTab === 'replies' && isLoadingReplies) || (activeTab === 'likes' && isLoadingLikes)) {
      return Array(3).fill(0).map((_, i) => (
        <PostCardSkeleton key={i} />
      ));
    }

    if (activeTab === 'posts') {
      if (posts.length === 0) {
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No posts yet</p>
            <p>When {isOwnProfile ? 'you post' : 'this user posts'}, the posts will show up here.</p>
          </div>
        );
      }

      return posts.map(post => (
        <PostCard key={post.id} post={post} />
      ));
    }

    if (activeTab === 'replies') {
      if (replies.length === 0) {
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No replies yet</p>
            <p>When {isOwnProfile ? 'you reply to posts' : 'this user replies to posts'}, the replies will show up here.</p>
          </div>
        );
      }

      return replies.map(({ reply, parentPost }) => (
        <div key={reply.id} className="relative border-b border-border/40">
          {parentPost && (
            <div className="opacity-60 hover:opacity-100 transition-all duration-200">
              <PostCard post={parentPost} hideActions compact />
            </div>
          )}
          <div className="relative pl-6 ml-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border/60">
            <div className="relative before:absolute before:left-[-24px] before:top-4 before:w-6 before:h-px before:bg-border/60">
              <PostCard post={reply} isReply />
            </div>
          </div>
        </div>
      ));
    }

    if (activeTab === 'likes') {
      if (likedPosts.length === 0) {
        return (
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No liked posts yet</p>
            <p>When {isOwnProfile ? 'you like posts' : 'this user likes posts'}, they will show up here.</p>
          </div>
        );
      }

      return likedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ));
    }

    return null;
  };

  return (
    <>
      <MainLayout
        showTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showBackButton
        title={userData?.display_name || username || 'Profile'}
        rightContent={
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card shadow-sm border border-border/40 hover:border-border/60 transition-colors duration-300">
              <h2 className="font-semibold text-lg mb-2">Similar Profiles</h2>
              <div className="space-y-4 mt-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Similar User {i}</p>
                        <p className="text-xs text-muted-foreground">@similar{i}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full btn-hover-effect">
                      Follow
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        {/* Profile Header */}
        {renderProfileHeader()}
        
        {/* Profile Content */}
        <div className="divide-y divide-border/40">
          {renderContent()}
        </div>
      </MainLayout>

      {/* Follow List Modal */}
      {userData && (
        <FollowListModal
          isOpen={followListModalOpen}
          onClose={() => setFollowListModalOpen(false)}
          username={userData.username}
          type={followListType}
        />
      )}
    </>
  );
} 