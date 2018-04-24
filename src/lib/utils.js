/**
 * @module utils
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import typer from 'media-typer';

/**
 * @function jsonTyper
 * @param {Headers} headers
 * @returns {boolean}
 */
export function jsonTyper(headers) {
  if (headers.has('Content-Type')) {
    const media = headers.get('Content-Type');
    const { subtype } = typer.parse(media);

    return subtype === 'json';
  }

  return false;
}
