/**
 * @module wxwork-api
 * @author nuintun
 * @license MIT
 * @version 0.1.1
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
 * @module fetch
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

const { Headers } = fetch;

/**
 * @function jsonTyper
 * @param {string} media
 * @returns {boolean}
 */
function jsonTyper(media) {
  if (media) {
    const { subtype } = typer.parse(media);

    return subtype === 'json';
  }

  return false;
}

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
  if (options.hasOwnProperty('body') && jsonTyper(options.headers.get('Content-Type'))) {
    options.body = JSON.stringify(options.body);
  }

  // Fetch
  const response = await fetch(resolveURL(url$$1, options.params), options);

  // Headers
  const headers = Object.create(null);

  // Delete Connection
  response.headers.delete('Connection');
  // Delete Content-Length
  response.headers.delete('Content-Length');
  // Get headers
  response.headers.forEach((value, key) => {
    headers[key.replace(/(^|-)[a-z]/g, matched => matched.toUpperCase())] = value;
  });

  // JSON
  if (jsonTyper(response.headers.get('Content-Type'))) {
    return { headers, data: await response.json(), json: true };
  }

  // Readable
  return { headers, data: response.body, json: false };
};

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
    return response.data;
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
    return await this.refreshAccessToken();
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
      const options = this.options;

      // Call set cache method
      await options.setAccessToken(this.key, Object.freeze({ token, expires }));

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
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

/**
 * @function setAccessToken
 * @param {any} options
 * @param {AccessToken} accessToken
 * @returns {Promise}
 */
async function setAccessToken(options = {}, accessToken) {
  options.params = Object.assign(options.params || {}, {
    access_token: await accessToken.getAccessToken()
  });

  return options;
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
    options = await setAccessToken(options, accessToken);

    // GET
    const response = await fetch$1(url$$1, options);

    // Access token is expired
    if (response.json && response.data.errcode === 42001) {
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refresh
      return await fetch$1(url$$1, options);
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
  async post(url$$1, data = {}, options = {}) {
    const corpId = this.corpId;
    const corpSecret = this.corpSecret;
    const accessToken = this.accessToken;

    // Configure options
    options.method = 'POST';
    options.body = data;
    options = await setAccessToken(options, accessToken);

    // POST
    const response = await fetch$1(url$$1, options);

    // Access token is expired
    if (response.json && response.data.errcode === 42001) {
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refresh
      return await fetch$1(url$$1, options);
    }

    return response;
  }
}

module.exports = WXWork;
