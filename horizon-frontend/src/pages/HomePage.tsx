import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePostForm } from '@/components/post/CreatePostForm';
import { PostCard, PostCardSkeleton } from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import { usePostStore } from '@/store/postStore';
import { useAuthStore } from '@/store/authStore';
import { User } from 'lucide-react';
import { Post as PostType } from '@/types';

// Define the Post interface that the PostCard component expects
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

// Mock posts for demonstration that match PostCard component's expected data structure
const mockPosts: PostCardPost[] = [
  {
    id: '1',
    content: 'Just watched the most amazing sunset at the beach! 🌅 The colors were unbelievable - deep oranges melting into purples. Nature\'s art at its finest.',
    created_at: '2023-04-15T18:23:00Z',
    likes_count: 56,
    replies_count: 7,
    reposts_count: 12,
    liked_by_user: false,
    reposted_by_user: false,
    user: {
      id: 'u1',
      username: 'sunsetlover',
      display_name: 'Sarah Jensen',
      avatar_url: 'https://i.pravatar.cc/150?img=32'
    }
  },
  {
    id: '2',
    content: 'Just released a new version of my open-source project! Check it out if you\'re into React and TypeScript. Would love some feedback from the community. 💻\n\nhttps://github.com/codecraft/awesome-ts-tools',
    created_at: '2023-04-14T14:30:00Z',
    likes_count: 124,
    replies_count: 23,
    reposts_count: 31,
    liked_by_user: true,
    reposted_by_user: false,
    user: {
      id: 'u2',
      username: 'devmaster',
      display_name: 'Alex Chen',
      avatar_url: 'https://i.pravatar.cc/150?img=68'
    }
  },
  {
    id: '3',
    content: 'Thinking about the future of AI and how it will reshape our society. We need to ensure these powerful tools are developed ethically and with human wellbeing at the center. What do you think?',
    created_at: '2023-04-14T09:15:00Z',
    likes_count: 87,
    replies_count: 42,
    reposts_count: 14,
    liked_by_user: false,
    reposted_by_user: true,
    user: {
      id: 'u3',
      username: 'futurist',
      display_name: 'Maya Johnson',
      avatar_url: 'https://i.pravatar.cc/150?img=47'
    }
  }
];

export function HomePage() {
  const { posts, isLoading: loading, error, fetchFeed } = usePostStore();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('for-you');
  const [showMockData, setShowMockData] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchFeed();
      } catch {
        setShowMockData(true);
      }
    };
    
    loadData();
  }, [fetchFeed]);

  const handleRefresh = () => {
    setShowMockData(false);
    fetchFeed().catch(() => setShowMockData(true));
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // In a real app, you would fetch different data based on the active tab
  };

  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' }
  ];

  const renderWhoToFollow = () => (
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border/40 hover:border-border/60 transition-colors duration-300">
      <h2 className="font-semibold text-lg mb-4">Who to follow</h2>
      {/* Placeholder for suggested users */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">User {i}</p>
                <p className="text-sm text-muted-foreground">@user{i}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="rounded-full btn-hover-effect">Follow</Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <MainLayout 
      title="Home" 
      showTabs 
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      rightContent={
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card shadow-sm border border-border/40 hover:border-border/60 transition-colors duration-300">
            <h2 className="font-semibold text-lg mb-2 text-transparent bg-clip-text sunset-gradient">Welcome to Horizon</h2>
            <p className="text-muted-foreground text-sm">Your modern social experience awaits.</p>
          </div>
          {renderWhoToFollow()}
          
          <div className="p-4 rounded-xl bg-card shadow-sm border border-border/40 hover:border-border/60 transition-colors duration-300">
            <h2 className="font-semibold text-lg mb-2">Trending Topics</h2>
            <div className="space-y-3 mt-3">
              {['#Technology', '#SunsetVibes', '#ArtificialIntelligence'].map((tag) => (
                <div key={tag} className="hover:bg-accent/5 p-2 -mx-2 rounded-md transition-colors duration-200">
                  <p className="font-medium">{tag}</p>
                  <p className="text-xs text-muted-foreground">1.5K posts</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="border-b border-border/40">
        {isAuthenticated && (
          <div className="p-4">
            <CreatePostForm />
          </div>
        )}
      </div>

      <div className="divide-y divide-border/40">
        {loading && !showMockData ? (
          // Skeleton loading state
          Array(3).fill(0).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))
        ) : error && !showMockData ? (
          // Error state with button to show mock data
          <div className="p-8 text-center">
            <p className="text-destructive mb-4">Failed to load feed</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRefresh} variant="outline" className="rounded-full btn-hover-effect">Try again</Button>
              <Button onClick={() => setShowMockData(true)} variant="default" className="rounded-full sunset-gradient text-white">Show example posts</Button>
            </div>
          </div>
        ) : posts && posts.length > 0 && !showMockData ? (
          // Render posts from the store if available
          posts.map((post: PostType) => (
            <PostCard key={post.id} post={{
              ...post,
              likes_count: post.like_count || 0,
              replies_count: 0, // Assuming reply_count doesn't exist in the backend model
              reposts_count: post.repost_count || 0,
              liked_by_user: false,
              reposted_by_user: false,
              user: post.user ? {
                id: post.user.id,
                username: post.user.username,
                display_name: post.user.display_name || post.user.username,
                avatar_url: post.user.avatar_url || ''
              } : {
                id: 'unknown',
                username: 'unknown',
                display_name: 'Unknown User',
                avatar_url: ''
              }
            }} />
          ))
        ) : (
          // If no posts in store or showMockData is true, render mock posts
          mockPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </MainLayout>
  );
} 