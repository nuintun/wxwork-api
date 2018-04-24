/**
 * @module request
 * @author nuintun
 * @license MIT
 * @version 2018/04/24
 */

import fetch from './fetch';
import { jsonTyper } from './utils';

/**
 * @function request
 * @param {string} url
 * @param {Object} options
 * @param {AccessToken} accessToken
 * @returns {Response}
 */
export default async function request(url, options, accessToken) {
  // Set access token
  options.params = Object.assign(options.params || {}, {
    access_token: await accessToken.getAccessToken()
  });

  // Fetch
  const response = await fetch(url, options);

  // JSON response
  if (jsonTyper(response.headers)) {
    const clone = response.clone();
    const data = await response.json();

    // Access token is expired
    if (data.errcode === 42001) {
      // Refresh access token
      options.params.access_token = await accessToken.refreshAccessToken();

      // Refetch
      return fetch(url, options);
    }

    // Response
    return clone;
  }

  // Response
  return response;
}
