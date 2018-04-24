/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import request from './lib/request';
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
  get(url, params = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Configure options
    options.method = 'GET';
    options.params = params;

    // Remove body
    delete options.body;

    // GET
    return request(url, options, accessToken);
  }

  /**
   * @method post
   * @param {string} url
   * @param {any} data
   * @param {any} options
   * @returns {Promise}
   */
  post(url, data = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Configure options
    options.method = 'POST';
    options.body = data;

    // POST
    return request(url, options, accessToken);
  }
}
