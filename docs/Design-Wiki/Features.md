# Features

This document outlines the features of BookBoss, categorized by functionality.

## 📚 Library Management

### Book Cataloging
-   **Add Books**: Manually enter book details or auto-fill using ISBN search (Google Books API).
-   **Edit Metadata**: Update title, author, publisher, publication date, page count, and more.
-   **Detailed Metadata**: Track binding types (Hardcover, Paperback), conditions, and special features (Signed, First Edition).
-   **File Management**: Upload and store EPUB/PDF files and cover images directly.
-   **Bulk Operations**: Delete multiple books at once.

### Organization & Discovery
-   **Search**: Real-time search by title, author, or ISBN.
-   **Shelves**: Create custom shelves (collections) and organize books into them.
-   **Reading Lists**: Create public or private reading lists.
-   **Sorting**: Sort books by Date Added, Title, Author, Rating, etc.
-   **Filters**: Filter by reading status, format, or library location.

## 👤 User & Social

### User Accounts
-   **Authentication**: Secure login system.
-   **Roles**: Admin and standard user roles.
-   **Privacy**: Per-user privacy settings.

### Reading Progress
-   **Tracking**: Track status (Not Started, In Progress, Completed, DNF).
-   **Sessions**: Log reading sessions (time spent, pages read).
-   **Statistics**: View reading stats by month, top authors, and format distribution.

### Lending (Loans)
-   **Loan Tracker**: Mark books as "Loaned Out".
-   **Borrower Info**: Record who has the book and the due date.
-   **History**: Keep a record of past loans.

## ⚙️ Administration

### System
-   **Settings**: Configure application title, theme, and registration policies.
-   **Backup & Restore**: Create full database backups and restore from SQL files.
-   **Export**: Export the entire library to CSV or JSON formats.
-   **Debug Tools**: Admin tools to reset the database, generate test data, and view logs.

### User Privacy
-   **Library Visibility**: Toggle public visibility of your library.
-   **Custom Library Name**: Set a custom display name for your library in the public directory.

### Integrations
-   **Audiobookshelf**: Connect to an external Audiobookshelf server to sync audiobook data.

## 🖼️ Media

-   **Photo Gallery**: Upload multiple photos per book (e.g., to document condition or special features).
-   **Cover Management**: Auto-download covers from metadata sources or upload custom images.
