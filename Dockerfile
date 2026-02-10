# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (more forgiving than npm ci)
RUN npm install

# Copy all project files
COPY . .

# Build the Vite application
RUN npm run build

# Install serve to run the production build
RUN npm install -g serve

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Start the application using serve
CMD ["serve", "-s", "dist", "-l", "8080"]
