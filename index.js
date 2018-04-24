/**
 * @module wxwork-api
 * @author nuintun
 * @license MIT
 * @version 0.1.2
 * @description WXWork API for the node.js.
 * @see https://github.com/nuintun/wxwork-api#readme
 */

'use strict';

const url = require('url');
const typer = require('media-typer');
const fetch = require('node-fetch');

/**
 * @module constants
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

const ACCESS_ERROR = 'WXWorkAccessError';
const BASE_URL = 'https://qyapi.weixin.qq.com/cgi-bin/';

/**
 * @module url
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @function resolveURL
 * @param {string} relativeURL
 * @param {string|Object} params
 */
function resolveURL(relativeURL, params) {
  params = new url.URLSearchParams(params);

  if (typeof relativeURL === 'string') {
    const hasSearchParams = relativeURL.indexOf('?') !== -1;

    relativeURL = `${relativeURL}${hasSearchParams ? '&' : '?'}${params}`;

    return url.resolve(BASE_URL, relativeURL);
  }

  return `${BASE_URL}?${params}`;
}

/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @function jsonTyper
 * @param {Headers} headers
 * @returns {boolean}
 */
function jsonTyper(headers) {
  if (headers.has('Content-Type')) {
    const media = headers.get('Content-Type');
    const { subtype } = typer.parse(media);

    return subtype === 'json';
  }

  return false;
}

/**
 * @module fetch
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

const { Headers } = fetch;

/**
 * @function fetch
 * @param {string} url
 * @param {Object} options
 * @returns {ReadableStream|Object}
 */
const fetch$1 = async (url$$1, options = {}) => {
  options.headers = new Headers(options.headers);

  // Default send json
  if (!options.headers.has('Content-Type')) {
    options.headers.append('Content-Type', 'application/json');
  }

  // Serialize body
  if (options.hasOwnProperty('body') && jsonTyper(options.headers)) {
    options.body = JSON.stringify(options.body);
  }

  // Fetch
  return fetch(resolveURL(url$$1, options.params), options);
};

/**
 * @module request
 * @author nuintun
 * @license MIT
 * @version 2018/04/24
 */

/**
 * @function request
 * @param {string} url
 * @param {Object} options
 * @param {AccessToken} accessToken
 * @returns {Response}
 */
async function request(url$$1, options, accessToken) {
  // Set access token
  options.params = Object.assign(options.params || {}, {
    access_token: await accessToken.getAccessToken()
  });

  // Fetch
  const response = await fetch$1(url$$1, options);

  // JSON response
  if (jsonTyper(response.headers)) {
    const clone = response.clone();
    const data = await response.json();

    // Access token is expired
    if (data.errcode === 42001) {
      // Refresh access token
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refetch
      return fetch$1(url$$1, options);
    }

    // Response
    return clone;
  }

  // Response
  return response;
}

/**
 * @module access-token
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @class AccessToken
 */
class AccessToken {
  /**
   * @constructor
   * @param {string} corpId
   * @param {string} corpSecret
   * @param {Object} options
   * @param {Function} options.setAccessTokenCache
   * @param {Function} options.getAccessTokenCache
   */
  constructor(corpId, corpSecret, options) {
    if (typeof options.setAccessToken !== 'function') {
      throw new TypeError('The options.setAccessToken must be a function');
    }

    if (typeof options.getAccessToken !== 'function') {
      throw new TypeError('The options.getAccessToken must be a function');
    }

    this.corpId = corpId;
    this.corpSecret = corpSecret;
    this.options = options;
    this.key = `${corpId}-${corpSecret}`;
  }

  /**
   * @private
   * @method isExpired
   * @param {number} expires
   * @returns {boolean}
   */
  isExpired(expires) {
    return Date.now() >= expires;
  }

  /**
   * @private
   * @method fetchAccessToken
   * @returns {Promise}
   */
  async fetchAccessToken() {
    const corpid = this.corpId;
    const corpsecret = this.corpSecret;

    // GET
    const response = await fetch$1('gettoken', { params: { corpid, corpsecret } });

    // Get data
    return response.json();
  }

  /**
   * @method getAccessToken
   * @returns {Promise}
   */
  async getAccessToken() {
    const options = this.options;
    const cached = await options.getAccessToken(this.key);

    // Hit cache
    if (cached) {
      // Access token is not expired
      if (!this.isExpired(cached.expires)) {
        return cached.token;
      }
    }

    // Refresh access token
    return this.refreshAccessToken();
  }

  /**
   * @method refreshAccessToken
   * @returns {Promise}
   */
  async refreshAccessToken() {
    // Get access token
    const response = await this.fetchAccessToken();

    // Set Cache
    if (response.errcode === 0) {
      const token = response.access_token;
      const expires = Date.now() + response.expires_in * 1000;

      // Call set cache method
      await this.options.setAccessToken(this.key, Object.freeze({ token, expires }));

      return token;
    }

    // Get access token error
    const error = new Error(response.errmsg);

    error.name = ACCESS_ERROR;
    error.code = response.errcode;

    throw error;
  }
}

/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @class WXWork
 */
class WXWork {
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
  async get(url$$1, params = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Configure options
    options.method = 'GET';
    options.params = params;

    // Remove body
    delete options.body;

    // GET
    return request(url$$1, options, accessToken);
  }

  /**
   * @method post
   * @param {string} url
   * @param {any} data
   * @param {any} options
   * @returns {Promise}
   */
  async post(url$$1, data = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Configure options
    options.method = 'POST';
    options.body = data;

    // POST
    return request(url$$1, options, accessToken);
  }
}

module.exports = WXWork;
