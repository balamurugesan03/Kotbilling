







const crypto = require('crypto');
const AggregatorConfig = require('../models/AggregatorConfig');

/**
 * Verify HMAC-SHA256 signature from Swiggy/Zomato webhooks
 * @param {string} platform - 'swiggy' or 'zomato'
 * @param {Buffer} rawBody - Raw request body
 * @param {string} signature - Signature from request header
 * @returns {Promise<boolean>}
 */
const verifyWebhookSignature = async (platform, rawBody, signature) => {
  if (!signature || !rawBody) {
    return false;
  }

  const config = await AggregatorConfig.findOne({ platform });
  if (!config || !config.webhookSecret) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Extract signature from platform-specific headers
 * @param {Object} headers - Request headers
 * @param {string} platform - 'swiggy' or 'zomato'
 * @returns {string|null}
 */
const getSignatureFromHeaders = (headers, platform) => {
  if (platform === 'swiggy') {
    return headers['x-swiggy-signature'] || headers['x-webhook-signature'] || null;
  }
  if (platform === 'zomato') {
    return headers['x-zomato-signature'] || headers['x-webhook-signature'] || null;
  }
  return null;
};

module.exports = {
  verifyWebhookSignature,
  getSignatureFromHeaders
};
