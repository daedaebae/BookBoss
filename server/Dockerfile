# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy frontend package files
COPY book-boss-react/package*.json ./
RUN npm install
# Copy frontend source
COPY book-boss-react/ .
# Build the frontend
RUN npm run build

# Stage 2: Setup the Backend and Serve
FROM node:18-alpine
WORKDIR /app

# Copy backend package files
# Copy backend package files
COPY server/package*.json ./
RUN npm install

# Copy backend source
COPY server/ .

# Secure uploads directory and permissions
RUN mkdir -p uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Copy built frontend assets from Stage 1 to 'public' folder in backend
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./public

# Expose API port (and now frontend port)
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
