# Cashfree UPI Payment Integration Setup

This document provides instructions for setting up Cashfree UPI payment integration in the Traffic Friend application.

## Prerequisites

1. **Cashfree Account**: Sign up for a merchant account at [Cashfree](https://www.cashfree.com/)
2. **API Credentials**: Obtain your Client ID and Client Secret from the Cashfree dashboard

## Backend Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file in the backend directory:

```env
# Cashfree Configuration
CASHFREE_CLIENT_ID=your_cashfree_client_id
CASHFREE_CLIENT_SECRET=your_cashfree_client_secret
CASHFREE_ENVIRONMENT=sandbox  # Use 'production' for live environment
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret

# Server URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3000
```

### 2. Install Dependencies

The required dependencies are already installed:
- `cashfree-pg-sdk-nodejs` - Cashfree Node.js SDK

### 3. API Endpoints

The following new endpoints are available:

- `POST /api/payments/cashfree/upi/order` - Create UPI payment link
- `POST /api/payments/cashfree/session` - Create payment session for mobile
- `POST /api/payments/cashfree/verify` - Verify payment status
- `POST /api/payments/cashfree/webhook` - Handle webhooks
- `GET /api/payments/methods` - Get available payment methods
- `GET /api/payments/config` - Get payment configuration

## Frontend Setup

### 1. Install Dependencies

The required dependencies are already installed:
- `react-native-cashfree-pg-sdk` - Cashfree React Native SDK

### 2. Payment Flow

1. **Cart Screen**: Users can select "UPI (Cashfree)" as payment method
2. **Order Creation**: Order is created with `payment.method: 'cashfree'`
3. **Payment Processing**: 
   - For UPI links: Opens external UPI app
   - For mobile sessions: Uses Cashfree SDK (requires additional setup)
4. **Payment Verification**: Automatically verifies payment status
5. **Order Confirmation**: Shows success message after payment

## Testing

### 1. Sandbox Testing

Use Cashfree's sandbox environment for testing:
- Set `CASHFREE_ENVIRONMENT=sandbox`
- Use sandbox credentials from Cashfree dashboard
- Test with sandbox UPI IDs

### 2. Test UPI IDs

For sandbox testing, use these test UPI IDs:
- `success@upi`
- `failure@upi`
- `pending@upi`

## Production Deployment

### 1. Switch to Production

1. Update environment variables:
   ```env
   CASHFREE_ENVIRONMENT=production
   CASHFREE_CLIENT_ID=your_live_client_id
   CASHFREE_CLIENT_SECRET=your_live_client_secret
   ```

2. Update webhook URLs in Cashfree dashboard:
   - Webhook URL: `https://yourdomain.com/api/payments/cashfree/webhook`

### 2. Webhook Configuration

Configure webhooks in your Cashfree dashboard:
- **Event**: `PAYMENT_SUCCESS_WEBHOOK`
- **URL**: `https://yourdomain.com/api/payments/cashfree/webhook`
- **Secret**: Set the same secret in both dashboard and environment variables

## Features Implemented

### 1. UPI Payment Links
- Generate UPI payment links with customer UPI ID
- Open payment links in default UPI app
- Automatic payment verification

### 2. Mobile Payment Sessions
- Create payment sessions for mobile SDK integration
- Support for in-app payment processing
- Real-time payment status updates

### 3. Payment Verification
- Server-side payment verification
- Webhook handling for payment events
- Automatic order status updates

### 4. Error Handling
- Comprehensive error handling
- User-friendly error messages
- Fallback to COD if payment fails

## Security Features

1. **Webhook Signature Verification**: All webhooks are verified using HMAC-SHA256
2. **Server-side Validation**: All payment data is validated server-side
3. **Secure API Keys**: API keys are stored as environment variables
4. **Payment Verification**: All payments are verified before marking as successful

## Troubleshooting

### Common Issues

1. **Payment Link Not Opening**
   - Check if UPI app is installed
   - Verify UPI ID format
   - Check network connectivity

2. **Webhook Not Receiving**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Ensure server is running

3. **Payment Verification Failing**
   - Check API credentials
   - Verify environment settings
   - Check order ID format

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=cashfree:*
```

## Support

For Cashfree-specific issues:
- [Cashfree Documentation](https://docs.cashfree.com/)
- [Cashfree Support](https://www.cashfree.com/support)

For application-specific issues:
- Check server logs
- Verify environment configuration
- Test with sandbox credentials first
