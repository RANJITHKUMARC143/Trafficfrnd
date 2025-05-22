## User Registration & Login

### Register a new user
POST `/api/users/register`

**Request body:**
```
{
  "username": "yourusername",
  "email": "your@email.com",
  "password": "yourpassword"
}
```

**Response:**
- Success: `{ "message": "User registered successfully" }`
- Error: `{ "error": "Username or email already exists" }`

### Login
POST `/api/users/login`

**Request body:**
```
{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

**Response:**
- Success: `{ "token": "<jwt>", "user": { "id": "...", "username": "...", "email": "..." } }`
- Error: `{ "error": "Invalid email or password" }` 