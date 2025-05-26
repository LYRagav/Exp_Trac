# Use an official Node.js LTS version as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Install Expo CLI and EAS CLI globally
RUN npm install -g expo-cli eas-cli

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port Expo runs on (default is 19000, 19001, 19002)
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
# Metro bundler uses 8081 by default if not overridden in metro.config.js
EXPOSE 8081

# Default command to run when the container starts
CMD ["npm", "start"] 