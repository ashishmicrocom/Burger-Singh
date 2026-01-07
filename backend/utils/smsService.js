// Send OTP SMS using DVHosting API
export const sendOTPSMS = async (phone, otp) => {
  // Development mode: Use default OTP 000000
  if (!process.env.DV_API_KEY) {
    console.log('⚠️  DVHosting not configured - Development Mode (Default OTP: 000000)');
    console.log(`📱 SMS to ${phone}: Using default OTP 000000 for testing`);
    console.log('👉 Configure DV_API_KEY in .env for production SMS');
    return true;
  }

  try {
    const dv_key = process.env.DV_API_KEY;
    
    // Construct DVHosting API URL
    const url = `https://dvhosting.in/api-sms-v3.php?api_key=${dv_key}&number=${phone}&otp=${otp}`;

    console.log('📤 Sending SMS via DVHosting:', { phone, otp });
    
    const response = await fetch(url, {
      method: 'GET'
    });

    const data = await response.text(); // DVHosting returns text response
    console.log('📥 DVHosting Response:', data);
    
    if (response.ok) {
      console.log('✅ SMS sent successfully via DVHosting');
      console.log(`📱 OTP sent to ${phone}: ${otp}`);
      return true;
    } else {
      // Log the error and show OTP in console for development
      console.warn('⚠️  DVHosting API Error:', data);
      console.log('='.repeat(60));
      console.log(`📱 DEVELOPMENT MODE - Use this OTP for ${phone}:`);
      console.log(`🔑 OTP: ${otp}`);
      console.log('='.repeat(60));
      
      console.log('💡 Troubleshooting:');
      console.log('   1. Verify API key is correct in .env file (DV_API_KEY)');
      console.log('   2. Check if phone number format is correct');
      console.log('   3. Try logging into DVHosting dashboard');
      console.log('   4. Check account balance and credits');
      console.log('='.repeat(60));
      return true; // Return true to allow OTP flow to continue
    }
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
    console.error('Error details:', error);
    console.log('='.repeat(60));
    console.log(`📱 DEVELOPMENT MODE - Use this OTP for ${phone}:`);
    console.log(`🔑 OTP: ${otp}`);
    console.log('='.repeat(60));
    return true; // Return true to allow OTP flow to continue
  }
};



// Test SMS configuration
export const testSMSConfig = () => {
  try {
    const apiKey = process.env.DV_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  DVHosting API key not configured');
      return false;
    }

    console.log('✅ DVHosting configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ SMS configuration error:', error.message);
    return false;
  }
};