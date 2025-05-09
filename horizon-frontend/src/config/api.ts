// API configuration for different environments
const isDevelopment = import.meta.env.MODE === 'development';

// For now, we'll use a mock API for production until backend is deployed
export const API_CONFIG = {
  // Use local API for development, mock API for production
  baseURL: isDevelopment 
    ? 'http://localhost:8080/api'
    : 'https://horizon-api-mock.vercel.app/api', // This is a placeholder URL
};

// Export other API-related configuration
export const API_TIMEOUT = 10000; // 10 seconds
export const API_RETRY_ATTEMPTS = 3;

// Mock API response delay (only used in development)
export const MOCK_API_DELAY = isDevelopment ? 1000 : 0; 