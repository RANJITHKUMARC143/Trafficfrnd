# Traffic Friend Backend - Render Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: You need a MongoDB Atlas cluster for production
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Set up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier is fine)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Render
5. Get your connection string (it will look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/trafficfrnd?retryWrites=true&w=majority
   ```

## Step 2: Deploy to Render

### Option A: Using Render Dashboard (Recommended)

1. **Connect GitHub Repository**:
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing this backend

2. **Configure the Service**:
   - **Name**: `traffic-friend-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend` (if your repo has multiple folders)

3. **Set Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (Render will override this)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string (generate one)
   - `CORS_ORIGIN`: `*`

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your API will be available at: `https://your-service-name.onrender.com`

### Option B: Using render.yaml (Alternative)

If you prefer using the `render.yaml` file:

1. Push your code to GitHub with the `render.yaml` file
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect and use the `render.yaml` configuration

## Step 3: Update Client Applications

After deployment, update your client applications to use the new Render URL:

### For User App (Expo):
```typescript
// In src/config.ts
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-service-name.onrender.com';
```

### For Admin Console:
```bash
# In Admin console/.env
VITE_API_URL=https://your-service-name.onrender.com
```

### For Delivery App:
```typescript
// In Delivery_app/config/api.ts
baseUrl: 'https://your-service-name.onrender.com/api',
```

### For Vendor App:
```typescript
// In vendor-app/src/services/api.ts
export const API_URL = 'https://your-service-name.onrender.com';
```

## Step 4: Test the Deployment

1. Visit your Render service URL in a browser
2. You should see: "Traffic Frnd API is running!"
3. Test the API endpoint: `https://your-service-name.onrender.com/api/test`
4. Test authentication endpoints with your client apps

## Important Notes

### Free Tier Limitations:
- Render free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 30+ seconds to respond
- Consider upgrading to paid plan for production use

### Environment Variables:
- Never commit sensitive data to your repository
- Always set environment variables in Render dashboard
- Use strong, unique JWT secrets in production

### Database:
- MongoDB Atlas free tier has limitations (512MB storage)
- Monitor your usage and upgrade as needed
- Regular backups are recommended

### CORS:
- Current configuration allows all origins (`*`)
- For production, consider restricting to your specific domains

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check that all dependencies are in `package.json`
   - Ensure Node.js version compatibility

2. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings
   - Ensure database user has correct permissions

3. **Environment Variables**:
   - Double-check all required variables are set
   - Ensure no typos in variable names

4. **CORS Issues**:
   - Verify CORS_ORIGIN is set correctly
   - Check if your client domain is allowed

### Logs:
- Check Render service logs for detailed error messages
- Use `console.log` statements for debugging (remove in production)

## Security Considerations

1. **JWT Secret**: Use a strong, random secret
2. **Database**: Use strong passwords and limit access
3. **CORS**: Restrict origins in production
4. **Rate Limiting**: Consider implementing rate limiting
5. **HTTPS**: Render provides HTTPS by default

## Monitoring

- Monitor your Render service health
- Set up MongoDB Atlas monitoring
- Track API usage and performance
- Set up alerts for downtime

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic with Render)
3. Set up monitoring and logging
4. Implement backup strategies
5. Consider scaling options as your app grows
