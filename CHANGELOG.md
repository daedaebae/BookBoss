# Changelog

All notable changes to this project will be documented in this file.


## [1.0.0] - 2026-02-08

### 🚀 Release Summary
**BookBoss v1.0.0** marks the complete transition from a vanilla JS prototype to a production-grade application built on **React 18** and **Node.js**. This release deprecates the legacy codebase, introducing a fully component-based architecture with TypeScript for enhanced reliability. Key highlights include a mobile-responsive design, integrated barcode scanner, OpenLibrary search, and a hardened Docker deployment strategy. With automated CI checks, consolidated environment management, and strict security practices, BookBoss is now open-source ready.

### ✨ Major Features
- **Modern Tech Stack**: Complete rewrite from vanilla JS to **React 18** (Frontend) and **Node.js/Express** (Backend).
- **TypeScript Support**: Frontend now fully typed with TypeScript for better reliability.
- **Dockerized Deployment**: Production-ready `docker-compose.yml` with separate services for frontend, backend, database, and backups.
- **Library Management**:
  - Add books manually or via ISBN scan.
  - Automatic metadata fetching (OpenLibrary integration).
  - Rich search, filtering, and sorting capabilities.
- **Interactive UI**:
  - Dark/Light mode theme toggle with persistence.
  - Responsive design for mobile and desktop.
  - Toast notifications for user feedback.

### 🔒 Security
- **Secrets Management**: Moved hardcoded credentials to `.env` files.
- **Runtime Validation**: Application fails fast if required environment variables are missing.
- **Dependency Audit**: Cleaned up dependencies and fixed known vulnerabilities.

### 🛠 Infrastructure
- **CI/CD**: GitHub Actions workflow for backend integration tests and frontend linting.
- **Database**: MySQL 8.0 with automated schema initialization and migrations.
- **Community**: Added `CONTRIBUTING.md`, `LICENSE` (MIT), and Issue Templates.

### 🧹 Hygiene
- **Cleanup**: Removed legacy codebase references.
- **License Headers**: Added MIT license headers to source files.
