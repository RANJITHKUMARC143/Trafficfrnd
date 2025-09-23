# Render Environment Variables Configuration

## Required Environment Variables for Render Deployment

Copy and paste these environment variables into your Render dashboard:

### 1. Basic Configuration
```
NODE_ENV=production
PORT=10000
```

### 2. Database Configuration
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/trafficfrnd?retryWrites=true&w=majority
```

**Replace with your actual MongoDB Atlas credentials:**
- `<username>`: Your MongoDB Atlas username
- `<password>`: Your MongoDB Atlas password
- `cluster0.xxxxx.mongodb.net`: Your actual cluster URL

### 3. JWT Security
```
JWT_SECRET=your_very_secure_random_string_here_make_it_long_and_complex_at_least_32_characters
```

**Generate a secure JWT secret:**
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

### 4. CORS Configuration
```
CORS_ORIGIN=*
```

**For production, consider restricting to specific domains:**
```
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
```

### 5. Optional: Payment Integration (Razorpay)
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_ENVIRONMENT=sandbox
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### 6. Optional: SMS Integration
```
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
```

### 7. Optional: File Upload Configuration
```
MAX_FILE_SIZE=5242880
UPLOAD_PATH=public
```

## Complete Environment Variables List for Render

Here's the complete list to copy-paste into Render:

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/trafficfrnd?retryWrites=true&w=majority
JWT_SECRET=your_very_secure_random_string_here_make_it_long_and_complex_at_least_32_characters
CORS_ORIGIN=*
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_ENVIRONMENT=sandbox
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=your_sender_id
MAX_FILE_SIZE=5242880
UPLOAD_PATH=public
```

## How to Set Environment Variables in Render

### Method 1: Through Render Dashboard
1. Go to your Render service dashboard
2. Click on "Environment" tab
3. Click "Add Environment Variable"
4. Add each variable one by one:
   - **Key**: `NODE_ENV`
   - **Value**: `production`
   - Click "Save Changes"
5. Repeat for all variables

### Method 2: Using render.yaml (Alternative)
If you prefer using the `render.yaml` file, update it with:

```yaml
services:
  - type: web
    name: traffic-friend-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: "*"
      - key: CASHFREE_APP_ID
        sync: false
      - key: CASHFREE_SECRET_KEY
        sync: false
      - key: CASHFREE_ENVIRONMENT
        value: sandbox
      - key: SMS_API_KEY
        sync: false
      - key: SMS_SENDER_ID
        sync: false
      - key: MAX_FILE_SIZE
        value: 5242880
      - key: UPLOAD_PATH
        value: public
```

## Security Best Practices

### 1. JWT Secret
- Use a strong, random string (at least 32 characters)
- Never use simple passwords or common phrases
- Generate using cryptographic methods

### 2. Database Credentials
- Use strong passwords for MongoDB Atlas
- Enable IP whitelisting
- Use read/write permissions only

### 3. CORS Configuration
- In production, restrict to your actual domains
- Avoid using `*` in production

### 4. Environment Variables
- Never commit sensitive data to git
- Use Render's secure environment variable storage
- Rotate secrets regularly

## Testing Your Environment Variables

After setting up environment variables, test your deployment:

1. **Check if the service starts:**
   - Visit your Render service URL
   - Should see: "Traffic Frnd API is running!"

2. **Test API endpoints:**
   - `https://your-service.onrender.com/api/test`
   - Should return: `{"message": "API is working!"}`

3. **Test database connection:**
   - Try registering a new user
   - Check if data is saved to MongoDB Atlas

4. **Test authentication:**
   - Try logging in with test credentials
   - Verify JWT tokens are generated

## Troubleshooting Environment Variables

### Common Issues:

1. **Service won't start:**
   - Check if all required variables are set
   - Verify MongoDB connection string format
   - Check JWT_SECRET is not empty

2. **Database connection fails:**
   - Verify MongoDB Atlas credentials
   - Check IP whitelist settings
   - Ensure database user has correct permissions

3. **Authentication issues:**
   - Verify JWT_SECRET is set correctly
   - Check if JWT_SECRET is long enough
   - Ensure no special characters in JWT_SECRET

4. **CORS errors:**
   - Verify CORS_ORIGIN is set correctly
   - Check if your client domain is allowed
   - Test with `*` first, then restrict

### Debug Commands:

Add these to your server.js for debugging:

```javascript
// Add this after dotenv.config()
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
```

## Quick Setup Checklist

- [ ] Set NODE_ENV=production
- [ ] Set PORT=10000
- [ ] Set MONGODB_URI with your Atlas credentials
- [ ] Generate and set JWT_SECRET
- [ ] Set CORS_ORIGIN=*
- [ ] Optional: Set payment integration variables
- [ ] Optional: Set SMS integration variables
- [ ] Test the deployment
- [ ] Verify database connection
- [ ] Test authentication endpoints

## Support

If you encounter issues:
1. Check Render service logs
2. Verify environment variables are set correctly
3. Test MongoDB Atlas connection
4. Check CORS configuration
5. Review JWT secret format

Remember: Environment variables are case-sensitive and must be set exactly as shown above.
