# Horizon - Social Media Platform

## Overview
Horizon is a modern social media platform built with React and TypeScript, featuring a clean and intuitive user interface. It allows users to share posts, follow other users, engage with content through likes and comments, and manage their personal profiles.

## Features
- User authentication (login/register)
- Create and share posts with text and images
- Follow other users and manage followers
- Like and bookmark posts
- Real-time notifications
- User profiles with customizable avatars and bio
- Dark/light theme support
- Responsive design for mobile and desktop

## Tech Stack
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/UI Components
- Zustand (State Management)
- React Router v6
- React Hook Form + Zod (Form Validation)
- Axios (API Client)

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see backend documentation)
ne
## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/masonrs2/horizon.git
cd horizon/horizon-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:8080/api
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## Building for Production

To create a production build:
```bash
npm run build
# or
yarn build
```

To preview the production build locally:
```bash
npm run preview
# or
yarn preview
```

## Project Structure
```
horizon-frontend/
├── src/
│   ├── api/          # API client and endpoints
│   ├── components/   # Reusable React components
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # Page components
│   ├── store/        # Zustand store definitions
│   ├── styles/       # Global styles and Tailwind config
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions
├── public/           # Static assets
└── index.html        # Entry HTML file
```

## Development Guidelines

### Code Style
- Follow the ESLint configuration
- Use TypeScript for type safety
- Follow component composition patterns
- Write meaningful commit messages

### Component Structure
- Use functional components with hooks
- Implement proper error handling
- Follow the container/presenter pattern where applicable
- Keep components focused and maintainable

## Testing
Run the test suite:
```bash
npm run test
# or
yarn test
```

## API Documentation
For detailed API documentation, please refer to the [Backend README](../horizon-backend/README.md).

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments
- [Shadcn/UI](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) for state management
- All contributors who have helped shape this project

## Deployment

### GitHub Pages Deployment
The frontend is configured for deployment to GitHub Pages. The current setup uses a temporary mock API for demonstration purposes until the backend is deployed.

To deploy to GitHub Pages:

```bash
# Make sure you have the latest changes
git pull origin main

# Install dependencies if needed
npm install

# Deploy to GitHub Pages
npm run deploy
```

The deployment process will:
1. Build the project in production mode
2. Push the built files to the gh-pages branch
3. Make the site available at https://msn0.github.io/horizon

### Development vs Production
- Development: Uses local API (http://localhost:8080/api)
- Production: Currently uses a temporary mock API (will be updated when backend is deployed)

### Updating API Configuration
When the backend is deployed:
1. Update the production API URL in `src/config/api.ts`
2. Redeploy using `npm run deploy`
