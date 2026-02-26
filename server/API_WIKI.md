# BookBoss API Documentation

Welcome to the BookBoss API Wiki. This API allows the React frontend (and authorized admins) to interact with the BookBoss database.

## Authentication
Most endpoints require a JWT Bearer token, passed in the `Authorization` header:
`Authorization: Bearer <your_token>`

## Key Endpoints

### 📚 Books
- \`GET /api/books\` - List all books (supports pagination, filtering)
- \`GET /api/books/:id\` - Get book details
- \`POST /api/books\` - Create a new book
- \`PUT /api/books/:id\` - Update book
- \`DELETE /api/books/:id\` - Delete book

### 👤 Users
- \`POST /api/login\` - Authenticate and receive JWT
- \`GET /api/users/profile\` - Get current logged-in user profile
- \`GET /api/user/books\` - Get reading progress/library for the current user

### 🔔 Notifications & Community
- \`GET /api/notifications\` - Get user notifications
- \`POST /api/notifications/:id/acknowledge\` - Mark notification as read
- \`POST /api/notifications\` - (Admin) Broadcast MOTD
- \`GET /api/features\` - List feature requests
- \`POST /api/features\` - Submit a new feature request

### ⚙️ System & Admin
- \`GET /api/settings\` - Get platform settings
- \`POST /api/settings\` - (Admin) Update settings
- \`GET /api/admin/libraries\` - (Admin) Get usage statistics for users
- \`POST /api/backup\` - (Admin) Trigger database backup

*This living document is continuously updated by the BookBoss team.*
