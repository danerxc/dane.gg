# Base stage
FROM node:20-slim AS base
WORKDIR /app

# Add curl for healthcheck
RUN apt-get update && apt-get install -y curl

# Copy package.json files
COPY package*.json ./
COPY admin/package*.json ./admin/

# Install dependencies
RUN npm install
RUN cd admin && npm install

# Copy application code
COPY . .

# Development stage
FROM base AS development
EXPOSE 3000 3001
ENV NODE_ENV=development

# Install devDependencies
RUN npm install --only=development
RUN cd admin && npm install --only=development

# Start both servers for development
CMD ["npx", "concurrently", "npx nodemon server.js", "cd admin && npx vite"]

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Set working directory for admin build
WORKDIR /app/admin

# Build the Vite project
RUN npm run build

# Reset working directory
WORKDIR /app

# Prune dependencies
RUN npm prune --production
RUN cd admin && npm prune --production

EXPOSE 3000

CMD ["npm", "start"]