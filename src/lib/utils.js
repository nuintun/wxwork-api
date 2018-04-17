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
 * @param {AccessToken} accessToken
 * @param {any} options
 * @returns {Promise}
 */
export async function configure(accessToken, options) {
  options = Object.assign({ responseType: 'json' }, options, { baseURL: BASE_URL });
  options.params = Object.assign({}, options.params, { access_token: await accessToken.getAccessToken() });

  return options;
}
