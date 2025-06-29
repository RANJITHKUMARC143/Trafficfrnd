# Troubleshooting Delivery Partner Management System

## Common Issues and Solutions

### 1. "Failed to fetch partner details" Error

#### Possible Causes:
1. **Route Order Issue**: The `/:id` route was being matched before specific routes like `/earnings/summary`
2. **Authentication Issues**: Invalid or missing JWT token
3. **Database Connection Issues**: MongoDB connection problems
4. **Invalid Partner ID**: The partner ID doesn't exist in the database
5. **CORS Issues**: Cross-origin request problems

#### Solutions:

##### A. Check Route Order (FIXED)
The routes have been reordered to ensure specific routes come before parameterized routes:
```javascript
// General routes first
router.get('/earnings/summary', auth, deliveryBoyController.getEarningsSummary);
router.get('/earnings/history', auth, deliveryBoyController.getEarningsHistory);

// Parameterized routes last
router.get('/:id', auth, async (req, res) => { ... });
```

##### B. Test Authentication
1. Check if you're logged in to the admin console
2. Verify the JWT token in localStorage:
   ```javascript
   // In browser console
   console.log(localStorage.getItem('token'));
   ```
3. Check if the token is valid and not expired

##### C. Test API Endpoints
1. **Test without authentication** (temporary):
   ```
   GET /api/delivery/test/:id
   ```
   This route doesn't require authentication and can help identify if the issue is with auth or the route itself.

2. **Test with authentication**:
   ```
   GET /api/delivery/:id
   ```
   Make sure to include the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

##### D. Check Database
1. Verify MongoDB connection:
   ```javascript
   // In backend console
   console.log('MongoDB connected:', mongoose.connection.readyState);
   ```

2. Check if the delivery partner exists:
   ```javascript
   // In MongoDB shell or Compass
   db.deliveryboys.findOne({_id: ObjectId("your-partner-id")})
   ```

##### E. Check Network Requests
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to access the delivery partner detail page
4. Check the request URL, headers, and response

### 2. Debugging Steps

#### Frontend Debugging:
1. **Check Console Logs**: The frontend now includes detailed logging
2. **Verify API URL**: Make sure the correct API URL is being used
3. **Check Token**: Verify the authentication token exists and is valid

#### Backend Debugging:
1. **Check Server Logs**: The backend now includes detailed logging
2. **Verify Route Registration**: Ensure routes are properly registered
3. **Check Database Queries**: Verify MongoDB queries are working

### 3. Testing the System

#### Step 1: Test Basic API
```bash
# Test if the API is running
curl http://localhost:3000/api/test
```

#### Step 2: Test Delivery Partner List
```bash
# Get all delivery partners (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/delivery
```

#### Step 3: Test Specific Partner (without auth)
```bash
# Test route without authentication
curl http://localhost:3000/api/delivery/test/PARTNER_ID
```

#### Step 4: Test Specific Partner (with auth)
```bash
# Test route with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/delivery/PARTNER_ID
```

### 4. Common Error Messages

#### "Authentication required"
- **Cause**: Missing or invalid JWT token
- **Solution**: Log in to the admin console and get a valid token

#### "Delivery partner not found"
- **Cause**: The partner ID doesn't exist in the database
- **Solution**: Check if the partner exists in the database

#### "Invalid token"
- **Cause**: JWT token is malformed or expired
- **Solution**: Log out and log back in to get a new token

#### "CORS error"
- **Cause**: Cross-origin request blocked
- **Solution**: Check CORS configuration in backend

### 5. Environment Variables

Make sure these environment variables are set:

```env
# Backend (.env)
JWT_SECRET=your_jwt_secret_key_here
MONGODB_URI=mongodb://localhost:27017/your_database
PORT=3000

# Frontend (.env)
VITE_API_URL=http://localhost:3000
```

### 6. Database Schema Issues

If you're getting database-related errors, verify the DeliveryBoy schema:

```javascript
// Check if the model has the required methods
const DeliveryBoy = require('./models/DeliveryBoy');
console.log('getPublicProfile method exists:', typeof DeliveryBoy.prototype.getPublicProfile === 'function');
```

### 7. Network Issues

#### Check if the backend is running:
```bash
# Check if port 3000 is in use
lsof -i :3000
# or
netstat -an | grep 3000
```

#### Check if the frontend can reach the backend:
```bash
# From frontend directory
curl http://localhost:3000/api/test
```

### 8. Browser Issues

#### Clear Browser Cache:
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

#### Check Network Tab:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to access the page
4. Look for failed requests (red entries)

### 9. Quick Fixes

#### If the issue persists:

1. **Restart the backend server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart
   npm start
   ```

2. **Clear browser data**:
   - Clear localStorage
   - Clear sessionStorage
   - Clear cookies

3. **Check MongoDB connection**:
   ```bash
   # Connect to MongoDB
   mongo
   # or
   mongosh
   ```

4. **Verify the delivery partner exists**:
   ```javascript
   // In MongoDB shell
   use your_database_name
   db.deliveryboys.find().pretty()
   ```

### 10. Getting Help

If you're still experiencing issues:

1. **Check the logs**: Both frontend and backend console logs
2. **Verify the setup**: Make sure all dependencies are installed
3. **Test with a simple request**: Use the test route first
4. **Check the network**: Ensure the backend is accessible from the frontend

#### Debug Information to Collect:
- Browser console logs
- Backend server logs
- Network request details
- MongoDB connection status
- Environment variables (without sensitive data)
- Error messages and stack traces

---

**Last Updated**: December 2024  
**Version**: 1.0.0 