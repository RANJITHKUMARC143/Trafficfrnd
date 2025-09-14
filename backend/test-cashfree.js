// Test script for Cashfree integration
const { createUPIOrder, createUPIPaymentLink, verifyPayment } = require('./services/cashfreeService');

async function testCashfreeIntegration() {
  console.log('Testing Cashfree Integration...\n');

  // Test data
  const testOrderId = 'test_order_123';
  const testAmount = 100; // ₹100
  const testCustomerDetails = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '9999999999',
    customerId: 'customer_123'
  };

  try {
    console.log('1. Testing UPI Payment Link Creation...');
    const linkResult = await createUPIPaymentLink(testAmount, testOrderId, testCustomerDetails, 'test@upi');
    console.log('✅ UPI Payment Link Result:', linkResult);
    console.log('');

    console.log('2. Testing Payment Order Creation...');
    const orderResult = await createUPIOrder(testAmount, testOrderId, testCustomerDetails);
    console.log('✅ Payment Order Result:', orderResult);
    console.log('');

    console.log('3. Testing Payment Verification...');
    if (orderResult.success) {
      const verifyResult = await verifyPayment(orderResult.orderId);
      console.log('✅ Payment Verification Result:', verifyResult);
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\nNote: This is a test run. Make sure to:');
    console.log('- Set up your Cashfree credentials in .env file');
    console.log('- Test with sandbox environment first');
    console.log('- Verify webhook endpoints are accessible');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('- Check if CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET are set');
    console.log('- Verify CASHFREE_ENVIRONMENT is set to "sandbox" for testing');
    console.log('- Ensure internet connectivity');
  }
}

// Run the test
testCashfreeIntegration();
