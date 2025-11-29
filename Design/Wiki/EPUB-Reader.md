# EPUB Reader

## Overview

BookBoss includes a built-in EPUB reader, allowing users to read their ebooks directly within the browser without needing external software. This feature leverages the `epub.js` library to render standard EPUB files.

## Features

- **In-Browser Reading**: Opens EPUB files stored on the server.
- **Navigation**: Next/Previous page controls.
- **Progress Tracking**: Remembers your location in the book (planned).
- **Responsive**: Adapts to different screen sizes.

## Architecture

```mermaid
graph LR
    Client[React Client]
    Server[Node.js Server]
    FS[File System]
    
    Client->>Server: Request Book File
    Server->>FS: Read .epub file
    FS-->>Server: File Stream
    Server-->>Client: Serve Static File
    Client->>ePubJS: Render Content
```

## Implementation Details

### Frontend
- **Library**: `epub.js`
- **Component**: `EpubReaderModal.tsx`
- **Rendering**: The reader renders the book content into an iframe or div container.

### Backend
- **Storage**: EPUB files are stored in the `server/uploads` directory (or a dedicated `books` directory).
- **Serving**: The server exposes a static route to serve these files to the frontend.

## Usage

1. **Upload**: User adds a book and uploads an EPUB file.
2. **Open**: User clicks "Read" from the book's context menu.
3. **Read**: The Reader Modal opens, loading the book content.

## Limitations
- Currently only supports `.epub` format.
- DRM-protected files are not supported.

## Future Enhancements
- [ ] **Bookmarks**: Save specific locations.
- [ ] **Highlights & Annotations**: Highlight text and add notes.
- [ ] **Themes**: Sepia, Dark, and Light modes for the reader.
- [ ] **Font Settings**: Adjust font size and family.
- [ ] **Text-to-Speech**: Read books aloud.
