import crypto from 'crypto';

/**
 * Generate a secure approval token
 * @returns {Object} { token, hashedToken, expiryTime }
 */
export const generateApprovalToken = () => {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage in database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 7 days
  const expiryTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  return {
    token,
    hashedToken,
    expiryTime
  };
};

/**
 * Verify an approval token
 * @param {String} token - The token to verify
 * @param {String} hashedTokenFromDB - The hashed token stored in database
 * @param {Date} tokenExpiry - The expiry date from database
 * @returns {Boolean} true if valid, false otherwise
 */
export const verifyApprovalToken = (token, hashedTokenFromDB, tokenExpiry) => {
  // Check if token has expired
  if (new Date() > tokenExpiry) {
    return false;
  }
  
  // Hash the provided token and compare
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  return hashedToken === hashedTokenFromDB;
};

/**
 * Generate a secure deactivation token
 * @returns {Object} { token, hashedToken, expiryTime }
 */
export const generateDeactivationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Token expires in 7 days
  const expiryTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  return {
    token,
    hashedToken,
    expiryTime
  };
};
