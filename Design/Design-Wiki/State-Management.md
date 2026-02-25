# State Management

## Overview

BookBoss uses a combination of **React Context** and **Local State** to manage data flow across the application. This approach avoids prop drilling while keeping the architecture simple and maintainable without the need for heavy external libraries like Redux.

## Context Architecture

### 1. AuthContext
Manages the user's authentication session.

- **State**:
  - `currentUser`: The logged-in user object (or null).
  - `token`: The JWT authentication token.
  - `isAuthenticated`: Boolean flag.
- **Actions**:
  - `login(username, password)`: Authenticates user.
  - `logout()`: Clears session and redirects to login.
  - `register(data)`: Creates new account.

### 2. ThemeContext
Manages the visual appearance of the application.

- **State**:
  - `theme`: 'light' | 'dark'.
  - `accentColor`: Hex code for the primary color.
- **Actions**:
  - `toggleTheme()`: Switches between modes.
  - `setAccentColor(color)`: Updates the primary color.
- **Persistence**: Saves preferences to `localStorage`.

## Local State Management

For page-specific data, we use React's `useState` and `useEffect` hooks.

### Example: LibraryPage
- `books`: Array of book objects fetched from API.
- `loading`: Boolean loading state.
- `error`: Error message string.
- `filters`: Object containing active filter criteria.

```typescript
const [books, setBooks] = useState<Book[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadBooks();
}, [filters]);
```

## Data Flow Pattern

1. **Component Mounts**: `useEffect` triggers data fetch.
2. **Service Call**: `BookService` makes Axios request to API.
3. **State Update**: Response data updates local state (`setBooks`).
4. **Render**: Component re-renders with new data.

## Future: React Query

As the application grows, we plan to migrate server-state management to **TanStack Query (React Query)**.

**Benefits:**
- Automatic caching and background refetching.
- Simplified loading/error states.
- Deduping of network requests.
- Better pagination support.

## Best Practices

- **Lift State Up**: Only when multiple components need access.
- **Context Splitting**: Keep contexts focused (Auth vs Theme) to prevent unnecessary re-renders.
- **Custom Hooks**: Encapsulate logic (e.g., `useBooks`, `useAuth`) for cleaner components.
