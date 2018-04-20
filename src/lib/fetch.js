/**
 * @module fetch
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import fetch from 'node-fetch';
import { resolveURL } from './url';

/**
 * @function fetch
 * @param {string} url
 * @param {Object} options
 * @returns {ReadableStream|Object}
 */
export default async (url, options = {}) => {
  const response = await fetch(resolveURL(url, options.params), options);
  const contentType = response.headers.get('Content-Type');

  // JSON
  if (/^application\/json;/i.test(contentType)) {
    return await response.json();
  }

  // Readable
  return response.body;
};
