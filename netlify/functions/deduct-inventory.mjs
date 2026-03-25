// netlify/functions/deduct-inventory.mjs
// Netlify Functions V2 — deducts 1 from ordered items on order submission.

import { getStore } from '@netlify/blobs';

const DEFAULT_INVENTORY = {
  'Red':   20,
  'Blue':  20,
  'Brown': 20,
  'Teal':  20
};

export default async function(request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { items } = body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: 'No items provided' }), { status: 400 });
  }

  const store     = getStore('inventory');
  const inventory = await store.get('stock', { type: 'json' }) || { ...DEFAULT_INVENTORY };

  // Deduct 1 per item, never below 0
  items.forEach(function(itemName) {
    if (inventory[itemName] !== undefined && inventory[itemName] > 0) {
      inventory[itemName] = inventory[itemName] - 1;
    }
  });

  await store.set('stock', JSON.stringify(inventory));

  return new Response(JSON.stringify({ success: true, inventory }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export const config = { path: '/.netlify/functions/deduct-inventory' };
