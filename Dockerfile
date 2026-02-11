FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source code
COPY . .

# Cloud Run environment
ENV PORT=8080
ENV API_BACKEND_PORT=8080
ENV API_BACKEND_HOST=0.0.0.0

# Expose Cloud Run port
EXPOSE 8080

# Start backend server
CMD ["node", "server.js"]
