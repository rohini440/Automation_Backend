const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT authentication token
 * @param {string} id - The user ID
 * @returns {string} - Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = generateToken;
