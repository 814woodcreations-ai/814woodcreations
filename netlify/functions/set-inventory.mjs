// netlify/functions/set-inventory.mjs
// Netlify Functions V2 — saves full inventory from admin page.

import { getStore } from '@netlify/blobs';

export default async function(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let inventory;
  try {
    inventory = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const store = getStore('inventory');
  await store.set('stock', JSON.stringify(inventory));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const config = { path: '/.netlify/functions/set-inventory' };
