/**
 * @module test
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

const WXWork = require('../index');

const api = new WXWork('aa', 'bb', 0);

async function fetch(params) {
  try {
    await api.get('user/get', { userid: '0' });
  } catch (error) {
    console.error(error);
  }
}

fetch();
