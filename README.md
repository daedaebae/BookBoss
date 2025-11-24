# BookBoss

A modern book management application for tracking your personal library.

## Project Structure

- **`book-boss-react/`** - New React + TypeScript frontend (in development)
- **`legacy-web/`** - Original vanilla JS frontend (deprecated)
- **`server/`** - Node.js/Express backend with MySQL database

## Current Status

🚧 **React Migration in Progress** - Phase 1 Complete

We are migrating from vanilla JavaScript to React for better maintainability and mobile responsiveness.

### Completed
- ✅ Phase 1: Setup & Foundation
  - React + TypeScript + Vite setup
  - AuthContext and ThemeContext
  - Global styles ported
  - Basic layout component

### Next Steps
- Phase 2: Core Features (Book Grid)
- Phase 3: Interactive Features (Add/Edit/Delete)
- Phase 4: Settings & Admin
- Phase 5: Production Deployment

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
