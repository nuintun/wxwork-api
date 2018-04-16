/**
 * @module wxwork-api
 * @author nuintun
 * @license MIT
 * @version 0.0.7
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

// Access token cache
const ACCESS_TOKEN_CACHE = new Map();

/**
 * @class AccessToken
 */
class AccessToken {
  /**
   * @constructor
   * @param {string} corpId
   * @param {string} corpSecret
   */
  constructor(corpId, corpSecret) {
    this.corpId = corpId;
    this.corpSecret = corpSecret;

    // Cache key
    const uid = `${corpId}-${corpSecret}`;

    /**
     * @function fetch
     */
    const fetch = async () => {
      if (ACCESS_TOKEN_CACHE.has(uid)) {
        const cached = ACCESS_TOKEN_CACHE.get(uid);

        // Access token is not expired
        if (!this.isExpired(cached.expires)) {
          return cached.token;
        }
      }

      // Get access token
      const response = await this.fetchAccessToken(uid);
      // Get response data
      const data = response.data;

      // Get access token success
      if (data.errcode === 0) {
        ACCESS_TOKEN_CACHE.set(uid, {
          token: data.access_token,
          expires: Date.now() + data.expires_in * 1000
        });

        return data.access_token;
      }

      // Get access token error
      const error = new Error(data.errmsg);

      error.name = API_ERROR;
      error.code = data.errcode;

      throw error;
    };

    return fetch();
  }

  /**
   * @static
   * @function refreshAccessToken
   * @param {string} corpId
   * @param {string} corpSecret
   * @returns {string}
   */
  static async refreshAccessToken(corpId, corpSecret) {
    // Cache key
    const uid = `${corpId}-${corpSecret}`;

    // Delete cache
    ACCESS_TOKEN_CACHE.delete(uid);

    // Refresh access token
    return await new AccessToken(corpId, corpSecret);
  }

  /**
   * @method isExpired
   * @param {number} expires
   * @returns {boolean}
   */
  isExpired(expires) {
    return Date.now() >= expires;
  }

  /**
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
}

/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @function configure
 * @param {string} corpId
 * @param {string} corpSecret
 * @param {any} options
 * @returns {Object}
 */
async function configure(corpId, corpSecret, options) {
  const accessToken = await new AccessToken(corpId, corpSecret);

  options = Object.assign({ responseType: 'json' }, options, { baseURL: BASE_URL });
  options.params = Object.assign({}, options.params, { access_token: accessToken });

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
  constructor(corpId, corpSecret) {
    this.corpId = corpId;
    this.corpSecret = corpSecret;
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

    // Set params
    options.params = params;
    // Configure options
    options = await configure(corpId, corpSecret, options);

    // GET
    const response = await axios.get(url, options);

    // Access token is expired
    if (response.data.errcode === 42001) {
      options.params.access_token = await AccessToken.refreshAccessToken(corpId, corpSecret);

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

    // Configure options
    options = await configure(corpId, corpSecret, options);

    // POST
    const response = await axios.post(url, data, options);

    // Access token is expired
    if (response.data.errcode === 42001) {
      options.params.access_token = await AccessToken.refreshAccessToken(corpId, corpSecret);

      // Refresh
      return await axios.post(url, data, options);
    }

    return response;
  }
}

module.exports = WXWork;
