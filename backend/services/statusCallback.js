const AggregatorConfig = require('../models/AggregatorConfig');

// Platform API endpoint stubs - replace with real Swiggy/Zomato Partner API URLs
const PLATFORM_ENDPOINTS = {
  swiggy: {
    accept: '/api/v1/orders/{orderId}/accept',
    ready: '/api/v1/orders/{orderId}/ready',
    pickedUp: '/api/v1/orders/{orderId}/picked-up',
    cancel: '/api/v1/orders/{orderId}/cancel',
    menuSync: '/api/v1/menu/sync'
  },
  zomato: {
    accept: '/api/v1/orders/{orderId}/accept',
    ready: '/api/v1/orders/{orderId}/food-ready',
    pickedUp: '/api/v1/orders/{orderId}/picked-up',
    cancel: '/api/v1/orders/{orderId}/cancel',
    menuSync: '/api/v1/menu/push'
  }
};

/**
 * Map internal order status to platform status action
 */
const STATUS_ACTION_MAP = {
  preparing: 'accept',
  ready: 'ready',
  completed: 'pickedUp',
  cancelled: 'cancel'
};

/**
 * Fire-and-forget status notification to platform
 * @param {string} platform - 'swiggy' or 'zomato'
 * @param {string} platformOrderId - Platform's order ID
 * @param {string} status - Internal order status
 * @param {Object} [extraData] - Additional data (prep time, cancel reason, etc.)
 */
const notifyPlatformStatus = async (platform, platformOrderId, status, extraData = {}) => {
  try {
    const config = await AggregatorConfig.findOne({ platform });
    if (!config || !config.isEnabled || !config.platformBaseUrl) {
      console.log(`[StatusCallback] Skipping notification - ${platform} not configured/enabled`);
      return { success: false, reason: 'not_configured' };
    }

    const action = STATUS_ACTION_MAP[status];
    if (!action) {
      console.log(`[StatusCallback] No action mapped for status: ${status}`);
      return { success: false, reason: 'unmapped_status' };
    }

    const endpoints = PLATFORM_ENDPOINTS[platform];
    if (!endpoints || !endpoints[action]) {
      return { success: false, reason: 'no_endpoint' };
    }

    const url = `${config.platformBaseUrl}${endpoints[action].replace('{orderId}', platformOrderId)}`;

    const payload = {
      order_id: platformOrderId,
      status: action,
      timestamp: new Date().toISOString(),
      ...extraData
    };

    if (action === 'accept' && config.defaultPrepTime) {
      payload.preparation_time = config.defaultPrepTime;
    }

    // Fire-and-forget HTTP call
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'X-Store-Id': config.storeId
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    }).then(res => {
      console.log(`[StatusCallback] ${platform} ${action} for ${platformOrderId}: ${res.status}`);
    }).catch(err => {
      console.error(`[StatusCallback] ${platform} ${action} failed:`, err.message);
    });

    return { success: true, action };
  } catch (error) {
    console.error(`[StatusCallback] Error:`, error.message);
    return { success: false, reason: 'error', error: error.message };
  }
};

/**
 * Test connection to platform API
 */
const testPlatformConnection = async (platform) => {
  try {
    const config = await AggregatorConfig.findOne({ platform });
    if (!config || !config.apiKey) {
      return { connected: false, message: 'Missing API credentials' };
    }

    // Stub: In production, call the platform's health/auth endpoint
    // For now, just validate that credentials are present
    const hasCredentials = config.apiKey && config.storeId;

    await AggregatorConfig.updateOne(
      { platform },
      { connectionStatus: hasCredentials ? 'connected' : 'error' }
    );

    return {
      connected: hasCredentials,
      message: hasCredentials ? 'Credentials configured' : 'Missing store ID or API key'
    };
  } catch (error) {
    return { connected: false, message: error.message };
  }
};

module.exports = {
  notifyPlatformStatus,
  testPlatformConnection,
  PLATFORM_ENDPOINTS
};
