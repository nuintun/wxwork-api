/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
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

    options.params = params;
    options = await configure(corpId, corpSecret, options);

    const response = await axios.get(url, options);

    if (response.data.errcode === 42001) {
      options.access_token = await AccessToken.refreshAccessToken(corpId, corpSecret);

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
  async post(url, data, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;

    options = await configure(corpId, corpSecret, options);

    const response = await axios.post(url, data, options);

    if (response.data.errcode === 42001) {
      options.access_token = await AccessToken.refreshAccessToken(corpId, corpSecret);

      return await axios.post(url, data, options);
    }

    return response;
  }
}
