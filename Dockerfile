FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY backend ./backend
ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/server.js"]
```

**3. .dockerignore** (create this new file)
```
node_modules
.git
.env
