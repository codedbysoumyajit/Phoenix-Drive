# Use Node.js 20 lightweight Alpine image
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy root and package locks
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install all dependencies for building
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source
COPY . .

# Build the Next.js production bundle
RUN cd frontend && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy root and package locks
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install only production dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci --only=production

# Copy backend files and frontend built assets
COPY backend ./backend
COPY --from=builder /usr/src/app/frontend/.next ./frontend/.next
COPY --from=builder /usr/src/app/frontend/public ./frontend/public
COPY --from=builder /usr/src/app/frontend/next.config.mjs ./frontend/next.config.mjs

# Ensure local uploads directory exists
RUN mkdir -p backend/src/uploads

EXPOSE 3000

# Start both servers concurrently via root package.json start script
CMD ["npm", "start"]

