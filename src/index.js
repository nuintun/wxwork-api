/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import fetch from './lib/fetch';
import AccessToken from './lib/access-token';
import { setAccessToken } from './lib/utils';

/**
 * @class WXWork
 */
export default class WXWork {
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

    // Configure options
    options.method = 'GET';
    options.params = params;
    options = await setAccessToken(options, accessToken);

    // GET
    const response = await fetch(url, options);

    // Access token is expired
    if (response.json && response.data.errcode === 42001) {
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refresh
      return await fetch(url, options);
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
    options.method = 'POST';
    options.body = data;
    options = await setAccessToken(options, accessToken);

    // POST
    const response = await fetch(url, options);

    // Access token is expired
    if (response.json && response.data.errcode === 42001) {
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refresh
      return await fetch(url, options);
    }

    return response;
  }
}
