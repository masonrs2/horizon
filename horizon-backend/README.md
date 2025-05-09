# Horizon Backend API Documentation

## Overview
This document provides detailed information about the Horizon social media platform's REST API endpoints.

## Base URL
```
http://localhost:8080/api
```

## Authentication
Most endpoints require authentication using a JWT token. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "display_name": "string"
}
```

**Response (201 Created):**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user_id": "string",
  "username": "string",
  "email": "string",
  "display_name": "string",
  "is_new_user": true
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string", // Can be username or email
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user_id": "string",
  "username": "string",
  "email": "string",
  "display_name": "string"
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "string",
  "refresh_token": "string"
}
```

#### Get Current User
```http
GET /auth/me
```

**Response (200 OK):**
```json
{
  "id": "string",
  "username": "string",
  "email": "string",
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string",
  "location": "string",
  "website": "string",
  "is_private": boolean,
  "followers_count": number,
  "following_count": number
}
```

### Users

#### Get User by Username
```http
GET /users/:username
```

**Response (200 OK):**
```json
{
  "id": "string",
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string",
  "location": "string",
  "website": "string",
  "is_private": boolean,
  "followers_count": number,
  "following_count": number
}
```

#### Update User Profile
```http
PUT /users/:id
```

**Request Body:**
```json
{
  "display_name": "string",
  "bio": "string",
  "location": "string",
  "website": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "string",
  "username": "string",
  "display_name": "string",
  "avatar_url": "string",
  "bio": "string",
  "location": "string",
  "website": "string",
  "is_private": boolean
}
```

#### Update User Avatar
```http
POST /users/:id/avatar
```

**Request Body:**
```
multipart/form-data
file: image file
```

**Response (200 OK):**
```json
{
  "avatar_url": "string"
}
```

### Posts

#### Create Post
```http
POST /posts
```

**Request Body:**
```json
{
  "content": "string",
  "media_urls": ["string"],
  "reply_to": "string" // Optional, post ID being replied to
}
```

**Response (201 Created):**
```json
{
  "id": "string",
  "content": "string",
  "media_urls": ["string"],
  "author": {
    "id": "string",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string"
  },
  "created_at": "string",
  "updated_at": "string",
  "likes_count": number,
  "replies_count": number,
  "is_liked": boolean,
  "is_bookmarked": boolean
}
```

#### Get Posts
```http
GET /posts
```

**Query Parameters:**
```
limit: number (default: 20)
offset: number (default: 0)
```

**Response (200 OK):**
```json
[
  {
    "id": "string",
    "content": "string",
    "media_urls": ["string"],
    "author": {
      "id": "string",
      "username": "string",
      "display_name": "string",
      "avatar_url": "string"
    },
    "created_at": "string",
    "updated_at": "string",
    "likes_count": number,
    "replies_count": number,
    "is_liked": boolean,
    "is_bookmarked": boolean
  }
]
```

#### Get Post by ID
```http
GET /posts/:id
```

**Response (200 OK):**
```json
{
  "id": "string",
  "content": "string",
  "media_urls": ["string"],
  "author": {
    "id": "string",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string"
  },
  "created_at": "string",
  "updated_at": "string",
  "likes_count": number,
  "replies_count": number,
  "is_liked": boolean,
  "is_bookmarked": boolean
}
```

#### Get Upload URL
```http
GET /posts/upload-url
```

**Query Parameters:**
```
filename: string
```

**Response (200 OK):**
```json
{
  "upload_url": "string",
  "file_url": "string"
}
```

#### Like Post
```http
POST /posts/:id/likes
```

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Unlike Post
```http
DELETE /posts/:id/likes
```

**Response (200 OK):**
```json
{
  "success": true
}
```

### Follow System

#### Follow User
```http
POST /users/:username/follow
```

**Response (200 OK):**
```json
{
  "is_following": true,
  "is_accepted": boolean
}
```

#### Unfollow User
```http
DELETE /users/:username/follow
```

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Get Follow Status
```http
GET /users/:username/follow-status
```

**Response (200 OK):**
```json
{
  "is_following": boolean,
  "is_accepted": boolean
}
```

#### Get Followers
```http
GET /users/:username/followers
```

**Query Parameters:**
```
limit: number (default: 20)
offset: number (default: 0)
```

**Response (200 OK):**
```json
[
  {
    "id": "string",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "is_following": boolean
  }
]
```

#### Get Following
```http
GET /users/:username/following
```

**Query Parameters:**
```
limit: number (default: 20)
offset: number (default: 0)
```

**Response (200 OK):**
```json
[
  {
    "id": "string",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string",
    "bio": "string",
    "is_following": boolean
  }
]
```

### Notifications

#### Get Notifications
```http
GET /notifications
```

**Query Parameters:**
```
limit: number (default: 20)
offset: number (default: 0)
```

**Response (200 OK):**
```json
[
  {
    "id": "string",
    "type": "string",
    "actor": {
      "id": "string",
      "username": "string",
      "display_name": "string",
      "avatar_url": "string"
    },
    "post": {
      "id": "string",
      "content": "string"
    },
    "created_at": "string",
    "read": boolean
  }
]
```

#### Get Unread Count
```http
GET /notifications/unread-count
```

**Response (200 OK):**
```json
{
  "count": number
}
```

#### Mark Notification as Read
```http
PUT /notifications/:id/read
```

**Response (200 OK):**
```json
{
  "success": true
}
```

#### Mark All Notifications as Read
```http
PUT /notifications/mark-all-read
```

**Response (200 OK):**
```json
{
  "success": true
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "string",
  "errors": ["string"]
}
```

### 401 Unauthorized
```json
{
  "message": "string",
  "errors": ["string"]
}
```

### 403 Forbidden
```json
{
  "message": "string",
  "errors": ["string"]
}
```

### 404 Not Found
```json
{
  "message": "string",
  "errors": ["string"]
}
```

### 500 Internal Server Error
```json
{
  "message": "string",
  "errors": ["string"]
}
``` 