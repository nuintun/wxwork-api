/**
 * @module crypto
 * @author nuintun
 * @license MIT
 * @version 2018/04/11
 */

import crypto from 'crypto';

/**
 * @function PKCS7Decoder
 * @description AES算法 pkcs7 padding Decoder
 * @param {Buffer} buffer 需要解码的 Buffer
 * @returns {Buffer}
 */
function PKCS7Decoder(buffer) {
  const pad = buffer[buffer.length - 1];

  if (pad < 1 || pad > 32) {
    pad = 0;
  }

  return buffer.slice(0, buffer.length - pad);
}

/**
 * @function PKCS7Encoder
 * @description AES算法 pkcs7 padding Encoder
 * @param {Buffer} buffer 需要编码码的 Buffer
 * @returns {Buffer}
 */
function PKCS7Encoder(buffer) {
  const blockSize = 32;
  const size = buffer.length;
  const amountToPad = blockSize - size % blockSize;
  const pad = new Buffer(amountToPad - 1);

  pad.fill(String.fromCharCode(amountToPad));

  return Buffer.concat([buffer, pad]);
}

/**
 * @function initCrypto
 * @description 初始化AES解密的配置信息
 * @param {string} corpId 企业微信的 corpId，当为第三方套件回调事件时，corpId 的内容为 suiteId
 * @param {string} token 企业微信的 token，当为第三方套件回调事件时，token 的内容为套件的 token
 * @param {string} encodingAESKey 企业微信的 encodingAESKey，当为第三方套件回调事件时，encodingAESKey 的内容为套件的 encodingAESKey
 */
export function initCrypto(corpId, token, encodingAESKey) {
  const aesKey = new Buffer(`${encodingAESKey}=`, 'base64');

  this.crypotConfig = { corpId, token, aesKey, iv: aesKey.slice(0, 16) };
}

/**
 * @function rawSignature
 * @description 生成签名
 * @param {string|number} timestamp 时间戳
 * @param {string} nonce 随机串
 * @param {string} encrypt 加密的数据
 * @returns {string} 排好序的签名
 */
export function rawSignature(timestamp, nonce, encrypt) {
  const { token } = this.crypotConfig;
  const rawList = [token, timestamp, nonce];

  if (encrypt) rawList.push(encrypt);

  const raw = rawList.sort().join('');
  const sha1 = crypto.createHash('sha1');

  sha1.update(raw);

  return sha1.digest('hex');
}

/**
 * @function encrypt
 * @description 对给定的消息进行AES加密
 * @param {string} msg 需要加密的明文
 * @param {string} corpId 可选 需要对比的corpId，如果第三方回调时默认是suiteId，也可自行传入作为匹配处理
 * @returns {string} 加密后的结果
 */
export function encrypt(msg, corpId) {
  const { aesKey, iv } = this.crypotConfig;

  corpId = corpId || this.crypotConfig.corpId;

  msg = new Buffer(msg);

  const size = new Buffer(4);
  const random16 = crypto.pseudoRandomBytes(16);

  size.writeUInt32BE(msg.length, 0);

  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  const raw = Buffer.concat([random16, size, msg, new Buffer(corpId)]);
  const cipheredMsg = Buffer.concat([cipher.update(raw), cipher.final()]);

  return cipheredMsg.toString('base64');
}

/**
 * @function decrypt
 * @description 对给定的密文进行AES解密
 * @param {string} string 需要解密的密文
 * @param {string} corpId 可选 需要对比的 corpId，如果第三方回调时默认是 suiteId，也可自行传入作为匹配处理
 * @returns {string} 解密后的结果
 */
export function decrypt(string, corpId) {
  const { aesKey, iv } = this.crypotConfig;

  corpId = corpId || this.crypotConfig.corpId;

  const aesCipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);

  aesCipher.setAutoPadding(false);

  const deciphered = PKCS7Decoder(Buffer.concat([aesCipher.update(string, 'base64'), aesCipher.final()]));
  const data = deciphered.slice(16);
  const size = data.slice(0, 4).readUInt32BE(0);
  const decryptCorpId = data.slice(size + 4).toString();

  if (corpId !== decryptCorpId) {
    const error = new Error('The corpId is invalid');

    error.code = 400;
    error.name = 'WXWorkAPIError';

    throw error;
  }

  return data.slice(4, size + 4).toString();
}
