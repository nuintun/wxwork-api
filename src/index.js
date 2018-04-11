/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

import axios from 'axios';
import { configure } from './lib/utils';

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

    return await axios.post(url, data, options);
  }
}
