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
export const mockPosts: PostCardPost[] = [
  {
    id: "1",
    content:
      "Just watched the most amazing sunset at the beach! 🌅 The colors were unbelievable - deep oranges melting into purples. Nature's art at its finest.",
    created_at: "2023-04-15T18:23:00Z",
    likes_count: 56,
    replies_count: 7,
    reposts_count: 12,
    liked_by_user: false,
    reposted_by_user: false,
    user: {
      id: "u1",
      username: "sunsetlover",
      display_name: "Sarah Jensen",
      avatar_url: "https://i.pravatar.cc/150?img=32",
    },
  },
  {
    id: "2",
    content:
      "Just released a new version of my open-source project! Check it out if you're into React and TypeScript. Would love some feedback from the community. 💻\n\nhttps://github.com/codecraft/awesome-ts-tools",
    created_at: "2023-04-14T14:30:00Z",
    likes_count: 124,
    replies_count: 23,
    reposts_count: 31,
    liked_by_user: true,
    reposted_by_user: false,
    user: {
      id: "u2",
      username: "devmaster",
      display_name: "Alex Chen",
      avatar_url: "https://i.pravatar.cc/150?img=68",
    },
  },
  {
    id: "3",
    content:
      "Thinking about the future of AI and how it will reshape our society. We need to ensure these powerful tools are developed ethically and with human wellbeing at the center. What do you think?",
    created_at: "2023-04-14T09:15:00Z",
    likes_count: 87,
    replies_count: 42,
    reposts_count: 14,
    liked_by_user: false,
    reposted_by_user: true,
    user: {
      id: "u3",
      username: "futurist",
      display_name: "Maya Johnson",
      avatar_url: "https://i.pravatar.cc/150?img=47",
    },
  },
];
