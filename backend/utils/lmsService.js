/**
 * LMS Integration Service
 * Handles integration with external Learning Management System
 */

/**
 * Create a new user in LMS
 * @param {Object} userData - User data from onboarding
 * @returns {Promise<Object>} { success, lmsUserId, message }
 */
export const createLMSUser = async (userData) => {
  try {
    const {
      fullName,
      email,
      phone,
      designation,
      storeName,
      storeCode,
      fieldCoachEmail,
      dateOfJoining
    } = userData;

    // Validate required fields
    if (!email || !fullName) {
      throw new Error('Email and full name are required for LMS creation');
    }

    // LMS API Configuration
    const lmsApiUrl = process.env.LMS_API_URL;
    const lmsApiKey = process.env.LMS_API_KEY;

    if (!lmsApiUrl || !lmsApiKey) {
      console.warn('⚠️  LMS API not configured - Running in mock mode');
      // Return mock response for development
      return {
        success: true,
        lmsUserId: `LMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Mock LMS user created (development mode)'
      };
    }

    // Prepare LMS payload
    const lmsPayload = {
      firstName: fullName.split(' ')[0],
      lastName: fullName.split(' ').slice(1).join(' ') || '',
      email,
      phone,
      designation,
      storeName,
      storeCode,
      fieldCoachEmail,
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    console.log('📡 Calling LMS API to create user:', email);

    // Make API call to LMS
    const response = await fetch(`${lmsApiUrl}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lmsApiKey}`,
        'X-API-Key': lmsApiKey
      },
      body: JSON.stringify(lmsPayload),
      timeout: 30000 // 30 seconds timeout
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`LMS API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const lmsResponse = await response.json();

    console.log('✅ LMS user created successfully:', lmsResponse.userId);

    return {
      success: true,
      lmsUserId: lmsResponse.userId || lmsResponse.id,
      message: 'User created in LMS successfully'
    };

  } catch (error) {
    console.error('❌ Error creating LMS user:', error.message);
    return {
      success: false,
      lmsUserId: null,
      message: error.message || 'Failed to create LMS user'
    };
  }
};

/**
 * Deactivate a user in LMS
 * @param {String} lmsUserId - The LMS user ID
 * @returns {Promise<Object>} { success, message }
 */
export const deactivateLMSUser = async (lmsUserId) => {
  try {
    if (!lmsUserId) {
      throw new Error('LMS User ID is required');
    }

    const lmsApiUrl = process.env.LMS_API_URL;
    const lmsApiKey = process.env.LMS_API_KEY;

    if (!lmsApiUrl || !lmsApiKey) {
      console.warn('⚠️  LMS API not configured - Running in mock mode');
      return {
        success: true,
        message: 'Mock LMS user deactivated (development mode)'
      };
    }

    console.log('📡 Calling LMS API to deactivate user:', lmsUserId);

    const response = await fetch(`${lmsApiUrl}/api/users/${lmsUserId}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lmsApiKey}`,
        'X-API-Key': lmsApiKey
      },
      body: JSON.stringify({ status: 'inactive' }),
      timeout: 30000
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`LMS API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    console.log('✅ LMS user deactivated successfully:', lmsUserId);

    return {
      success: true,
      message: 'User deactivated in LMS successfully'
    };

  } catch (error) {
    console.error('❌ Error deactivating LMS user:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to deactivate LMS user'
    };
  }
};

/**
 * Get user from LMS
 * @param {String} lmsUserId - The LMS user ID
 * @returns {Promise<Object>} User data from LMS
 */
export const getLMSUser = async (lmsUserId) => {
  try {
    const lmsApiUrl = process.env.LMS_API_URL;
    const lmsApiKey = process.env.LMS_API_KEY;

    if (!lmsApiUrl || !lmsApiKey) {
      return null;
    }

    const response = await fetch(`${lmsApiUrl}/api/users/${lmsUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${lmsApiKey}`,
        'X-API-Key': lmsApiKey
      },
      timeout: 15000
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Error fetching LMS user:', error.message);
    return null;
  }
};
