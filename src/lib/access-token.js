/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

import agent from './agent';

/**
 * @class AccessToken
 */
export default class AccessToken {
  /**
   * @constructor
   * @param {string} corpId
   * @param {string} corpSecret
   * @param {Object} options
   * @param {Function} options.setAccessTokenCache
   * @param {Function} options.getAccessTokenCache
   */
  constructor(corpId, corpSecret, options) {
    if (typeof options.setAccessToken !== 'function') {
      throw new TypeError('The options.setAccessToken must be a function');
    }

    if (typeof options.getAccessToken !== 'function') {
      throw new TypeError('The options.getAccessToken must be a function');
    }

    this.corpId = corpId;
    this.corpSecret = corpSecret;
    this.options = options;
    this.key = `${corpId}-${corpSecret}`;
  }

  /**
   * @private
   * @method isExpired
   * @param {number} expires
   * @returns {boolean}
   */
  isExpired(expires) {
    return Date.now() >= expires;
  }

  /**
   * @private
   * @method fetchAccessToken
   * @returns {Promise}
   */
  async fetchAccessToken() {
    const corpid = this.corpId;
    const corpsecret = this.corpSecret;

    // GET
    const response = await agent.get('gettoken', { params: { corpid, corpsecret } });

    // Get data
    return response.data;
  }

  /**
   * @method getAccessToken
   * @returns {Promise}
   */
  async getAccessToken() {
    const options = this.options;
    const cached = await options.getAccessToken(this.key);

    // Hit cache
    if (cached) {
      // Access token is not expired
      if (!this.isExpired(cached.expires)) {
        return cached.token;
      }
    }

    // Refresh access token
    return this.refreshAccessToken();
  }

  /**
   * @method refreshAccessToken
   * @returns {Promise}
   */
  async refreshAccessToken() {
    // Get access token
    const response = await this.fetchAccessToken();

    // Set Cache
    if (response.errcode === 0) {
      const token = response.access_token;
      const expires = Date.now() + response.expires_in * 1000;

      // Call set cache method
      await this.options.setAccessToken(this.key, Object.freeze({ token, expires }));

      return token;
    }

    // Get access token error
    const error = new Error(response.errmsg);

    error.name = 'WXWorkAccessError';
    error.code = response.errcode;

    throw error;
  }
}
