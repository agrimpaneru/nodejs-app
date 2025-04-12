FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install prom-client along with other dependencies
RUN npm install prom-client --save && npm ci --only=production

# Copy all application files
COPY . .

# Expose port for app
EXPOSE 3000

# Start the application
CMD ["npm", "start"]