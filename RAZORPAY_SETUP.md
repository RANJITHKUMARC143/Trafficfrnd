# Razorpay Payment Integration Setup

This document provides instructions for setting up Razorpay payment integration in the Traffic Friend application.

## Prerequisites

1. **Razorpay Account**: Sign up for a merchant account at [Razorpay](https://razorpay.com/)
2. **API Credentials**: Obtain your Key ID and Key Secret from the Razorpay dashboard

## Backend Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file in the backend directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_ENVIRONMENT=sandbox  # Use 'live' for production environment
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Server URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### 2. Install Dependencies

The required dependencies are already installed:
- `razorpay` - Razorpay Node.js SDK

### 3. API Endpoints

The following new endpoints are available:

- `POST /api/payments/razorpay/order` - Create Razorpay order
- `POST /api/payments/razorpay/verify` - Verify payment status
- `POST /api/payments/razorpay/webhook` - Handle webhooks
- `GET /api/payments/methods` - Get available payment methods
- `GET /api/payments/config` - Get payment configuration

## Frontend Setup

### 1. Install Dependencies

The required dependencies are already installed:
- `react-native-razorpay` - Razorpay React Native SDK

### 2. Payment Flow

1. **Cart Screen**: Users can select "Online Payment (Razorpay)" as payment method
2. **Order Creation**: Order is created with `payment.method: 'razorpay'`
3. **Payment Processing**: 
   - Opens Razorpay checkout with UPI, Cards, Net Banking options
   - Handles payment success/failure callbacks
4. **Payment Verification**: Automatically verifies payment status
5. **Order Confirmation**: Shows success message after payment

## Testing

### Test Mode
- Use Razorpay test credentials for development
- Test cards: 4111 1111 1111 1111 (Visa), 5555 5555 5555 4444 (Mastercard)
- Test UPI: Use any UPI ID in test mode

### Production Mode
- Update environment variables with live credentials
- Ensure webhook URLs are configured in Razorpay dashboard
- Test with real payment methods

## Webhook Configuration

Configure the following webhook URL in your Razorpay dashboard:
```
https://your-backend-url.com/api/payments/razorpay/webhook
```

Required events:
- `payment.captured` - When payment is successfully captured

## Security Notes

1. **Never expose Key Secret** on the frontend
2. **Always verify signatures** on the backend
3. **Use HTTPS** in production
4. **Validate webhook signatures** before processing

## Troubleshooting

### Common Issues

1. **Payment not verifying**: Check webhook configuration and signature verification
2. **SDK not working**: Ensure proper installation and linking
3. **Test mode issues**: Verify test credentials and environment settings

### Support

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: https://razorpay.com/support/
