# Architecture Overview

## System Architecture

BookBoss follows a modern three-tier architecture with a React frontend, Node.js/Express backend, and MySQL database.

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        React[React App<br/>TypeScript + Vite]
    end
    
    subgraph "Application Layer"
        Express[Express Server<br/>Node.js]
        Auth[JWT Authentication]
        API[REST API Endpoints]
        FileUpload[Multer File Upload]
    end
    
    subgraph "Data Layer"
        MySQL[(MySQL Database)]
        FileSystem[File System<br/>uploads/]
    end
    
    subgraph "External Services"
        OpenLibrary[OpenLibrary API]
        Audiobookshelf[Audiobookshelf<br/>Integration]
    end
    
    Browser --> React
    React --> API
    API --> Express
    Express --> Auth
    Express --> MySQL
    Express --> FileSystem
    Express --> OpenLibrary
    Express --> Audiobookshelf
    
    style React fill:#61dafb
    style Express fill:#90c53f
    style MySQL fill:#00758f
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite (fast HMR and optimized builds)
- **Styling**: Custom CSS with CSS variables
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Barcode Scanner**: Html5-QRCode
- **EPUB Reader**: ePub.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **File Uploads**: Multer
- **Database Driver**: mysql2
- **Password Hashing**: bcrypt
- **CORS**: cors middleware

### Database
- **RDBMS**: MySQL 8.0+
- **Schema Management**: SQL migration scripts
- **Indexing**: Full-text search indexes on title/author

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Editor**: VS Code (recommended)
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler

## Project Structure

```
BookBoss/
├── book-boss-react/          # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context providers
│   │   ├── pages/            # Page-level components
│   │   ├── services/         # API service layer
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Helper functions
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── public/               # Static assets
│   └── Design/               # Design documentation
│
├── server/                   # Node.js backend
│   ├── server.js             # Main server file (all routes)
│   ├── schema.sql            # Base database schema
│   ├── update_schema_*.js    # Migration scripts
│   ├── abs-client.js         # Audiobookshelf client
│   └── uploads/              # User-uploaded files
│
├── legacy-web/               # Original vanilla JS app (deprecated)
├── migrations/               # Database migration history
└── Design/                   # Project documentation
    └── Wiki/                 # This wiki
```

## Application Flow

### User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant React
    participant AuthContext
    participant API
    participant Server
    participant DB
    
    User->>React: Open Application
    React->>AuthContext: Check localStorage for token
    
    alt Token exists
        AuthContext->>API: Validate token
        API->>Server: GET /api/auth/me
        Server->>DB: Verify user
        DB-->>Server: User data
        Server-->>API: User object
        API-->>AuthContext: Set currentUser
        AuthContext-->>React: Authenticated
    else No token
        React->>User: Show Login Page
        User->>React: Enter credentials
        React->>API: POST /api/auth/login
        API->>Server: Login request
        Server->>DB: Verify credentials
        DB-->>Server: User data
        Server-->>API: JWT token + user
        API-->>AuthContext: Store token & user
        AuthContext-->>React: Redirect to Library
    end
```

### Book Management Flow

```mermaid
sequenceDiagram
    participant User
    participant BookGrid
    participant BookService
    participant Server
    participant DB
    participant OpenLibrary
    
    User->>BookGrid: View Library
    BookGrid->>BookService: fetchBooks()
    BookService->>Server: GET /api/books
    Server->>DB: SELECT * FROM books
    DB-->>Server: Book records
    Server-->>BookService: JSON response
    BookService-->>BookGrid: Book array
    BookGrid-->>User: Display books
    
    User->>BookGrid: Click "Add Book"
    BookGrid->>User: Show Add Book Modal
    
    alt Barcode Scan
        User->>BookGrid: Scan ISBN
        BookGrid->>BookService: searchByISBN(isbn)
        BookService->>Server: GET /api/books/search?isbn=...
        Server->>OpenLibrary: Search by ISBN
        OpenLibrary-->>Server: Book metadata
        Server-->>BookService: Book data
        BookService-->>BookGrid: Pre-fill form
    else Manual Entry
        User->>BookGrid: Enter details manually
    end
    
    User->>BookGrid: Submit
    BookGrid->>BookService: addBook(bookData)
    BookService->>Server: POST /api/books
    Server->>DB: INSERT INTO books
    DB-->>Server: New book ID
    Server-->>BookService: Created book
    BookService-->>BookGrid: Update UI
    BookGrid-->>User: Show success message
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "React Components"
        Pages[Pages]
        Components[Components]
    end
    
    subgraph "State Management"
        AuthCtx[AuthContext]
        ThemeCtx[ThemeContext]
    end
    
    subgraph "Service Layer"
        API[API Service]
        BookSvc[Book Service]
        UserSvc[User Service]
        PhotoSvc[Photo Service]
    end
    
    subgraph "Backend"
        Routes[Express Routes]
        Middleware[Auth Middleware]
        DB[(Database)]
    end
    
    Pages --> Components
    Components --> AuthCtx
    Components --> ThemeCtx
    Components --> BookSvc
    Components --> UserSvc
    Components --> PhotoSvc
    
    BookSvc --> API
    UserSvc --> API
    PhotoSvc --> API
    
    API --> Routes
    Routes --> Middleware
    Middleware --> DB
    
    style AuthCtx fill:#ffd700
    style ThemeCtx fill:#ffd700
    style API fill:#90ee90
```

## Security Architecture

### Authentication & Authorization

1. **JWT Tokens**: Stateless authentication using JSON Web Tokens
2. **Password Hashing**: bcrypt with salt rounds for secure password storage
3. **Role-Based Access**: Admin, editor, and viewer roles
4. **Protected Routes**: Server-side middleware validates tokens on every request
5. **CORS Configuration**: Controlled cross-origin resource sharing

### Security Measures

```mermaid
graph TD
    Request[HTTP Request] --> CORS{CORS Check}
    CORS -->|Valid Origin| Auth{Auth Required?}
    CORS -->|Invalid| Reject1[403 Forbidden]
    
    Auth -->|No| Handler[Route Handler]
    Auth -->|Yes| Token{Valid Token?}
    
    Token -->|Yes| Role{Has Permission?}
    Token -->|No| Reject2[401 Unauthorized]
    
    Role -->|Yes| Handler
    Role -->|No| Reject3[403 Forbidden]
    
    Handler --> Response[HTTP Response]
    
    style CORS fill:#ffeb3b
    style Auth fill:#ff9800
    style Token fill:#f44336
    style Role fill:#9c27b0
```

## Performance Optimizations

### Frontend
- **Code Splitting**: Lazy loading of routes and heavy components
- **Image Optimization**: Lazy loading book covers with loading states
- **Debounced Search**: Reduced API calls during user input
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Efficient rendering of large book lists (planned)

### Backend
- **Database Indexing**: Indexes on frequently queried columns (ISBN, title, author)
- **Connection Pooling**: Reused database connections
- **Caching**: In-memory caching for frequently accessed data (planned)
- **Pagination**: Limit query results for large datasets

### Database
- **Full-Text Indexes**: Fast search across title and author fields
- **Foreign Key Constraints**: Maintain referential integrity
- **Optimized Queries**: Selective column fetching, JOIN optimization

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Server"
        Nginx[Nginx Reverse Proxy]
        Node[Node.js Process]
        Static[Static Files<br/>React Build]
    end
    
    subgraph "Database Server"
        MySQL[(MySQL Database)]
    end
    
    subgraph "File Storage"
        Uploads[Uploads Directory<br/>Book Covers & Photos]
    end
    
    Internet[Internet] --> Nginx
    Nginx --> Static
    Nginx --> Node
    Node --> MySQL
    Node --> Uploads
    
    style Nginx fill:#009639
    style Node fill:#90c53f
    style MySQL fill:#00758f
```

## Scalability Considerations

### Current Scale
- Designed for personal/small group use (1-50 users)
- Handles libraries up to 10,000+ books efficiently
- Single-server deployment

### Future Scaling Options
- **Horizontal Scaling**: Load balancer + multiple Node.js instances
- **Database Replication**: Read replicas for heavy read workloads
- **CDN Integration**: Serve static assets and book covers from CDN
- **Caching Layer**: Redis for session management and frequently accessed data
- **Microservices**: Split features into separate services (e.g., search, metadata)

## API Design Principles

1. **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE)
2. **Consistent Responses**: Uniform JSON structure across endpoints
3. **Error Handling**: Descriptive error messages with appropriate status codes
4. **Versioning**: API version in URL path (currently implicit v1)
5. **Authentication**: Bearer token in Authorization header
6. **Pagination**: Offset/limit for list endpoints (planned)
7. **Filtering**: Query parameters for filtering and sorting

## Development Workflow

```mermaid
graph LR
    Dev[Local Development] --> Test[Testing]
    Test --> Commit[Git Commit]
    Commit --> Push[Git Push]
    Push --> Build[Build React App]
    Build --> Deploy[Deploy to Server]
    Deploy --> Monitor[Monitor Logs]
    
    style Dev fill:#4caf50
    style Build fill:#2196f3
    style Deploy fill:#ff9800
```

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Features Used**: ES6+, CSS Grid, CSS Custom Properties, Fetch API
- **Polyfills**: Not required for target browsers

## Accessibility

- **Semantic HTML**: Proper heading hierarchy, landmarks
- **ARIA Labels**: Screen reader support for interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG AA compliant color schemes
- **Focus Management**: Visible focus indicators
