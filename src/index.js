/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import axios from 'axios';
import { configure } from './lib/utils';
import AccessToken from './lib/access-token';

/**
 * @class WXWork
 */
export default class WXWork {
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
      options.access_token = await AccessToken.refreshAccessToken(corpId, corpSecret);

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
      options.access_token = await AccessToken.refreshAccessToken(corpId, corpSecret);

      // Refresh
      return await axios.post(url, data, options);
    }

    return response;
  }
}
