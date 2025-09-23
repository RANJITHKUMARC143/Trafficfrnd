const fetch = require('node-fetch');

// Send SMS using generic SMS API (can be configured for any provider)
async function sendSMS(phone, message) {
  try {
    const smsApiKey = process.env.SMS_API_KEY;
    const smsSenderId = process.env.SMS_SENDER_ID || 'TRAFFC';
    
    if (!smsApiKey) {
      console.log('SMS API key not configured, returning mock response');
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

    // Generic SMS API endpoint (can be configured for any provider)
    const smsUrl = process.env.SMS_API_URL || 'https://api.sms-provider.com/send';
    
    const smsData = {
      phone: phoneWithCountryCode,
      message: message,
      sender_id: smsSenderId
    };

    console.log('SMS Request:', {
      url: smsUrl,
      phone: phoneWithCountryCode,
      messageLength: message.length,
      senderId: smsSenderId
    });

    const response = await fetch(smsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${smsApiKey}`,
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

    console.log('SMS Response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'SMS API error');
    }

    return {
      success: true,
      messageId: data?.message_id || `sms_${Date.now()}`,
      status: data?.status || 'sent',
      message: data?.message || 'SMS sent successfully'
    };
  } catch (error) {
    console.error('SMS service error:', error);
    throw error;
  }
}

// Send payment link via SMS
async function sendPaymentLinkSMS(phone, paymentLink, orderId, customerName) {
  const message = `Hi ${customerName || 'Customer'}!

Your order #${orderId} is ready for payment.

Payment Link: ${paymentLink}

Complete payment to confirm your order. Secure payment powered by Razorpay.

Thank you for choosing TrafficFriend!`;

  return await sendSMS(phone, message);
}

module.exports = {
  sendSMS,
  sendPaymentLinkSMS
};