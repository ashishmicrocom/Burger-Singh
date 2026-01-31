import axios from 'axios';

/**
 * Zoop API Integration Service
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - ZOOP_API_KEY: Your Zoop API Key
 * - ZOOP_APP_ID: Your Zoop App ID
 * - ZOOP_BASE_URL: Zoop API base URL (default: https://api.zoop.one/api/v1)
 */

// Function to get credentials (lazy loading)
const getZoopCredentials = () => {
  const credentials = {
    baseURL: process.env.ZOOP_BASE_URL || 'https://test.zoop.one/api/v1',
    esignBaseURL: process.env.ZOOP_ESIGN_BASE_URL || 'https://test.zoop.plus/contract/esign',
    apiKey: process.env.ZOOP_API_KEY?.trim(),
    appId: process.env.ZOOP_APP_ID?.trim()
  };
  
  console.log('🔍 Loading Zoop credentials:', {
    hasApiKey: !!credentials.apiKey,
    hasAppId: !!credentials.appId,
    baseURL: credentials.baseURL,
    esignBaseURL: credentials.esignBaseURL
  });
  
  return credentials;
};

// Create axios client dynamically
const getZoopClient = () => {
  const { baseURL, apiKey, appId } = getZoopCredentials();
  
  return axios.create({
    baseURL: baseURL,
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      'app-id': appId
    },
    timeout: 30000 // 30 seconds
  });
};

/**
 * Calculate name similarity using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score between 0 and 1
 */
const calculateNameSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = (s1, s2) => {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  };
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

/**
 * Verify PAN using Zoop Pan Pro Product
 * @param {string} panNumber - PAN number to verify
 * @param {string} name - Name as per PAN (optional for advanced verification)
 * @param {string} dob - Date of birth in YYYY-MM-DD format (optional)
 * @returns {Promise<Object>} Verification result
 */
export const verifyPAN = async (panNumber, name = null, dob = null) => {
  try {
    const { apiKey, appId } = getZoopCredentials();
    
    if (!apiKey || !appId) {
      console.error('❌ Zoop credentials missing:', {
        hasApiKey: !!apiKey,
        hasAppId: !!appId
      });
      throw new Error('Zoop API credentials not configured. Please set ZOOP_API_KEY and ZOOP_APP_ID in environment variables.');
    }

    // Validate PAN format
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      return {
        success: false,
        error: 'Invalid PAN format. PAN should be 10 characters (e.g., ABCDE1234F)'
      };
    }

    // Validate DOB if provided
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear() - 
        (today.getMonth() < dobDate.getMonth() || 
         (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate()) ? 1 : 0);
      
      if (dobDate > today) {
        return {
          success: false,
          error: 'Date of birth cannot be in the future'
        };
      }
      
      if (age < 18) {
        return {
          success: false,
          error: 'Applicant must be at least 18 years old'
        };
      }
      
      if (age > 100) {
        return {
          success: false,
          error: 'Please provide a valid date of birth'
        };
      }
    }

    console.log(`🔍 Verifying PAN: ${panNumber}`);

    const zoopClient = getZoopClient();
    
    // Zoop Pan Pro API endpoint (official format)
    const response = await zoopClient.post('/in/identity/pan/pro', {
      mode: 'sync',
      data: {
        customer_pan_number: panNumber,
        pan_holder_name: name || '',
        consent: 'Y',
        consent_text: 'I hereby declare my consent agreement for fetching my information via ZOOP API'
      },
      task_id: `task_${Date.now()}_${Math.random().toString(36).substring(7)}`
    });

    console.log('✅ PAN verification response:', response.data);

    if (response.data && (response.data.success || response.data.response_code === '101')) {
      const result = response.data.result || response.data.data || {};
      const panHolderName = result.name || result.full_name || result.pan_holder_name;
      
      // If name is provided, validate name matching for ownership verification
      if (name && panHolderName) {
        const normalizedInputName = name.trim().toLowerCase().replace(/\s+/g, ' ');
        const normalizedPanName = panHolderName.trim().toLowerCase().replace(/\s+/g, ' ');
        
        // Check if names match (at least 70% similarity or contains)
        const nameMatches = normalizedPanName.includes(normalizedInputName) || 
                           normalizedInputName.includes(normalizedPanName) ||
                           calculateNameSimilarity(normalizedInputName, normalizedPanName) >= 0.7;
        
        if (!nameMatches) {
          console.warn('⚠️ PAN name mismatch:', {
            provided: name,
            panRecord: panHolderName
          });
          return {
            success: false,
            verified: false,
            error: `PAN name mismatch. PAN is registered under: ${panHolderName}. Please verify your details.`
          };
        }
      }
      
      // Check if PAN is valid/active
      const panStatus = result.status || result.pan_status;
      if (panStatus && panStatus.toLowerCase() !== 'valid' && panStatus.toLowerCase() !== 'active') {
        return {
          success: false,
          verified: false,
          error: `PAN status is ${panStatus}. Please ensure your PAN is valid and active.`
        };
      }
      
      return {
        success: true,
        verified: true,
        data: {
          panNumber: result.pan_number || result.pan || panNumber,
          name: panHolderName,
          category: result.category || result.type,
          status: panStatus || 'Active',
          lastUpdated: result.last_updated,
          verificationId: response.data.request_id || response.data.id,
          verifiedAt: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        verified: false,
        error: response.data?.message || response.data?.response_message || 'PAN verification failed'
      };
    }
  } catch (error) {
    console.error('❌ PAN verification error:', error.response?.data || error.message);
    return {
      success: false,
      verified: false,
      error: error.response?.data?.message || error.message || 'PAN verification failed'
    };
  }
};

/**
 * Initiate Aadhaar E-Sign verification using v5/init endpoint
 * @param {string} name - Full name of the signer
 * @param {string} email - Email address of the signer
 * @param {string} city - City of the signer
 * @param {string} documentBase64 - Base64 encoded PDF document to sign
 * @param {string} redirectUrl - URL to redirect after signing
 * @param {string} responseUrl - Webhook URL for response
 * @param {string} taskId - Your internal task reference ID
 * @returns {Promise<Object>} Verification initiation result with transaction_id
 */
export const initiateAadhaarESign = async (name, email, city, documentBase64, redirectUrl = '', responseUrl = '', taskId = '') => {
  try {
    const { apiKey, appId, esignBaseURL } = getZoopCredentials();
    
    if (!apiKey || !appId) {
      console.error('❌ Zoop credentials missing:', {
        hasApiKey: !!apiKey,
        hasAppId: !!appId
      });
      throw new Error('Zoop API credentials not configured. Please set ZOOP_API_KEY and ZOOP_APP_ID in environment variables.');
    }

    // Validate required parameters
    if (!name || !email || !city || !documentBase64) {
      return {
        success: false,
        error: 'Name, email, city, and document are required for Aadhaar e-Sign'
      };
    }

    console.log(`🔍 Initiating Aadhaar e-Sign v5 for: ${name} (${email})`);
    console.log(`📡 Using e-Sign base URL: ${esignBaseURL}`);

    // Validate and prepare URLs - Don't include query params as Zoop will append their own
    const finalRedirectUrl = redirectUrl && redirectUrl.trim() !== '' 
      ? redirectUrl 
      : 'https://burgersingfrontend.kamaaupoot.in/onboarding';
    
    const finalResponseUrl = responseUrl && responseUrl.trim() !== ''
      ? responseUrl
      : `${esignBaseURL}/webhook`;

    console.log('🔗 Redirect URL:', finalRedirectUrl);
    console.log('🔗 Response URL:', finalResponseUrl);

    // Validate redirect URL format
    try {
      new URL(finalRedirectUrl);
    } catch (e) {
      return {
        success: false,
        error: `Invalid redirect URL format: ${finalRedirectUrl}`
      };
    }

    // Create axios client specifically for e-sign with correct base URL
    const esignClient = axios.create({
      baseURL: esignBaseURL,
      headers: {
        'Content-Type': 'application/json',
        'app-id': appId,
        'api-key': apiKey
      },
      timeout: 30000
    });
    
    // Zoop E-Sign v5/init API
    const payload = {
      task_id: taskId || `task_${Date.now()}`,  // Your reference ID
      document: {
        name: "Onboarding Agreement",
        data: documentBase64,
        info: "Burger Singh Onboarding Document"
      },
      signers: [
        {
          signer_name: name,
          signer_email: email,
          signer_city: city,
          signer_purpose: "Onboarding Verification",
          sign_coordinates: [
            {
              page_num: 0,
              x_coord: 400,
              y_coord: 550
            }
          ]
        }
      ],
      txn_expiry_min: "10080", // 7 days
      white_label: "Y",
      redirect_url: finalRedirectUrl,
      response_url: finalResponseUrl,
      esign_type: "AADHAAR",
      email_template: {
        org_name: "Burger Singh"
      }
    };

    console.log('📤 Sending payload to:', `${esignBaseURL}/v5/init`);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    const response = await esignClient.post('/v5/init', payload);

    console.log('✅ Aadhaar e-Sign v5 initiation response:', response.data);

    if (response.data && response.data.success) {
      // Extract data from Zoop's response format
      const firstRequest = response.data.requests && response.data.requests[0];
      const groupId = response.data.group_id;
      
      console.log('🎯 Extracted transaction details:', {
        group_id: groupId,
        request_id: firstRequest?.request_id,
        signing_url: firstRequest?.signing_url
      });
      
      return {
        success: true,
        transactionId: groupId, // Zoop uses 'group_id' as transaction ID
        requestId: firstRequest?.request_id,
        esignUrl: firstRequest?.signing_url, // Zoop uses 'signing_url'
        message: 'E-Sign process initiated successfully',
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data?.message || response.data?.response_message || 'Failed to initiate Aadhaar e-Sign'
      };
    }
  } catch (error) {
    console.error('❌ Aadhaar e-Sign v5 initiation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to initiate Aadhaar e-Sign'
    };
  }
};

/**
 * Check Aadhaar E-Sign transaction status
 * @param {string} transactionId - Transaction ID from initiation step
 * @returns {Promise<Object>} Transaction status result
 */
export const checkAadhaarESignStatus = async (transactionId) => {
  try {
    const { apiKey, appId, esignBaseURL } = getZoopCredentials();
    
    if (!apiKey || !appId) {
      throw new Error('Zoop API credentials not configured');
    }

    if (!transactionId) {
      return {
        success: false,
        error: 'Transaction ID is required'
      };
    }

    console.log(`🔍 Checking Aadhaar e-Sign status for transaction: ${transactionId}`);
    console.log(`📡 Using e-Sign base URL: ${esignBaseURL}`);
    console.log(`🔗 Full status check URL: ${esignBaseURL}/v5/status/${transactionId}`);

    // Create axios client specifically for e-sign
    const esignClient = axios.create({
      baseURL: esignBaseURL,
      headers: {
        'Content-Type': 'application/json',
        'app-id': appId,
        'api-key': apiKey
      },
      timeout: 30000
    });
    
    // Check transaction status
    const response = await esignClient.get(`/v5/status/${transactionId}`);

    console.log('✅ Aadhaar e-Sign status response:', response.data);

    if (response.data && response.data.success) {
      const result = response.data.result || response.data.data || {};
      return {
        success: true,
        status: result.status || result.transaction_status,
        verified: result.status === 'COMPLETED' || result.transaction_status === 'COMPLETED',
        data: {
          transactionId: transactionId,
          status: result.status || result.transaction_status,
          signers: result.signers || [],
          signedDocument: result.signed_document_url || result.document_url,
          verifiedAt: result.completed_at || result.updated_at,
          aadhaarDetails: result.aadhaar_details || {}
        }
      };
    } else {
      return {
        success: false,
        verified: false,
        error: response.data?.message || 'Failed to check e-Sign status'
      };
    }
  } catch (error) {
    console.error('❌ Aadhaar e-Sign status check error:', {
      transactionId: transactionId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 404 - Transaction not found
    if (error.response?.status === 404) {
      return {
        success: false,
        verified: false,
        error: 'Transaction not found. The e-Sign session may have expired or was never completed. Please initiate verification again.'
      };
    }
    
    return {
      success: false,
      verified: false,
      error: error.response?.data?.message || error.message || 'Failed to check e-Sign status'
    };
  }
};

/**
 * Check verification status (works for both PAN and Aadhaar)
 * @param {string} requestId - Request ID from Zoop
 * @returns {Promise<Object>} Status result
 */
export const checkVerificationStatus = async (requestId) => {
  try {
    const { apiKey, appId } = getZoopCredentials();
    
    if (!apiKey || !appId) {
      throw new Error('Zoop API credentials not configured');
    }

    const zoopClient = getZoopClient();
    const response = await zoopClient.get(`/verification/status/${requestId}`);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

export default {
  verifyPAN,
  initiateAadhaarESign,
  checkAadhaarESignStatus,
  checkVerificationStatus
};
