# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "email": "string (optional)"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer"
  }
}
```

---

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "admin"
  }
}
```

---

#### GET /api/auth/me
Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "admin",
  "permissions": {}
}
```

---

### Books

#### GET /api/books
Get all books for the authenticated user.

**Query Parameters:**
- `search` (optional): Search term for title/author
- `format` (optional): Filter by format (physical, ebook, audiobook)
- `status` (optional): Filter by reading status

**Response:**
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "cover_url": "https://...",
    "cover_image_path": "/uploads/covers/...",
    "format": "physical",
    "rating": 4.5,
    "status": "completed",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### GET /api/books/:id
Get a single book by ID.

**Response:**
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "publisher": "Scribner",
  "publication_year": 1925,
  "page_count": 180,
  "description": "A classic novel...",
  "cover_url": "https://...",
  "format": "physical",
  "binding_type": "Hardback",
  "condition": "Excellent",
  "special_features": ["First Edition", "Signed Copy"],
  "rating": 4.5,
  "review": "An amazing read!",
  "status": "completed",
  "current_page": 180
}
```

---

#### POST /api/books
Add a new book to the library.

**Request Body:**
```json
{
  "title": "string (required)",
  "author": "string",
  "isbn": "string",
  "publisher": "string",
  "publication_year": 2024,
  "page_count": 300,
  "description": "string",
  "cover_url": "string",
  "format": "physical|ebook|audiobook",
  "binding_type": "string",
  "condition": "string",
  "special_features": ["string"],
  "rating": 4.5,
  "review": "string",
  "status": "not_started|in_progress|completed|dnf"
}
```

**Response:**
```json
{
  "id": 123,
  "title": "New Book",
  ...
}
```

---

#### PUT /api/books/:id
Update an existing book.

**Request Body:** Same as POST /api/books

**Response:** Updated book object

---

#### DELETE /api/books/:id
Delete a book from the library.

**Response:**
```json
{
  "message": "Book deleted successfully"
}
```

---

#### GET /api/books/search
Search for books using OpenLibrary API.

**Query Parameters:**
- `isbn`: ISBN-10 or ISBN-13
- `title`: Book title
- `author`: Author name

**Response:**
```json
{
  "docs": [
    {
      "title": "Book Title",
      "author_name": ["Author Name"],
      "isbn": ["9781234567890"],
      "publisher": ["Publisher"],
      "publish_year": [2020],
      "number_of_pages_median": 300,
      "cover_i": 12345678
    }
  ]
}
```

---

#### POST /api/books/refresh-metadata
Bulk refresh metadata for all books from OpenLibrary.

**Response:**
```json
{
  "message": "Metadata refresh started",
  "total": 150,
  "updated": 120,
  "failed": 30
}
```

---

### Book Photos

#### GET /api/books/:bookId/photos
Get all photos for a specific book.

**Response:**
```json
[
  {
    "id": 1,
    "book_id": 123,
    "file_path": "/uploads/photos/abc123.jpg",
    "tag": "cover",
    "description": "Front cover",
    "display_order": 0,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### POST /api/books/:bookId/photos
Upload a new photo for a book.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `photo`: File (image)
- `tag`: string (cover, spine, edges, interior, special)
- `description`: string (optional)

**Response:**
```json
{
  "id": 1,
  "book_id": 123,
  "file_path": "/uploads/photos/abc123.jpg",
  "tag": "cover"
}
```

---

#### DELETE /api/books/:bookId/photos/:photoId
Delete a photo.

**Response:**
```json
{
  "message": "Photo deleted successfully"
}
```

---

### Loans

#### GET /api/loans
Get all loans for the authenticated user.

**Query Parameters:**
- `active`: true/false (filter active loans)

**Response:**
```json
[
  {
    "id": 1,
    "book_id": 123,
    "book_title": "The Great Gatsby",
    "borrower_name": "Jane Doe",
    "loan_date": "2024-01-15",
    "due_date": "2024-02-15",
    "return_date": null,
    "notes": "Handle with care"
  }
]
```

---

#### POST /api/loans
Create a new loan record.

**Request Body:**
```json
{
  "book_id": 123,
  "borrower_name": "Jane Doe",
  "loan_date": "2024-01-15",
  "due_date": "2024-02-15",
  "notes": "string (optional)"
}
```

---

#### PUT /api/loans/:id/return
Mark a loan as returned.

**Request Body:**
```json
{
  "return_date": "2024-02-10"
}
```

---

### Reading Lists

#### GET /api/reading-lists
Get all reading lists for the authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "name": "To Read",
    "description": "Books I want to read",
    "is_public": false,
    "book_count": 15,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST /api/reading-lists
Create a new reading list.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "is_public": false
}
```

---

#### POST /api/reading-lists/:listId/books
Add a book to a reading list.

**Request Body:**
```json
{
  "book_id": 123
}
```

---

#### DELETE /api/reading-lists/:listId/books/:bookId
Remove a book from a reading list.

---

### Shelves

#### GET /api/shelves
Get all shelves for the authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Favorites",
    "description": "My favorite books",
    "color": "#ff6b6b",
    "book_count": 25
  }
]
```

---

#### POST /api/shelves
Create a new shelf.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string",
  "color": "#hexcode"
}
```

---

#### POST /api/shelves/:shelfId/books
Add a book to a shelf.

**Request Body:**
```json
{
  "book_id": 123
}
```

---

### Users (Admin Only)

#### GET /api/users
Get all users (admin only).

**Response:**
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "admin",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### POST /api/users
Create a new user (admin only).

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "email": "string",
  "role": "admin|editor|viewer"
}
```

---

#### PUT /api/users/:id
Update user information (admin only).

---

#### DELETE /api/users/:id
Delete a user (admin only).

---

### Settings

#### GET /api/settings
Get user settings.

**Response:**
```json
{
  "theme": "dark",
  "accent_color": "#6366f1",
  "default_view": "grid",
  "books_per_page": 50
}
```

---

#### PUT /api/settings
Update user settings.

**Request Body:**
```json
{
  "theme": "dark|light",
  "accent_color": "#hexcode",
  "default_view": "grid|list"
}
```

---

### Statistics

#### GET /api/stats
Get reading statistics for the authenticated user.

**Response:**
```json
{
  "total_books": 150,
  "by_format": {
    "physical": 100,
    "ebook": 30,
    "audiobook": 20
  },
  "by_status": {
    "not_started": 50,
    "in_progress": 10,
    "completed": 80,
    "dnf": 10
  },
  "total_pages": 45000,
  "avg_rating": 4.2,
  "top_authors": [
    {"author": "Stephen King", "count": 15},
    {"author": "J.K. Rowling", "count": 12}
  ]
}
```

---

### Export

#### GET /api/export/csv
Export library as CSV file.

**Response:** CSV file download

---

#### GET /api/export/json
Export library as JSON file.

**Response:** JSON file download

---

### File Upload

#### POST /api/upload/cover
Upload a custom book cover image.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `cover`: File (image)
- `book_id`: number

**Response:**
```json
{
  "file_path": "/uploads/covers/abc123.jpg",
  "url": "http://localhost:3000/uploads/covers/abc123.jpg"
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 500 | Internal Server Error |

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production deployment.

## Pagination

Pagination is not yet implemented but planned for future releases. Will use query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

## Filtering & Sorting

Books endpoint supports filtering via query parameters:
- `format`: physical, ebook, audiobook
- `status`: not_started, in_progress, completed, dnf
- `sort`: title, author, created_at, rating
- `order`: asc, desc

Example:
```
GET /api/books?format=physical&status=completed&sort=rating&order=desc
```

## Webhooks

Not currently implemented. Future feature for integration with external services.
