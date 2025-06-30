# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY ["package.json", "package-lock.json*", "./"]

# Install application dependencies
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build TypeScript
RUN npm run build

# Expose port 8000
EXPOSE 8000

RUN chown -R node /app

USER node

# Start the application
CMD ["npm", "start"]