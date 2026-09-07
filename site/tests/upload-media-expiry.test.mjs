import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost } from '../functions/api/upload-media.js';

function requestFor(contentType, bytes) {
  return {
    headers: new Headers({
      Authorization: 'Bearer test-secret',
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
    }),
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}

function captureEnv() {
  const puts = [];
  return {
    puts,
    env: {
      MEDIA_UPLOAD_TOKEN: 'test-secret',
      MEDIA_KV: {
        async put(key, value, options) {
          puts.push({ key, value, options });
        },
      },
    },
  };
}

test('MP4 bytes and metadata expire after seven days', async () => {
  const mp4 = Uint8Array.from([
    0x00, 0x00, 0x00, 0x18,
    0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d,
  ]);
  const { env, puts } = captureEnv();

  const response = await onRequestPost({ request: requestFor('video/mp4', mp4), env });

  assert.equal(response.status, 200);
  assert.equal(puts.length, 2);
  assert.equal(puts[0].options.expirationTtl, 604800);
  assert.equal(puts[1].options.expirationTtl, 604800);
  const body = await response.json();
  assert.equal(body.expires_in_seconds, 604800);
});

test('image bytes and metadata do not receive automatic expiry', async () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
  const { env, puts } = captureEnv();

  const response = await onRequestPost({ request: requestFor('image/jpeg', jpeg), env });

  assert.equal(response.status, 200);
  assert.equal(puts.length, 2);
  assert.equal('expirationTtl' in puts[0].options, false);
  assert.equal('expirationTtl' in puts[1].options, false);
  const body = await response.json();
  assert.equal(body.expires_in_seconds, null);
});
