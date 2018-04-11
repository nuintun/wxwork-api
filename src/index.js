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
