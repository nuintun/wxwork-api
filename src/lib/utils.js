/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

import AccessToken from './access-token';

/**
 * @function configure
 * @param {string} corpId
 * @param {string} corpSecret
 * @param {any} options
 * @returns {Object}
 */
export async function configure(corpId, corpSecret, options) {
  const accessToken = await new AccessToken(corpId, corpSecret);

  options = Object.assign({ baseURL: BASE_URL, responseType: 'json' }, options);
  options.data = Object.assign({ access_token: accessToken }, options.data);

  return options;
}
