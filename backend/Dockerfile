FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (only production if possible, but package.json has nodemon in devDependencies)
RUN npm install --production

# Copy application source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
