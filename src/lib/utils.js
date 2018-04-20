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
export async function setAccessToken(options = {}, accessToken) {
  options.params = Object.assign(options.params || {}, {
    access_token: await accessToken.getAccessToken()
  });

  return options;
}
