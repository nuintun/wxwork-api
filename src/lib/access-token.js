/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

import axios from 'axios';
import { API_ERROR, BASE_URL } from './const';

// Access token cache
const ACCESS_TOKEN_CACHE = new Map();

/**
 * @class AccessToken
 */
export default class AccessToken {
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
   * @static
   * @function refreshAccessToken
   * @param {string} corpId
   * @param {string} corpSecret
   * @returns {string}
   */
  static async refreshAccessToken(corpId, corpSecret) {
    const uid = `${corpId}-${corpSecret}`;

    ACCESS_TOKEN_CACHE.delete(uid);

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

    return await axios.get('gettoken', {
      baseURL: BASE_URL,
      responseType: 'json',
      params: { corpid: corpId, corpsecret: corpSecret }
    });
  }
}
