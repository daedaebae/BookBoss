# Deployment Guide

This guide describes how to deploy BookBoss in a production environment using Docker Compose.

## Prerequisites
- Docker & Docker Compose installed
- A domain name (or dynamic DNS) pointing to your server
- Ports 80 (HTTP) and 443 (HTTPS) open on your firewall

## 1. Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/BookBoss.git
   cd BookBoss
   ```

2. **Configure Environment Variables**:
   Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Secure Your Instace**:
   Edit `.env` and set:
   - `JWT_SECRET`: Generate a strong random string (e.g., `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `MYSQL_ROOT_PASSWORD`: A strong password for the root DB user
   - `MYSQL_PASSWORD`: A strong password for the application DB user
   - `DB_PASSWORD`: Matches `MYSQL_PASSWORD`

## 2. Admin User & First Run

BookBoss is configured to automatically create a default admin user on the first run of the backend container if one does not exist.

**Default Credentials:**
- **Username**: `admin`
- **Password**: `admin`

> **Security Warning**: You must change this password immediately after logging in for the first time.

## 3. Launching the Stack

Start the application stack using Docker Compose:

```bash
docker compose up -d --build
```

- **--build**: Ensures the latest images are built (important for frontend changes).
- **-d**: Runs in detached mode (background).

## 4. Reverse Proxy Setup (Optional but Recommended)

For production, we recommend using a reverse proxy like **Caddy** or **Nginx** to handle HTTPS.

### Example: Caddy (Automatic HTTPS)

1. Create a `Caddyfile` in the project root:
   ```caddyfile
   your-domain.com {
       reverse_proxy :5173
   }
   ```
   *Note: Ensure your `docker-compose.yml` exposes port 5173.*

2. Run Caddy:
   ```bash
   caddy run
   ```

## 5. Troubleshooting.

### Database Connection
Check container logs:
```bash
docker compose logs -f db
```

### "Admin user not found"
If you cannot login with `admin:admin`:
1. Check the backend logs to see if the creation script ran:
   ```bash
   docker compose logs backend | grep "User created"
   ```
2. If the volume persists from an old install, the password might be different. You can reset it manually by exec-ing into the container (advanced).

### Frontend Connection Errors
Ensure `VITE_API_TARGET` is correctly set if you are building exclusively for production without the proxy config in `vite.config.ts`. In the Docker setup, the frontend relies on the `proxy` field in `vite.config.ts` for development mode server or Nginx configuration for production build serving.
