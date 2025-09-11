# Deployment Guide for Traffic Frnd Backend

## Deploying to Render

### Prerequisites
1. GitHub repository with your backend code
2. MongoDB Atlas account (for cloud database)
3. Render account

### Step 1: Set up MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier is sufficient)
3. Create a database user with read/write permissions
4. Get your connection string from the "Connect" button
5. Replace `<password>` with your actual password
6. Add your database name at the end: `?retryWrites=true&w=majority`

### Step 2: Deploy to Render

#### Option A: Using Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `traffic-friend-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `JWT_SECRET`: Generate a secure random string
   - `MONGODB_URI`: Your MongoDB Atlas connection string

6. Click "Create Web Service"

#### Option B: Using render.yaml (Recommended)

1. The `render.yaml` file is already configured
2. Push your code to GitHub
3. In Render dashboard, create a new "Blueprint" service
4. Connect your GitHub repository
5. Render will automatically detect and use the `render.yaml` configuration

### Step 3: Configure Environment Variables

In your Render service dashboard, add these environment variables:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_secure_jwt_secret_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Trafficfrnd?retryWrites=true&w=majority
```

### Step 4: Update Frontend Configuration

Update your frontend applications to use the new backend URL:

```javascript
// In your frontend config files
const API_BASE_URL = 'https://your-render-app-name.onrender.com/api';
```

### Step 5: Test the Deployment

1. Your app will be available at: `https://your-app-name.onrender.com`
2. Test the health endpoint: `https://your-app-name.onrender.com/api/test`
3. Test your main API endpoints

### Troubleshooting

#### Common Issues:

1. **Build Failures**: Check the build logs in Render dashboard
2. **Database Connection**: Verify your MongoDB Atlas connection string
3. **Environment Variables**: Ensure all required variables are set
4. **CORS Issues**: Update CORS configuration if needed

#### Logs:
- Check Render dashboard logs for any errors
- Use `console.log()` statements for debugging

### Security Notes

1. Never commit `.env` files to your repository
2. Use strong, unique JWT secrets
3. Configure MongoDB Atlas network access properly
4. Consider using environment-specific configurations

### Monitoring

- Render provides basic monitoring and logs
- Set up alerts for downtime
- Monitor your MongoDB Atlas usage

### Scaling

- Start with the free tier
- Upgrade to paid plans as needed
- Consider using Render's auto-scaling features 