# Base dependencies
FROM node:20-slim AS base
WORKDIR /app
COPY package*.json ./
COPY admin/package*.json admin/
RUN npm install
RUN cd admin && npm install --legacy-peer-deps

# Development with hot reload
FROM base AS development
WORKDIR /app
COPY . .
RUN cd admin && npm run build
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Build stage for React
FROM base AS production-build
WORKDIR /app
COPY . .
RUN cd admin && npm run build

# Production with optimizations
FROM node:20-slim AS production
WORKDIR /app
# Install production dependencies only
COPY package*.json ./
RUN npm install --production
# Copy built React app and server files
COPY --from=production-build /app/admin/build ./admin/build
COPY public ./public
COPY server.js .
COPY routes ./routes
COPY services ./services
COPY middleware ./middleware
COPY controllers ./controllers
EXPOSE 3000
CMD ["npm", "start"]