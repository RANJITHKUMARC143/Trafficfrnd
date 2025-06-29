const fetch = require('node-fetch');

// Test authentication and get token
async function testAuth() {
  try {
    console.log('Testing authentication...');
    
    // Test login (you'll need to use actual credentials)
    const loginResponse = await fetch('http://192.168.4.176:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Replace with actual admin email
        password: 'password123'     // Replace with actual password
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login successful!');
      console.log('Token:', loginData.token);
      
      // Test delivery partner details with token
      const partnerResponse = await fetch('http://192.168.4.176:3000/api/delivery/683ea013bee73eea25ee3262', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (partnerResponse.ok) {
        const partnerData = await partnerResponse.json();
        console.log('✅ Delivery partner details fetched successfully!');
        console.log('Partner name:', partnerData.fullName);
        console.log('Partner email:', partnerData.email);
      } else {
        const errorData = await partnerResponse.json();
        console.log('❌ Failed to fetch partner details:', errorData.message);
      }
    } else {
      console.log('❌ Login failed. Please check your credentials.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth(); 