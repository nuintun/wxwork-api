/**
 * @module url
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import { BASE_URL } from './constants';
import { resolve, URLSearchParams } from 'url';

/**
 * @function resolveURL
 * @param {string} relativeURL
 * @param {string|Object} params
 */
export function resolveURL(relativeURL, params) {
  params = new URLSearchParams(params);

  if (typeof relativeURL === 'string') {
    const hasSearchParams = relativeURL.indexOf('?') !== -1;

    relativeURL = `${relativeURL}${hasSearchParams ? '&' : '?'}${params}`;

    return resolve(BASE_URL, relativeURL);
  }

  return `${BASE_URL}?${params}`;
}
