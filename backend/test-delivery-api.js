const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'https://trafficfrnd-2.onrender.com/api';

// Test the delivery partners list endpoint
async function testDeliveryPartnersList() {
  console.log('Testing delivery partners list...');
  
  try {
    const response = await fetch(`${API_BASE}/delivery`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test getting a specific delivery partner
async function testDeliveryPartnerDetails() {
  console.log('\nTesting delivery partner details...');
  
  try {
    // Use the first delivery partner ID from our database
    const partnerId = '683ea013bee73eea25ee3262';
    const response = await fetch(`${API_BASE}/delivery/${partnerId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Test getting orders for a delivery partner
async function testDeliveryPartnerOrders() {
  console.log('\nTesting delivery partner orders...');
  
  try {
    // Use the first delivery partner ID from our database
    const partnerId = '683ea013bee73eea25ee3262';
    const response = await fetch(`${API_BASE}/delivery/${partnerId}/orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testDeliveryPartnersList();
  await testDeliveryPartnerDetails();
  await testDeliveryPartnerOrders();
}

runTests(); 