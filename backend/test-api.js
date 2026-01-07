// Simple test script to verify API endpoints
const testLogin = async () => {
  try {
    const response = await fetch('https://burgersingfrontbackend.kamaaupoot.in/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@burgersingh.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('Login Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Login successful!');
      console.log('User:', data.user.name);
      console.log('Role:', data.user.role);
      console.log('Token:', data.token.substring(0, 20) + '...');
    } else {
      console.log('\n❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin();
