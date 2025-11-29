# Planned Features

- [x] **Force Login on Load**
  - Show a greeting on initial page load.
  - Force the user to successfully log in before accessing anything on the server (protect all routes/views).

- [x] **Settings Menu Popup**
  - ✅ **MIGRATED TO REACT** - Full settings modal with tabs for General, Profile, Filters, Export, Users, and Audiobookshelf
  - Create a pop-up menu when the settings button is clicked.
  - Style it consistently with the user creation menu.
  - Show common server options that the user can change.

- [x] **Custom Image Upload**
  - Ability to upload custom image files for a book (e.g., cover art).

- [x] **Enhanced Book Metadata**
  - Create a pop-up menu for each book.
  - Add ability to add/edit/remove metadata descriptors via text boxes.
  - Include specific descriptors for cover and book binding styles (e.g., check boxes).

- [x] **Photo Gallery & Tagging**
  - Upload multiple photos per book (cover variations, special pages, etc.)
  - Tag photos with descriptors (cover, spine, edges, special features)
  - Photo gallery view in book details

- [x] **Enhanced Physical Book Metadata**
  - **Format Types**: Hardback, Paperback, Mass Market Paperback, Board Book, Leather Bound
  - **Condition**: Excellent, Good, Fair, Poor
  - **Special Features**: Signed Copy, Bonus Chapters, Limited Edition, First Edition
  - **Binding & Edge Types**: 
    - Gilded edges
    - Fore-edge painting
    - Sprayed edges
    - Hidden fore-edge art
    - Decorative binding details

## Management & Organization

- [ ] **Advanced Format Tracking**
  - Explicitly distinguish between Physical, Ebook, and Audiobook.
  - Add format-specific metadata (e.g., Location/Shelf for physical, Duration for audio, File size for digital).

- [ ] **Custom Shelves & Collections**
  - Allow users to create custom shelves (e.g., "Favorites", "To Read", "History").
  - Ability to move books between shelves or add to multiple collections.

- [x] **Reading Status & Progress**
  - Track status: Not Started, In Progress, Completed, DNF (Did Not Finish).
  - Progress bars for current reads (page number or percentage).

- [x] **Series Management**
  - Group books by series.
  - Sort books within a series by volume number.

- [x] **Loan / Lending Tracker**
  - Track physical books lent out to friends.
  - Record borrower name and due date.

- [ ] **Bulk Management Tools**
  - Select multiple books to perform batch actions.
  - Bulk delete, bulk add tags, or bulk move to shelf.

- [ ] **Advanced Filtering & Sorting**
  - Multi-select filters (e.g., "Fantasy" AND "Hardcover").
  - Sort by Rating, Page Count, Publication Date, or Date Added.

## Missing Features (Legacy → React Migration)

### Critical Missing Features
- [x] **Barcode Scanner Integration**
  - Scan tab in Add Book modal with Html5-QRCode library
  - Camera-based barcode scanning for ISBN lookup
  - Auto-populate book details from scanned ISBN

- [x] **Online Search (OpenLibrary API)**
  - Search tab in Add Book modal
  - Search by ISBN, title, or author
  - Display search results with book details
  - One-click add from search results

- [x] **EPUB Reader**
  - Reader modal with ePub.js integration
  - Open/read EPUB files directly in browser
  - Navigation controls (prev/next page)
  - Reading progress tracking

- [x] **Context Menu on Book Cards** ✅
  - Right-click or click menu on each book card
  - Quick actions: Edit, Delete, Open Reader (for ebooks)
  - Show/hide menu on card interaction

### Navigation & Filtering
- [x] **Sidebar Navigation Filters**
  - Hot Books filter
  - Downloaded Books filter
  - Read Books filter
  - Create a Shelf option

- [x] **Library Search** ✅
  - Real-time search across title, author, ISBN
  - Search bar in top navigation

### UI/UX Enhancements
- [ ] **Mobile Menu Toggle**
  - Hamburger menu for mobile devices
  - Sidebar overlay for small screens

- [x] **Library Stats Display** ✅
  - Total books count
  - Books by format breakdown
  - Reading progress statistics

### Backend Features
- [x] **Metadata Refresh**
  - Bulk refresh metadata for all books
  - Download/update cover images from OpenLibrary
  - Progress indicator during refresh

## Calibre-Web Inspired Features

### eBook Distribution & Sharing
- [ ] **Send to E-Reader**
  - One-click send to Kindle via email
  - Support for multiple e-reader email addresses
  - Email configuration in settings

- [ ] **OPDS Feed**
  - Generate OPDS catalog feed
  - Allow e-reader apps to browse library
  - Download books directly from compatible apps
  - Authentication support for OPDS

- [ ] **Public Sharing**
  - Optional public library view (no login required)
  - Share specific books or collections via link
  - Download permissions control

### Advanced Metadata Management
- [x] **Metadata Download from Multiple Sources**
  - Metadata refresh from OpenLibrary API
  - Batch metadata download for all books
  - Success/error feedback UI
  - Automatic book list refresh

- [x] **Publisher & Language Tracking**
  - Publisher field in database and UI
  - Language/locale tracking
  - Ready for filtering (fields exist)

- [x] **Book Ratings & Reviews**
  - Star ratings (0-5, supports decimals)
  - Personal review/notes field
  - StarRating component with hover effects
  - Display on BookCard and BookDetailModal

### Format Conversion & Processing
- [ ] **eBook Format Conversion**
  - Convert between formats (EPUB, MOBI, PDF, etc.)
  - Integration with Calibre CLI tools
  - Batch conversion support
  - Quality/size settings

- [ ] **Automated Book Ingestion**
  - Watch folder for new books
  - Auto-import and process
  - Intelligent metadata extraction
  - Handle subfolder structures

### Multi-User Features
- [x] **Per-User Permissions**
  - Role-based system (admin, editor, viewer)
  - Custom JSON permissions field
  - Access control on reading lists
  - User activity logging via existing auth system

- [x] **User Reading Lists**
  - Personal reading lists (e.g., "To Read", "Favorites")
  - Public/private list settings
  - Add/remove books from lists
  - List sharing between users
  - Book count tracking
  - Full CRUD API endpoints

### Skip these Integration Features
- [ ] **Kobo Integration**
  - Sync with Kobo e-readers
  - Custom cover thumbnails
  - Reading progress sync
  - Metadata sync

- [ ] **Cloud Storage Integration**
  - Google Drive support
  - Dropbox support
  - OneDrive support
  - S3-compatible storage

### Advanced Library Features
- [ ] **Multi-Language Support**
  - UI translation system
  - Support for 20+ languages
  - User language preference

- [x] **Advanced Search**
  - Full-text search with MySQL FULLTEXT indexes
  - Relevance ranking
  - Saved search queries
  - Search within title and author fields

- [x] **Book Statistics & Analytics**
  - Reading time tracking with sessions
  - Books read per month/year
  - Author statistics (top 20 authors)
  - Genre distribution data
  - Average ratings and total pages

- [x] **Duplicate Detection**
  - Find duplicate books by ISBN
  - Find duplicates by title/author combination
  - Grouped results with book IDs
  - Ready for merge functionality

### Backup & Export
- [x] **Automated Backups**
  - [x] Database backup endpoint
  - [x] Restore from backup
  - [x] Export library to CSV
  - [x] Export library to JSON

- [ ] **Library Export Formats**
  - [x] Export as CSV
  - [x] Export as JSON
  - Export as JSON
  - Export as Calibre database
  - Custom export templates


### Mobile & Tablet Features
- [x] **Responsive Layout Foundation**
  - Comprehensive breakpoints (480px, 768px, 1024px, 1280px)
  - Touch-friendly sizing (44px minimum touch targets)
  - Responsive book grid (2-5 columns based on screen size)
  - Mobile hamburger menu

- [ ] **Touch Optimizations**
  - Swipe gestures for navigation
  - Long-press for book details
  - Pull-to-refresh on library
  - Haptic feedback (iOS)
  - Touch ripple effects

- [ ] **Progressive Web App (PWA)**
  - Installable on iOS/Android home screen
  - Offline support with service worker
  - App-like experience (no browser chrome)
  - Background sync for pending changes
  - Push notifications for due dates

- [ ] **Platform-Specific Features**
  - iOS safe area support (notched devices)
  - Android share target API
  - Native mobile keyboards
  - Camera access for barcode scanning
  - File picker integration

### Social & Community Features
- [ ] **Book Recommendations**
  - AI-powered recommendations based on reading history
  - "Similar books" suggestions
  - Trending books in your network
  - Genre-based recommendations

- [ ] **Social Reading**
  - Follow other users
  - See what friends are reading
  - Share book recommendations
  - Reading challenges (e.g., "Read 50 books this year")
  - Book clubs with discussion threads

- [ ] **Reviews & Ratings**
  - Public reviews (optional)
  - Review helpful/unhelpful voting
  - Spoiler tags for reviews
  - Review moderation tools

- [ ] **Activity Feed**
  - Recent additions to library
  - Reading progress updates
  - Reviews and ratings from followed users
  - Book completion celebrations

### Reading Experience Enhancements
- [ ] **Enhanced EPUB Reader**
  - Customizable themes (sepia, dark, light)
  - Font size and family selection
  - Margin and line spacing controls
  - Bookmarks and highlights
  - Text-to-speech integration
  - Reading statistics (time, speed)

- [ ] **Reading Goals & Challenges**
  - Annual reading goal tracker
  - Monthly reading challenges
  - Genre diversity goals
  - Page count milestones
  - Achievement badges

- [ ] **Reading Sessions**
  - Timer for reading sessions
  - Track pages read per session
  - Session history and analytics
  - Focus mode (distraction-free)

### Advanced Organization
- [ ] **Smart Collections**
  - Auto-updating collections based on rules
  - Dynamic filters (e.g., "Unread books added this month")
  - Collection templates
  - Nested collections

- [ ] **Tags & Labels**
  - Custom tags for books
  - Tag-based filtering
  - Tag cloud visualization
  - Auto-tagging based on metadata

- [ ] **Virtual Shelves**
  - Visual shelf representation
  - Drag-and-drop organization
  - Shelf backgrounds and themes
  - 3D shelf view option

### Data & Analytics
- [ ] **Advanced Statistics**
  - Reading heatmap (calendar view)
  - Genre distribution pie charts
  - Author word clouds
  - Reading pace trends
  - Completion rate analytics

- [ ] **Data Visualization**
  - Interactive charts and graphs
  - Export charts as images
  - Customizable dashboard
  - Year-in-review summary

- [ ] **Reading Insights**
  - Average pages per day
  - Fastest/slowest reads
  - Most productive reading times
  - Genre preferences over time

### Integration & Automation
- [ ] **Goodreads Import**
  - Import library from Goodreads CSV
  - Sync ratings and reviews
  - Import reading lists
  - One-time or periodic sync

- [ ] **Amazon Integration**
  - Link to Amazon for purchasing
  - Price tracking and alerts
  - Wishlist sync
  - Kindle library import

- [ ] **Library System Integration**
  - Check local library availability
  - Place holds on books
  - Due date reminders
  - Library card management

- [ ] **Smart Home Integration**
  - Alexa/Google Assistant commands
  - "What should I read next?"
  - Reading progress updates
  - Add books via voice

### Performance & Quality of Life
- [ ] **Search Improvements**
  - Fuzzy search (typo tolerance)
  - Search suggestions/autocomplete
  - Recent searches
  - Advanced search builder UI

- [ ] **Keyboard Shortcuts**
  - Quick add book (Ctrl+N)
  - Search focus (Ctrl+K)
  - Navigate between views
  - Bulk selection shortcuts

- [ ] **Accessibility**
  - Screen reader optimization
  - High contrast mode
  - Keyboard-only navigation
  - ARIA labels throughout
  - Dyslexia-friendly fonts

- [ ] **Performance Optimizations**
  - Virtual scrolling for large libraries
  - Image lazy loading
  - Code splitting
  - CDN for static assets
  - Database query optimization

### Admin & Maintenance
- [ ] **User Management**
  - Bulk user operations
  - User activity logs
  - Storage quota per user
  - User groups/teams

- [ ] **System Monitoring**
  - Server health dashboard
  - Database size tracking
  - API usage statistics
  - Error logging and alerts

- [ ] **Scheduled Tasks**
  - Automatic metadata refresh
  - Scheduled backups
  - Database cleanup
  - Email digest notifications

### Fun & Gamification
- [ ] **Achievements System**
  - Unlock badges for milestones
  - Reading streaks
  - Genre explorer badges
  - Speed reader achievements

- [ ] **Leaderboards**
  - Most books read
  - Fastest readers
  - Most diverse readers
  - Monthly competitions

- [ ] **Reading Streaks**
  - Daily reading streak tracker
  - Streak recovery options
  - Streak milestones
  - Motivational notifications
