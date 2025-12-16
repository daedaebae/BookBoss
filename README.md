# BookBoss

A comprehensive book management system.

## 🚀 Quick Start (Docker)

The easiest way to run BookBoss is with Docker.

1.  **Prerequisites**:
    *   Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
    *   Add `127.0.0.1 durf.local` to your `/etc/hosts` file.
2.  **Run**:
    ```bash
    docker compose up --build -d
    ```
3.  **Access**:
    -   **Frontend**: https://durf.local (or https://localhost)
        -   *Note*: Accept the self-signed certificate warning in your browser.
    -   **Backend**: http://localhost:3000 (API)
    -   **Database**: Port 3306 (internal), 3307 (external)

> **Note**: Default credentials in `docker-compose.yml` are for development only. Change `JWT_SECRET` and passwords for production usage.

## Manual Installation
A modern, full-featured book management application for tracking your personal library with support for physical books, ebooks, and audiobooks.

## 📚 Documentation

**Complete documentation is available in the [Design/Wiki](./Design/Wiki/) folder:**

- **[Architecture Overview](./Design/Wiki/Architecture.md)** - System design and technology stack
- **[Database Schema](./Design/Wiki/Database-Schema.md)** - Complete database structure
- **[API Documentation](./Design/Wiki/API-Documentation.md)** - REST API reference
- **[Book Management](./Design/Wiki/Book-Management.md)** - Core features guide
- **[React Migration](./Design/Wiki/React-Migration.md)** - Migration progress and developer guide
- **[Component Library](./Design/Wiki/Component-Library.md)** - React components reference

**Planning Documents:**
- [Planned Features](./Design/PLANNED_FEATURES.md) - Feature roadmap and status
- [React Migration Plan](./Design/react_migration_plan.md) - Original migration strategy

## Project Structure

- **`book-boss-react/`** - React + TypeScript frontend (production-ready)
- **`server/`** - Node.js/Express backend with MySQL database
- **`legacy-web/`** - Original vanilla JS frontend (deprecated)
- **`Design/`** - Documentation and planning materials

## Current Status

✅ **React Migration: COMPLETE** (November 2024)

All features have been successfully migrated to React with significant enhancements.

### Completed Features
- ✅ Full React + TypeScript migration
- ✅ Mobile-responsive design
- ✅ Barcode scanner integration
- ✅ OpenLibrary API search
- ✅ EPUB reader
- ✅ Photo gallery with tagging
- ✅ Loan tracking system
- ✅ Reading lists and shelves
- ✅ Statistics and analytics
- ✅ Multi-user support with admin panel
- ✅ Settings and configuration
- ✅ Dark/Light theme with custom accents

### In Progress
- 🚧 Performance optimizations
- 🚧 PWA features
- 🚧 Accessibility improvements

## Development

### Backend
```bash
cd server
npm install
node server.js
```

### React Frontend (Development)
```bash
cd book-boss-react
npm install
npm run dev
```

### Legacy Frontend
```bash
# Served from legacy-web/ directory
# Open index.html in browser or use a local server
```

## Features

- 📚 Book library management
- 🔍 API search integration (Google Books)
- 📱 Mobile-responsive design
- 🎨 Dark/Light theme with accent colors
- 👥 Multi-user support with admin controls
- 🔗 Audiobookshelf integration
- 📤 Export library (JSON/CSV)

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Custom CSS (no framework)
- Axios for API calls

**Backend:**
- Node.js + Express
- MySQL
- JWT authentication
- Multer for file uploads

## Environment Variables

Create a `.env` file in the `server/` directory:
```
DB_HOST=localhost
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=bookboss
JWT_SECRET=your_secret_key
```

## License

Private - All Rights Reserved
