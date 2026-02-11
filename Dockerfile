# Use Node.js 20 (since your package.json requires it)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the frontend
RUN npm run build

# Expose port 8080 (Cloud Run default)
ENV PORT=8080
EXPOSE 8080

# Start the Node.js server
CMD ["node", "server.js"]
