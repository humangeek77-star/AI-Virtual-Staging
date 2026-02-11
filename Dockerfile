FROM node:20-alpine

WORKDIR /app

# Copy and install
COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

# Expose port
ENV PORT=8080
EXPOSE 8080

# Run the dev command (frontend + backend)
CMD ["npm", "run", "dev"]
