/**
 * @module test
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

const WXWork = require('../index');

const api = new WXWork('corpId', 'corpSecret');

async function fetch(params) {
  try {
    const response = await api.get('user/get', { userid: 'nuintun' });

    console.log(response.data);
  } catch (error) {
    return console.error(error);
  }
}

fetch();
