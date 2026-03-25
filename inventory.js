// ============================================================
// 814 WOOD CREATIONS — inventory.js
// Loads live stock counts from Netlify Function → Netlify Blobs.
// Marks out-of-stock items with a red X and disables ordering.
// Automatically deducts stock when an order is submitted.
// ============================================================

// ── Which inventory keys belong to which order button ────────
var PRODUCT_KEYS = {
  orderNotebook: ['Red', 'Blue', 'Brown', 'Teal']
};

var _inventory = {};

// ── Load & apply inventory ───────────────────────────────────
function loadInventory() {
  fetch('/.netlify/functions/get-inventory')
    .then(function(r) { return r.json(); })
    .then(function(inventory) {
      _inventory = inventory;
      applyInventory(inventory);
    })
    .catch(function(err) {
      console.warn('Could not load inventory:', err);
    });
}

function applyInventory(inventory) {
  // Mark individual color cards out of stock
  Object.keys(inventory).forEach(function(itemName) {
    if (inventory[itemName] <= 0) {
      markOutOfStock(itemName);
    }
  });

  // Disable order buttons where all variants are out of stock
  Object.keys(PRODUCT_KEYS).forEach(function(btnId) {
    var btn = document.getElementById(btnId);
    if (!btn) return;

    var keys   = PRODUCT_KEYS[btnId];
    var allOut = keys.every(function(k) {
      return inventory[k] !== undefined && inventory[k] <= 0;
    });

    if (allOut) {
      btn.disabled         = true;
      btn.textContent      = 'Currently Out of Stock';
      btn.style.background = '#9ca3af';
      btn.style.cursor     = 'not-allowed';
      btn.style.opacity    = '0.7';
      btn.title = 'This item is currently out of stock. Please check back soon!';
    } else {
      btn.disabled         = false;
      btn.style.background = '';
      btn.style.cursor     = '';
      btn.style.opacity    = '';
      btn.title            = '';
    }
  });
}

// Adds red-X overlay + "Out of Stock" badge to a color card
function markOutOfStock(itemName) {
  var cards = document.querySelectorAll('[data-color="' + itemName + '"]');
  cards.forEach(function(card) {
    if (card.classList.contains('out-of-stock')) return;
    card.classList.add('out-of-stock');
    card.style.position = 'relative';
    if (!card.querySelector('.stock-label')) {
      var label         = document.createElement('div');
      label.className   = 'stock-label';
      label.textContent = 'Out of Stock';
      card.appendChild(label);
    }
  });
}

// ── Deduct stock on order submission ─────────────────────────
function setupInventoryTracking() {
  var orderForm = document.querySelector('form[name="custom-notebook-order"]');
  if (!orderForm) return;

  orderForm.addEventListener('submit', function() {
    var itemsToDeduct = [];
    var colorInput    = document.getElementById('color');
    var colorValue    = colorInput ? colorInput.value : '';

    if (colorValue) {
      itemsToDeduct.push(colorValue);
    }

    if (itemsToDeduct.length === 0) return;

    // Fire and forget — don't block form submission
    fetch('/.netlify/functions/deduct-inventory', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ items: itemsToDeduct })
    }).catch(function(err) {
      console.warn('Inventory deduction failed:', err);
    });
  });
}

// ── Init ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', function() {
  loadInventory();
  setupInventoryTracking();
});

// Refresh every 60 seconds so stock changes are reflected live
setInterval(loadInventory, 60000);
