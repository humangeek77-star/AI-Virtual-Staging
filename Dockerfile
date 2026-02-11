FROM node:20-alpine

WORKDIR /app

# Copy and install
COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

# Set environment variables for the backend
ENV API_BACKEND_PORT=8080
ENV API_BACKEND_HOST=0.0.0.0
ENV PORT=8080

# Expose port
EXPOSE 8080

# Run the backend server directly
CMD ["node", "backend/server.js"]
