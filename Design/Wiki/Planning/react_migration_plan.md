# React Migration Implementation Plan

This document outlines the strategy for migrating the BookBoss application from a Vanilla JS/HTML/CSS architecture to a modern React-based application.

## 1. Technology Stack

-   **Framework**: React 18+
-   **Build Tool**: Vite (for fast development and optimized builds)
-   **Language**: TypeScript (highly recommended for type safety and better developer experience) or JavaScript (ES6+)
-   **Styling**: CSS Modules or Tailwind CSS (recommended for utility-first styling)
-   **Routing**: React Router v6
-   **State Management**: React Context API (sufficient for current complexity) or Zustand (if more complex state is needed)
-   **HTTP Client**: Axios (already in use)
-   **Icons**: Lucide React or React Icons

## 2. Project Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
│   ├── common/      # Buttons, Inputs, Modals, Toast
│   ├── layout/      # Sidebar, Header, Layout wrapper
│   ├── books/       # BookCard, BookGrid, BookFilters
│   └── settings/    # Settings forms, User management
├── context/         # Global state (AuthContext, ThemeContext, BookContext)
├── hooks/           # Custom hooks (useAuth, useBooks, useTheme)
├── pages/           # Page components (Library, Settings, Login)
├── services/        # API service layer
├── types/           # TypeScript interfaces (if using TS)
├── utils/           # Helper functions
├── App.tsx          # Main app component with routing
└── main.tsx         # Entry point
```

## 3. Component Breakdown

### Layout Components
-   `Layout`: Wraps the application with Sidebar and Main Content.
-   `Sidebar`: Navigation menu with active state handling.
-   `Header`: Search bar, Add Book button, Mobile menu toggle.

### Common Components
-   `Button`: Reusable button with variants (primary, secondary, icon).
-   `Input`: Form input with label and error handling.
-   `Modal`: Generic modal wrapper.
-   `Toast`: Notification component.
-   `ToggleSwitch`: For dark mode.
-   `Select`: Custom or styled select dropdown.

### Feature Components
-   `BookGrid`: Grid layout for displaying books.
-   `BookCard`: Individual book display with cover, title, author, and context menu.
-   `BookContextMenu`: Dropdown menu for book actions (Edit, Delete, etc.).
-   `AddBookModal`: Form for adding new books (manual & API search).
-   `EditBookModal`: Form for editing existing books.
-   `SettingsTabs`: Navigation for settings categories.
-   `UserList`: Admin user management list.

## 4. State Management Strategy

### AuthContext
-   Manages `currentUser` and `authToken`.
-   Provides `login`, `logout`, and `register` functions.
-   Persists token to `localStorage`.

### ThemeContext
-   Manages `theme` (light/dark) and `accentColor`.
-   Applies classes to `document.body`.
-   Persists preferences to `localStorage`.

### BookContext (Optional)
-   Could manage the list of books, filters, and sort criteria.
-   Alternatively, use React Query (TanStack Query) for server state management (highly recommended for caching and syncing).

## 5. Migration Phases

### Phase 1: Setup & Foundation
1.  Initialize new Vite project: `npm create vite@latest book-boss-react -- --template react-ts`
2.  Install dependencies: `react-router-dom`, `axios`, `lucide-react`.
3.  Set up global styles (port existing `style.css` or convert to Tailwind).
4.  Create `AuthContext` and `ThemeContext`.
5.  Implement basic `Layout`, `Sidebar`, and `Login` page.

### Phase 2: Core Features (Read-Only)
1.  Create `BookCard` and `BookGrid` components.
2.  Implement `useBooks` hook to fetch books from the existing API.
3.  Build the `Library` page to display books.
4.  Implement search and filtering logic.

### Phase 3: Interactive Features
1.  Implement `AddBookModal` (API search and manual entry).
2.  Implement `EditBookModal` and `Delete` functionality.
3.  Implement `BookContextMenu`.
4.  Add Toast notifications for success/error feedback.

### Phase 4: Settings & Admin
1.  Build `Settings` page with tabs.
2.  Implement User Management (Admin only).
3.  Implement Audiobookshelf integration settings.
4.  Add Metadata Refresh and Export features.

### Phase 5: Polish & Switch
1.  Verify all features against the legacy app.
2.  Optimize performance (lazy loading images/routes).
3.  Replace the static file serving in `server.js` to serve the React build output (`dist` folder).

## 6. API Integration
-   Create an `api.ts` file using Axios interceptors to automatically attach the `Authorization` header from `AuthContext`.
-   Define typed API response interfaces for better type safety.

## 7. Benefits of Migration
-   **Component Reusability**: Easier to maintain and update UI elements.
-   **State Management**: Cleaner handling of complex state (like filters + search + sort).
-   **Performance**: Virtual DOM and optimized builds.
-   **Developer Experience**: Hot Module Replacement (HMR) and better tooling.
