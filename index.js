/**
 * @module wxwork-api
 * @author nuintun
 * @license MIT
 * @version 0.2.0
 * @description WXWork API for the node.js.
 * @see https://github.com/nuintun/wxwork-api#readme
 */

'use strict';

const axios = require('axios');

/**
 * @module agent
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

/**
 * @namespace agent
 */
const agent = axios.create({ baseURL: 'https://qyapi.weixin.qq.com/cgi-bin', maxContentLength: 20 * 1024 * 1024 });

/**
 * @module request
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

/**
 * @function request
 * @param {string} url
 * @param {AccessToken} accessToken
 * @param {Object} options
 * @returns {Promise}
 */
async function request(url, accessToken, options = {}) {
  options.url = url;
  options.params = Object.assign(options.params || {}, {
    access_token: await accessToken.getAccessToken()
  });

  // Fetch
  const response = await agent.request(options);
  // Get data
  const data = response.data;

  // Access token is expired
  if (data && data.errcode === 42001) {
    // Refresh access token
    options.params.access_token = await accessToken.refreshAccessToken();

    // Refetch
    return await agent.request(options);
  }

  // Response
  return response;
}

/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

/**
 * @class AccessToken
 */
class AccessToken {
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

/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

// Access token symbol
const ACCESS_TOKEN = Symbol('AccessToken');

/**
 * @class WXWork
 */
class WXWork {
  /**
   * @constructor
   * @param {string} corpId
   * @param {string} corpSecret
   */
  constructor(corpId, corpSecret, options) {
    this[ACCESS_TOKEN] = new AccessToken(corpId, corpSecret, options);
  }

  /**
   * @method getAccessToken
   * @returns {Promise}
   */
  getAccessToken() {
    return this[ACCESS_TOKEN].getAccessToken();
  }

  /**
   * @method get
   * @param {string} url
   * @param {any} options
   * @returns {Promise}
   */
  get(url, params = {}, options = {}) {
    // Configure options
    options = Object.assign(options, { method: 'GET', params });

    // GET
    return request(url, this[ACCESS_TOKEN], options);
  }

  /**
   * @method post
   * @param {string} url
   * @param {any} data
   * @param {any} options
   * @returns {Promise}
   */
  async post(url, data = {}, options = {}) {
    // Configure options
    options = Object.assign(options, { method: 'POST', data });

    // POST
    return request(url, this[ACCESS_TOKEN], options);
  }
}

module.exports = WXWork;
