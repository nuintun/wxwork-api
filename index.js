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
      url: `gettoken?corpid=${corpId}&corpsecret=${corpSecret}`,
      baseURL: `https://qyapi.weixin.qq.com/cgi-bin/`,
      responseType: 'json'
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
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

class WXWork {
  constructor(corpId, corpsecret, appId) {
    this.corpId = corpId;
    this.corpsecret = corpsecret;
    this.appId = appId;

    const getAccessToken = async () => {
      console.log(await new AccessToken(corpId, corpsecret));
    };

    getAccessToken().catch(error => console.error(error));
  }
}

module.exports = WXWork;
