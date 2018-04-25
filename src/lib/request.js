/**
 * @module request
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

import agent from './agent';

/**
 * @function request
 * @param {string} url
 * @param {AccessToken} accessToken
 * @param {Object} options
 * @returns {Promise}
 */
export default async function request(url, accessToken, options = {}) {
  options.url = url;
  options.params = Object.assign(options.params || {}, {
    access_token: await accessToken.getAccessToken()
  });

  // Fetch
  const response = await agent.request(options);
  // Get data
  const data = response.data;

  // Access token is expired
  if (data && data.errcode === 42001) {
    // Refresh access token
    options.params.access_token = await accessToken.refreshAccessToken();

    // Refetch
    return await agent.request(options);
  }

  // Response
  return response;
}
