# User Flows

This document visualizes key user interactions within the BookBoss application.

## Authentication Flow

Process for logging in a user and establishing a session.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Client
    participant API as Node API
    participant DB as MySQL Database

    User->>Frontend: Enters Username & Password
    Frontend->>API: POST /api/login
    API->>DB: SELECT * FROM users WHERE username = ?
    DB-->>API: User Record

    alt Password Match
        API->>API: Generate Session Token
        API-->>Frontend: 200 OK { token, user_id, is_admin }
        Frontend->>Frontend: Store Token in AuthContext / LocalStorage
        Frontend->>User: Redirect to Library
    else Password Mismatch
        API-->>Frontend: 401 Unauthorized
        Frontend->>User: Show Error Message
    end
```

## Add Book Flow

Process for adding a new book, including metadata and optional file uploads.

```mermaid
sequenceDiagram
    participant User
    participant Frontend as React Client
    participant API as Node API
    participant Ext as Google Books API
    participant FS as File System
    participant DB as MySQL Database

    User->>Frontend: Clicks "Add Book"
    Frontend->>User: Shows Add Book Modal

    alt Search by ISBN
        User->>Frontend: Enters ISBN & Clicks Search
        Frontend->>API: (Proxy) GET https://www.googleapis.com/...
        API->>Ext: Fetch Metadata
        Ext-->>API: JSON Metadata
        API-->>Frontend: Book Details
        Frontend->>User: Pre-fills Form
    end

    User->>Frontend: Fills Details & Uploads Cover/File
    User->>Frontend: Clicks "Save"
    Frontend->>API: POST /api/books (Multipart Form Data)

    API->>FS: Save Uploaded Files (Cover/Epub)
    API->>DB: INSERT INTO books (...)
    DB-->>API: Success (ID)
    API-->>Frontend: 201 Created
    Frontend->>User: Close Modal & Refresh Grid
```

## Loan Book Flow

Process for tracking a book lent to a friend.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB

    User->>Frontend: Selects Book -> "Loan Book"
    User->>Frontend: Enters Borrower Name & Due Date
    Frontend->>API: POST /api/loans
    API->>DB: INSERT INTO loans (...)
    API->>DB: UPDATE books SET is_loaned = 1 ...
    DB-->>API: Success
    API-->>Frontend: 201 Created
    Frontend->>User: Updates Book Status Badge
```
