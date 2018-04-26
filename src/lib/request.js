/**
 * @module request
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

import agent from './agent';

/**
 * @class Request
 */
export default class Request {
  /**
   * @method getAccessToken
   * @returns {Promise}
   */
  async getAccessToken() {
    throw new Error('Method getAccessToken not implemented');
  }

  /**
   * @method refreshAccessToken
   * @returns {Promise}
   */
  async refreshAccessToken() {
    throw new Error('Method refreshAccessToken not implemented');
  }

  /**
   * @function request
   * @param {string} url
   * @param {Object} options
   * @returns {Promise}
   */
  async request(url, options = {}) {
    options.url = url;
    options.params = Object.assign(options.params || {}, {
      access_token: await this.getAccessToken()
    });

    // Fetch
    const response = await agent.request(options);
    // Get data
    const data = response.data;

    // Access token is expired
    if (data && data.errcode === 42001) {
      // Refresh access token
      options.params.access_token = await this.refreshAccessToken();

      // Refetch
      return await agent.request(options);
    }

    // Response
    return response;
  }
}
