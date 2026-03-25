// netlify/functions/get-inventory.mjs
// Netlify Functions V2 — Blobs work automatically, no siteID or token needed.

import { getStore } from '@netlify/blobs';

const DEFAULT_INVENTORY = {
  'Red':   20,
  'Blue':  20,
  'Brown': 20,
  'Teal':  20
};

export default async function() {
  const store = getStore('inventory');

  let inventory = await store.get('stock', { type: 'json' });

  if (!inventory) {
    inventory = DEFAULT_INVENTORY;
    await store.set('stock', JSON.stringify(DEFAULT_INVENTORY));
  }

  return new Response(JSON.stringify(inventory), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const config = { path: '/.netlify/functions/get-inventory' };
