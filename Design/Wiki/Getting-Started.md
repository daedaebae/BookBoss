# Walkthrough & Getting Started

This guide provides instructions on how to set up and run the BookBoss application locally.

## Prerequisites

-   **Docker** and **Docker Compose** (Recommended for easiest setup)
-   **Node.js 18+** and **npm** (Required if running manually without Docker)
-   **MySQL 8.0+** (Required if running manually)

## Configuration

Before running the application, you must configure the sensitive environment variables.

1.  **Environment Setup**:
    Copy the example environment file from the project root:
    ```bash
    cp .env.example .env
    ```

2.  **Secure Secrets**:
    Edit `.env` and set your secrets:
    ```ini
    # Database
    MYSQL_ROOT_PASSWORD=change_this_to_a_secure_password
    MYSQL_USER=bookboss
    MYSQL_PASSWORD=change_this_user_password
    MYSQL_DATABASE=bookboss

    # Security
    JWT_SECRET=change_this_to_a_long_random_string
    ```

## Option 1: Running with Docker (Recommended)

This method spins up the Database and the Combined App (Backend + Frontend) in containers.

1.  **Build and Start**:
    Execute from the project root:
    ```bash
    # Important: To reset the database (required if tables are missing), you must delete the local data folder:
    docker compose down
    sudo rm -rf mysql-data
    docker compose up -d --build
    ```

2.  **Access the Application**:
    -   **Web App**: [http://localhost:5173](http://localhost:5173) (or via Proxy)
    -   **API**: [http://localhost:3000](http://localhost:3000)
    -   **Database**: Port 3307 (Mapped to host)

3.  **Viewing Logs**:
    ```bash
    docker compose logs -f
    ```

4.  **Stopping**:
    ```bash
    docker compose down
    ```

## Option 2: Hybrid Development (Recommended for Code Editing)

This is the preferred method for developing on the code. You run the database in Docker, but the Backend and Frontend run locally on your machine for hot-reloading.

### 1. Database (Docker)
Start *only* the database service:
```bash
docker compose up -d db
```
*Creates a MySQL instance on port 3307.*

### 2. Backend (Terminal 1)
Leave this terminal running!
1.  Navigate to `server/`:
    ```bash
    cd server
    ```
2.  Install dependencies (once):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    npm start
    ```
    *Connects to localhost:3307. API runs on **http://localhost:3000**.*

### 3. Frontend (Terminal 2)
Open a new terminal window.
1.  Navigate to `book-boss-react/`:
    ```bash
    cd book-boss-react
    ```
2.  Install dependencies (once):
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
    *Client runs on **http://localhost:5173**.*

## First Time Login

Authentication is active by default. You need an Admin user to access the system and create other users.

1.  **Create Default Admin**:
    The backend automatically attempts to create an `admin` user on startup. *(Note: The `docker-compose.yml` file uses the `.env` in the project root to configure this).*
    
    If you need to manually reset or create it:
    
    **Using Docker**:
    ```bash
    # Execute inside the backend container
    docker exec -it bookboss-backend node create_docker_admin.js
    ```
    
    **Manual Run**:
    ```bash
    cd server
    node create_docker_admin.js
    ```

2.  **Login**:
    -   Go to the login page.
    -   Username: `admin`
    -   Password: `admin`

    > [!WARNING]
    > **Security Risk**: Change the admin password immediately after logging in, or create a new admin user and delete the default one.
