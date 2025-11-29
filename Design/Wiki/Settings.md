# Settings & Configuration

## Overview

The Settings module allows users to customize their BookBoss experience and allows Admins to configure system-wide parameters.

## User Settings

These settings are specific to the logged-in user and are stored in the browser (localStorage) or database.

### General
- **Theme**: Toggle between Light and Dark modes.
- **Accent Color**: Choose a primary color for buttons and highlights.
- **Default View**: Set the preferred library layout (Grid vs. List - planned).
- **Books Per Page**: Control pagination size.

### Profile
- **Username**: Update display name.
- **Email**: Update contact email.
- **Password**: Change login password.

### Export
- **CSV Export**: Download library data as a CSV file.
- **JSON Export**: Download full library backup as JSON.

## Admin Settings

Accessible only to users with the `Admin` role.

### User Management
- Create, edit, and delete user accounts.
- Assign roles (Admin, Editor, Viewer).

### System Configuration (Planned)
- **Registration**: Enable/disable public registration.
- **Storage Limits**: Set quotas for file uploads.
- **Backup**: Schedule automated database backups.

## Audiobookshelf Integration

Settings for connecting to an external Audiobookshelf server.
- **Server URL**: Address of the ABS instance.
- **API Key**: Token for authentication.
- **Sync Settings**: Configuration for what data to sync.

## Implementation

- **Frontend**: `SettingsPage.tsx` manages the UI tabs.
- **State**: `ThemeContext` handles visual preferences.
- **Persistence**: User preferences are synced to the backend `users` table (planned) or stored in `localStorage`.

## Future Enhancements
- [ ] Import from Goodreads/CSV.
- [ ] Notification preferences.
- [ ] Language/Localization settings.
