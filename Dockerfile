# Use the official Node.js 20 lightweight Alpine image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Ensure the local uploads directory exists inside the container
RUN mkdir -p src/uploads

# Expose the application port (matching config.js default)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
