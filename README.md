# Horizon - Social Media Platform

Horizon is a modern social media platform built with Go (backend) and React (frontend). This README provides instructions for setting up and running both the frontend and backend components of the application.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Go](https://golang.org/doc/install) (1.21 or later)
- [Node.js](https://nodejs.org/) (19.x or later)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Project Structure

```
horizon/
├── horizon-backend/    # Go backend server
├── horizon-frontend/   # React frontend application
└── README.md          # This file
```

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd horizon-backend
   ```

2. Create a `.env` file in the backend directory with the following content:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=horizon
   SERVER_PORT=8080
   ENVIRONMENT=development
   ```

3. Start the PostgreSQL database using Docker Compose:
   ```bash
   docker-compose up -d
   ```
   This will:
   - Start a PostgreSQL instance
   - Run database migrations automatically
   - Create necessary tables and indexes

4. Install Go dependencies:
   ```bash
   go mod download
   ```

5. Start the backend server:
   ```bash
   go run cmd/api/main.go
   ```

The backend server will be available at `http://localhost:8080`.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd horizon-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will be available at `http://localhost:5173`.

## Authentication

The application comes with a default test user:
- Username: `testuser1`
- Password: `password123`

You can use these credentials to test the application, or create a new user through the registration endpoint.

To make authenticated requests using curl, you can use the provided helper script:
```bash
./auth-token.sh
```
This will:
1. Log in using the test credentials
2. Store the JWT token in an environment variable
3. Show example commands for making authenticated requests

## Development Notes

- The backend uses a consistent JWT secret in development mode for convenience
- In production, set the `JWT_SECRET` environment variable to a secure value
- The database data is persisted in a Docker volume named `horizon-pgdata`
- Frontend hot-reloading is enabled by default in development mode

## API Documentation

All authenticated endpoints require a Bearer token in the Authorization header:
```bash
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepassword",
    "display_name": "New User"
}

Response (201 Created):
{
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user_id": "256b72f8063748af9d6c67b4b0522367",
    "username": "newuser",
    "email": "user@example.com",
    "display_name": "New User",
    "is_new_user": true
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "testuser1",
    "password": "password123"
}

Response (200 OK):
{
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "user_id": "256b72f8063748af9d6c67b4b0522367",
    "username": "testuser1",
    "email": "test1@example.com",
    "display_name": "Test User 1"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <your_jwt_token>

Response (200 OK):
{
    "id": "256b72f8063748af9d6c67b4b0522367",
    "username": "testuser1",
    "email": "test1@example.com",
    "display_name": "Test User 1",
    "avatar_url": "",
    "bio": "",
    "is_private": false
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
    "refresh_token": "eyJhbGc..."
}

Response (200 OK):
{
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc..."
}
```

### Posts Endpoints

#### Create a New Post
```http
POST /api/posts
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
    "content": "Hello, World!",
    "is_private": false,
    "reply_to_post_id": null,
    "media_urls": []
}

Response (201 Created):
{
    "id": "a5290165-4419-4549-9a0b-1070486c8474",
    "user_id": "256b72f8063748af9d6c67b4b0522367",
    "content": "Hello, World!",
    "created_at": "2024-03-05T23:32:16.379234-06:00",
    "updated_at": "2024-03-05T23:32:16.379234-06:00",
    "deleted_at": null,
    "is_private": false,
    "reply_to_post_id": null,
    "allow_replies": true,
    "media_urls": null,
    "like_count": 0,
    "repost_count": 0
}
```

#### Get All Posts
```http
GET /api/posts?limit=10&offset=0
Authorization: Bearer <your_jwt_token>

Response (200 OK):
[
    {
        "id": "a5290165-4419-4549-9a0b-1070486c8474",
        "user_id": "256b72f8063748af9d6c67b4b0522367",
        "content": "Hello, World!",
        "created_at": "2024-03-05T23:32:16.379234-06:00",
        "updated_at": "2024-03-05T23:32:16.379234-06:00",
        "deleted_at": null,
        "is_private": false,
        "reply_to_post_id": null,
        "allow_replies": true,
        "media_urls": null,
        "like_count": 0,
        "repost_count": 0
    }
]
```

#### Get a Specific Post
```http
GET /api/posts/{post_id}
Authorization: Bearer <your_jwt_token>

Response (200 OK):
{
    "id": "a5290165-4419-4549-9a0b-1070486c8474",
    "user_id": "256b72f8063748af9d6c67b4b0522367",
    "content": "Hello, World!",
    "created_at": "2024-03-05T23:32:16.379234-06:00",
    "updated_at": "2024-03-05T23:32:16.379234-06:00",
    "deleted_at": null,
    "is_private": false,
    "reply_to_post_id": null,
    "allow_replies": true,
    "media_urls": null,
    "like_count": 0,
    "repost_count": 0
}
```

#### Update a Post
```http
PUT /api/posts/{post_id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
    "content": "Updated content"
}

Response (200 OK):
{
    "id": "a5290165-4419-4549-9a0b-1070486c8474",
    "content": "Updated content",
    "updated_at": "2024-03-05T23:35:16.379234-06:00"
    // ... other post fields
}
```

#### Like a Post
```http
POST /api/posts/{post_id}/like
Authorization: Bearer <your_jwt_token>

Response (200 OK):
{
    "message": "post liked"
}
```

#### Unlike a Post
```http
DELETE /api/posts/{post_id}/like
Authorization: Bearer <your_jwt_token>

Response (200 OK):
{
    "message": "post unliked"
}
```

#### Get User's Posts
```http
GET /api/users/{user_id}/posts
Authorization: Bearer <your_jwt_token>

Response (200 OK):
[
    {
        "id": "a5290165-4419-4549-9a0b-1070486c8474",
        "user_id": "256b72f8063748af9d6c67b4b0522367",
        "content": "Hello, World!",
        // ... other post fields
    }
]
```

### Error Responses

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
    "message": "error description"
}
```

Common status codes:
- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing or invalid authentication
- 403 Forbidden - Authenticated but not authorized
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server error

## Troubleshooting

1. If the database container fails to start:
   ```bash
   docker-compose down -v  # Remove containers and volumes
   docker-compose up -d    # Start fresh
   ```

2. If you need to reset the database:
   ```bash
   docker-compose down -v  # This will remove all data
   docker-compose up -d    # Start fresh with new data
   ```

3. If the frontend fails to connect to the backend:
   - Ensure the backend is running on port 8080
   - Check CORS settings in the backend
   - Verify the API base URL in the frontend configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
