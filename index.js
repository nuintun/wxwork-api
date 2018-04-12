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
const cluster = require('cluster');

/**
 * @module const
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

const API_ERROR = 'WXWorkAPIError';
const CLUSTER_CMD = { ACCESS_TOKEN: 'access-token' };
const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin/';

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

    /**
     * @function fetch
     */
    const fetch = async () => {
      if (ACCESS_TOKEN_CACHE.has(uid)) {
        const cached = ACCESS_TOKEN_CACHE.get(uid);

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

    return await axios.get('gettoken', {
      baseURL: BASE_URL,
      responseType: 'json',
      params: { corpid: corpId, corpsecret: corpSecret }
    });
  }
}

if (cluster.isMaster) {
  cluster.on('message', async (worker, message) => {
    const cmd = message.cmd;

    switch (message.cmd) {
      case CLUSTER_CMD.ACCESS_TOKEN:
        const data = message.data;
        const corpId = data.corpId;
        const corpSecret = data.corpSecret;

        worker.send({ cmd, data: await new AccessToken(corpId, corpSecret) });
        break;
    }
  });
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
async function configure(corpId, corpSecret, options = {}) {
  const accessToken = cluster.isMaster
    ? await new AccessToken(corpId, corpSecret)
    : await new Promise((resolve, reject) => {
        process.once('message', message => {
          const cmd = message.cmd;

          switch (message.cmd) {
            case CLUSTER_CMD.ACCESS_TOKEN:
              resolve(message.data);
              break;
          }
        });

        process.send({
          cmd: CLUSTER_CMD.ACCESS_TOKEN,
          data: { corpId, corpSecret }
        });
      });

  options = Object.assign(options, { baseURL: BASE_URL, responseType: 'json' });
  options.params = Object.assign(options.params || {}, { access_token: accessToken });

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
  async get(url, params = {}, options) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;

    options = await configure(corpId, corpSecret, options);
    options.params = Object.assign(params, options.params);

    return await axios.get(url, options);
  }

  /**
   * @method post
   * @param {string} url
   * @param {Object} data
   * @param {any} options
   * @returns {Promise}
   */
  async post(url, data = {}, options) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;

    options = await configure(corpId, corpSecret, options);
    options.data = Object.assign(data, options.data);

    return await axios.post(url, data, options);
  }
}

module.exports = WXWork;