/**
 * @module wxwork-api
 * @author nuintun
 * @license MIT
 * @version 0.0.0
 * @description WXWork API for the node.js.
 * @see https://github.com/nuintun/wxwork-api#readme
 */

'use strict';

const axios = require('axios');

/**
 * @module const
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

const BASE_URL$1 = 'https://qyapi.weixin.qq.com/cgi-bin/';

/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
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

    const uid = `${corpId}-${corpSecret}`;

    const fetch = async () => {
      if (ACCESS_TOKEN_CACHE.has(uid)) {
        const cached = ACCESS_TOKEN_CACHE.get(uid);

        if (this.isExpired(cached.expires)) {
          return this.fetchAccessToken(uid);
        }

        return cached.token;
      }

      return this.fetchAccessToken(uid);
    };

    return fetch();
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
   * @param {string} uid
   * @returns {Promise}
   */
  async fetchAccessToken(uid) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;

    const response = await axios({
      baseURL: BASE_URL$1,
      responseType: 'json',
      url: `gettoken?corpid=${corpId}&corpsecret=${corpSecret}`
    });

    const data = response.data;

    if (data.errcode === 0) {
      ACCESS_TOKEN_CACHE.set(uid, {
        token: data.access_token,
        expires: Date.now() + data.expires_in * 1000
      });
    } else {
      const error = new Error(data.errmsg);

      error.code = data.errcode;
      error.name = 'WXWorkAPIError';

      throw error;
    }

    return data.access_token;
  }
}

/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
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

  options = Object.assign({ baseURL: BASE_URL, responseType: 'json' }, options);
  options.data = Object.assign({ access_token: accessToken }, options.data);

  return options;
}

/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
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
  async get(url, options) {
    options = await configure(options);

    return await axios.get(url, options);
  }

  /**
   * @method post
   * @param {string} url
   * @param {any} options
   * @returns {Promise}
   */
  async post(url, options) {
    options = await configure(options);

    return await axios.post(url, options);
  }
}

module.exports = WXWork;
