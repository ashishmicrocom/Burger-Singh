import axios from 'axios';

/**
 * Surepass API Integration Service for Digilocker
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - SUREPASS_API_TOKEN: Your Surepass API Token
 * - SUREPASS_BASE_URL: Surepass API base URL (default: https://kyc-api.surepass.io/api/v1)
 */

// Function to get credentials (lazy loading)
const getSurepassCredentials = () => {
    const credentials = {
        baseURL: process.env.SUREPASS_BASE_URL || 'https://sandbox.surepass.app',
        apiToken: process.env.SUREPASS_API_TOKEN?.trim()
    };

    console.log('🔍 Loading Surepass credentials:', {
        hasApiToken: !!credentials.apiToken,
        baseURL: credentials.baseURL
    });

    return credentials;
};

// Create axios client dynamically
const getSurepassClient = () => {
    const { baseURL, apiToken } = getSurepassCredentials();

    return axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        },
        timeout: 30000 // 30 seconds
    });
};

// Create axios client with Token header (alternative auth format)
const getSurepassClientTokenAuth = () => {
    const { baseURL, apiToken } = getSurepassCredentials();

    return axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': 'application/json',
            'Token': apiToken
        },
        timeout: 30000
    });
};

/**
 * Initiate Digilocker Link for Aadhaar verification
 * @param {string} redirectUrl - URL to redirect after verification
 * @param {string} webhookUrl - Webhook URL for verification response
 * @returns {Promise<Object>} Initiation result with link URL and client_id
 */
export const initiateDigilockerLink = async (redirectUrl, webhookUrl = '') => {
    try {
        const { baseURL, apiToken } = getSurepassCredentials();

        if (!apiToken) {
            console.error('❌ Surepass credentials missing:', {
                hasApiToken: !!apiToken
            });
            throw new Error('Surepass API credentials not configured. Please set SUREPASS_API_TOKEN in environment variables.');
        }

        // Validate required parameters
        if (!redirectUrl) {
            return {
                success: false,
                error: 'Redirect URL is required for Digilocker Link'
            };
        }

        console.log(`🔍 Initiating Digilocker Link`);
        console.log('🔗 Redirect URL:', redirectUrl);
        console.log('🔗 Webhook URL:', webhookUrl);

        // Validate redirect URL format
        try {
            new URL(redirectUrl);
        } catch (e) {
            return {
                success: false,
                error: `Invalid redirect URL format: ${redirectUrl}`
            };
        }

        // Surepass Digilocker Link API - payload format from their dashboard
        const payload = {
            data: {
                redirect_url: redirectUrl,
                expiry_minutes: 10,
                send_sms: false,
                send_email: false,
                verify_phone: false,
                verify_email: false,
                skip_main_screen: false,
                signup_flow: false
            }
        };

        // Add webhook_url if provided
        if (webhookUrl && webhookUrl.trim() !== '') {
            payload.data.webhook_url = webhookUrl;
        }

        console.log('📤 Sending payload to Surepass:', JSON.stringify(payload, null, 2));

        // Use the correct Surepass Digilocker endpoint
        const endpoint = '/api/v1/digilocker/initialize';
        const url = `${baseURL}${endpoint}`;
        
        console.log(`📡 Calling Surepass API: ${url}`);
        
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            },
            timeout: 30000
        });

        console.log('✅ Surepass Digilocker response:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.success !== false) {
            return {
                success: true,
                clientId: response.data.data?.client_id,
                digilockerUrl: response.data.data?.link || response.data.data?.url,
                message: 'Digilocker Link initiated successfully',
                expiresAt: response.data.data?.expires_at || null
            };
        } else {
            return {
                success: false,
                error: response.data?.message || 'Failed to initiate Digilocker Link'
            };
        }
    } catch (error) {
        console.error('❌ Digilocker Link initiation error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to initiate Digilocker Link'
        };
    }
};

/**
 * Check Digilocker verification status
 * @param {string} clientId - Client ID from initiation
 * @returns {Promise<Object>} Verification status result
 */
export const checkDigilockerStatus = async (clientId) => {
    try {
        const { apiToken } = getSurepassCredentials();

        if (!apiToken) {
            throw new Error('Surepass API credentials not configured.');
        }

        if (!clientId) {
            return {
                success: false,
                error: 'Client ID is required to check status'
            };
        }

        console.log(`🔍 Checking Digilocker status for client_id: ${clientId}`);

        const surepassClient = getSurepassClient();

        // Surepass Digilocker Status API endpoint
        const response = await surepassClient.post('/api/v1/digilocker/status', {
            client_id: clientId
        });

        console.log('✅ Surepass Digilocker status response:', response.data);

        if (response.data && response.data.success) {
            const data = response.data.data;

            // Check if verification is complete
            if (data.status === 'completed' || data.verification_status === 'verified') {
                return {
                    success: true,
                    verified: true,
                    data: {
                        aadhaarNumber: data.aadhaar_number || data.masked_aadhaar,
                        name: data.name || data.full_name,
                        dob: data.dob || data.date_of_birth,
                        gender: data.gender,
                        address: data.address || data.full_address,
                        photo: data.photo || data.profile_image,
                        documentDetails: data,
                        verifiedAt: new Date().toISOString()
                    },
                    message: 'Aadhaar verified successfully via Digilocker'
                };
            } else if (data.status === 'pending' || data.verification_status === 'pending') {
                return {
                    success: true,
                    verified: false,
                    message: 'Digilocker verification is pending. Please complete the verification process.'
                };
            } else if (data.status === 'failed' || data.verification_status === 'failed') {
                return {
                    success: false,
                    verified: false,
                    error: data.error_message || 'Digilocker verification failed'
                };
            } else {
                return {
                    success: false,
                    verified: false,
                    error: 'Unknown verification status'
                };
            }
        } else {
            return {
                success: false,
                verified: false,
                error: response.data?.message || 'Failed to check Digilocker status'
            };
        }
    } catch (error) {
        console.error('❌ Digilocker status check error:', error.response?.data || error.message);
        return {
            success: false,
            verified: false,
            error: error.response?.data?.message || error.message || 'Failed to check Digilocker status'
        };
    }
};

/**
 * Fetch Aadhaar details from Digilocker
 * @param {string} clientId - Client ID from initiation
 * @returns {Promise<Object>} Aadhaar details
 */
export const fetchAadhaarDetails = async (clientId) => {
    try {
        const { apiToken } = getSurepassCredentials();

        if (!apiToken) {
            throw new Error('Surepass API credentials not configured.');
        }

        if (!clientId) {
            return {
                success: false,
                error: 'Client ID is required to fetch Aadhaar details'
            };
        }

        console.log(`🔍 Fetching Aadhaar details for client_id: ${clientId}`);

        const surepassClient = getSurepassClient();

        // Surepass Digilocker Fetch API endpoint
        const response = await surepassClient.post('/api/v1/digilocker/fetch', {
            client_id: clientId
        });

        console.log('✅ Surepass Aadhaar fetch response:', response.data);

        if (response.data && response.data.success) {
            const aadhaarData = response.data.data;

            return {
                success: true,
                data: {
                    aadhaarNumber: aadhaarData.aadhaar_number || aadhaarData.masked_aadhaar,
                    name: aadhaarData.name || aadhaarData.full_name,
                    dob: aadhaarData.dob || aadhaarData.date_of_birth,
                    gender: aadhaarData.gender,
                    address: aadhaarData.address || aadhaarData.full_address,
                    photo: aadhaarData.photo || aadhaarData.profile_image,
                    fatherName: aadhaarData.father_name,
                    mobile: aadhaarData.mobile,
                    email: aadhaarData.email,
                    pincode: aadhaarData.pincode,
                    state: aadhaarData.state,
                    district: aadhaarData.district,
                    country: aadhaarData.country,
                    houseNumber: aadhaarData.house_number,
                    street: aadhaarData.street,
                    landmark: aadhaarData.landmark,
                    locality: aadhaarData.locality,
                    vtc: aadhaarData.vtc,
                    subdivision: aadhaarData.subdivision,
                    postOffice: aadhaarData.post_office
                }
            };
        } else {
            return {
                success: false,
                error: response.data?.message || 'Failed to fetch Aadhaar details'
            };
        }
    } catch (error) {
        console.error('❌ Aadhaar details fetch error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch Aadhaar details'
        };
    }
};

/**
 * Verify PAN using Surepass
 * @param {string} panNumber - PAN number to verify
 * @returns {Promise<Object>} Verification result
 */
export const verifyPAN = async (panNumber) => {
    try {
        const { apiToken } = getSurepassCredentials();

        if (!apiToken) {
            throw new Error('Surepass API credentials not configured.');
        }

        // Validate PAN format
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panNumber)) {
            return {
                success: false,
                error: 'Invalid PAN format. PAN should be 10 characters (e.g., ABCDE1234F)'
            };
        }

        console.log(`🔍 Verifying PAN: ${panNumber}`);

        const surepassClient = getSurepassClient();

        // Surepass PAN Verification API endpoint
        const response = await surepassClient.post('/api/v1/pan/verification', {
            id_number: panNumber
        });

        console.log('✅ PAN verification response:', response.data);

        if (response.data && response.data.success) {
            const panData = response.data.data;

            return {
                success: true,
                verified: true,
                data: {
                    panNumber: panData.pan_number || panNumber,
                    name: panData.full_name || panData.name,
                    category: panData.category,
                    status: panData.status || 'Valid',
                    verifiedAt: new Date().toISOString()
                }
            };
        } else {
            return {
                success: false,
                verified: false,
                error: response.data?.message || 'PAN verification failed'
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

export default {
    initiateDigilockerLink,
    checkDigilockerStatus,
    fetchAadhaarDetails,
    verifyPAN
};

