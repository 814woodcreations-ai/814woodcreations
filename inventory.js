// ========================================
// INVENTORY TRACKING CONFIGURATION
// ========================================

// YOUR GOOGLE SHEETS CREDENTIALS
// Replace these with your actual values:
const SHEET_ID = 'YOUR_SHEET_ID_HERE';  // Get this from your Google Sheet URL
const API_KEY = 'YOUR_API_KEY_HERE';     // Your Google Cloud API Key
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';  // Your deployed Apps Script URL
const SECRET_KEY = 'mySecretPassword123';  // Match this to your Apps Script password

// ========================================
// INVENTORY FUNCTIONS
// ========================================

/**
 * Load inventory from Google Sheets when page loads
 */
async function loadInventory() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A2:B10?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.values) {
      // Check each color's inventory
      data.values.forEach(row => {
        const color = row[0];         // e.g., "Red"
        const quantity = parseInt(row[1]);  // e.g., 0
        
        if (quantity <= 0) {
          disableColor(color);
        }
      });
      
      console.log('Inventory loaded successfully');
    }
  } catch (error) {
    console.error('Error loading inventory:', error);
    console.log('Make sure you have set up your Google Sheets credentials in inventory.js');
  }
}

/**
 * Disable a color option (add red X and prevent clicking)
 */
function disableColor(color) {
  // Find all color buttons with matching data-color attribute
  const colorButtons = document.querySelectorAll(`[data-color="${color}"]`);
  
  colorButtons.forEach(colorElement => {
    if (!colorElement.classList.contains('out-of-stock')) {
      // Add out-of-stock class
      colorElement.classList.add('out-of-stock');
      
      // Add "Out of Stock" label if not already present
      if (!colorElement.querySelector('.stock-label')) {
        const label = document.createElement('div');
        label.className = 'stock-label';
        label.textContent = 'Out of Stock';
        colorElement.appendChild(label);
      }
    }
  });
}

/**
 * Update inventory in Google Sheets (subtract 1)
 */
async function updateInventory(selectedColor) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        color: selectedColor,
        key: SECRET_KEY
      })
    });
    
    const result = await response.text();
    console.log('Inventory updated:', result);
    
    // Reload inventory to check if this color just went out of stock
    await loadInventory();
    
    return true;
  } catch (error) {
    console.error('Error updating inventory:', error);
    return false;
  }
}

// ========================================
// INTEGRATE WITH EXISTING ORDER FLOW
// ========================================

/**
 * Hook into the existing form submission
 * This updates inventory when customer submits order
 */
function setupInventoryTracking() {
  // Wait for the order form to exist
  const orderForm = document.querySelector('form[name="custom-notebook-order"]');
  
  if (orderForm) {
    // Add event listener to form submission
    orderForm.addEventListener('submit', async function(e) {
      // Get the selected color from the readonly input
      const colorInput = document.getElementById('color');
      
      if (colorInput && colorInput.value) {
        const selectedColor = colorInput.value;
        
        // Update inventory in Google Sheets
        console.log('Updating inventory for color:', selectedColor);
        await updateInventory(selectedColor);
      }
    });
  }
}

// ========================================
// INITIALIZATION
// ========================================

// Load inventory when page loads
window.addEventListener('DOMContentLoaded', function() {
  console.log('Loading inventory...');
  loadInventory();
  
  // Set up tracking on order form page
  setupInventoryTracking();
});

// Also reload inventory every 60 seconds to catch updates from other users
setInterval(loadInventory, 60000);
