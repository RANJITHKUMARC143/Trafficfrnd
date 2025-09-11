#!/bin/bash

# Start Local MongoDB Script
echo "Starting Local MongoDB for Traffic Frnd..."

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo "MongoDB is already running!"
    echo "You can connect to it at: mongodb://localhost:27017"
    echo "Database name: Trafficfrnd"
else
    echo "Starting MongoDB..."
    
    # Try to start MongoDB (this assumes MongoDB is installed)
    if command -v mongod &> /dev/null; then
        # Create data directory if it doesn't exist
        mkdir -p ./data/db
        
        # Start MongoDB
        mongod --dbpath ./data/db --port 27017
    else
        echo "MongoDB is not installed or not in PATH"
        echo "Please install MongoDB:"
        echo "  macOS: brew install mongodb-community"
        echo "  Ubuntu: sudo apt-get install mongodb"
        echo "  Windows: Download from https://www.mongodb.com/try/download/community"
    fi
fi
