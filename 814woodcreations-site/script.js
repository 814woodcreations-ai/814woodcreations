document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  let selectedColor = null;
  let selectedLogo = null;
  let selectedFont = null;
  let pendingColorSelection = null;

  // Color engraving messages
  const colorEngravingMessages = {
    'Red': 'This color will be engraved off white',
    'Blue': 'This color will be engraved black',
    'Brown': 'This color will be engraved black',
    'Teal': 'This color will be engraved off white'
  };

  // Get confirmation lightbox elements
  const confirmationLightbox = document.getElementById('color-confirmation-lightbox');
  const confirmationMessage = document.getElementById('confirmation-message');
  const confirmYesBtn = document.getElementById('confirm-yes');
  const confirmNoBtn = document.getElementById('confirm-no');

  // Color selection with confirmation
  document.querySelectorAll("[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      pendingColorSelection = { btn, color };
      
      // Show confirmation lightbox with engraving message
      if (confirmationLightbox && confirmationMessage) {
        confirmationMessage.textContent = colorEngravingMessages[color] || 'This color will be engraved';
        confirmationLightbox.classList.add('open');
      }
    });
  });

  // Confirm Yes - apply the selection
  if (confirmYesBtn) {
    confirmYesBtn.addEventListener('click', () => {
      if (pendingColorSelection) {
        // Remove selected class from all color cards
        document.querySelectorAll("[data-color]").forEach((b) => b.classList.remove("selected"));
        
        // Add selected class to the clicked card
        pendingColorSelection.btn.classList.add('selected');
        selectedColor = pendingColorSelection.color;
        
        // Close lightbox
        confirmationLightbox.classList.remove('open');
        pendingColorSelection = null;
      }
    });
  }

  // Confirm No - cancel the selection
  if (confirmNoBtn) {
    confirmNoBtn.addEventListener('click', () => {
      confirmationLightbox.classList.remove('open');
      pendingColorSelection = null;
    });
  }

  // Close confirmation lightbox if clicking outside
  if (confirmationLightbox) {
    confirmationLightbox.addEventListener('click', (e) => {
      if (e.target === confirmationLightbox) {
        confirmationLightbox.classList.remove('open');
        pendingColorSelection = null;
      }
    });
  }

  // Logo / design selection
  document.querySelectorAll("[data-logo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-logo]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedLogo = btn.dataset.logo;
    });
  });

  // Font selection (new)
  document.querySelectorAll("[data-font]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-font]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedFont = btn.dataset.font;
    });
  });

  // Lightbox elements (for enlarging design images)
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");

  if (lightbox && lightboxImg && lightboxClose) {
    // When clicking on a design image, open lightbox
    document.querySelectorAll(".design-thumb").forEach((img) => {
      img.addEventListener("click", (e) => {
        // Don't trigger the parent button click
        e.stopPropagation();
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "Preview";
        lightbox.classList.add("open");
      });
    });

    // When clicking on floating background notebook images, open lightbox
    document.querySelectorAll(".notebook-bg").forEach((img) => {
      img.addEventListener("click", (e) => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "Notebook Preview";
        lightbox.classList.add("open");
      });
    });

    // When clicking on gallery images, open lightbox
    document.querySelectorAll(".gallery-img").forEach((img) => {
      img.addEventListener("click", (e) => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "Gallery Image";
        lightbox.classList.add("open");
      });
    });

    // Close lightbox with button
    lightboxClose.addEventListener("click", () => {
      lightbox.classList.remove("open");
    });

    // Close lightbox if clicking the dark background
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove("open");
      }
    });
  }

  // Order button on category pages
  const orderBtn = document.getElementById("orderNotebook");
  if (orderBtn) {
    orderBtn.addEventListener("click", () => {
      if (!selectedColor || !selectedLogo) {
        alert("Please select a color and a design before continuing.");
        return;
      }

      if (!selectedFont) {
        alert("Please select a font before continuing.");
        return;
      }

      // Save selections for order form
      localStorage.setItem("product", "Custom Notebook");
      localStorage.setItem("color", selectedColor);
      localStorage.setItem("design_number", selectedLogo);
      localStorage.setItem("font", selectedFont);

      // Go to order section on home page
      window.location.href = "index.html#order";
    });
  }

  // Auto-fill order form if data exists
  const product = localStorage.getItem("product");
  const color = localStorage.getItem("color");
  const design = localStorage.getItem("design_number");
  const font = localStorage.getItem("font");

  if (product && document.getElementById("product")) {
    document.getElementById("product").value = product;
  }
  if (color && document.getElementById("color")) {
    document.getElementById("color").value = color;
  }
  if (design && document.getElementById("design-number")) {
    document.getElementById("design-number").value = design;
  }
  if (font && document.getElementById("font")) {
    const fontField = document.getElementById("font");
    // works whether it's an <input> or <select>
    fontField.value = font;
  }
});
