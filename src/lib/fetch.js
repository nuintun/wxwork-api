/**
 * @module fetch
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import fetch from 'node-fetch';
import { resolveURL } from './url';
import { jsonTyper } from './utils';

const { Headers } = fetch;

/**
 * @function fetch
 * @param {string} url
 * @param {Object} options
 * @returns {ReadableStream|Object}
 */
export default (url, options = {}) => {
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
  return fetch(resolveURL(url, options.params), options);
};
