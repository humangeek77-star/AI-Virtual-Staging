FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy everything
COPY . .

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Go back to root
WORKDIR /app

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start the backend server
CMD ["node", "backend/server.js"]
