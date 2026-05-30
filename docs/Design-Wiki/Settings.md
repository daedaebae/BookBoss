# Settings & Configuration

## Overview

The Settings module allows users to customize their BookBoss experience and allows Admins to configure system-wide parameters.

## User Settings

These settings are specific to the logged-in user and are stored in the browser (localStorage) or database.

### General
- **Theme/Accent Color**: Choose a primary visual theme and background variant (e.g., Jenn's Theme (Default), Purple, Ocean, Midnight).
- **Default View**: Set the preferred library layout (Grid vs. List - planned).
- **Books Per Page**: Control pagination size.

### Profile & Privacy
- **Library Name**: Set a custom name for your library (visible to others if public).
- **Privacy Settings**: Toggle public sharing of your library.
- **Password**: Change login password.

### Export
- **CSV Export**: Download library data as a CSV file.
- **JSON Export**: Download full library backup as JSON.

## Admin Settings

Accessible only to users with the `Admin` role.

### User Management
- Create, edit, and delete user accounts.
- Assign roles (Admin, Editor, Viewer).

### System Configuration
- **Registration**: Enable/disable public registration.
- **Backup**: Create and restore full database backups.
- **Debug Mode**: Enable detailed logging and development tools.

## Audiobookshelf Integration

Settings for connecting to an external Audiobookshelf server.
- **Server URL**: Address of the ABS instance (e.g. `http://audiobookshelf:13378`).
- **API Key**: Token for authentication. Find it in ABS under **Settings → Users → your username → API Token**.
- **Test Connection**: Verifies the stored credentials are valid. Returns a descriptive error if the token is wrong or the server is unreachable.
- **Sync Settings**: Sync individual libraries or all content.

### Error Messages (Test Connection)

| Condition | Message |
|-----------|---------|
| Wrong API token | `Invalid API key — please check your Audiobookshelf API token.` |
| Server unreachable | `Could not reach the server — please check the URL.` |
| Timeout | `Connection timed out — the server took too long to respond.` |
| Other HTTP error | `Server returned HTTP {status} — please check the URL and API key.` |

## Implementation

- **Frontend**: `SettingsModal.tsx` manages the UI. It features a responsive **Horizontal Scrollable Tab Bar** for navigation, ensuring a consistent experience across desktop and mobile devices.
- **State**: `ThemeContext` handles visual preferences.
- **Persistence**: User preferences are synced to the backend `users` table (planned) or stored in `localStorage`.

## Future Enhancements
- [ ] Import from Goodreads/CSV.
- [ ] Notification preferences.
- [ ] Language/Localization settings.
