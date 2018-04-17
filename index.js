/**
 * @module wxwork-api
 * @author nuintun
 * @license MIT
 * @version 0.0.8
 * @description WXWork API for the node.js.
 * @see https://github.com/nuintun/wxwork-api#readme
 */

'use strict';

const axios = require('axios');

/**
 * @module const
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

const API_ERROR = 'WXWorkAPIError';
const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin/';

/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
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

/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @function configure
 * @param {AccessToken} accessToken
 * @param {any} options
 * @returns {Promise}
 */
async function configure(accessToken, options) {
  options = Object.assign({ responseType: 'json' }, options, { baseURL: BASE_URL });
  options.params = Object.assign({}, options.params, { access_token: await accessToken.getAccessToken() });

  return options;
}

/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

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
    this.corpId = corpId;
    this.corpSecret = corpSecret;
    this.accessToken = new AccessToken(corpId, corpSecret, options);
  }

  /**
   * @method get
   * @param {string} url
   * @param {any} options
   * @returns {Promise}
   */
  async get(url, params = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Set params
    options.params = params;
    // Configure options
    options = await configure(accessToken, options);

    // GET
    const response = await axios.get(url, options);

    // Access token is expired
    if (response.data.errcode === 42001) {
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refresh
      return await axios.get(url, options);
    }

    return response;
  }

  /**
   * @method post
   * @param {string} url
   * @param {any} data
   * @param {any} options
   * @returns {Promise}
   */
  async post(url, data = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Configure options
    options = await configure(accessToken, options);

    // POST
    const response = await axios.post(url, data, options);

    // Access token is expired
    if (response.data.errcode === 42001) {
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refresh
      return await axios.post(url, data, options);
    }

    return response;
  }
}

module.exports = WXWork;
