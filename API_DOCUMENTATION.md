# API Documentation - Available Actions

This document lists all available backend actions that can be performed from the frontend.

## Base URL
- **Development**: `http://localhost:8080/backend`
- **Production**: `/backend`

---

## 🔐 Authentication (`/auth.php`)

### 1. Sign Up
- **Endpoint**: `POST /auth.php?action=signup`
- **Description**: Create a new user account
- **Required Fields**: `email`, `password`
- **Optional Fields**: `username`, `displayName`, `name`, `party`, `bio`
- **Frontend Method**: `api.signup(userData)`
- **Response**: User object with session

### 2. Login
- **Endpoint**: `POST /auth.php?action=login`
- **Description**: Authenticate user and create session
- **Required Fields**: `email` (or username), `password`
- **Frontend Method**: `api.login(email, password)`
- **Response**: User object with followers, following, friends arrays

### 3. Get Current User
- **Endpoint**: `GET /auth.php?action=me`
- **Description**: Get currently authenticated user's profile
- **Frontend Method**: `api.getCurrentUser()`
- **Response**: Complete user profile

### 4. Logout
- **Endpoint**: `POST /auth.php?action=logout`
- **Description**: Destroy user session
- **Frontend Method**: `api.logout()`
- **Response**: Success confirmation

---

## 📝 Content Management (`/content.php`)

### 1. List Posts
- **Endpoint**: `GET /content.php?action=list&limit={limit}&offset={offset}`
- **Description**: Get paginated list of posts with likes, comments, and tips
- **Query Parameters**: 
  - `limit` (optional, default: 20)
  - `offset` (optional, default: 0)
- **Frontend Method**: `api.getPosts({ limit?, offset? })`
- **Response**: Array of posts with user info, likes, comments, tips

### 2. Get Single Post
- **Endpoint**: `GET /content.php?action=get&id={id}`
- **Description**: Get detailed information about a specific post
- **Required Parameters**: `id` (post ID)
- **Frontend Method**: `api.getPost(id)`
- **Response**: Post object with all details

### 3. Create Post
- **Endpoint**: `POST /content.php?action=create`
- **Description**: Create a new post
- **Required Fields**: `content`
- **Optional Fields**: `media_url`, `media_type`, `type`, `party`
- **Frontend Method**: `api.createPost({ content, media_url?, media_type?, type?, party? })`
- **Response**: Created post object

### 4. Like Post
- **Endpoint**: `POST /content.php?action=like&id={id}`
- **Description**: Like or unlike a post
- **Required Parameters**: `id` (post ID)
- **Frontend Method**: `api.likePost(postId)`
- **Response**: Updated like count and status

### 5. Comment on Post
- **Endpoint**: `POST /content.php?action=comment&id={id}`
- **Description**: Add a comment to a post
- **Required Parameters**: `id` (post ID)
- **Required Fields**: `content`
- **Frontend Method**: `api.commentPost(postId, content)`
- **Response**: Created comment object

---

## 👥 Social Features (`/social.php`)

### 1. Follow User
- **Endpoint**: `POST /social.php?action=follow&user_id={userId}`
- **Description**: Follow another user
- **Required Parameters**: `user_id`
- **Frontend Method**: `api.followUser(userId)`
- **Response**: Success confirmation

### 2. Unfollow User
- **Endpoint**: `POST /social.php?action=unfollow&user_id={userId}`
- **Description**: Unfollow a user
- **Required Parameters**: `user_id`
- **Frontend Method**: `api.unfollowUser(userId)`
- **Response**: Success confirmation

### 3. Get Followers
- **Endpoint**: `GET /social.php?action=followers&user_id={userId}`
- **Description**: Get list of followers for a user
- **Optional Parameters**: `user_id` (if omitted, returns current user's followers)
- **Frontend Method**: `api.getFollowers(userId?)`
- **Response**: Array of user objects

### 4. Get Following
- **Endpoint**: `GET /social.php?action=following&user_id={userId}`
- **Description**: Get list of users being followed
- **Optional Parameters**: `user_id` (if omitted, returns current user's following)
- **Frontend Method**: `api.getFollowing(userId?)`
- **Response**: Array of user objects

---

## 💬 Messaging (`/messages.php`)

### 1. Send Message
- **Endpoint**: `POST /messages.php?action=send`
- **Description**: Send a direct message to another user
- **Required Fields**: `user_id`, `content`
- **Frontend Method**: `api.sendMessage(userId, content)`
- **Response**: Created message object

### 2. List Messages
- **Endpoint**: `GET /messages.php?action=list&user_id={userId}`
- **Description**: Get conversation messages
- **Optional Parameters**: `user_id` (filter by specific user)
- **Frontend Method**: `api.getMessages(userId?)`
- **Response**: Array of message objects

### 3. Mark Message as Read
- **Endpoint**: `POST /messages.php?action=mark_read&id={id}`
- **Description**: Mark a message as read
- **Required Parameters**: `id` (message ID)
- **Response**: Success confirmation

---

## 🔍 Search (`/search.php`)

### 1. Search
- **Endpoint**: `GET /search.php?q={query}&type={type}`
- **Description**: Search for users, posts, or hashtags
- **Required Parameters**: `q` (search query)
- **Optional Parameters**: `type` (filter by type: user, post, hashtag)
- **Frontend Method**: `api.search(query, type?)`
- **Response**: Array of search results

---

## 📤 File Upload (`/upload.php`)

### 1. Upload File
- **Endpoint**: `POST /upload.php`
- **Description**: Upload images, videos, or other media files
- **Required Fields**: `file` (FormData)
- **Frontend Method**: `api.uploadFile(file)`
- **Supported Types**: jpg, jpeg, png, gif, mp3, mp4, pdf
- **Max Size**: 50MB (configurable)
- **Response**: File URL and metadata

---

## 💳 Payments (`/payments.php`)

### 1. Process Payment
- **Endpoint**: `POST /payments.php`
- **Description**: Process a payment transaction
- **Required Fields**: `amount`, `payment_method`
- **Optional Fields**: `description`
- **Frontend Method**: `api.processPayment({ amount, payment_method, description? })`
- **Response**: Payment confirmation

---

## 📊 Analytics (`/analytics.php`)

### 1. Track Event
- **Endpoint**: `POST /analytics.php?action=track`
- **Description**: Track user analytics events
- **Required Fields**: `event`
- **Optional Fields**: `metadata` (JSON object)
- **Response**: Success confirmation

### 2. Get Stats
- **Endpoint**: `GET /analytics.php?action=stats`
- **Description**: Get user analytics statistics
- **Response**: Statistics grouped by event type

---

## ⚙️ Admin (`/admin.php`)

**Note**: Requires admin role

### 1. Get Statistics
- **Endpoint**: `GET /admin.php?action=stats`
- **Description**: Get platform-wide statistics
- **Frontend Method**: `api.getAdminData()`
- **Response**: Total users, total posts, etc.

### 2. Delete User
- **Endpoint**: `POST /admin.php?action=delete_user&id={id}`
- **Description**: Delete a user account
- **Required Parameters**: `id` (user ID)
- **Response**: Success confirmation

### 3. Delete Post
- **Endpoint**: `POST /admin.php?action=delete_post&id={id}`
- **Description**: Delete a post
- **Required Parameters**: `id` (post ID)
- **Response**: Success confirmation

---

## 📋 Summary by Category

### User Actions
- ✅ Sign up / Login / Logout
- ✅ View profile
- ✅ Update profile (via frontend state)

### Content Actions
- ✅ Create posts
- ✅ View posts (list & single)
- ✅ Like posts
- ✅ Comment on posts
- ✅ Upload media files

### Social Actions
- ✅ Follow/Unfollow users
- ✅ View followers/following lists
- ✅ Send/receive messages
- ✅ Search users/posts/hashtags

### Financial Actions
- ✅ Process payments
- ✅ View earnings/tips/tokens

### Admin Actions
- ✅ View platform statistics
- ✅ Delete users/posts
- ✅ Track analytics

---

## 🔒 Authentication Requirements

Most endpoints require authentication (session-based). Exceptions:
- Sign up
- Login
- Public content viewing (may vary)

---

## 📝 Response Format

All endpoints return JSON in this format:
```json
{
  "success": true|false,
  "data": {...},
  "error": "error message if failed",
  "message": "success message"
}
```

---

## 🚀 Usage Examples

### Frontend API Usage

```typescript
import api from './lib/api'

// Authentication
await api.signup({ email, password, username, displayName, party })
await api.login(email, password)
await api.logout()
const user = await api.getCurrentUser()

// Content
const posts = await api.getPosts({ limit: 20, offset: 0 })
await api.createPost({ content: "Hello world!", type: "post" })
await api.likePost(123)
await api.commentPost(123, "Great post!")

// Social
await api.followUser(456)
const followers = await api.getFollowers()
const following = await api.getFollowing()

// Messages
await api.sendMessage(789, "Hi there!")
const messages = await api.getMessages(789)

// Search
const results = await api.search("keyword", "user")

// Upload
const fileUrl = await api.uploadFile(file)

// Payments
await api.processPayment({ amount: 10.00, payment_method: "stripe" })

// Admin
const stats = await api.getAdminData()
```

---

**Last Updated**: 2026-02-03
**Backend Version**: 1.0
**Frontend Integration**: Complete ✅

