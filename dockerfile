# Base stage
FROM node:20-slim AS base

WORKDIR /app

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

# Start both servers for development
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

ENV NODE_ENV=production
RUN cd admin && npm run build
RUN npm prune --production
RUN cd admin && npm prune --production

EXPOSE 3000

# Start the server
CMD ["npm", "start"]