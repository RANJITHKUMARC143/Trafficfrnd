# Local MongoDB Setup for Traffic Frnd

This guide will help you set up the Traffic Frnd application to use a local MongoDB database instead of the remote API.

## Prerequisites

1. **MongoDB Installation**
   - **macOS**: `brew install mongodb-community`
   - **Ubuntu/Debian**: `sudo apt-get install mongodb`
   - **Windows**: Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)

2. **Node.js** (already installed for this project)

## Setup Steps

### 1. Start MongoDB Locally

**Option A: Using the provided script**
```bash
./start-local-mongodb.sh
```

**Option B: Manual start**
```bash
# Create data directory
mkdir -p ./data/db

# Start MongoDB
mongod --dbpath ./data/db --port 27017
```

**Option C: Using MongoDB service (if installed as service)**
```bash
# macOS with Homebrew
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongodb

# Windows (run as Administrator)
net start MongoDB
```

### 2. Verify MongoDB is Running

Open a new terminal and run:
```bash
mongosh
# or
mongo
```

You should see the MongoDB shell. Type `exit` to quit.

### 3. Start the Backend Server

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:3000` and connect to your local MongoDB.

### 4. Start the Frontend

```bash
# For the main app
npm start

# For the admin console
cd "Admin console"
npm install
npm run dev
```

## Configuration Changes Made

### Backend Changes
- ✅ Updated `backend/config/db.js` to use local MongoDB by default
- ✅ Updated `backend/index.js` to use local MongoDB connection
- ✅ Added fallback to `mongodb://localhost:27017/Trafficfrnd`

### Frontend Changes
- ✅ Updated `src/config.ts` to use `http://localhost:3000`
- ✅ Updated `app/explore.tsx` to use local API
- ✅ Updated `app/services/socketService.ts` to use local socket

## Database Information

- **Connection String**: `mongodb://localhost:27017/Trafficfrnd`
- **Database Name**: `Trafficfrnd`
- **Port**: `27017` (default MongoDB port)

## Troubleshooting

### MongoDB Connection Issues

1. **"Could not connect to MongoDB"**
   - Make sure MongoDB is running: `pgrep mongod`
   - Check if port 27017 is available: `lsof -i :27017`

2. **"Permission denied"**
   - Make sure you have write permissions to the data directory
   - On macOS/Linux: `sudo chown -R $(whoami) ./data`

3. **"Port already in use"**
   - Kill existing MongoDB processes: `pkill mongod`
   - Or use a different port: `mongod --port 27018`

### API Connection Issues

1. **Frontend can't connect to backend**
   - Make sure backend is running on port 3000
   - Check firewall settings
   - For mobile development, use your computer's IP address instead of localhost

2. **Socket connection issues**
   - Make sure the backend server is running
   - Check that WebSocket connections are allowed

## Environment Variables

Create a `.env` file in the backend directory (optional):
```env
MONGODB_URI=mongodb://localhost:27017/Trafficfrnd
JWT_SECRET=your_jwt_secret_here
PORT=3000
NODE_ENV=development
```

## Benefits of Local Setup

- ✅ **No internet dependency** - Works offline
- ✅ **Faster development** - No network latency
- ✅ **Full control** - Complete database access
- ✅ **Cost effective** - No cloud database costs
- ✅ **Privacy** - Data stays on your machine

## Switching Back to Remote API

If you need to switch back to the remote API:

1. Update `src/config.ts`:
   ```typescript
   export const API_URL = 'https://trafficfrnd-2.onrender.com';
   ```

2. Update `app/explore.tsx`:
   ```typescript
   const API_URL = 'https://trafficfrnd-2.onrender.com';
   ```

3. Update `app/services/socketService.ts`:
   ```typescript
   const API_URL = 'https://trafficfrnd-2.onrender.com';
   ```

## Next Steps

1. Start MongoDB locally
2. Start the backend server
3. Start the frontend application
4. Test the application functionality

Your Traffic Frnd application is now running entirely locally!
