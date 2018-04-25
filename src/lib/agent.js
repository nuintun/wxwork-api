/**
 * @module agent
 * @author nuintun
 * @license MIT
 * @version 2018/04/25
 */

import axios from 'axios';

/**
 * @namespace agent
 */
export default axios.create({ baseURL: 'https://qyapi.weixin.qq.com/cgi-bin', maxContentLength: 20 * 1024 * 1024 });
