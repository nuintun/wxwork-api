/**
 * @module fetch
 * @author nuintun
 * @license MIT
 * @version 2018/04/16
 */

import typer from 'media-typer';
import { resolveURL } from './url';
import fetch from 'node-fetch';

const { Headers } = fetch;

/**
 * @function jsonTyper
 * @param {string} media
 * @returns {boolean}
 */
function jsonTyper(media) {
  if (media) {
    const { subtype } = typer.parse(media);

    return subtype === 'json';
  }

  return false;
}

/**
 * @function fetch
 * @param {string} url
 * @param {Object} options
 * @returns {ReadableStream|Object}
 */
export default async (url, options = {}) => {
  options.headers = new Headers(options.headers);

  // Default send json
  if (options.headers.has('Content-Type')) {
    options.headers.append('Content-Type', 'application/json');
  }

  // Serialize body
  if (options.hasOwnProperty('body') && jsonTyper(options.headers.get('Content-Type'))) {
    options.body = JSON.stringify(options.body);
  }

  // Fetch
  const response = await fetch(resolveURL(url, options.params), options);

  // JSON
  if (jsonTyper(response.headers.get('Content-Type'))) {
    return await response.json();
  }

  // Readable
  return response.body;
};