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

### Integration Features
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

- [ ] **Advanced Search**
  - Full-text search in metadata
  - Boolean operators (AND, OR, NOT)
  - Saved search queries
  - Search within specific fields

- [ ] **Book Statistics & Analytics**
  - Reading time tracking
  - Books read per month/year
  - Genre distribution charts
  - Author statistics

- [ ] **Duplicate Detection**
  - Find duplicate books by ISBN
  - Find duplicates by title/author
  - Merge duplicate entries
  - Keep preferred version

### Backup & Export
- [ ] **Automated Backups**
  - Scheduled database backups
  - Export library to ZIP
  - Backup to cloud storage
  - Restore from backup

- [ ] **Library Export Formats**
  - Export as CSV
  - Export as JSON
  - Export as Calibre database
  - Custom export templates

