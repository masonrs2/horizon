#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:8080"

# Function to print response
print_response() {
    echo -e "${GREEN}Response:${NC}"
    echo "$1" | jq '.'
    echo
}

# First, let's create two test users
echo -e "${GREEN}Creating test users...${NC}"

# Create first user
RESPONSE1=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser1",
        "email": "test1@example.com",
        "password": "password123",
        "display_name": "Test User 1"
    }')
print_response "$RESPONSE1"

# Create second user
RESPONSE2=$(curl -s -X POST "${BASE_URL}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "password123",
        "display_name": "Test User 2"
    }')
print_response "$RESPONSE2"

# Login as first user
echo -e "${GREEN}Logging in as testuser1...${NC}"
LOGIN_RESPONSE1=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser1",
        "password": "password123"
    }')
print_response "$LOGIN_RESPONSE1"

# Extract token for first user
TOKEN1=$(echo $LOGIN_RESPONSE1 | jq -r '.access_token')

# Login as second user
echo -e "${GREEN}Logging in as testuser2...${NC}"
LOGIN_RESPONSE2=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "username": "testuser2",
        "password": "password123"
    }')
print_response "$LOGIN_RESPONSE2"

# Extract token for second user
TOKEN2=$(echo $LOGIN_RESPONSE2 | jq -r '.access_token')

# Test 1: Get follow status (should be false initially)
echo -e "${GREEN}Testing get follow status (initial)...${NC}"
curl -s -X GET "${BASE_URL}/api/users/testuser2/follow-status" \
    -H "Authorization: Bearer ${TOKEN1}" | jq '.'
echo

# Test 2: Follow user2 as user1
echo -e "${GREEN}Testing follow user...${NC}"
curl -s -X POST "${BASE_URL}/api/users/testuser2/follow" \
    -H "Authorization: Bearer ${TOKEN1}" | jq '.'
echo

# Test 3: Get follow status again (should be true)
echo -e "${GREEN}Testing get follow status (after follow)...${NC}"
curl -s -X GET "${BASE_URL}/api/users/testuser2/follow-status" \
    -H "Authorization: Bearer ${TOKEN1}" | jq '.'
echo

# Test 4: Get followers of user2
echo -e "${GREEN}Testing get followers...${NC}"
curl -s -X GET "${BASE_URL}/api/users/testuser2/followers" \
    -H "Authorization: Bearer ${TOKEN2}" | jq '.'
echo

# Test 5: Get following of user1
echo -e "${GREEN}Testing get following...${NC}"
curl -s -X GET "${BASE_URL}/api/users/testuser1/following" \
    -H "Authorization: Bearer ${TOKEN1}" | jq '.'
echo

# Test 6: Unfollow user2 as user1
echo -e "${GREEN}Testing unfollow user...${NC}"
curl -s -X DELETE "${BASE_URL}/api/users/testuser2/follow" \
    -H "Authorization: Bearer ${TOKEN1}" | jq '.'
echo

# Test 7: Get follow status final (should be false)
echo -e "${GREEN}Testing get follow status (after unfollow)...${NC}"
curl -s -X GET "${BASE_URL}/api/users/testuser2/follow-status" \
    -H "Authorization: Bearer ${TOKEN1}" | jq '.'
echo 