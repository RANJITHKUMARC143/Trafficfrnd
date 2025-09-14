const crypto = require('crypto');

// Create UPI payment link using Cashfree API
async function createUPIPaymentLink(amount, orderId, customerDetails, upiId) {
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    console.log('Cashfree Credentials Check:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NOT SET',
      environment: environment
    });
    
    if (!clientId || !clientSecret) {
      console.log('Cashfree credentials not configured, returning mock response');
      return {
        success: true,
        linkId: `mock_link_${orderId}_${Date.now()}`,
        linkUrl: `https://mock-cashfree.com/pay/${orderId}?upi=${upiId}`,
        linkStatus: 'ACTIVE',
        amount: amount,
        currency: 'INR'
      };
    }
    
    // Use direct API calls with correct Cashfree API structure
    const baseUrl = environment === 'production' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';
    
    const apiUrl = `${baseUrl}/orders`;
    
    // Create order request payload according to Cashfree API documentation
    const orderData = {
      order_id: `order_${orderId}_${Date.now()}`,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerDetails.customerId || `customer_${Date.now()}`,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone
      },
      order_meta: {
        return_url: 'https://your-app.com/payment/success',
        notify_url: 'https://your-app.com/payment/webhook'
      },
      order_note: `Order for ${customerDetails.name}`,
      order_tags: {
        order_type: 'food_delivery',
        app_name: 'TrafficFriend'
      }
    };
    
    console.log('Cashfree API Request:', {
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': '***hidden***'
      },
      body: orderData
    });
    
    // Make API call to Cashfree with correct headers
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cashfree API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Cashfree API error: ${errorData.message || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Cashfree API Success Response:', result);
    
    // Clean up payment_session_id by removing any extra text
    let cleanPaymentSessionId = result.payment_session_id;
    if (cleanPaymentSessionId && cleanPaymentSessionId.includes('paymentpayment')) {
      cleanPaymentSessionId = cleanPaymentSessionId.replace(/paymentpayment.*$/, '');
    }
    
    console.log('Cleaned Payment Session ID:', {
      original: result.payment_session_id,
      cleaned: cleanPaymentSessionId
    });
    
    // For testing, use UPI deep link instead of Cashfree checkout URL
    const upiDeepLink = `upi://pay?pa=${upiId}&pn=TrafficFriend&am=${amount}&cu=INR&tn=Order Payment`;
    
    return {
      success: true,
      linkId: cleanPaymentSessionId,
      linkUrl: upiDeepLink,
      linkStatus: result.order_status,
      amount: amount,
      currency: 'INR',
      orderId: result.order_id,
      cfOrderId: result.cf_order_id
    };
  } catch (error) {
    console.error('Error creating UPI payment link:', error);
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
}

// Verify payment
async function verifyPayment(orderId) {
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    if (!clientId || !clientSecret) {
      throw new Error('Cashfree credentials not configured');
    }
    
    const baseUrl = environment === 'production' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';
    
    const apiUrl = `${baseUrl}/orders/${orderId}/payments`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to verify payment: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      payments: result || []
    };
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Get available payment methods
async function getAvailablePaymentMethods() {
  try {
    // For now, return UPI as the main method for Cashfree
    return {
      success: true,
      methods: ['upi'],
      upi: {
        enabled: true,
        description: 'Pay using UPI ID'
      }
    };
  } catch (error) {
    console.error('Error getting payment methods:', error);
    throw error;
  }
}

module.exports = {
  createUPIPaymentLink,
  verifyPayment,
  verifyWebhookSignature,
  getAvailablePaymentMethods
};