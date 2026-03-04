# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY book-boss-react/package*.json ./
RUN npm install --legacy-peer-deps
COPY book-boss-react/ .
# Since the backend will serve this directly, VITE_API_TARGET isn't strictly needed for same-origin,
# but we'll let it use relative paths or the same host.
RUN npm run build

# Stage 2: Setup the Production Environment (Node + MariaDB + Backup Script)
FROM node:18-bullseye-slim

WORKDIR /app

# Install MariaDB server, client, and cron/supervisor utilities
RUN apt-get update && \
    apt-get install -y mariadb-server mariadb-client netcat && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Setup MariaDB directories and permissions
RUN mkdir -p /run/mysqld && \
    chown -R mysql:mysql /run/mysqld /var/lib/mysql

# Copy backend package files and install dependencies
COPY server/package*.json ./
RUN npm install --production

# Copy backend source
COPY server/ .

# Ensure uploads and backups directories exist with correct permissions
RUN mkdir -p uploads backups && chown -R node:node /app/uploads /app/backups

# Copy built frontend assets from Stage 1 into the backend's 'public' folder
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the API/Frontend port
EXPOSE 3000

# Start the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
