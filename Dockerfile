FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY backend/package*.json ./backend/

# Install all dependencies (root + workspaces)
RUN npm install

# Copy all source code
COPY . .

# Environment variables
ENV PORT=8080
ENV API_BACKEND_PORT=8080
ENV API_BACKEND_HOST=0.0.0.0

EXPOSE 8080

# Start the backend server
CMD ["node", "backend/server.js"]
