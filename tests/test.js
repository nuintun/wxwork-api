/**
 * @module test
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

const WXWork = require('../index');

// Access token cache
const ACCESS_TOKEN_CACHE = new Map();

const api = new WXWork('corpId', 'corpSecret', {
  setAccessToken: (...rest) => ACCESS_TOKEN_CACHE.set(...rest),
  getAccessToken: (...rest) => ACCESS_TOKEN_CACHE.get(...rest)
});

async function fetch(params) {
  try {
    const response = await api.get('user/get', { userid: 'nuintun' });

    console.log(response.data);
  } catch (error) {
    return console.error(error);
  }
}

fetch();
