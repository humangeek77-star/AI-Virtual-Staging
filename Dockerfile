FROM node:18-alpine

# Set working directory to backend folder
WORKDIR /app/backend

# Copy package files from backend
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of backend code
COPY backend/ ./

# Environment variables
ENV PORT=8080
ENV API_BACKEND_PORT=8080
ENV API_BACKEND_HOST=0.0.0.0

EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
