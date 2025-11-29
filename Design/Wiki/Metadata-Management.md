# Metadata Management

## Overview

Metadata Management refers to how BookBoss handles the information associated with each book. High-quality metadata is crucial for sorting, filtering, and searching the library effectively.

## Data Sources

1. **User Input**: Manual entry of details.
2. **OpenLibrary API**: Primary source for automated metadata fetching.
3. **Google Books API**: (Planned fallback source).

## Key Metadata Fields

### Core Identity
- **Title**: The main title of the work.
- **Author(s)**: Primary creator(s).
- **ISBN**: International Standard Book Number (unique identifier).
- **Publisher**: Entity responsible for publication.

### Physical Attributes
- **Format**: Physical, Ebook, Audiobook.
- **Binding**: Hardcover, Paperback, Leather, etc.
- **Condition**: Assessment of physical state (New, Good, Worn).
- **Page Count**: Number of pages.

### Classification
- **Language**: Language of the text.
- **Publication Year**: Date of release.
- **Special Features**: Attributes like "Signed", "First Edition", "Illustrated".

## Metadata Refresh

The **Metadata Refresh** feature allows users to update existing books with the latest data from external APIs.

### Workflow
1. User selects "Refresh Metadata" (single book or bulk).
2. System identifies books with ISBNs.
3. System queries OpenLibrary for each ISBN.
4. Existing fields are updated if new data is found (user preferences determine overwrite behavior).
5. Missing covers are downloaded.

## Custom Metadata

BookBoss supports custom JSON fields for flexible metadata:
- **`special_features`**: A JSON array storing tags like `["Sprayed Edges", "Bonus Content"]`.
- **`permissions`**: User-specific settings stored as JSON.

## Future Enhancements
- [ ] **Genre/Tags**: Folksonomy-style tagging system.
- [ ] **Series Support**: Linking books into series with volume numbers.
- [ ] **Custom Fields**: Allow users to define their own metadata fields (e.g., "Lent To", "Purchase Price").
