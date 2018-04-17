/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import axios from 'axios';
import { API_ERROR, BASE_URL } from './const';

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
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;

    // GET
    return await axios.get('gettoken', {
      baseURL: BASE_URL,
      responseType: 'json',
      params: { corpid: corpId, corpsecret: corpSecret }
    });
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
    return await this.refreshAccessToken();
  }

  /**
   * @method refreshAccessToken
   * @returns {Promise}
   */
  async refreshAccessToken() {
    // Get access token
    const response = await this.fetchAccessToken();
    // Get response data
    const data = response.data;

    // Set Cache
    if (data.errcode === 0) {
      const token = data.access_token;
      const expires = Date.now() + data.expires_in * 1000;
      const options = this.options;

      await options.setAccessToken(this.key, Object.freeze({ token, expires }));

      return token;
    }

    // Get access token error
    const error = new Error(data.errmsg);

    error.name = API_ERROR;
    error.code = data.errcode;

    throw error;
  }
}
