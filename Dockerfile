# Use official Node.js image as base
FROM node:18-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker cache)
COPY app/package*.json ./

# Install production dependencies
RUN npm install prom-client --save && npm ci --only=production

# Copy the rest of the application code into the container
COPY app/ .

# Expose port 3000 for the Node.js app
EXPOSE 3000

# Set the default command to run the app
CMD ["npm", "start"]
