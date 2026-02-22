# API Endpoints Documentation

## Authentication Endpoints

### Register User
```
POST /account/register
Content-Type: application/json

{
  "name": "اسم المستخدم",
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 201 Created
{
  "data": {
    "id": 1,
    "name": "اسم المستخدم",
    "email": "user@example.com"
  }
}
```

### Login User
```
POST /account/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "data": {
    "token": "JWT_TOKEN_HERE"
  }
}
```

---

## Posts Endpoints

### Get All Posts (Public)
```
GET /posts

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "title": "Recipe Title",
      "content": "Recipe content",
      "userId": 1,
      "User": { "id": 1, "name": "اسم المستخدم" }
    }
  ]
}
```

### Create Post (Protected)
```
POST /posts
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "title": "My Favorite Recipe",
  "content": "Detailed recipe instructions..."
}

Response: 201 Created
```

### Update Post (Protected)
```
PUT /posts/:id
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}

Response: 200 OK
```

### Delete Post (Protected)
```
DELETE /posts/:id
Authorization: Bearer JWT_TOKEN

Response: 204 No Content
```

---

## Comments Endpoints

### Get Comments for Post
```
GET /posts/:postId/comments

Response: 200 OK
{
  "data": [
    {
      "id": 1,
      "text": "Great recipe!",
      "userId": 2,
      "postId": 1,
      "User": { "name": "المستخدم" }
    }
  ]
}
```

### Create Comment (Protected)
```
POST /posts/:postId/comments
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "text": "This recipe is amazing!"
}

Response: 201 Created
```

### Update Comment (Protected)
```
PUT /comments/:id
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "text": "Updated comment text"
}

Response: 200 OK
```

### Delete Comment (Protected)
```
DELETE /comments/:id
Authorization: Bearer JWT_TOKEN

Response: 204 No Content
```

---

## Likes Endpoints

### Get Likes Count
```
GET /posts/:postId/likes

Response: 200 OK
{
  "data": {
    "count": 5
  }
}
```

### Toggle Like on Post (Protected)
```
POST /posts/:postId/like
Authorization: Bearer JWT_TOKEN

Response: 200 OK
{
  "data": {
    "action": "liked",
    "count": 6
  }
}
```

---

## Error Responses

### Unauthorized (401)
```json
{
  "message": "No token provided or invalid token"
}
```

### Not Found (404)
```json
{
  "message": "Resource not found"
}
```

### Validation Error (400)
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Server Error (500)
```json
{
  "message": "Internal server error"
}
```

---

## Testing All Endpoints

### Manual Testing with cURL

**1. Register**
```bash
curl -X POST http://localhost:4000/account/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'
```

**2. Login**
```bash
curl -X POST http://localhost:4000/account/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

**3. Create Post**
```bash
curl -X POST http://localhost:4000/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Recipe","content":"Instructions here"}'
```

**4. Get Posts**
```bash
curl http://localhost:4000/posts
```

### Automated Testing

```bash
# Run E2E API tests
npm run test:e2e

# Run all test suites (Repository + Comprehensive + Integration + E2E)
npm run test:all
```

---

## Response Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (new resource) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Unexpected error |

---

## Implementation Notes

- All requests/responses use **JSON** format
- Authentication uses **JWT Bearer tokens**
- Protected endpoints require `Authorization: Bearer TOKEN` header
- All repository operations use **Repository Pattern** for data abstraction
- Complete **HTTP integration tests** verify all endpoints in `api.test.js`
