# React Migration Guide

## Overview

BookBoss is currently undergoing a migration from a vanilla JavaScript application to a modern React-based architecture. This document tracks the migration progress and provides guidance for developers.

## Migration Status

### ✅ Phase 1: Setup & Foundation (COMPLETE)

- [x] Initialize Vite + React + TypeScript project
- [x] Set up project structure and folders
- [x] Install core dependencies (react-router-dom, axios, lucide-react)
- [x] Create AuthContext for authentication state
- [x] Create ThemeContext for theme management
- [x] Port global CSS styles to index.css
- [x] Implement Layout component with Sidebar
- [x] Create Login page with authentication

### ✅ Phase 2: Core Features (COMPLETE)

- [x] Create BookCard component
- [x] Create BookGrid component
- [x] Implement book fetching with bookService
- [x] Build Library page
- [x] Implement search functionality
- [x] Add filtering by format and status
- [x] Create BookDetailModal component
- [x] Implement sorting options

### ✅ Phase 3: Interactive Features (COMPLETE)

- [x] Create AddBookModal with tabs (Manual, Search, Scan)
- [x] Implement barcode scanner with Html5-QRCode
- [x] Integrate OpenLibrary API search
- [x] Create EditBookModal component
- [x] Implement delete functionality with confirmation
- [x] Add Toast notification system
- [x] Create context menu for book cards
- [x] Implement EPUB reader modal

### ✅ Phase 4: Settings & Admin (COMPLETE)

- [x] Build Settings page with tabbed interface
- [x] Implement General settings tab
- [x] Implement Profile settings tab
- [x] Implement Filters settings tab
- [x] Implement Export settings tab (CSV/JSON)
- [x] Implement Users management tab (admin only)
- [x] Implement Audiobookshelf integration tab
- [x] Add metadata refresh functionality

### ✅ Phase 5: Advanced Features (COMPLETE)

- [x] Photo gallery with upload and tagging
- [x] Loan tracking system
- [x] Reading lists (custom collections)
- [x] User shelves (virtual organization)
- [x] Reading sessions tracking
- [x] Statistics and analytics
- [x] Mobile responsive design
- [x] Hamburger menu for mobile

### 🚧 Phase 6: Polish & Optimization (IN PROGRESS)

- [x] Mobile UX testing and refinement
- [x] Responsive breakpoints optimization
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] PWA features (service worker, offline support)
- [ ] SEO optimization
- [ ] Production build configuration

## Architecture Comparison

### Legacy (Vanilla JS)

```
legacy-web/
├── index.html          # Monolithic HTML
├── style.css           # All styles in one file
└── app.js              # All logic in one file (~3000 lines)
```

**Issues:**
- No component reusability
- Global state management
- Difficult to maintain
- Poor mobile experience
- No type safety

### Modern (React)

```
book-boss-react/src/
├── components/         # Reusable components
├── context/           # Global state management
├── pages/             # Page-level components
├── services/          # API abstraction layer
├── types/             # TypeScript definitions
└── utils/             # Helper functions
```

**Benefits:**
- Component-based architecture
- Type safety with TypeScript
- Better state management
- Easier testing
- Better mobile support
- Modern development experience

## Component Migration Map

| Legacy Feature | React Component | Status |
|----------------|-----------------|--------|
| Login form | `LoginPage.tsx` | ✅ Complete |
| Book grid | `BookGrid.tsx` | ✅ Complete |
| Book card | `BookCard.tsx` | ✅ Complete |
| Add book modal | `AddBookModal.tsx` | ✅ Complete |
| Edit book modal | `EditBookModal.tsx` | ✅ Complete |
| Settings menu | `SettingsPage.tsx` | ✅ Complete |
| User management | `UsersTab.tsx` | ✅ Complete |
| Sidebar navigation | `Sidebar.tsx` | ✅ Complete |
| Search bar | `SearchBar.tsx` | ✅ Complete |
| Theme toggle | `ThemeContext.tsx` | ✅ Complete |
| Barcode scanner | `ScanTab.tsx` | ✅ Complete |
| EPUB reader | `EpubReaderModal.tsx` | ✅ Complete |
| Photo gallery | `PhotoGallery.tsx` | ✅ Complete |
| Loan tracker | `LoanModal.tsx` | ✅ Complete |
| Reading lists | `ReadingListsPage.tsx` | ✅ Complete |

## State Management

### AuthContext

Manages user authentication state:

```typescript
interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, password: string) => Promise<void>;
}
```

**Usage:**
```typescript
const { currentUser, login, logout } = useAuth();
```

### ThemeContext

Manages theme and appearance:

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  accentColor: string;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
}
```

**Usage:**
```typescript
const { theme, toggleTheme, accentColor } = useTheme();
```

## Service Layer

All API calls are abstracted into service modules:

### API Service (`api.ts`)
- Axios instance with interceptors
- Automatic token attachment
- Error handling
- Base URL configuration

### Book Service (`bookService.ts`)
- `fetchBooks()`: Get all books
- `getBook(id)`: Get single book
- `addBook(data)`: Create new book
- `updateBook(id, data)`: Update book
- `deleteBook(id)`: Delete book
- `searchBooks(query)`: Search OpenLibrary

### User Service (`userService.ts`)
- `fetchUsers()`: Get all users (admin)
- `createUser(data)`: Create new user
- `updateUser(id, data)`: Update user
- `deleteUser(id)`: Delete user

### Photo Service (`photoService.ts`)
- `fetchPhotos(bookId)`: Get book photos
- `uploadPhoto(bookId, file, tag)`: Upload photo
- `deletePhoto(photoId)`: Delete photo

## TypeScript Types

All data structures are typed:

```typescript
// types/book.ts
export interface Book {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  cover_url?: string;
  format: 'physical' | 'ebook' | 'audiobook';
  rating?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'dnf';
  // ... more fields
}

// types/user.ts
export interface User {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'editor' | 'viewer';
  permissions?: Record<string, boolean>;
}
```

## Routing

React Router v6 for navigation:

```typescript
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
  <Route path="/lists" element={<ProtectedRoute><ReadingListsPage /></ProtectedRoute>} />
</Routes>
```

## Styling Approach

### CSS Variables

Global theme colors defined as CSS custom properties:

```css
:root {
  --primary-color: #6366f1;
  --background: #ffffff;
  --text-primary: #1f2937;
  --border-color: #e5e7eb;
}

[data-theme="dark"] {
  --background: #111827;
  --text-primary: #f9fafb;
  --border-color: #374151;
}
```

### Component Styles

Each component has its own CSS file:
- `BookCard.css`
- `Sidebar.css`
- `Modal.css`

### Responsive Design

Mobile-first approach with breakpoints:
```css
/* Mobile: default */
.book-grid {
  grid-template-columns: repeat(2, 1fr);
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .book-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .book-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Migration Challenges & Solutions

### Challenge 1: Global State
**Problem:** Legacy app used global variables  
**Solution:** React Context API for auth and theme state

### Challenge 2: Direct DOM Manipulation
**Problem:** Legacy app used `document.getElementById()`  
**Solution:** React refs and state management

### Challenge 3: Event Listeners
**Problem:** Manual event listener management  
**Solution:** React event handlers and useEffect cleanup

### Challenge 4: File Uploads
**Problem:** Complex multipart form handling  
**Solution:** FormData with Axios, Multer on backend

### Challenge 5: Modal Management
**Problem:** Multiple modals with z-index issues  
**Solution:** Portal-based modal system with proper stacking

## Testing Strategy

### Unit Tests (Planned)
- Component rendering tests
- Service layer tests
- Utility function tests

### Integration Tests (Planned)
- User flow tests
- API integration tests
- Authentication flow tests

### E2E Tests (Planned)
- Complete user journeys
- Cross-browser testing
- Mobile device testing

## Performance Optimizations

### Implemented
- Lazy loading images with loading states
- Debounced search input (300ms)
- React.memo for expensive components
- Axios request cancellation

### Planned
- Code splitting with React.lazy()
- Virtual scrolling for large lists
- Image optimization (WebP, responsive images)
- Service worker for offline support
- CDN for static assets

## Deployment

### Development
```bash
cd book-boss-react
npm run dev
```

### Production Build
```bash
npm run build
# Output: dist/ folder
```

### Server Configuration
Update `server/server.js` to serve React build:
```javascript
app.use(express.static(path.join(__dirname, '../book-boss-react/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../book-boss-react/dist/index.html'));
});
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

## Accessibility

### Implemented
- Semantic HTML elements
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance

### Planned
- Screen reader optimization
- Keyboard shortcuts
- High contrast mode
- Focus visible indicators
- Skip navigation links

## Future Improvements

- [ ] Progressive Web App (PWA) features
- [ ] Offline mode with service worker
- [ ] Push notifications
- [ ] Advanced caching strategies
- [ ] GraphQL API (alternative to REST)
- [ ] Real-time updates with WebSockets
- [ ] Internationalization (i18n)
- [ ] Dark mode improvements
- [ ] Animation and transitions
- [ ] Skeleton loading states

## Developer Guide

### Getting Started

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd BookBoss
   ```

2. **Install dependencies**
   ```bash
   cd book-boss-react
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Start backend**
   ```bash
   cd ../server
   npm install
   node server.js
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for React + TypeScript
- **Prettier**: Code formatting (recommended)
- **Naming**: PascalCase for components, camelCase for functions

### Component Guidelines

1. **Functional components** with hooks
2. **TypeScript** for all components
3. **Props interface** defined for each component
4. **CSS modules** or separate CSS files
5. **Error boundaries** for error handling
6. **Loading states** for async operations

### Git Workflow

1. Create feature branch from `main`
2. Make changes and commit
3. Test thoroughly
4. Create pull request
5. Code review
6. Merge to `main`

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
