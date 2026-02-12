FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=8080
ENV API_BACKEND_PORT=8080
ENV API_BACKEND_HOST=0.0.0.0

EXPOSE 8080

CMD ["node", "server.js"]
