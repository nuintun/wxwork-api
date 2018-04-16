/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import { BASE_URL } from './const';
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

  options = Object.assign({ responseType: 'json' }, options, { baseURL: BASE_URL });
  options.params = Object.assign({}, options.params, { access_token: accessToken });

  return options;
}
