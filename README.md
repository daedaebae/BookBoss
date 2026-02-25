# BookBoss

A comprehensive book management system.

## 🚀 Quick Start (Docker)

The easiest way to run BookBoss is with Docker. You can pull the prebuilt image directly.

### Option 1: Docker Compose (Recommended)

1.  **Clone the repository** (to get the configuration files):
    ```bash
    git clone https://github.com/daedaebae/BookBoss.git
    cd BookBoss
    ```
2.  **Environment Setup**:
    ```bash
    cp .env.example .env
    # Note: Edit the .env file to configure your secure passwords and secrets!
    ```
3.  **Run with Prebuilt Image**:
    You can pull the latest prebuilt image and run the stack using Docker Compose:
    ```bash
    # Optionally comment out the 'build:' section in docker-compose.yml and add 'image: ghcr.io/daedaebae/bookboss:latest' to use the remote registry
    docker compose up -d
    ```

### Option 2: Standalone Docker Run

If you prefer to run BookBoss without `docker-compose`, you can pull and run the prebuilt image directly. You must explicitly pass your environment variables:

```bash
docker run -d \
  --name bookboss \
  -p 3000:3000 \
  -e MYSQL_ROOT_PASSWORD=bookboss \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=bookboss \
  -e MYSQL_DATABASE=bookboss \
  -e JWT_SECRET=your_secure_secret \
  -v bookboss_data:/var/lib/mysql \
  -v bookboss_uploads:/app/uploads \
  -v bookboss_backups:/app/backups \
  ghcr.io/daedaebae/bookboss:latest
```

### Accessing the Application
- **Frontend / Application**: http://localhost:3000
- **Database (Internal default mapped)**: Port 3306

> **Note**: The frontend is built directly into the Node.js backend public directory, so you only need to expose port 3000!

### Default Credentials
*   **Username**: `admin`
*   **Password**: `admin`
*(Created automatically on first build)*

> **Note**: For production, update `JWT_SECRET` and passwords in your `.env` file immediately.

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



## Features

- 📚 Book library management
- 🔍 API search integration (Google Books)
- 📱 Mobile-responsive design
- 🎨 Dark/Light theme with accent colors
- 👥 Multi-user support with admin controls
- 🔗 Audiobookshelf integration
- 📤 Export library (JSON/CSV)

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express
- **Database**: MySQL 8.0
- JWT authentication
- Multer for file uploads

## Environment Variables

The project uses a single `.env` file in the root directory. Copy `.env.example` to start:

```bash
cp .env.example .env
```

Review the comments in `.env` for detailed configuration options.

## License

MIT License - see the [LICENSE](LICENSE) file for details
