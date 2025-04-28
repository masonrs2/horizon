#!/bin/bash

# Script to retrieve and store JWT token for Horizon API

# Login to get token
echo "Logging in to get token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser1","password":"password123"}')

# Extract the access token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')

# Store token in environment variable
export JWT_TOKEN=$ACCESS_TOKEN

echo "Token stored in JWT_TOKEN environment variable"
echo "You can now use it in curl commands like:"
echo "curl -X GET 'http://localhost:8080/api/posts' -H \"Authorization: Bearer \$JWT_TOKEN\" | jq"

# Optional: Add to check if token is valid
echo "Checking if token is valid..."
curl -s -X GET 'http://localhost:8080/api/auth/me' -H "Authorization: Bearer $JWT_TOKEN" | jq 