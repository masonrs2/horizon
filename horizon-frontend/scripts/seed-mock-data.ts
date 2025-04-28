import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

interface User {
  id: string;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_private: boolean;
}

const mockUsers = [
  {
    username: "sunsetlover",
    email: "sarah@example.com",
    password: "password123",
    display_name: "Sarah Jensen",
    avatar_url: "https://i.pravatar.cc/150?img=32"
  },
  {
    username: "devmaster",
    email: "alex@example.com",
    password: "password123",
    display_name: "Alex Chen",
    avatar_url: "https://i.pravatar.cc/150?img=68"
  },
  {
    username: "futurist",
    email: "maya@example.com",
    password: "password123",
    display_name: "Maya Johnson",
    avatar_url: "https://i.pravatar.cc/150?img=47"
  }
];

const mockPosts = [
  {
    content: "Just watched the most amazing sunset at the beach! 🌅 The colors were unbelievable - deep oranges melting into purples. Nature's art at its finest.",
    username: "sunsetlover"
  },
  {
    content: "Just released a new version of my open-source project! Check it out if you're into React and TypeScript. Would love some feedback from the community. 💻\n\nhttps://github.com/codecraft/awesome-ts-tools",
    username: "devmaster"
  },
  {
    content: "Thinking about the future of AI and how it will reshape our society. We need to ensure these powerful tools are developed ethically and with human wellbeing at the center. What do you think?",
    username: "futurist"
  }
];

async function createUser(userData: typeof mockUsers[0]): Promise<User> {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      // User already exists, try to login
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: userData.username,
        password: userData.password
      });
      return loginResponse.data.user;
    }
    throw error;
  }
}

async function createPost(token: string, content: string): Promise<Post> {
  const response = await axios.post(
    `${API_URL}/posts`,
    {
      content,
      is_private: false
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.data;
}

async function seedData() {
  try {
    console.log('Starting to seed mock data...');

    // Create users
    console.log('Creating users...');
    const createdUsers = await Promise.all(
      mockUsers.map(userData => createUser(userData))
    );
    console.log('Users created successfully');

    // Create posts for each user
    console.log('Creating posts...');
    for (const post of mockPosts) {
      // Find the user
      const user = mockUsers.find(u => u.username === post.username);
      if (!user) continue;

      // Login as the user
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: user.username,
        password: user.password
      });
      const token = loginResponse.data.access_token;

      // Create the post
      await createPost(token, post.content);
    }
    console.log('Posts created successfully');

    console.log('Mock data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding mock data:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
    }
  }
}

// Run the seeding function
seedData(); 