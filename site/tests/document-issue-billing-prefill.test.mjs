import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestPost } from '../functions/api/documents.js';

function issueRequest(billing) {
  return new Request('https://badutmurah.my/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'issue',
      phone: '0123456789',
      lead_id: '2026-09-07_booking-name.yaml',
      type: 'quotation',
      billing,
    }),
  });
}

test('empty billing object reaches document-issue and returns booking prefill', async () => {
  let forwardedPayload;
  const env = {
    WEBSITE_WEBHOOK_SECRET: 'test-secret',
    RELAY: {
      async fetch(_url, options) {
        forwardedPayload = JSON.parse(options.body);
        return Response.json({
          type: 'quotation',
          doc_no: 'Q-26-9999',
          billing: {
            nama: 'Booking Name',
            phone: '0123456789',
            alamat: 'Booking Location',
            email: '',
          },
        });
      },
    },
  };

  const response = await onRequestPost({ request: issueRequest({}), env });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(forwardedPayload.billing, {});
  assert.equal(body.document.billing.nama, 'Booking Name');
  assert.equal(body.document.billing.phone, '0123456789');
  assert.equal(body.document.billing.alamat, 'Booking Location');
});
