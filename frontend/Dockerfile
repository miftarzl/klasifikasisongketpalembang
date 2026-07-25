# Multi-stage build for React Vite Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production Nginx Stage
FROM nginx:alpine

# Copy built dist files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 90 inside container
EXPOSE 90

CMD ["nginx", "-g", "daemon off;"]
