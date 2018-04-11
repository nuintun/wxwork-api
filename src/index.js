/**
 * @module index
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

import AccessToken from './lib/access-token';

export default class WXWork {
  constructor(corpId, corpsecret, appId) {
    this.corpId = corpId;
    this.corpsecret = corpsecret;
    this.appId = appId;

    const getAccessToken = async () => {
      console.log(await new AccessToken(corpId, corpsecret));
    };

    getAccessToken().catch(error => console.error(error));
  }
}
