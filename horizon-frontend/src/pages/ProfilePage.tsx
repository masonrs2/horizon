import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard, PostCardSkeleton } from '@/components/post/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { CalendarDays, MapPin, Link as LinkIcon, User as UserIcon } from 'lucide-react';

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

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const { isAuthenticated, user } = useAuthStore();
  const isOwnProfile = isAuthenticated && user && user.username === username;
  const [posts, setPosts] = useState<ProfilePagePost[]>([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          const mockUserData: ProfileData = {
            id: 'u1',
            username: username,
            display_name: username === 'devmaster' ? 'Alex Chen' : 
                        username === 'sunsetlover' ? 'Sarah Jensen' : 
                        username === 'futurist' ? 'Maya Johnson' : 
                        `${username.charAt(0).toUpperCase()}${username.slice(1)}`,
            avatar_url: username === 'devmaster' ? 'https://i.pravatar.cc/150?img=68' : 
                       username === 'sunsetlover' ? 'https://i.pravatar.cc/150?img=32' : 
                       username === 'futurist' ? 'https://i.pravatar.cc/150?img=47' : 
                       '', 
            bio: 'This is a sample bio for the user profile. In a real app, this would be the user\'s actual bio from the database.',
            location: 'San Francisco, CA',
            website: 'https://example.com',
            created_at: '2023-01-15T00:00:00Z',
            followers_count: 1024,
            following_count: 512
          };

          // Create mock posts for the profile
          const mockPosts: ProfilePagePost[] = [
            {
              id: 'p1',
              content: 'Just thinking about how far we\'ve come with web development. Remember the days of table-based layouts? 😄 #WebDev #Nostalgia',
              created_at: '2023-04-10T10:30:00Z',
              likes_count: 45,
              replies_count: 8,
              reposts_count: 5,
              liked_by_user: false,
              reposted_by_user: false,
              user: {
                id: mockUserData.id,
                username: mockUserData.username,
                display_name: mockUserData.display_name,
                avatar_url: mockUserData.avatar_url
              }
            },
            {
              id: 'p2',
              content: 'Working on a new project with React and TypeScript. The type safety is *chef\'s kiss* 👩‍💻 #ReactJS #TypeScript',
              created_at: '2023-04-05T15:20:00Z',
              likes_count: 78,
              replies_count: 12,
              reposts_count: 10,
              liked_by_user: true,
              reposted_by_user: false,
              user: {
                id: mockUserData.id,
                username: mockUserData.username,
                display_name: mockUserData.display_name,
                avatar_url: mockUserData.avatar_url
              }
            },
            {
              id: 'p3',
              content: 'The sunset tonight was absolutely breathtaking! 🌅 Nature always finds a way to remind us of its beauty.',
              created_at: '2023-03-28T19:45:00Z',
              likes_count: 132,
              replies_count: 18,
              reposts_count: 24,
              liked_by_user: false,
              reposted_by_user: true,
              user: {
                id: mockUserData.id,
                username: mockUserData.username,
                display_name: mockUserData.display_name,
                avatar_url: mockUserData.avatar_url
              }
            }
          ];
          
          setUserData(mockUserData);
          setPosts(mockPosts);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load user profile');
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [username]);

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
          <div className="text-destructive mb-4">Failed to load profile</div>
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
              <Button className="rounded-full sunset-gradient btn-hover-effect">
                Follow
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
              <div className="flex items-center gap-1">
                <span className="font-semibold">{userData.following_count}</span>
                <span className="text-muted-foreground">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{userData.followers_count}</span>
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
        {isLoading ? (
          // Loading state for posts
          Array(3).fill(0).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))
        ) : posts.length > 0 ? (
          // Show posts
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          // Empty state
          <div className="p-8 text-center text-muted-foreground">
            <p className="mb-2">No posts yet</p>
            <p>When this user posts, their posts will show up here.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 