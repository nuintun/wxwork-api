/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

import cluster from 'cluster';
import AccessToken from './access-token';
import { CLUSTER_CMD, BASE_URL } from './const';

/**
 * @function configure
 * @param {string} corpId
 * @param {string} corpSecret
 * @param {any} options
 * @returns {Object}
 */
export async function configure(corpId, corpSecret, options = {}) {
  const accessToken = cluster.isMaster
    ? await new AccessToken(corpId, corpSecret)
    : await new Promise((resolve, reject) => {
        process.once('message', message => {
          const cmd = message.cmd;

          switch (message.cmd) {
            case CLUSTER_CMD.ACCESS_TOKEN:
              resolve(message.data);
              break;
          }
        });

        process.send({
          cmd: CLUSTER_CMD.ACCESS_TOKEN,
          data: { corpId, corpSecret }
        });
      });

  options = Object.assign(options, { baseURL: BASE_URL, responseType: 'json' });
  options.params = Object.assign(options.params || {}, { access_token: accessToken });

  return options;
}
