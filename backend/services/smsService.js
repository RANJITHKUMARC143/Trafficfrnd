const fetch = require('node-fetch');

// Send SMS using Cashfree SMS API
async function sendSMS(phone, message) {
  try {
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    const environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
    
    if (!clientId || !clientSecret) {
      console.log('Cashfree credentials not configured, returning mock response');
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

// Send payment link via SMS
async function sendPaymentLinkSMS(phone, paymentLink, orderId, customerName) {
  const message = `Hi ${customerName || 'Customer'}!

Your order #${orderId} is ready for payment.

Payment Link: ${paymentLink}

Complete payment to confirm your order. Secure payment powered by Cashfree.

Thank you for choosing TrafficFriend!`;

  return await sendSMS(phone, message);
}

module.exports = {
  sendSMS,
  sendPaymentLinkSMS
};
