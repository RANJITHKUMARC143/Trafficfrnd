const crypto = require('crypto');

// Create payment link using Cashfree Payment Links API (Official API)
async function createPaymentLink(amount, orderId, customerDetails, purpose = 'Order Payment') {
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    console.log('Cashfree Payment Link Credentials Check:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'NOT SET',
      clientSecret: clientSecret ? `${clientSecret.substring(0, 10)}...` : 'NOT SET',
      environment: environment
    });
    
    if (!clientId || !clientSecret) {
      console.log('Cashfree credentials not configured, returning mock response');
      return {
        success: true,
        cf_link_id: `mock_link_${orderId}_${Date.now()}`,
        link_id: `link_${orderId}_${Date.now()}`,
        link_url: `https://mock-cashfree.com/pay/${orderId}`,
        link_status: 'ACTIVE',
        link_amount: amount,
        link_currency: 'INR'
      };
    }
    
    // Use Cashfree Payment Links API (PG v2)
    const baseUrl = environment === 'production' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';
    
    const apiUrl = `${baseUrl}/links`;
    
    // Create payment link request payload according to Cashfree API documentation
    const linkData = {
      link_id: `link_${orderId}_${Date.now()}`,
      link_amount: amount,
      link_currency: 'INR',
      link_purpose: purpose,
      customer_details: {
        customer_name: customerDetails.name || 'Customer',
        customer_phone: customerDetails.phone || '9999999999',
        customer_email: customerDetails.email || 'customer@example.com'
      },
      link_notify: {
        send_sms: true,
        send_email: false
      },
      link_auto_reminders: true
    };
    
    console.log('Cashfree Payment Link API Request:', {
      url: apiUrl,
      linkData: { ...linkData, customer_details: { ...linkData.customer_details, customer_phone: '***' } }
    });
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-client-secret': clientSecret,
        'x-api-version': '2023-08-01',
        'Accept': 'application/json'
      },
      body: JSON.stringify(linkData)
    });
    
    const data = await response.json();
    console.log('Cashfree Payment Link API Response:', { status: response.status, data });
    
    if (!response.ok) {
      console.error('Cashfree API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        requestData: linkData
      });
      throw new Error(data?.message || data?.error || `Cashfree Payment Link API error: ${response.status} ${response.statusText}`);
    }
    
    return {
      success: true,
      cf_link_id: data?.cf_link_id,
      link_id: data?.link_id,
      link_url: data?.link_url,
      link_status: data?.link_status,
      link_amount: data?.link_amount,
      link_currency: data?.link_currency,
      link_qrcode: data?.link_qrcode
    };
  } catch (error) {
    console.error('Error creating Cashfree payment link:', error);
    throw error;
  }
}

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

// Send SMS using Cashfree SMS API
async function sendSMS(phone, message) {
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    if (!clientId || !clientSecret) {
      console.log('Cashfree credentials not configured, returning mock SMS response');
      return {
        success: true,
        messageId: `mock_sms_${Date.now()}`,
        status: 'sent',
        message: 'SMS sent successfully (mock)'
      };
    }

    // Format phone number to 10 digits with country code
    const formattedPhone = phone.replace(/\D/g, '');
    let phoneWithCountryCode;
    
    if (formattedPhone.length === 10) {
      phoneWithCountryCode = `91${formattedPhone}`;
    } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
      phoneWithCountryCode = formattedPhone;
    } else {
      throw new Error('Invalid phone number format. Please provide 10-digit Indian mobile number.');
    }

    // Cashfree SMS API endpoint
    const baseUrl = environment === 'production' 
      ? 'https://api.cashfree.com' 
      : 'https://sandbox.cashfree.com';
    
    const smsUrl = `${baseUrl}/pg/notifications/sms`;

    // Create basic auth header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const smsData = {
      phone: phoneWithCountryCode,
      message: message,
      sender_id: 'TRAFFC' // TrafficFriend sender ID
    };

    console.log('Cashfree SMS Request:', {
      url: smsUrl,
      phone: phoneWithCountryCode,
      messageLength: message.length,
      environment: environment
    });

    const response = await fetch(smsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(smsData)
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      try {
        data = { message: await response.text() };
      } catch {}
    }

    console.log('Cashfree SMS Response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Cashfree SMS API error');
    }

    return {
      success: true,
      messageId: data?.message_id || `sms_${Date.now()}`,
      status: data?.status || 'sent',
      message: data?.message || 'SMS sent successfully via Cashfree'
    };
  } catch (error) {
    console.error('Cashfree SMS service error:', error);
    throw error;
  }
}

// Create payment link and send SMS in one function
async function createPaymentLinkAndSendSMS(amount, orderId, customerDetails, purpose = 'Order Payment', sendSMSFlag = false) {
  try {
    // First create the payment link using the official Payment Links API
    const paymentLinkResult = await createPaymentLink(amount, orderId, customerDetails, purpose);
    
    // If SMS sending is requested and we have customer phone
    if (sendSMSFlag && customerDetails.phone) {
      const message = `Hi ${customerDetails.name || 'Customer'}!

Your order #${orderId} is ready for payment.

Payment Link: ${paymentLinkResult.link_url}

Complete payment to confirm your order. Secure payment powered by Cashfree.

Thank you for choosing TrafficFriend!`;

      try {
        const smsResult = await sendSMS(customerDetails.phone, message);
        return {
          ...paymentLinkResult,
          smsSent: true,
          smsResult: smsResult
        };
      } catch (smsError) {
        console.error('SMS sending failed, but payment link created:', smsError);
        return {
          ...paymentLinkResult,
          smsSent: false,
          smsError: smsError.message
        };
      }
    }
    
    return {
      ...paymentLinkResult,
      smsSent: false
    };
  } catch (error) {
    console.error('Error creating payment link and sending SMS:', error);
    throw error;
  }
}

module.exports = {
  createPaymentLink,
  createUPIPaymentLink,
  verifyPayment,
  verifyWebhookSignature,
  getAvailablePaymentMethods,
  sendSMS,
  createPaymentLinkAndSendSMS
};