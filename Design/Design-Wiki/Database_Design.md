# Database Design

This document details the database schema for the BookBoss application.

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ SHELVES : owns
    USERS ||--o{ USER_BOOKS : tracks
    USERS ||--o{ LOANS : manages
    USERS ||--o{ READING_LISTS : creates
    USERS ||--o{ SAVED_SEARCHES : saves
    USERS ||--o{ AUDIOBOOKSHELF_SERVERS : connects
    USERS ||--o{ READING_SESSIONS : records

    BOOKS ||--o{ SHELF_BOOKS : "is in"
    BOOKS ||--o{ USER_BOOKS : "has progress"
    BOOKS ||--o{ LOANS : "is loaned"
    BOOKS ||--o{ BOOK_PHOTOS : "has photos"
    BOOKS ||--o{ READING_LIST_BOOKS : "is in"
    BOOKS ||--o{ READING_SESSIONS : "read in"

    SHELVES ||--o{ SHELF_BOOKS : contains
    READING_LISTS ||--o{ READING_LIST_BOOKS : contains

    USERS {
        int id PK
        string username
        string password
        boolean is_admin
        json privacy_settings
    }

    BOOKS {
        int id PK
        string title
        string author
        string isbn
        string cover_url
        string library
        timestamp added_at
        json categories
        string file_path
        string format
        string cover_image_path
        string binding_type
        json descriptors
        string series
        float series_index
        string publisher
        string language
        text description
        string status
        int rating
        int page_count
        date publication_date
        boolean is_loaned
        string borrower_name
        date loan_date
        date due_date
    }

    SHELVES {
        int id PK
        int user_id FK
        string name
    }

    SHELF_BOOKS {
        int shelf_id FK
        int book_id FK
    }

    USER_BOOKS {
        int user_id FK
        int book_id FK
        string status
        int progress
        int rating
    }

    LOANS {
        int id PK
        int user_id FK
        int book_id FK
        string borrower_name
        date due_date
        date return_date
        text notes
    }

    BOOK_PHOTOS {
        int id PK
        int book_id FK
        string photo_path
        string photo_type
        text description
        json tags
        timestamp uploaded_at
    }

    READING_LISTS {
        int id PK
        int user_id FK
        string name
        text description
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    READING_LIST_BOOKS {
        int id PK
        int list_id FK
        int book_id FK
        timestamp added_at
        text notes
    }

    SETTINGS {
        string key PK
        text value
    }
```

## Table Definitions

### Core Tables

-   **`users`**: Stores user credentials and admin status.
-   **`books`**: The central table storing all book metadata (Title, Author, ISBN, etc.) and file paths.
-   **`settings`**: Key-value store for global application settings (e.g., app title, theme).

### Organization

-   **`shelves`**: User-created collections (folders) for books.
-   **`shelf_books`**: Many-to-many link between Shelves and Books.
-   **`reading_lists`**: Ordered lists of books, can be public or private.
-   **`reading_list_books`**: Links books to reading lists with optional notes.

### User Data & Progress

-   **`user_books`**: Tracks a specific user's interaction with a book (Read status, specific page progress, personal rating).
-   **`loans`**: Tracks books lent out to others, including borrower name and due dates.
-   **`reading_sessions`**: Logs reading duration and pages read for statistics.
-   **`saved_searches`**: Stores complex search queries for quick access.

### Media & Integrations

-   **`book_photos`**: Stores additional images for a book (e.g., specific binding details, damage).
-   **`audiobookshelf_servers`**: Stores connection details/tokens for Audiobookshelf integration.
