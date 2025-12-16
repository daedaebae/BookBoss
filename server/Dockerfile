FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

RUN npm install

# Copy source code
COPY . .

# Expose API port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
