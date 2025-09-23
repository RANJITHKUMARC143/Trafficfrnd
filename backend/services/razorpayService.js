const Razorpay = require('razorpay');
const crypto = require('crypto');

// Lazy initialization of Razorpay instance
let razorpay = null;

function getRazorpayInstance() {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      console.log('Razorpay credentials not configured, will use mock responses');
      return null;
    }
    
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpay;
}

// Create Razorpay order
async function createRazorpayOrder(amount, orderId, customerDetails) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('Razorpay Credentials Check:', {
      keyId: keyId ? `${keyId.substring(0, 10)}...` : 'NOT SET',
      keySecret: keySecret ? `${keySecret.substring(0, 10)}...` : 'NOT SET'
    });
    
    if (!keyId || !keySecret) {
      console.log('Razorpay credentials not configured, returning mock response');
      return {
        success: true,
        id: `order_${orderId}_${Date.now()}`,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        status: 'created',
        receipt: `receipt_${orderId}`,
        created_at: Date.now()
      };
    }

    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      throw new Error('Razorpay instance not available');
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${orderId}`,
      notes: {
        orderId: orderId,
        customerName: customerDetails.name || 'Customer',
        customerEmail: customerDetails.email || 'customer@example.com',
        customerPhone: customerDetails.phone || '9999999999'
      }
    };

    console.log('Creating Razorpay order with options:', options);
    
    const order = await razorpayInstance.orders.create(options);
    
    console.log('Razorpay order created successfully:', order);
    
    return {
      success: true,
      ...order
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
}

// Verify Razorpay payment signature
function verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keySecret) {
      console.log('Razorpay key secret not configured, skipping signature verification');
      return true; // Return true for mock verification
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;
    
    console.log('Razorpay signature verification:', {
      expected: expectedSignature,
      received: razorpaySignature,
      isAuthentic: isAuthentic
    });
    
    return isAuthentic;
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return false;
  }
}

// Fetch payment details from Razorpay
async function fetchRazorpayPayment(paymentId) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      console.log('Razorpay credentials not configured, returning mock payment details');
      return {
        success: true,
        id: paymentId,
        amount: 10000, // Mock amount in paise
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        created_at: Date.now()
      };
    }

    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      throw new Error('Razorpay instance not available');
    }

    const payment = await razorpayInstance.payments.fetch(paymentId);
    
    console.log('Razorpay payment details:', payment);
    
    return {
      success: true,
      ...payment
    };
  } catch (error) {
    console.error('Error fetching Razorpay payment:', error);
    throw new Error(`Failed to fetch Razorpay payment: ${error.message}`);
  }
}

// Notify payment link via Razorpay (SMS or email)
async function notifyPaymentLink(linkId, medium /* 'sms' | 'email' */) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return { success: true, mock: true };
  }
  const razorpayInstance = getRazorpayInstance();
  if (!razorpayInstance) throw new Error('Razorpay instance not available');
  const resp = await razorpayInstance.paymentLink.notifyBy(linkId, medium);
  return { success: true, ...resp };
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  fetchRazorpayPayment,
  notifyPaymentLink,
  // Create a Razorpay Payment Link (or return a mock link when creds are missing)
  async createRazorpayPaymentLink(amount, orderId, customerDetails = {}, purpose = '') {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      const mockUrl = `http://localhost:3000/mock-payment-link?orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(amount)}`;
      return {
        success: true,
        id: `plink_${orderId}_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR',
        short_url: mockUrl,
        status: 'created'
      };
    }

    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      throw new Error('Razorpay instance not available');
    }

    // Sanitize inputs to match Razorpay patterns
    const rawPhone = (customerDetails.phone || '').toString();
    const digits = rawPhone.replace(/\D/g, '');
    let contact = digits;
    if (digits.length === 10) {
      contact = `+91${digits}`; // default to India if 10 digits
    } else if (digits.length > 10 && !rawPhone.startsWith('+')) {
      contact = `+${digits}`; // try to E.164-ize
    }
    const email = (customerDetails.email || '').toString();
    const validEmail = /.+@.+\..+/.test(email) ? email : undefined;

    const options = {
      amount: amount * 100,
      currency: 'INR',
      accept_partial: false,
      reference_id: String(orderId),
      description: purpose || `Order Payment - ${orderId}`,
      customer: {
        name: customerDetails.name || 'Customer',
        contact: contact || undefined,
        email: validEmail
      },
      notify: {
        sms: true,
        email: !!(customerDetails.email)
      },
      reminder_enable: true,
      notes: {
        orderId: String(orderId)
      }
    };

    const paymentLink = await razorpayInstance.paymentLink.create(options);
    return {
      success: true,
      ...paymentLink
    };
  }
};
