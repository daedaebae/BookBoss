# Getting Started with BookBoss

This guide provides instructions on how to set up and run the BookBoss application locally.

## Prerequisites

-   **Docker** and **Docker Compose** (Recommended for easiest setup)
-   **Node.js 18+** and **npm** (Required if running manually without Docker)
-   **MySQL 8.0+** (Required if running manually)

## Configuration

Before running the application, you must configure the sensitive environment variables.

1.  Navigate to the `server` directory (or root if running Docker).
2.  Copy the example environment file:
    ```bash
    cp server/.env.example .env
    ```
    *(Note: If running with Docker, ensure the `.env` file is in the same directory as `docker-compose.yml` or that you update the docker-compose mapping. Currently, our setup expects `.env` in the root `BookBoss` directory for Docker Compose context)*.
    
    > **Correction**: The `docker-compose.yml` expects `.env` in the root directory where you run the command.

3.  Edit `.env` and set your secrets:
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
    # Important: If you had previous volumes, wipe them to ensure clean DB credentials
    docker-compose down -v
    docker-compose up -d --build
    ```

2.  **Access the Application**:
    -   **Web App**: [http://localhost](http://localhost) (Served by Node.js on port 80)
    -   **API**: [http://localhost/api](http://localhost/api) (or :3000)
    -   **Database**: Port 3307 (Mapped to host)

3.  **Viewing Logs**:
    ```bash
    docker-compose logs -f
    ```

4.  **Stopping**:
    ```bash
    docker-compose down
    ```

## Option 2: Running Manually (Development)

If you want to develop on the code, running services individually is often better.

### 1. Database
Start a MySQL instance. You can use the Docker container just for the DB:
```bash
docker-compose up -d db
```
*Wait for it to initialize.*

### 2. Backend
1.  Navigate to `server/`:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    # Ensure you have your .env variables exported or use a package like dotenv-cli
    node --env-file=../.env server.js 
    # OR if you have .env in server/ directory:
    npm start
    ```
    The server runs on **http://localhost:3000**.

### 3. Frontend
1.  Navigate to `book-boss-react/`:
    ```bash
    cd book-boss-react
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
    The frontend runs on **http://localhost:5173**.

## First Time Login

Authentication is active by default. You need an Admin user to access the system and create other users.

1.  **Create Default Admin**:
    A helper script is provided to create an initial admin user `admin` with password `admin`.
    
    **Using Docker**:
    ```bash
    # Execute inside the app container
    docker exec -it bookboss-app node create_docker_admin.js
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
