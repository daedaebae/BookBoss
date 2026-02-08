# Contributing to BookBoss

Thank you for your interest in contributing to BookBoss! We welcome contributions from the community to help make this the best personal library management system.

## Getting Started

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/your-username/BookBoss.git
    cd BookBoss
    ```
3.  **Set up the environment**:
    - Copy `.env.example` to `.env` in the root and `server/` directories.
    - Start the application with Docker:
      ```bash
      docker compose up -d
      ```

## Development Workflow

### Frontend (React)
- Located in `book-boss-react/`
- Run `npm install` and `npm run dev` to start the frontend server.
- Ensure all new components are typed with TypeScript.
- Run `npm run lint` before committing to catch style issues.

### Backend (Node.js)
- Located in `server/`
- Run `npm install` and `npm run dev` to start the backend server.
- Ensure API changes are reflected in the documentation.
- Run `npm test` to verify integration tests pass.

## Submitting Changes

1.  Create a new branch for your feature or fix:
    ```bash
    git checkout -b feature/amazing-new-feature
    ```
2.  Commit your changes with clear, descriptive messages.
3.  Push your branch to your fork.
4.  Open a **Pull Request** against the `main` branch of the original repository.

## Report Bugs

If you find a bug, please open an issue using the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md). Include as much detail as possible to help us reproduce and fix the issue.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
