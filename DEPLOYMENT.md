# Deployment Guide

This guide describes how to deploy BookBoss in a production environment using Docker Compose and a reverse proxy for HTTPS termination.

## Prerequisites
- Docker & Docker Compose installed
- A domain name (or dynamic DNS) pointing to your server
- Ports 80 and 443 open on your firewall

## 1. Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and set secure passwords and secrets:
   ```ini
   MYSQL_ROOT_PASSWORD=your_secure_root_password
   MYSQL_USER=bookboss
   MYSQL_PASSWORD=your_secure_db_password
   JWT_SECRET=your_long_random_secret_string
   ```

## 2. Reverse Proxy Setup (Caddy)

We recommend **Caddy** for automatic HTTPS (Let's Encrypt).

1. Create a `Caddyfile` in the project root:
   ```caddyfile
   your-domain.com {
       # Proxy to the Frontend Container
       reverse_proxy localhost:80
   }
   ```
   *Note: Ensure your `docker-compose.yml` exposes the frontend on port 80 or adjust the proxy target accordingly.*

2. Run Caddy:
   ```bash
   caddy run
   ```

## 3. Deployment

Start the application stack:

```bash
docker compose up -d
```

## 4. Verification

Visit `https://your-domain.com` in your browser. You should see the login screen securely served over HTTPS.

## Troubleshooting

- **Database Connection**: Check container logs with `docker compose logs -f db`.
- **Environment Variables**: Ensure all required variables are set in `.env`.
