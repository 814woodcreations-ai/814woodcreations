document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  let selectedColor = null;
  let selectedFont = null;
  let selectedEngravingText = "";
  let previewFontSize = 24;

  // ── MULTI-IMAGE STATE ─────────────────────────────────────
  let selectedDesigns = []; // { id, name, src, number, posX, posY, size, el }
  let activeDesignId = null;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0, elemStartX = 0, elemStartY = 0;

  // Text drag state
  let textPosX = 50, textPosY = 80;
  let isTextDragging = false;
  let textDragStartX = 0, textDragStartY = 0, textElemStartX = 0, textElemStartY = 0;

  const NOTEBOOK_WIDTH_IN = 5.5;
  const NOTEBOOK_HEIGHT_IN = 8.25;

  // Elements
  const previewSection = document.getElementById('preview-section');
  const previewNotebook = document.getElementById('preview-notebook');
  const previewText = document.getElementById('preview-text');
  const previewTextContainer = document.getElementById('preview-text-container');
  const fontSizeControlWrapper = document.getElementById('font-size-control-wrapper');
  const fontSelectDropdown = document.getElementById('font-select');
  const designsOverlay = document.getElementById('designs-overlay');
  const positionReadoutContainer = document.getElementById('position-readout-container');

  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const getNotebookRect = () => previewNotebook ? previewNotebook.getBoundingClientRect() : null;

  // ── FONT FAMILIES ─────────────────────────────────────────
  const fontFamilies = {
    'Achafexp':'Achafexp,serif','Achafita':'Achafita,serif','Achaflft':'Achaflft,serif',
    'Achafont':'Achafont,serif','Achafout':'Achafout,serif','Achafsex':'Achafsex,serif',
    'Alegreya SC':'Alegreya SC,serif','Alegreya SC Italic':'Alegreya SC,serif',
    'Alegreya SC Bold':'Alegreya SC,serif','Alegreya SC Bold Italic':'Alegreya SC,serif',
    'Alegreya SC Black':'Alegreya SC,serif','Alegreya SC Black Italic':'Alegreya SC,serif',
    'Dancing Script':'Dancing Script,cursive','Dancing Script Medium':'Dancing Script,cursive',
    'Dancing Script SemiBold':'Dancing Script,cursive','Dancing Script Bold':'Dancing Script,cursive',
    'Bloody Terror':'Bloody Terror,cursive','Clesgoth':'Clesgoth,fantasy',
    'Collegiate':'Collegiate,sans-serif','Collegiate Black':'Collegiate Black,sans-serif',
    'Collegiate Border':'Collegiate Border,sans-serif','Collegiate Inside':'Collegiate Inside,sans-serif',
    'Collegiate Outline':'Collegiate Outline,sans-serif','Enchanted Land':'Enchanted Land,fantasy',
    'Freshman':'Freshman,sans-serif','Heorot':'Heorot,serif','Heorot Italic':'Heorot,serif',
    'Heorot Bold':'Heorot,serif','Heorot Bold Italic':'Heorot,serif',
    'Heorot SemiBold':'Heorot,serif','Heorot SemiBold Italic':'Heorot,serif',
    'Lato Thin':'Lato,sans-serif','Lato Thin Italic':'Lato,sans-serif',
    'Lato Light':'Lato,sans-serif','Lato Light Italic':'Lato,sans-serif',
    'Lato':'Lato,sans-serif','Lato Italic':'Lato,sans-serif',
    'Lato Bold':'Lato,sans-serif','Lato Bold Italic':'Lato,sans-serif',
    'Lato Black':'Lato,sans-serif','Lato Black Italic':'Lato,sans-serif',
    'Marlboro':'Marlboro,serif','Mostwasted':'Mostwasted,display',
    'Old London':'Old London,serif','Old London Alternate':'Old London Alternate,serif',
    'Plank':'Plank,display','Playball':'Playball,cursive',
    'Prince Valiant':'Prince Valiant,fantasy','Remachine Script':'Remachine Script,cursive',
    'Stardos Stencil':'Stardos Stencil,display','Stardos Stencil Bold':'Stardos Stencil,display'
  };

  const textColors = { 'Red':'#ffffff','Blue':'#000000','Brown':'#000000','Teal':'#ffffff' };
  const designColorClass = { 'Red':'preview-design-white','Blue':'preview-design-black','Brown':'preview-design-black','Teal':'preview-design-white' };

  // Images that skip the laser engraving filter and always show in their natural color
  const noFilterImages = ['50.png', '52.png'];

  // Images that show a red X overlay when Red or Teal notebook is selected
  const incompatibleOnLightColors = ['50.png', '52.png'];
  const incompatibleColors = ['Red', 'Teal'];

  function isIncompatible(filename) {
    return incompatibleOnLightColors.some(f => filename === f) &&
           incompatibleColors.includes(selectedColor);
  }

  function applyRedXOverlay(container, imgEl) {
    const existing = container.querySelector('.red-x-overlay');
    if (existing) existing.remove();
    const filename = (imgEl.src || '').split('/').pop();
    if (!isIncompatible(filename)) return;
    const overlay = document.createElement('div');
    overlay.className = 'red-x-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:15;background:linear-gradient(to top right,transparent 0%,transparent calc(50% - 2px),#ff0000 50%,transparent calc(50% + 2px),transparent 100%),linear-gradient(to bottom right,transparent 0%,transparent calc(50% - 2px),#ff0000 50%,transparent calc(50% + 2px),transparent 100%);';
    container.appendChild(overlay);
  }

  function applyDesignFilter(imgEl) {
    if (!imgEl) return;
    const filename = (imgEl.src || '').split('/').pop();
    if (noFilterImages.some(f => filename === f)) {
      imgEl.classList.remove('preview-design-white', 'preview-design-black');
      imgEl.style.filter = 'none';
      return;
    }
    if (selectedColor && designColorClass[selectedColor]) {
      imgEl.classList.remove('preview-design-white', 'preview-design-black');
      imgEl.classList.add(designColorClass[selectedColor]);
    }
  }

  function refreshAllRedXOverlays() {
    // Update overlays on preview design elements
    selectedDesigns.forEach(d => {
      if (!d.el) return;
      const imgEl = d.el.querySelector('img');
      if (imgEl) applyRedXOverlay(d.el, imgEl);
    });
    // Update overlays on thumbnail cards in the grid
    document.querySelectorAll('.option-card.image-option[data-logo]').forEach(card => {
      const imgEl = card.querySelector('img');
      if (!imgEl) return;
      const filename = (imgEl.src || '').split('/').pop();
      if (!incompatibleOnLightColors.some(f => filename === f)) return;
      const existing = card.querySelector('.red-x-overlay');
      if (existing) existing.remove();
      if (!isIncompatible(filename)) return;
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      const overlay = document.createElement('div');
      overlay.className = 'red-x-overlay';
      overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:15;background:linear-gradient(to top right,transparent 0%,transparent calc(50% - 2px),#ff0000 50%,transparent calc(50% + 2px),transparent 100%),linear-gradient(to bottom right,transparent 0%,transparent calc(50% - 2px),#ff0000 50%,transparent calc(50% + 2px),transparent 100%);';
      card.appendChild(overlay);
    });
  }

  // ── POSITION READOUT ──────────────────────────────────────
  function calcInches(d) {
    const notebookRect = getNotebookRect();
    const elemRect = d.el ? d.el.getBoundingClientRect() : null;
    const xC = ((d.posX / 100) * NOTEBOOK_WIDTH_IN).toFixed(2);
    const yC = ((d.posY / 100) * NOTEBOOK_HEIGHT_IN).toFixed(2);
    let xE = xC, yE = yC;
    if (notebookRect && elemRect && elemRect.width > 0) {
      xE = (((d.posX - (elemRect.width/2/notebookRect.width)*100) / 100) * NOTEBOOK_WIDTH_IN).toFixed(2);
      yE = (((d.posY - (elemRect.height/2/notebookRect.height)*100) / 100) * NOTEBOOK_HEIGHT_IN).toFixed(2);
    }
    return { xC, yC, xE, yE };
  }

  function updateAllPositionReadouts() {
    // Keep hidden position data updated for order submission
    if (positionReadoutContainer) {
      positionReadoutContainer.innerHTML = '';
      selectedDesigns.forEach(d => {
        const { xC, yC, xE, yE } = calcInches(d);
        const block = document.createElement('div');
        block.dataset.designId = d.id;
        block.dataset.xC = xC; block.dataset.yC = yC;
        block.dataset.xE = xE; block.dataset.yE = yE;
        positionReadoutContainer.appendChild(block);
      });
    }

    // Update visible size sliders for customer
    const sizeControls = document.getElementById('design-size-controls');
    if (!sizeControls) return;
    sizeControls.innerHTML = '';
    if (selectedDesigns.length === 0) return;

    const heading = document.createElement('label');
    heading.style.cssText = 'display:block;font-weight:600;margin-bottom:0.5rem;background-color:#add8e6;padding:0.5rem 0.75rem;border-radius:0.5rem;';
    heading.textContent = selectedDesigns.length === 1 ? 'Design Size:' : 'Design Sizes:';
    sizeControls.appendChild(heading);

    selectedDesigns.forEach(d => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin-bottom:1rem;';
      wrapper.innerHTML = `
        ${selectedDesigns.length > 1 ? `<div style="font-size:0.82rem;font-weight:600;margin-bottom:0.25rem;color:#1e40af;">Design ${d.number}: ${d.name}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
          <small style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;">30%</small>
          <small id="size-label-${d.id}" style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;font-weight:700;">${d.size}%</small>
          <small style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;">300%</small>
        </div>
        <input type="range" min="30" max="300" step="5" value="${d.size}"
          style="width:100%;" data-design-id="${d.id}" class="design-size-slider">
      `;
      sizeControls.appendChild(wrapper);
    });

    sizeControls.querySelectorAll('.design-size-slider').forEach(slider => {
      slider.addEventListener('input', function() {
        const d = selectedDesigns.find(d => String(d.id) === this.dataset.designId);
        if (!d) return;
        d.size = parseInt(this.value);
        if (d.el) d.el.style.width = `${d.size}%`;
        const label = document.getElementById(`size-label-${this.dataset.designId}`);
        if (label) label.textContent = `${d.size}%`;
      });
    });
  }

  // ── CREATE DRAGGABLE ELEMENT ──────────────────────────────
  function createDesignElement(d) {
    const container = document.createElement('div');
    container.dataset.designId = d.id;
    container.style.cssText = `position:absolute;left:${d.posX}%;top:${d.posY}%;width:${d.size}%;transform:translate(-50%,-50%);cursor:grab;user-select:none;touch-action:none;z-index:10;`;

    const img = document.createElement('img');
    img.src = d.src;
    img.alt = d.name;
    img.style.cssText = 'width:100%;height:auto;opacity:0.9;pointer-events:none;display:block;';
    applyDesignFilter(img);

    const badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:-10px;left:-10px;background:#2563eb;color:white;border-radius:50%;width:22px;height:22px;font-size:0.7rem;font-weight:bold;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:20;';
    badge.textContent = d.number;
    badge.className = 'design-badge';

    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;font-size:0.68rem;padding:2px 7px;border-radius:4px;white-space:nowrap;pointer-events:none;';
    hint.textContent = '✋ Drag to reposition';

    container.appendChild(img);
    container.appendChild(badge);
    container.appendChild(hint);

    // Drag events
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      activeDesignId = String(d.id);
      dragStartX = e.clientX; dragStartY = e.clientY;
      elemStartX = d.posX; elemStartY = d.posY;
      container.style.cursor = 'grabbing';
      container.style.zIndex = 100;
      hint.style.display = 'none';
    });
    container.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      isDragging = true;
      activeDesignId = String(d.id);
      dragStartX = t.clientX; dragStartY = t.clientY;
      elemStartX = d.posX; elemStartY = d.posY;
      hint.style.display = 'none';
    }, { passive: true });

    d.el = container;
    return container;
  }

  // Global move/up listeners
  document.addEventListener('mousemove', (e) => {
    if (!isDragging || !activeDesignId) return;
    const rect = getNotebookRect(); if (!rect) return;
    const d = selectedDesigns.find(d => String(d.id) === activeDesignId); if (!d) return;
    d.posX = clamp(elemStartX + ((e.clientX - dragStartX) / rect.width) * 100, 0, 100);
    d.posY = clamp(elemStartY + ((e.clientY - dragStartY) / rect.height) * 100, 0, 100);
    d.el.style.left = `${d.posX}%`;
    d.el.style.top = `${d.posY}%`;
    updateAllPositionReadouts();
  });
  document.addEventListener('touchmove', (e) => {
    if (!isDragging || !activeDesignId) return;
    const rect = getNotebookRect(); if (!rect) return;
    const d = selectedDesigns.find(d => String(d.id) === activeDesignId); if (!d) return;
    const t = e.touches[0];
    d.posX = clamp(elemStartX + ((t.clientX - dragStartX) / rect.width) * 100, 0, 100);
    d.posY = clamp(elemStartY + ((t.clientY - dragStartY) / rect.height) * 100, 0, 100);
    d.el.style.left = `${d.posX}%`;
    d.el.style.top = `${d.posY}%`;
    updateAllPositionReadouts();
  }, { passive: true });
  document.addEventListener('mouseup', () => {
    if (isDragging && activeDesignId) {
      const d = selectedDesigns.find(d => String(d.id) === activeDesignId);
      if (d && d.el) { d.el.style.cursor = 'grab'; d.el.style.zIndex = 10; }
    }
    isDragging = false; activeDesignId = null;
  });
  document.addEventListener('touchend', () => { isDragging = false; activeDesignId = null; });

  // ── ADD / REMOVE DESIGN ───────────────────────────────────
  function addDesign(name, src) {
    const id = String(Date.now() + Math.random());
    const offset = selectedDesigns.length * 8;
    const d = { id, name, src, number: selectedDesigns.length + 1, posX: clamp(50 + offset, 10, 85), posY: clamp(40 + offset, 10, 85), size: 60, el: null };
    selectedDesigns.push(d);
    if (designsOverlay) designsOverlay.appendChild(createDesignElement(d));
    updateAllPositionReadouts();
    refreshAllRedXOverlays();
  }

  function removeDesign(name) {
    const idx = selectedDesigns.findIndex(d => d.name === name);
    if (idx === -1) return;
    const d = selectedDesigns[idx];
    if (d.el && d.el.parentNode) d.el.parentNode.removeChild(d.el);
    selectedDesigns.splice(idx, 1);
    // Re-number remaining
    selectedDesigns.forEach((d, i) => {
      d.number = i + 1;
      const badge = d.el ? d.el.querySelector('.design-badge') : null;
      if (badge) badge.textContent = i + 1;
    });
    updateAllPositionReadouts();
  }

  // ── UPDATE PREVIEW ────────────────────────────────────────
  function showPreviewIfNeeded() {
    if (previewSection && (selectedColor || selectedFont || selectedDesigns.length > 0 || selectedEngravingText))
      previewSection.style.display = 'block';
  }

  function updatePreview() {
    showPreviewIfNeeded();
    if (fontSizeControlWrapper) fontSizeControlWrapper.style.display = selectedFont ? "block" : "none";

    if (selectedColor && previewNotebook) {
      previewNotebook.src = `images/colors/${selectedColor.toLowerCase()}.png`;
      if (previewText && textColors[selectedColor]) previewText.style.color = textColors[selectedColor];
      selectedDesigns.forEach(d => {
        if (!d.el) return;
        const img = d.el.querySelector('img');
        if (img) applyDesignFilter(img);
      });
      refreshAllRedXOverlays();
    }

    if (selectedFont && previewText) {
      previewText.style.setProperty('font-family', fontFamilies[selectedFont] || 'serif', 'important');
      previewText.style.setProperty('font-size', `${previewFontSize}px`, 'important');
      previewText.textContent = (selectedEngravingText && selectedEngravingText.trim()) ? selectedEngravingText.trim() : "Your Text";
      previewTextContainer.style.left = `${textPosX}%`;
      previewTextContainer.style.top = `${textPosY}%`;
      previewTextContainer.style.bottom = 'auto';
      previewTextContainer.style.transform = 'translate(-50%,-50%)';
      previewTextContainer.style.display = "block";
      updateTextPositionReadout();
    } else {
      if (previewTextContainer) previewTextContainer.style.display = 'none';
    }
  }

  // ── TEXT POSITION READOUT ─────────────────────────────────
  function updateTextPositionReadout() {
    const readout = document.getElementById('text-position-readout');
    const posXEl = document.getElementById('text-pos-x-display');
    const posYEl = document.getElementById('text-pos-y-display');
    if (!readout || !posXEl || !posYEl) return;
    if (selectedFont) {
      readout.style.display = 'block';
      const xC = ((textPosX / 100) * NOTEBOOK_WIDTH_IN).toFixed(2);
      const yC = ((textPosY / 100) * NOTEBOOK_HEIGHT_IN).toFixed(2);
      const nr = getNotebookRect(), er = previewTextContainer ? previewTextContainer.getBoundingClientRect() : null;
      let xE = xC, yE = yC;
      if (nr && er && er.width > 0) {
        xE = (((textPosX - (er.width/2/nr.width)*100)/100)*NOTEBOOK_WIDTH_IN).toFixed(2);
        yE = (((textPosY - (er.height/2/nr.height)*100)/100)*NOTEBOOK_HEIGHT_IN).toFixed(2);
      }
      posXEl.innerHTML = `<span style="display:block">Center: ${xC}"</span><span style="display:block">Left edge: ${xE}"</span>`;
      posYEl.innerHTML = `<span style="display:block">Center: ${yC}"</span><span style="display:block">Top edge: ${yE}"</span>`;
    } else {
      readout.style.display = 'none';
    }
  }

  // ── EVENT LISTENERS ───────────────────────────────────────
  const engravingInput = document.getElementById("engraving-text");
  if (engravingInput) engravingInput.addEventListener("input", (e) => { selectedEngravingText = e.target.value || ""; updatePreview(); });

  const fontSizeControl = document.getElementById("font-size-control");
  const fontSizeDisplay = document.getElementById("font-size-display");
  if (fontSizeControl && fontSizeDisplay) {
    fontSizeControl.addEventListener("input", (e) => { previewFontSize = parseInt(e.target.value); fontSizeDisplay.textContent = `${previewFontSize}px`; updatePreview(); });
  }

  document.querySelectorAll("[data-color]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-color]").forEach(b => b.classList.remove("selected"));
      btn.classList.add('selected');
      selectedColor = btn.dataset.color;
      updatePreview();
    });
  });

  // Multi-select toggle for designs
  document.querySelectorAll("[data-logo]").forEach(btn => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.logo;
      if (btn.classList.contains("selected")) {
        btn.classList.remove("selected");
        removeDesign(name);
      } else {
        btn.classList.add("selected");
        const img = btn.querySelector('img');
        addDesign(name, img ? img.src : '');
        showPreviewIfNeeded();
      }
    });
  });

  document.querySelectorAll("[data-font]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-font]").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected"); selectedFont = btn.dataset.font; updatePreview();
    });
  });

  const fontDropdown = document.getElementById("font-select");
  if (fontDropdown) fontDropdown.addEventListener("change", (e) => { selectedFont = e.target.value; updatePreview(); });

  // ── TEXT DRAG ─────────────────────────────────────────────
  if (previewTextContainer) {
    previewTextContainer.addEventListener('mousedown', (e) => {
      if (previewTextContainer.style.display === 'none') return;
      e.preventDefault();
      isTextDragging = true;
      textDragStartX = e.clientX; textDragStartY = e.clientY;
      textElemStartX = textPosX; textElemStartY = textPosY;
      previewTextContainer.style.cursor = 'grabbing';
      const hint = document.getElementById('text-drag-hint');
      if (hint) hint.style.display = 'none';
    });
    previewTextContainer.addEventListener('touchstart', (e) => {
      if (previewTextContainer.style.display === 'none') return;
      const t = e.touches[0];
      isTextDragging = true;
      textDragStartX = t.clientX; textDragStartY = t.clientY;
      textElemStartX = textPosX; textElemStartY = textPosY;
      const hint = document.getElementById('text-drag-hint');
      if (hint) hint.style.display = 'none';
    }, { passive: true });
    document.addEventListener('mousemove', (e) => {
      if (!isTextDragging) return;
      const rect = getNotebookRect(); if (!rect) return;
      textPosX = clamp(textElemStartX + ((e.clientX - textDragStartX) / rect.width) * 100, 5, 95);
      textPosY = clamp(textElemStartY + ((e.clientY - textDragStartY) / rect.height) * 100, 5, 95);
      previewTextContainer.style.left = `${textPosX}%`;
      previewTextContainer.style.top = `${textPosY}%`;
      updateTextPositionReadout();
    });
    document.addEventListener('touchmove', (e) => {
      if (!isTextDragging) return;
      const rect = getNotebookRect(); if (!rect) return;
      const t = e.touches[0];
      textPosX = clamp(textElemStartX + ((t.clientX - textDragStartX) / rect.width) * 100, 5, 95);
      textPosY = clamp(textElemStartY + ((t.clientY - textDragStartY) / rect.height) * 100, 5, 95);
      previewTextContainer.style.left = `${textPosX}%`;
      previewTextContainer.style.top = `${textPosY}%`;
      updateTextPositionReadout();
    }, { passive: true });
    document.addEventListener('mouseup', () => { isTextDragging = false; if (previewTextContainer) previewTextContainer.style.cursor = 'grab'; });
    document.addEventListener('touchend', () => { isTextDragging = false; });
  }

  // ── LIGHTBOX ──────────────────────────────────────────────
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  if (lightbox && lightboxImg && lightboxClose) {
    document.querySelectorAll(".design-thumb").forEach(img => {
      img.addEventListener("click", (e) => { e.stopPropagation(); lightboxImg.src = img.src; lightbox.classList.add("open"); });
    });
    document.querySelectorAll(".notebook-bg").forEach(img => {
      img.addEventListener("click", () => { lightboxImg.src = img.src; lightbox.classList.add("open"); });
    });
    document.querySelectorAll(".gallery-img").forEach(img => {
      img.addEventListener("click", () => { lightboxImg.src = img.src; lightbox.classList.add("open"); });
    });
    lightboxClose.addEventListener("click", () => lightbox.classList.remove("open"));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.classList.remove("open"); });
  }

  // ── ORDER BUTTON ──────────────────────────────────────────
  const orderBtn = document.getElementById("orderNotebook");
  if (orderBtn) {
    orderBtn.addEventListener("click", async () => {
      if (!selectedColor || selectedDesigns.length === 0) {
        alert("Please select a color and at least one design before continuing.");
        return;
      }
      if (selectedFont && (!selectedEngravingText || !selectedEngravingText.trim())) {
        alert("Please enter the text you want engraved before continuing.");
        return;
      }

      // Disable button and show status
      orderBtn.disabled = true;
      orderBtn.textContent = "📸 Capturing your design...";

      // Save all order data to localStorage
      localStorage.setItem("product", "Custom Notebook");
      localStorage.setItem("color", selectedColor);
      localStorage.setItem("font", selectedFont || "");
      localStorage.setItem("font_size", selectedFont ? `${previewFontSize}px` : "");
      localStorage.setItem("engraving_text", selectedEngravingText.trim() || "");
      localStorage.setItem("design_number", selectedDesigns.map(d => d.name).join(', '));

      const designsData = selectedDesigns.map(d => {
        const { xC, yC, xE, yE } = calcInches(d);
        return { number: d.number, name: d.name, size: `${d.size}%`, centerX: `${xC}"`, centerY: `${yC}"`, leftEdge: `${xE}"`, topEdge: `${yE}"` };
      });
      localStorage.setItem("designs", JSON.stringify(designsData));

      const txIn = ((textPosX / 100) * NOTEBOOK_WIDTH_IN).toFixed(2);
      const tyIn = ((textPosY / 100) * NOTEBOOK_HEIGHT_IN).toFixed(2);
      localStorage.setItem("text_pos_x", `${txIn} inches from left`);
      localStorage.setItem("text_pos_y", `${tyIn} inches from top`);

      // ── SNAPSHOT: capture + upload to ImgBB → short URL ────
      try {
        const notebookWrapper = previewNotebook ? previewNotebook.parentElement : null;
        if (notebookWrapper && typeof html2canvas !== 'undefined') {
          orderBtn.textContent = "📸 Capturing your design...";

          // Force the selected font to fully load before capturing,
          // otherwise html2canvas renders a fallback font instead.
          if (selectedFont && fontFamilies[selectedFont]) {
            try {
              const fontFamily = fontFamilies[selectedFont].split(',')[0].trim();
              // Create a short off-screen element to force the browser to rasterize the font
              const primer = document.createElement('span');
              primer.style.cssText = `position:fixed;top:-999px;left:-999px;font-family:${fontFamilies[selectedFont]};font-size:32px;opacity:0;pointer-events:none;`;
              primer.textContent = selectedEngravingText || 'ABCabc';
              document.body.appendChild(primer);
              // Wait for fonts to be ready
              await document.fonts.ready;
              // Also try the FontFace load API for extra reliability
              try { await document.fonts.load(`32px "${fontFamily}"`, primer.textContent); } catch(e) {}
              // Small delay to ensure rendering
              await new Promise(r => setTimeout(r, 150));
              document.body.removeChild(primer);
            } catch(e) { /* continue anyway */ }
          }

          const canvas = await html2canvas(notebookWrapper, {
            useCORS: true,
            allowTaint: false,
            scale: 2,
            logging: false,
            onclone: (clonedDoc) => {
              // In the cloned document, explicitly set the font on the preview text
              // so html2canvas renders it with the correct typeface
              const clonedText = clonedDoc.getElementById('preview-text');
              if (clonedText && selectedFont && fontFamilies[selectedFont]) {
                clonedText.style.setProperty('font-family', fontFamilies[selectedFont], 'important');
                clonedText.style.setProperty('font-size', `${previewFontSize}px`, 'important');
                clonedText.style.setProperty('color', selectedColor ? (textColors[selectedColor] || '#000') : '#000', 'important');
              }
            }
          });

          // Scale down to ~800px wide and compress as JPEG
          const MAX_WIDTH = 800;
          const ratio = Math.min(1, MAX_WIDTH / canvas.width);
          const thumb = document.createElement('canvas');
          thumb.width = Math.round(canvas.width * ratio);
          thumb.height = Math.round(canvas.height * ratio);
          thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);

          const base64 = thumb.toDataURL('image/jpeg', 0.85).split(',')[1];

          orderBtn.textContent = "⬆️ Uploading preview...";
          const formData = new FormData();
          formData.append('image', base64);
          formData.append('name', 'order-' + Date.now());

          const response = await fetch('https://api.imgbb.com/1/upload?key=381873438a13df3df78daa534e89863d', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            localStorage.setItem("design_snapshot_url", result.data.url);
          } else {
            localStorage.setItem("design_snapshot_url", "Upload failed");
          }
        }
      } catch (err) {
        console.warn("Snapshot failed:", err);
        localStorage.setItem("design_snapshot_url", "Snapshot unavailable");
      }

      orderBtn.textContent = "✅ Redirecting to order form...";
      setTimeout(() => {
        window.location.href = "order.html";
      }, 600);
    });
  }

  // ── AUTO-FILL ORDER FORM ──────────────────────────────────
  const product = localStorage.getItem("product");
  const color = localStorage.getItem("color");
  const design = localStorage.getItem("design_number");
  const font = localStorage.getItem("font");
  const fontSize = localStorage.getItem("font_size");
  const engravingText = localStorage.getItem("engraving_text");

  if (engravingText && document.getElementById("engraving-text")) document.getElementById("engraving-text").value = engravingText;
  if (engravingText && document.getElementById("engraving-text-form")) document.getElementById("engraving-text-form").value = engravingText;
  if (product && document.getElementById("product")) document.getElementById("product").value = product;
  if (color && document.getElementById("color")) document.getElementById("color").value = color;
  if (design && document.getElementById("design-number")) document.getElementById("design-number").value = design;
  if (font && document.getElementById("font")) {
    const fontField = document.getElementById("font");
    fontField.value = font;
    const orderForm = document.querySelector('form[name="custom-notebook-order"]');
    if (orderForm && fontField.disabled) orderForm.addEventListener('submit', () => { fontField.disabled = false; });
  }
  if (fontSize && document.getElementById("font-size")) document.getElementById("font-size").value = fontSize;

  const textPosXSaved = localStorage.getItem("text_pos_x");
  const textPosYSaved = localStorage.getItem("text_pos_y");
  const snapshotUrl = localStorage.getItem("design_snapshot_url");
  const designsSaved = localStorage.getItem("designs");

  if (textPosXSaved && document.getElementById("text-pos-x")) document.getElementById("text-pos-x").value = textPosXSaved;
  if (textPosYSaved && document.getElementById("text-pos-y")) document.getElementById("text-pos-y").value = textPosYSaved;
  if (designsSaved && document.getElementById("designs-data")) document.getElementById("designs-data").value = designsSaved;
  if (snapshotUrl && snapshotUrl.startsWith('https://')) {
    // Fill hidden field for form submission
    const hiddenField = document.getElementById("design-snapshot-url");
    if (hiddenField) hiddenField.value = snapshotUrl;

    // Show visible preview image on order form
    const wrapper = document.getElementById("snapshot-wrapper");
    const preview = document.getElementById("snapshot-preview");
    if (wrapper && preview) {
      preview.src = snapshotUrl;
      wrapper.style.display = "block";
    }
  }
});
