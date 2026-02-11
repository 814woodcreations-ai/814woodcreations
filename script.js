document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  let selectedColor = null;
  let selectedLogo = null;
  let selectedFont = null;
  let selectedEngravingText = "";
  let textPosition = "bottom"; // Default position: "none", "top", or "bottom"
  let previewFontSize = 24; // Default font size in pixels
  let previewDesignSize = 60; // Default design size in percentage

  // Preview elements
  const previewSection = document.getElementById('preview-section');
  const previewNotebook = document.getElementById('preview-notebook');
  const previewDesign = document.getElementById('preview-design');
  const previewDesignContainer = document.getElementById('preview-design-container');
  const previewText = document.getElementById('preview-text');
  const previewTextContainer = document.getElementById('preview-text-container');
  const fontSizeControlWrapper = document.getElementById('font-size-control-wrapper');
  const fontSelectDropdown = document.getElementById('font-select');

  // Engraving text input
  const engravingInput = document.getElementById("engraving-text");
  if (engravingInput) {
    engravingInput.addEventListener("input", (e) => {
      selectedEngravingText = e.target.value || "";
      updatePreview();
    });
  }

  // Text position selection
  const textPositionSelect = document.getElementById("text-position");
  if (textPositionSelect) {
    textPositionSelect.addEventListener("change", (e) => {
      textPosition = e.target.value;
      
      // Disable/enable font selection based on text position
      if (fontSelectDropdown) {
        if (textPosition === "none") {
          fontSelectDropdown.value = "";
          fontSelectDropdown.disabled = true;
          selectedFont = null;
        } else {
          fontSelectDropdown.disabled = false;
        }
      }
      
      updatePreview();
    });
  }

  // Font size control
  const fontSizeControl = document.getElementById("font-size-control");
  const fontSizeDisplay = document.getElementById("font-size-display");
  if (fontSizeControl && fontSizeDisplay) {
    fontSizeControl.addEventListener("input", (e) => {
      previewFontSize = parseInt(e.target.value);
      fontSizeDisplay.textContent = `${previewFontSize}px`;
      updatePreview();
    });
  }

  // Design size control
  const designSizeControl = document.getElementById("design-size-control");
  const designSizeDisplay = document.getElementById("design-size-display");
  if (designSizeControl && designSizeDisplay) {
    designSizeControl.addEventListener("input", (e) => {
      previewDesignSize = parseInt(e.target.value);
      designSizeDisplay.textContent = `${previewDesignSize}%`;
      updatePreview();
    });
  }

  // Font family mapping - all custom fonts
  const fontFamilies = {
    'Achafexp': 'Achafexp, serif',
    'Achafita': 'Achafita, serif',
    'Achaflft': 'Achaflft, serif',
    'Achafont': 'Achafont, serif',
    'Achafout': 'Achafout, serif',
    'Achafsex': 'Achafsex, serif',
    'Alegreya SC': 'Alegreya SC, serif',
    'Alegreya SC Italic': 'Alegreya SC, serif',
    'Alegreya SC Bold': 'Alegreya SC, serif',
    'Alegreya SC Bold Italic': 'Alegreya SC, serif',
    'Alegreya SC Black': 'Alegreya SC, serif',
    'Alegreya SC Black Italic': 'Alegreya SC, serif',
    'Dancing Script': 'Dancing Script, cursive',
    'Dancing Script Medium': 'Dancing Script, cursive',
    'Dancing Script SemiBold': 'Dancing Script, cursive',
    'Dancing Script Bold': 'Dancing Script, cursive',
    'Bloody Terror': 'Bloody Terror, cursive',
    'Clesgoth': 'Clesgoth, fantasy',
    'Collegiate': 'Collegiate, sans-serif',
    'Collegiate Black': 'Collegiate Black, sans-serif',
    'Collegiate Border': 'Collegiate Border, sans-serif',
    'Collegiate Inside': 'Collegiate Inside, sans-serif',
    'Collegiate Outline': 'Collegiate Outline, sans-serif',
    'Enchanted Land': 'Enchanted Land, fantasy',
    'Freshman': 'Freshman, sans-serif',
    'Heorot': 'Heorot, serif',
    'Heorot Italic': 'Heorot, serif',
    'Heorot Bold': 'Heorot, serif',
    'Heorot Bold Italic': 'Heorot, serif',
    'Heorot SemiBold': 'Heorot, serif',
    'Heorot SemiBold Italic': 'Heorot, serif',
    'Lato Thin': 'Lato, sans-serif',
    'Lato Thin Italic': 'Lato, sans-serif',
    'Lato Light': 'Lato, sans-serif',
    'Lato Light Italic': 'Lato, sans-serif',
    'Lato': 'Lato, sans-serif',
    'Lato Italic': 'Lato, sans-serif',
    'Lato Bold': 'Lato, sans-serif',
    'Lato Bold Italic': 'Lato, sans-serif',
    'Lato Black': 'Lato, sans-serif',
    'Lato Black Italic': 'Lato, sans-serif',
    'Marlboro': 'Marlboro, serif',
    'Mostwasted': 'Mostwasted, display',
    'Old London': 'Old London, serif',
    'Old London Alternate': 'Old London Alternate, serif',
    'Plank': 'Plank, display',
    'Playball': 'Playball, cursive',
    'Prince Valiant': 'Prince Valiant, fantasy',
    'Remachine Script': 'Remachine Script, cursive',
    'Stardos Stencil': 'Stardos Stencil, display',
    'Stardos Stencil Bold': 'Stardos Stencil, display'
  };

  // Font variant descriptions
  const fontVariants = {
    'Achafexp': 'Expanded',
    'Achafita': 'Italic',
    'Achaflft': 'Light',
    'Achafont': 'Regular',
    'Achafout': 'Outline',
    'Achafsex': 'Semi-Extended',
    'Alegreya SC': 'Regular',
    'Alegreya SC Italic': 'Italic',
    'Alegreya SC Bold': 'Bold',
    'Alegreya SC Bold Italic': 'Bold Italic',
    'Alegreya SC Black': 'Black',
    'Alegreya SC Black Italic': 'Black Italic',
    'Dancing Script': 'Regular',
    'Dancing Script Medium': 'Medium',
    'Dancing Script SemiBold': 'SemiBold',
    'Dancing Script Bold': 'Bold',
    'Bloody Terror': 'Horror',
    'Clesgoth': 'Gothic',
    'Collegiate': 'Regular',
    'Collegiate Black': 'Black',
    'Collegiate Border': 'Border',
    'Collegiate Inside': 'Inside',
    'Collegiate Outline': 'Outline',
    'Enchanted Land': 'Fantasy',
    'Freshman': 'College',
    'Heorot': 'Regular',
    'Heorot Italic': 'Italic',
    'Heorot Bold': 'Bold',
    'Heorot Bold Italic': 'Bold Italic',
    'Heorot SemiBold': 'SemiBold',
    'Heorot SemiBold Italic': 'SemiBold Italic',
    'Lato Thin': 'Thin',
    'Lato Thin Italic': 'Thin Italic',
    'Lato Light': 'Light',
    'Lato Light Italic': 'Light Italic',
    'Lato': 'Regular',
    'Lato Italic': 'Italic',
    'Lato Bold': 'Bold',
    'Lato Bold Italic': 'Bold Italic',
    'Lato Black': 'Black',
    'Lato Black Italic': 'Black Italic',
    'Marlboro': 'Classic',
    'Mostwasted': 'Grunge',
    'Old London': 'Gothic',
    'Old London Alternate': 'Gothic Alt',
    'Plank': 'Wooden',
    'Playball': 'Script',
    'Prince Valiant': 'Medieval',
    'Remachine Script': 'Script',
    'Stardos Stencil': 'Regular',
    'Stardos Stencil Bold': 'Bold'
  };

  // Color text colors for engraving
  const textColors = {
    'Red': '#ffffff',  // white
    'Blue': '#000000', // black
    'Brown': '#000000', // black
    'Teal': '#ffffff'  // white
  };

  // Design image colors (filter classes)
  const designColors = {
    'Red': 'preview-design-white',
    'Blue': 'preview-design-black',
    'Brown': 'preview-design-black',
    'Teal': 'preview-design-white'
  };

  // Function to update preview
  function updatePreview() {
    if (!previewSection) return;

    // Show preview section if any selection is made
    if (selectedColor || selectedFont || selectedLogo || selectedEngravingText) {
      previewSection.style.display = 'block';
    }

    // Show/hide text size slider based on text position
    if (fontSizeControlWrapper) {
      if (textPosition === "none") {
        fontSizeControlWrapper.style.display = "none";
      } else {
        fontSizeControlWrapper.style.display = "block";
      }
    }

    // Update notebook color image
    if (selectedColor && previewNotebook) {
      previewNotebook.src = `images/colors/${selectedColor.toLowerCase()}.png`;
      
      // Update text color based on notebook color
      if (previewText && textColors[selectedColor]) {
        previewText.style.color = textColors[selectedColor];
      }
      
      // Update design image color filter based on notebook color
      if (previewDesign && designColors[selectedColor]) {
        // Remove all color classes
        previewDesign.classList.remove('preview-design-white', 'preview-design-black');
        // Add the appropriate color class
        previewDesign.classList.add(designColors[selectedColor]);
      }
    }

    // Update font
    if (selectedFont && previewText && textPosition !== "none") {
      const fontFamily = fontFamilies[selectedFont] || "serif";
      previewText.style.setProperty('font-family', fontFamily, 'important');
      previewText.style.setProperty('font-size', `${previewFontSize}px`, 'important');

      // Use customer engraving text (fallback text if empty)
      const displayText = (selectedEngravingText && selectedEngravingText.trim())
        ? selectedEngravingText.trim()
        : "Your Text";
      previewText.textContent = displayText;

      // Position text based on selection
      if (textPosition === "top") {
        previewTextContainer.style.top = "15%";
        previewTextContainer.style.bottom = "auto";
      } else if (textPosition === "bottom") {
        previewTextContainer.style.bottom = "15%";
        previewTextContainer.style.top = "auto";
      }

      previewTextContainer.style.display = "block";
    } else {
      if (previewTextContainer) previewTextContainer.style.display = 'none';
    }

    // Update design position based on text position
    // If text is at top, move design toward bottom; if text is at bottom, move design toward top
    if (selectedLogo && previewDesign) {
      // Find the button to get the image source
      const logoButton = document.querySelector(`[data-logo="${selectedLogo}"]`);
      if (logoButton) {
        const logoImg = logoButton.querySelector('img');
        if (logoImg) {
          previewDesign.src = logoImg.src;
          previewDesignContainer.style.width = `${previewDesignSize}%`;
          
          // Position design opposite of text
          if (textPosition === "top") {
            // Text at top, design toward bottom
            previewDesignContainer.style.top = "auto";
            previewDesignContainer.style.bottom = "15%";
            previewDesignContainer.style.transform = "translate(-50%, 0)";
          } else if (textPosition === "bottom") {
            // Text at bottom, design toward top
            previewDesignContainer.style.top = "15%";
            previewDesignContainer.style.bottom = "auto";
            previewDesignContainer.style.transform = "translate(-50%, 0)";
          } else {
            // No text, design in center
            previewDesignContainer.style.top = "50%";
            previewDesignContainer.style.bottom = "auto";
            previewDesignContainer.style.transform = "translate(-50%, -50%)";
          }
          
          previewDesignContainer.style.display = 'block';
        }
      }
    } else {
      if (previewDesignContainer) previewDesignContainer.style.display = 'none';
    }
  }

  // Color selection - direct selection without confirmation
  document.querySelectorAll("[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      
      // Remove selected class from all color cards
      document.querySelectorAll("[data-color]").forEach((b) => b.classList.remove("selected"));
      
      // Add selected class to the clicked card
      btn.classList.add('selected');
      selectedColor = color;
      
      // Update preview
      updatePreview();
    });
  });

  // Logo / design selection
  document.querySelectorAll("[data-logo]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-logo]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedLogo = btn.dataset.logo;
      updatePreview();
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
      updatePreview();
    });
  });

  // Font dropdown selection (for pages with dropdown)
  const fontDropdown = document.getElementById("font-select");
  if (fontDropdown) {
    fontDropdown.addEventListener("change", (e) => {
      selectedFont = e.target.value;
      updatePreview();
    });
  }

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

      // Only require font and text if position is not "none"
      if (textPosition !== "none") {
        if (!selectedFont) {
          alert("Please select a font before continuing.");
          return;
        }

        if (!selectedEngravingText || !selectedEngravingText.trim()) {
          alert("Please enter the text you want engraved before continuing.");
          return;
        }
      }

      // Save selections for order form
      localStorage.setItem("product", "Custom Notebook");
      localStorage.setItem("color", selectedColor);
      localStorage.setItem("design_number", selectedLogo);
      localStorage.setItem("font", selectedFont || "");
      localStorage.setItem("engraving_text", selectedEngravingText.trim() || "");
      localStorage.setItem("text_position", textPosition);

      // Go to order section on home page
      window.location.href = "index.html#order";
    });
  }

  // Auto-fill order form if data exists
  const product = localStorage.getItem("product");
  const color = localStorage.getItem("color");
  const design = localStorage.getItem("design_number");
  const font = localStorage.getItem("font");
  const engravingText = localStorage.getItem("engraving_text");
  const savedTextPosition = localStorage.getItem("text_position");

  if (engravingText && document.getElementById("engraving-text")) {
    document.getElementById("engraving-text").value = engravingText;
  }

  // Fill in order form fields
  if (engravingText && document.getElementById("engraving-text-form")) {
    document.getElementById("engraving-text-form").value = engravingText;
  }

  if (savedTextPosition && document.getElementById("text-position")) {
    document.getElementById("text-position").value = savedTextPosition;
    textPosition = savedTextPosition;
    
    // Disable font selection if text position is none
    if (fontSelectDropdown && textPosition === "none") {
      fontSelectDropdown.disabled = true;
      fontSelectDropdown.value = "";
    }
  }

  // Fill text position in order form
  if (savedTextPosition && document.getElementById("text-position-form")) {
    const positionLabels = {
      'none': 'None (No Text)',
      'top': 'Top',
      'bottom': 'Bottom'
    };
    document.getElementById("text-position-form").value = positionLabels[savedTextPosition] || savedTextPosition;
  }

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
    
    // If this is the order form page, enable the select before submission
    const orderForm = document.querySelector('form[name="custom-notebook-order"]');
    if (orderForm && fontField.disabled) {
      orderForm.addEventListener('submit', function() {
        fontField.disabled = false;
      });
    }
  }
});
