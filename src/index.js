/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

import request from './lib/request';
import AccessToken from './lib/access-token';

// Access token symbol
const ACCESS_TOKEN = Symbol('AccessToken');

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
    this[ACCESS_TOKEN] = new AccessToken(corpId, corpSecret, options);
  }

  /**
   * @method getAccessToken
   * @returns {Promise}
   */
  getAccessToken() {
    return this[ACCESS_TOKEN].getAccessToken();
  }

  /**
   * @method get
   * @param {string} url
   * @param {any} options
   * @returns {Promise}
   */
  get(url, params = {}, options = {}) {
    // Configure options
    options = Object.assign(options, { method: 'GET', params });

    // GET
    return request(url, this[ACCESS_TOKEN], options);
  }

  /**
   * @method post
   * @param {string} url
   * @param {any} data
   * @param {any} options
   * @returns {Promise}
   */
  async post(url, data = {}, options = {}) {
    // Configure options
    options = Object.assign(options, { method: 'POST', data });

    // POST
    return request(url, this[ACCESS_TOKEN], options);
  }
}
