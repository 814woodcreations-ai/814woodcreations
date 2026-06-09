document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  let selectedColor = null;
  let selectedFont = null;
  let selectedEngravingText = "";
  let previewFontSize = 24;
  let textOrientation = 'straight'; // 'straight' or 'sideways'

  // ── MULTI-IMAGE STATE ─────────────────────────────────────
  let selectedDesigns = []; // { id, name, src, number, posX, posY, size, el }
  let activeDesignId = null;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0, elemStartX = 0, elemStartY = 0;

  // Side 2 design state (Half Wrap only)
  let selectedDesigns2 = [];
  let activeDesignId2 = null;
  let isDragging2 = false;
  let dragStartX2 = 0, dragStartY2 = 0, elemStartX2 = 0, elemStartY2 = 0;

  // Text drag state (Side 1)
  let textPosX = 50, textPosY = 80;
  let isTextDragging = false;
  let textDragStartX = 0, textDragStartY = 0, textElemStartX = 0, textElemStartY = 0;

  // Text drag state (Side 2)
  let textPosX2 = 50, textPosY2 = 80;
  let isTextDragging2 = false;
  let textDragStartX2 = 0, textDragStartY2 = 0, textElemStartX2 = 0, textElemStartY2 = 0;

  let previewFontSize2 = 24;

  const NOTEBOOK_WIDTH_IN  = 10.0;  // Real printable width of bottle (inches)
  const NOTEBOOK_HEIGHT_IN = 6.5;   // Real printable height of bottle (inches)
  const WB_MAX_W_IN = 10.0;
  const WB_MAX_H_IN = 6.5;
  const HALF_MAX_W_IN = 5.0;   // Half Wrap max width (real inches)
  const HALF_MAX_H_IN = 3.5;   // Half Wrap max height (real inches)

  // Tracks whether Half Wrap Around is currently selected
  let isHalfWrapActive = false;

  // The preview image doesn't fill the overlay 1:1 — the bottle has a neck, base, curves etc.
  // Calibration: when the overlay shows 6.3"W × 4.1"H it equals 10"W × 6.5"H in real life.
  // Scale factors correct preview inches → real printed inches.
  const WB_SCALE_W = 10.0 / 3.5;   // ~1.5873
  const WB_SCALE_H = 6.5  / 4;   // ~.61538

  // Convert preview height (inches) → real printed height (inches)
  const toRealH = h => h * WB_SCALE_H;
  // Convert preview width (inches) → real printed width (inches)
  const toRealW = w => w * WB_SCALE_W;

  // Max preview height (inches) so neither real dimension exceeds the given limits.
  // Uses Half Wrap limits when isHalfWrapActive, Full Wrap limits otherwise.
  function maxPreviewHForAspect(aspect, forceMaxW, forceMaxH) {
    const maxW = forceMaxW !== undefined ? forceMaxW : (isHalfWrapActive ? HALF_MAX_W_IN : WB_MAX_W_IN);
    const maxH = forceMaxH !== undefined ? forceMaxH : (isHalfWrapActive ? HALF_MAX_H_IN : WB_MAX_H_IN);
    const capFromH = maxH / WB_SCALE_H;
    if (!aspect || aspect <= 0) return capFromH;
    const capFromW = maxW / (aspect * WB_SCALE_W);
    return Math.min(capFromH, capFromW);
  }

  // Real max W/H to display in labels — respects active wrap mode
  function activeMaxW() { return isHalfWrapActive ? HALF_MAX_W_IN : WB_MAX_W_IN; }
  function activeMaxH() { return isHalfWrapActive ? HALF_MAX_H_IN : WB_MAX_H_IN; }

  // Elements
  const previewSection = document.getElementById('preview-section');
  const previewNotebook = document.getElementById('preview-notebook');
  const previewText = document.getElementById('preview-text');
  const previewTextContainer = document.getElementById('preview-text-container');
  const fontSizeControlWrapper = document.getElementById('font-size-control-wrapper');
  const fontSelectDropdown = document.getElementById('font-select');
  const designsOverlay = document.getElementById('designs-overlay');
  const positionReadoutContainer = document.getElementById('position-readout-container');

  // Side 2 elements
  const previewNotebook2 = document.getElementById('preview-notebook-2');
  const previewText2 = document.getElementById('preview-text-2');
  const previewTextContainer2 = document.getElementById('preview-text-container-2');
  const designsOverlay2 = document.getElementById('designs-overlay-2');
  const positionReadoutContainer2 = document.getElementById('position-readout-container-2');

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

  const textColors = { 'Red':'#ffffff','Blue':'#000000','Brown':'#000000','Teal':'#ffffff','Book Left':'#5c2a00','Book Right':'#5c2a00','Book Up':'#5c2a00' };
  const designColorClass = { 'Red':'preview-design-white','Blue':'preview-design-black','Brown':'preview-design-black','Teal':'preview-design-white','Book Left':'preview-design-brown','Book Right':'preview-design-brown','Book Up':'preview-design-brown' };

  // Images that skip the laser engraving filter and always show in their natural color
  const noFilterImages = ['50.png', '52.png', '12.png'];

  // Images that show a red X overlay when Red or Teal notebook is selected
  const incompatibleOnLightColors = ['50.png', '52.png', '12.png'];
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
      imgEl.classList.remove('preview-design-white', 'preview-design-black', 'preview-design-brown');
      imgEl.style.filter = 'none';
      return;
    }
    if (selectedColor && designColorClass[selectedColor]) {
      imgEl.classList.remove('preview-design-white', 'preview-design-black', 'preview-design-brown');
      imgEl.classList.add(designColorClass[selectedColor]);
      if (designColorClass[selectedColor] === 'preview-design-brown') {
        imgEl.style.filter = 'brightness(0) invert(1) sepia(1) saturate(4) hue-rotate(355deg) brightness(0.5)';
        imgEl.style.mixBlendMode = '';
      } else {
        imgEl.style.filter = '';
      }
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

    const previewMaxIn = WB_MAX_H_IN / WB_SCALE_H; // 4.0" preview = 6.5" real

    selectedDesigns.forEach(d => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin-bottom:1rem;';
      const currentPreviewIn = d.sizeIn !== undefined ? d.sizeIn : previewMaxIn;
      const maxPreviewIn = maxPreviewHForAspect(d.aspect);
      const realH = toRealH(currentPreviewIn);
      const realW = d.aspect ? toRealW(currentPreviewIn * d.aspect) : null;
      const realMaxH = toRealH(maxPreviewIn);
      // When width is capped at 10", derive height from real width / aspect so both are consistent
      const displayW = realW !== null ? Math.min(realW, activeMaxW()) : null;
      const displayH = (displayW !== null && d.aspect) ? displayW / d.aspect : Math.min(realH, activeMaxH());
      const sizeLabel = displayW !== null
        ? `${displayW.toFixed(1)}"W × ${displayH.toFixed(1)}"H`
        : `${Math.min(realH, activeMaxH()).toFixed(1)}"H`;
      wrapper.innerHTML = `
        ${selectedDesigns.length > 1 ? `<div style="font-size:0.82rem;font-weight:600;margin-bottom:0.25rem;color:#1e40af;">Design ${d.number}: ${d.name}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
          <small style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;">0.5"H</small>
          <small id="size-label-${d.id}" style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;font-weight:700;">${sizeLabel}</small>
          <small style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;">${Math.min(realMaxH, activeMaxH()).toFixed(1)}"H</small>
        </div>
        <input type="range" min="0.1" max="${maxPreviewIn.toFixed(2)}" step="0.05" value="${Math.min(currentPreviewIn, maxPreviewIn).toFixed(2)}"
          style="width:100%;" data-design-id="${d.id}" class="design-size-slider">
      `;
      sizeControls.appendChild(wrapper);
    });

    sizeControls.querySelectorAll('.design-size-slider').forEach(slider => {
      slider.addEventListener('input', function() {
        const d = selectedDesigns.find(d => String(d.id) === this.dataset.designId);
        if (!d) return;
        const previewIn = parseFloat(this.value);
        const maxIn = maxPreviewHForAspect(d.aspect);
        d.sizeIn = Math.min(previewIn, maxIn);
        d.size = (d.sizeIn / previewMaxIn) * 100;
        if (d.el) d.el.style.height = `${d.size}%`;
        const label = document.getElementById(`size-label-${this.dataset.designId}`);
        if (label) {
          const rW = d.aspect ? Math.min(toRealW(d.sizeIn * d.aspect), activeMaxW()) : null;
          const rH = (rW !== null && d.aspect) ? rW / d.aspect : Math.min(toRealH(d.sizeIn), activeMaxH());
          label.textContent = rW !== null
            ? `${rW.toFixed(1)}"W × ${rH.toFixed(1)}"H`
            : `${rH.toFixed(1)}"H`;
        }
      });
    });
  }

  // ── CREATE DRAGGABLE ELEMENT ──────────────────────────────
  function createDesignElement(d) {
    const container = document.createElement('div');
    container.dataset.designId = d.id;
    // Size by height% so the image fills the bottle height; width follows aspect ratio naturally
    container.style.cssText = `position:absolute;left:${d.posX}%;top:${d.posY}%;height:${d.size}%;width:auto;transform:translate(-50%,-50%);cursor:grab;user-select:none;touch-action:none;z-index:10;`;

    const img = document.createElement('img');
    img.src = d.src;
    img.alt = d.name;
    img.style.cssText = 'height:100%;width:auto;opacity:0.9;pointer-events:none;display:block;';
    applyDesignFilter(img);

    // Bookmark page: force filter with !important so nothing can override it
    if (document.getElementById('orderBookmark')) {
      img.setAttribute('style', img.getAttribute('style') + ';filter:invert(35%) sepia(60%) saturate(500%) hue-rotate(355deg) brightness(60%) !important');
    }

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

  // ── SIDE 2 DRAG LISTENERS ─────────────────────────────────
  const getNotebook2Rect = () => previewNotebook2 ? previewNotebook2.getBoundingClientRect() : null;

  document.addEventListener('mousemove', (e) => {
    if (!isDragging2 || !activeDesignId2) return;
    const rect = getNotebook2Rect(); if (!rect) return;
    const d = selectedDesigns2.find(d => String(d.id) === activeDesignId2); if (!d) return;
    d.posX = clamp(elemStartX2 + ((e.clientX - dragStartX2) / rect.width) * 100, 0, 100);
    d.posY = clamp(elemStartY2 + ((e.clientY - dragStartY2) / rect.height) * 100, 0, 100);
    d.el.style.left = `${d.posX}%`;
    d.el.style.top = `${d.posY}%`;
    updateAllPositionReadouts2();
  });
  document.addEventListener('touchmove', (e) => {
    if (!isDragging2 || !activeDesignId2) return;
    const rect = getNotebook2Rect(); if (!rect) return;
    const d = selectedDesigns2.find(d => String(d.id) === activeDesignId2); if (!d) return;
    const t = e.touches[0];
    d.posX = clamp(elemStartX2 + ((t.clientX - dragStartX2) / rect.width) * 100, 0, 100);
    d.posY = clamp(elemStartY2 + ((t.clientY - dragStartY2) / rect.height) * 100, 0, 100);
    d.el.style.left = `${d.posX}%`;
    d.el.style.top = `${d.posY}%`;
    updateAllPositionReadouts2();
  }, { passive: true });
  document.addEventListener('mouseup', () => {
    if (isDragging2 && activeDesignId2) {
      const d = selectedDesigns2.find(d => String(d.id) === activeDesignId2);
      if (d && d.el) { d.el.style.cursor = 'grab'; d.el.style.zIndex = 10; }
    }
    isDragging2 = false; activeDesignId2 = null;
  });
  document.addEventListener('touchend', () => { isDragging2 = false; activeDesignId2 = null; });

  function createDesignElement2(d) {
    const container = document.createElement('div');
    container.dataset.designId = d.id;
    container.style.cssText = `position:absolute;left:${d.posX}%;top:${d.posY}%;height:${d.size}%;width:auto;transform:translate(-50%,-50%);cursor:grab;user-select:none;touch-action:none;z-index:10;`;
    const img = document.createElement('img');
    img.src = d.src;
    img.alt = d.name;
    img.style.cssText = 'height:100%;width:auto;opacity:0.9;pointer-events:none;display:block;';
    applyDesignFilter(img);
    const badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;top:-10px;left:-10px;background:#16a34a;color:white;border-radius:50%;width:22px;height:22px;font-size:0.7rem;font-weight:bold;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:20;';
    badge.textContent = d.number;
    badge.className = 'design-badge';
    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:#fff;font-size:0.68rem;padding:2px 7px;border-radius:4px;white-space:nowrap;pointer-events:none;';
    hint.textContent = '✋ Drag to reposition';
    container.appendChild(img);
    container.appendChild(badge);
    container.appendChild(hint);
    container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging2 = true; activeDesignId2 = String(d.id);
      dragStartX2 = e.clientX; dragStartY2 = e.clientY;
      elemStartX2 = d.posX; elemStartY2 = d.posY;
      container.style.cursor = 'grabbing'; container.style.zIndex = 100;
      hint.style.display = 'none';
    });
    container.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      isDragging2 = true; activeDesignId2 = String(d.id);
      dragStartX2 = t.clientX; dragStartY2 = t.clientY;
      elemStartX2 = d.posX; elemStartY2 = d.posY;
      hint.style.display = 'none';
    }, { passive: true });
    d.el = container;
    return container;
  }

  function updateAllPositionReadouts2() {
    if (positionReadoutContainer2) {
      positionReadoutContainer2.innerHTML = '';
      selectedDesigns2.forEach(d => {
        const { xC, yC, xE, yE } = calcInches(d);
        const block = document.createElement('div');
        block.dataset.designId = d.id;
        block.dataset.xC = xC; block.dataset.yC = yC;
        block.dataset.xE = xE; block.dataset.yE = yE;
        positionReadoutContainer2.appendChild(block);
      });
    }
    const sizeControls2 = document.getElementById('design-size-controls-2');
    if (!sizeControls2) return;
    sizeControls2.innerHTML = '';
    if (selectedDesigns2.length === 0) return;
    const heading = document.createElement('label');
    heading.style.cssText = 'display:block;font-weight:600;margin-bottom:0.5rem;background-color:#add8e6;padding:0.5rem 0.75rem;border-radius:0.5rem;';
    heading.textContent = selectedDesigns2.length === 1 ? 'Design Size:' : 'Design Sizes:';
    sizeControls2.appendChild(heading);
    const previewMaxIn = WB_MAX_H_IN / WB_SCALE_H;
    selectedDesigns2.forEach(d => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin-bottom:1rem;';
      const currentPreviewIn = d.sizeIn !== undefined ? d.sizeIn : previewMaxIn;
      const maxPreviewIn = maxPreviewHForAspect(d.aspect, HALF_MAX_W_IN, HALF_MAX_H_IN);
      const realW = d.aspect ? toRealW(currentPreviewIn * d.aspect) : null;
      const displayW = realW !== null ? Math.min(realW, HALF_MAX_W_IN) : null;
      const displayH = (displayW !== null && d.aspect) ? displayW / d.aspect : Math.min(toRealH(currentPreviewIn), HALF_MAX_H_IN);
      const sizeLabel = displayW !== null ? `${displayW.toFixed(1)}"W × ${displayH.toFixed(1)}"H` : `${displayH.toFixed(1)}"H`;
      const realMaxH = toRealH(maxPreviewIn);
      wrapper.innerHTML = `
        ${selectedDesigns2.length > 1 ? `<div style="font-size:0.82rem;font-weight:600;margin-bottom:0.25rem;color:#16a34a;">Design ${d.number}: ${d.name}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
          <small style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;">0.5"H</small>
          <small id="size-label2-${d.id}" style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;font-weight:700;">${sizeLabel}</small>
          <small style="background-color:#add8e6;padding:0.25rem 0.5rem;border-radius:0.5rem;">${Math.min(realMaxH, HALF_MAX_H_IN).toFixed(1)}"H</small>
        </div>
        <input type="range" min="0.1" max="${maxPreviewIn.toFixed(2)}" step="0.05" value="${Math.min(currentPreviewIn, maxPreviewIn).toFixed(2)}"
          style="width:100%;" data-design-id="${d.id}" class="design-size-slider-2">
      `;
      sizeControls2.appendChild(wrapper);
    });
    sizeControls2.querySelectorAll('.design-size-slider-2').forEach(slider => {
      slider.addEventListener('input', function() {
        const d = selectedDesigns2.find(d => String(d.id) === this.dataset.designId);
        if (!d) return;
        const previewIn = parseFloat(this.value);
        const maxIn = maxPreviewHForAspect(d.aspect, HALF_MAX_W_IN, HALF_MAX_H_IN);
        d.sizeIn = Math.min(previewIn, maxIn);
        d.size = (d.sizeIn / previewMaxIn) * 100;
        if (d.el) d.el.style.height = `${d.size}%`;
        const label = document.getElementById(`size-label2-${this.dataset.designId}`);
        if (label) {
          const rW = d.aspect ? Math.min(toRealW(d.sizeIn * d.aspect), HALF_MAX_W_IN) : null;
          const rH = (rW !== null && d.aspect) ? rW / d.aspect : Math.min(toRealH(d.sizeIn), HALF_MAX_H_IN);
          label.textContent = rW !== null ? `${rW.toFixed(1)}"W × ${rH.toFixed(1)}"H` : `${rH.toFixed(1)}"H`;
        }
      });
    });
  }

  function addDesign2(name, src) {
    const id = String(Date.now() + Math.random() + 0.5);
    const offset = selectedDesigns2.length * 8;
    const defaultPreviewIn = WB_MAX_H_IN / WB_SCALE_H;
    const defaultPct = 100;
    const d = { id, name, src, number: selectedDesigns2.length + 1, posX: clamp(50 + offset, 10, 85), posY: clamp(40 + offset, 10, 85), size: defaultPct, sizeIn: defaultPreviewIn, aspect: null, el: null };
    selectedDesigns2.push(d);
    if (designsOverlay2) designsOverlay2.appendChild(createDesignElement2(d));
    const probe = new Image();
    probe.onload = () => {
      d.aspect = probe.naturalWidth / probe.naturalHeight;
      const maxIn = maxPreviewHForAspect(d.aspect, HALF_MAX_W_IN, HALF_MAX_H_IN);
      if (d.sizeIn > maxIn) {
        d.sizeIn = maxIn;
        d.size = (d.sizeIn / (WB_MAX_H_IN / WB_SCALE_H)) * 100;
        if (d.el) d.el.style.height = `${d.size}%`;
      }
      updateAllPositionReadouts2();
    };
    probe.src = src;
    updateAllPositionReadouts2();
  }

  function removeDesign2(name) {
    const idx = selectedDesigns2.findIndex(d => d.name === name);
    if (idx === -1) return;
    const d = selectedDesigns2[idx];
    if (d.el && d.el.parentNode) d.el.parentNode.removeChild(d.el);
    selectedDesigns2.splice(idx, 1);
    selectedDesigns2.forEach((d, i) => {
      d.number = i + 1;
      const badge = d.el ? d.el.querySelector('.design-badge') : null;
      if (badge) badge.textContent = i + 1;
    });
    updateAllPositionReadouts2();
  }
  function addDesign(name, src) {
    const id = String(Date.now() + Math.random());
    const offset = selectedDesigns.length * 8;
    const defaultPreviewIn = WB_MAX_H_IN / WB_SCALE_H;  // 6.5" preview → 6.5" real
    const defaultPct = 100;  // 100% of overlay height = full bottle height
    const d = { id, name, src, number: selectedDesigns.length + 1, posX: clamp(50 + offset, 10, 85), posY: clamp(40 + offset, 10, 85), size: defaultPct, sizeIn: defaultPreviewIn, aspect: null, el: null };
    selectedDesigns.push(d);
    if (designsOverlay) designsOverlay.appendChild(createDesignElement(d));

    // Measure aspect ratio so slider max and width display are accurate
    const probe = new Image();
    probe.onload = () => {
      d.aspect = probe.naturalWidth / probe.naturalHeight;
      const maxIn = maxPreviewHForAspect(d.aspect);
      if (d.sizeIn > maxIn) {
        d.sizeIn = maxIn;
        d.size = (d.sizeIn / (WB_MAX_H_IN / WB_SCALE_H)) * 100;
        if (d.el) d.el.style.height = `${d.size}%`;
      }
      updateAllPositionReadouts();
    };
    probe.src = src;

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

    const keychainImages = {
      'Walnut Key Left':           'images/walnut/walnutkeyleft.png',
      'Walnut Key Right':          'images/walnut/walnutkeyright.png',
      'Walnut Key Up':             'images/walnut/walnutkeyup.png',
      'Slate Key Left':            'images/slate/slatekeyleft.png',
      'Slate Key Right':           'images/slate/slatekeyright.png',
      'Slate Key Up':              'images/slate/slatekeyup.png',
      'Book Left':                 'images/bookmark/bookleft.png',
      'Book Right':                'images/bookmark/bookright.png',
      'Book Up':                   'images/bookmark/bookup.png',
      'Aqua Water Bottle':         'images/water/aqua.png',
      'Dark Blue Water Bottle':    'images/water/darkblue.png',
      'Light Purple Water Bottle': 'images/water/lightpurple.png',
      'Black Water Bottle':        'images/water/black.png',
      'Dark Green Water Bottle':   'images/water/darkgreen.png',
      'Red Water Bottle':          'images/water/red.png',
      'Pink Water Bottle':         'images/water/pink.png'
    };

    if (selectedColor && previewNotebook) {
      previewNotebook.src = keychainImages[selectedColor] || `images/colors/${selectedColor.toLowerCase()}.png`;
      if (previewText && textColors[selectedColor]) previewText.style.color = textColors[selectedColor];
      // Sync same bottle image to side 2
      if (previewNotebook2) previewNotebook2.src = previewNotebook.src;
      if (previewText2 && textColors[selectedColor]) previewText2.style.color = textColors[selectedColor];
      selectedDesigns.forEach(d => {
        if (!d.el) return;
        const img = d.el.querySelector('img');
        if (img) applyDesignFilter(img);
      });
      selectedDesigns2.forEach(d => {
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
      const rotateTransform = textOrientation === 'sideways' ? 'translate(-50%,-50%) rotate(-90deg)' : 'translate(-50%,-50%)';
      previewTextContainer.style.transform = rotateTransform;
      previewTextContainer.style.display = "block";
      updateTextPositionReadout();
      // Sync font and orientation to side 2 text
      if (previewText2) {
        previewText2.style.setProperty('font-family', fontFamilies[selectedFont] || 'serif', 'important');
        previewText2.style.setProperty('font-size', `${previewFontSize2}px`, 'important');
        previewText2.textContent = (selectedEngravingText && selectedEngravingText.trim()) ? selectedEngravingText.trim() : "Your Text";
      }
      if (previewTextContainer2 && previewTextContainer2.style.display !== 'none') {
        previewTextContainer2.style.left = `${textPosX2}%`;
        previewTextContainer2.style.top = `${textPosY2}%`;
        previewTextContainer2.style.transform = rotateTransform;
      }
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
  // ── ENGRAVING TEXT (multi-line) ───────────────────────────
  function getEngravingLines() {
    const single = (document.getElementById('engraving-text') || {}).value || '';
    const l1 = (document.getElementById('engraving-line1') || {}).value || single;
    const l2 = (document.getElementById('engraving-line1') ? (document.getElementById('engraving-line2') || {}).value || '' : '');
    const l3 = (document.getElementById('engraving-line1') ? (document.getElementById('engraving-line3') || {}).value || '' : '');
    const lines = parseInt((document.getElementById('text-lines-select') || {}).value) || 1;
    if (lines === 3) return [l1, l2, l3];
    if (lines === 2) return [l1, l2];
    return [l1];
  }

  function buildEngravingText() {
    return getEngravingLines().filter(l => l.trim()).join('\n');
  }

  function onEngravingInput() {
    selectedEngravingText = buildEngravingText();
    updatePreview();
  }

  ['engraving-line1', 'engraving-line2', 'engraving-line3', 'engraving-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', onEngravingInput);
  });
  const textLinesSelectEl = document.getElementById('text-lines-select');
  if (textLinesSelectEl) textLinesSelectEl.addEventListener('change', onEngravingInput);

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
        // Full Wrap: only 1 image allowed — deselect any existing before adding
        const isFull = document.querySelector('input[name="image-wrap"]:checked')?.value === 'Full Wrap Around';
        const isHalf = document.querySelector('input[name="image-wrap"]:checked')?.value === 'Half Wrap Around';
        if (isFull || (!isFull && !isHalf)) {
          // Single-select: clear all existing designs first
          [...selectedDesigns].forEach(d => {
            const existing = document.querySelector(`#logo-options .option-card.image-option[data-logo="${CSS.escape(d.name)}"]`);
            if (existing) existing.classList.remove('selected');
            // Also uncheck the visible checkbox
            const cb = document.querySelector(`.design-radio-item input[name="design-pick"][value="${CSS.escape(d.name)}"]`);
            if (cb) { cb.checked = false; cb.closest('.design-radio-item').classList.remove('checked'); }
            removeDesign(d.name);
          });
        }
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

  // ── TEXT ORIENTATION ──────────────────────────────────────
  document.addEventListener('change', (e) => {
    if (e.target.name !== 'text-orientation') return;
    textOrientation = e.target.checked ? e.target.value : 'straight';
    updatePreview();
  });
  // Handle uncheck (radio cleared back to no selection = straight)
  document.addEventListener('click', (e) => {
    if (e.target.name !== 'text-orientation') return;
    // If the radio was just unchecked by the uncheck handler, reset to straight
    setTimeout(() => {
      const checked = document.querySelector('input[name="text-orientation"]:checked');
      textOrientation = checked ? checked.value : 'straight';
      updatePreview();
    }, 0);
  });

  // Side 2 font size control
  const fontSizeControl2 = document.getElementById("font-size-control-2");
  const fontSizeDisplay2 = document.getElementById("font-size-display-2");
  if (fontSizeControl2 && fontSizeDisplay2) {
    fontSizeControl2.addEventListener("input", (e) => {
      previewFontSize2 = parseInt(e.target.value);
      fontSizeDisplay2.textContent = `${previewFontSize2}px`;
      if (previewText2 && selectedFont) {
        previewText2.style.setProperty('font-size', `${previewFontSize2}px`, 'important');
      }
    });
  }

  // ── IMAGE WRAP: show/hide side 2 + max out on Full Wrap ──
  document.addEventListener('change', (e) => {
    if (e.target.name !== 'image-wrap') return;
    const isHalf = e.target.value === 'Half Wrap Around';
    const isFull = e.target.value === 'Full Wrap Around';

    // Update global flag so maxPreviewHForAspect uses the right limits
    isHalfWrapActive = isHalf;

    // Show or hide side 2 panel
    const side2Wrapper = document.getElementById('side2-preview-wrapper');
    const side2Controls = document.getElementById('side2-controls');
    const side1Label = document.getElementById('side1-label');
    const side1ControlsLabel = document.getElementById('side1-controls-label');
    if (side2Wrapper) side2Wrapper.style.display = isHalf ? 'block' : 'none';
    if (side2Controls) side2Controls.style.display = isHalf ? 'block' : 'none';
    if (side1Label) side1Label.style.display = isHalf ? 'block' : 'none';
    if (side1ControlsLabel) side1ControlsLabel.style.display = isHalf ? 'block' : 'none';

    // Update the info note
    const halfNote = document.getElementById('half-wrap-note');
    if (halfNote) halfNote.style.display = isHalf ? 'inline' : 'none';

    // Sync bottle image to side 2 when shown
    if (isHalf && previewNotebook2 && previewNotebook) {
      previewNotebook2.src = previewNotebook.src;
    }

    // Clamp all Side 1 designs to the now-active limits and refresh sliders
    if (selectedDesigns.length > 0) {
      const previewMaxIn = WB_MAX_H_IN / WB_SCALE_H;
      selectedDesigns.forEach(d => {
        const maxIn = maxPreviewHForAspect(d.aspect); // uses updated isHalfWrapActive
        if (d.sizeIn > maxIn) {
          d.sizeIn = maxIn;
          d.size = (d.sizeIn / previewMaxIn) * 100;
          if (d.el) d.el.style.height = `${d.size}%`;
        }
      });
      updateAllPositionReadouts();
    }

    // Full Wrap: max out all Side 1 designs to full limits
    if (isFull && selectedDesigns.length > 0) {
      const previewMaxIn = WB_MAX_H_IN / WB_SCALE_H;
      selectedDesigns.forEach(d => {
        const maxIn = maxPreviewHForAspect(d.aspect);
        d.sizeIn = maxIn;
        d.size = (d.sizeIn / previewMaxIn) * 100;
        if (d.el) d.el.style.height = `${d.size}%`;
      });
      updateAllPositionReadouts();
    }
  });
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

  // Side 2 text drag
  if (previewTextContainer2) {
    previewTextContainer2.addEventListener('mousedown', (e) => {
      if (previewTextContainer2.style.display === 'none') return;
      e.preventDefault();
      isTextDragging2 = true;
      textDragStartX2 = e.clientX; textDragStartY2 = e.clientY;
      textElemStartX2 = textPosX2; textElemStartY2 = textPosY2;
      previewTextContainer2.style.cursor = 'grabbing';
      const hint = document.getElementById('text-drag-hint-2');
      if (hint) hint.style.display = 'none';
    });
    previewTextContainer2.addEventListener('touchstart', (e) => {
      if (previewTextContainer2.style.display === 'none') return;
      const t = e.touches[0];
      isTextDragging2 = true;
      textDragStartX2 = t.clientX; textDragStartY2 = t.clientY;
      textElemStartX2 = textPosX2; textElemStartY2 = textPosY2;
      const hint = document.getElementById('text-drag-hint-2');
      if (hint) hint.style.display = 'none';
    }, { passive: true });
    document.addEventListener('mousemove', (e) => {
      if (!isTextDragging2) return;
      const rect = getNotebook2Rect(); if (!rect) return;
      textPosX2 = clamp(textElemStartX2 + ((e.clientX - textDragStartX2) / rect.width) * 100, 5, 95);
      textPosY2 = clamp(textElemStartY2 + ((e.clientY - textDragStartY2) / rect.height) * 100, 5, 95);
      previewTextContainer2.style.left = `${textPosX2}%`;
      previewTextContainer2.style.top = `${textPosY2}%`;
    });
    document.addEventListener('touchmove', (e) => {
      if (!isTextDragging2) return;
      const rect = getNotebook2Rect(); if (!rect) return;
      const t = e.touches[0];
      textPosX2 = clamp(textElemStartX2 + ((t.clientX - textDragStartX2) / rect.width) * 100, 5, 95);
      textPosY2 = clamp(textElemStartY2 + ((t.clientY - textDragStartY2) / rect.height) * 100, 5, 95);
      previewTextContainer2.style.left = `${textPosX2}%`;
      previewTextContainer2.style.top = `${textPosY2}%`;
    }, { passive: true });
    document.addEventListener('mouseup', () => { isTextDragging2 = false; if (previewTextContainer2) previewTextContainer2.style.cursor = 'grab'; });
    document.addEventListener('touchend', () => { isTextDragging2 = false; });
  }

  // ── SIDE 2 DESIGN EVENTS (dispatched from waterbottle.html checkbox handler) ──
  document.addEventListener('wb-add-design2', (e) => {
    const { name, src } = e.detail;
    // Side 2 is always single-select — clear existing before adding
    [...selectedDesigns2].forEach(d => {
      removeDesign2(d.name);
      const cb = document.querySelector(`.design-radio-item input[name="design-pick-2"][value="${CSS.escape(d.name)}"]`);
      if (cb) { cb.checked = false; cb.closest('.design-radio-item').classList.remove('checked'); }
    });
    addDesign2(name, src);
  });
  document.addEventListener('wb-remove-design2', (e) => {
    removeDesign2(e.detail.name);
  });
  document.addEventListener('wb-clear-designs2', () => {
    [...selectedDesigns2].forEach(d => removeDesign2(d.name));
  });

  // ── LIGHTBOX ──────────────────────────────────────────────
  const lightbox = document.getElementById("image-lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  if (lightbox && lightboxImg && lightboxClose) {
    document.querySelectorAll(".design-thumb").forEach(img => {
      img.addEventListener("click", (e) => {
        // Don't intercept clicks on color-picker buttons — let them bubble up to [data-color]
        if (img.closest('[data-color]')) return;
        e.stopPropagation();
        lightboxImg.src = img.src;
        lightbox.classList.add("open");
      });
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
  const orderBtn = document.getElementById("orderNotebook") || document.getElementById("orderKeychain") || document.getElementById("orderCoaster") || document.getElementById("orderBookmark") || document.getElementById("orderWaterbottle");
  const isKeychainPage    = !!document.getElementById("orderKeychain");
  const isCoasterPage     = !!document.getElementById("orderCoaster");
  const isBookmarkPage    = !!document.getElementById("orderBookmark");
  const isWaterBottlePage = !!document.getElementById("orderWaterbottle");
  const isNoColorPage     = isKeychainPage || isCoasterPage || isBookmarkPage;

  if (orderBtn) {
    orderBtn.addEventListener("click", async () => {
      // For the notebook page, designs are managed by the inline script
      var backDesignsCount = (typeof window.getBackDesigns === 'function') ? window.getBackDesigns().length : 0;
      var inlineFrontCount = (typeof window.getFrontDesigns === 'function') ? window.getFrontDesigns().length : 0;
      var totalDesigns = selectedDesigns.length + inlineFrontCount + backDesignsCount;
      if (!isNoColorPage && !isWaterBottlePage && (!selectedColor || totalDesigns === 0)) {
        alert("Please select a color and at least one design before continuing.");
        return;
      }
      if (isNoColorPage && selectedDesigns.length === 0) {
        alert("Please select at least one design before continuing.");
        return;
      }
      if (selectedFont && (!selectedEngravingText || !selectedEngravingText.trim())) {
        alert("Please enter the text you want engraved before continuing.");
        return;
      }

      // ── WATER BOTTLE: validate wrap + line selections ─────
      if (isWaterBottlePage) {
        const engravingText = buildEngravingText();
        const hasText   = engravingText.trim().length > 0;
        const textLines = (document.getElementById('text-lines-select') || {}).value || '';
        const textWrap  = document.querySelector('input[name="text-wrap"]:checked');
        const imageWrap = document.querySelector('input[name="image-wrap"]:checked');

        if (hasText && !textLines) {
          alert('Please select how many lines you would like your text on before continuing.');
          const el = document.getElementById('text-lines-select');
          if (el) el.focus();
          return;
        }
        if (hasText && !textWrap) {
          alert('Please select a Text Wrap option (Full or Half Wrap Around) before continuing.');
          const el = document.querySelector('input[name="text-wrap"]');
          if (el) el.focus();
          return;
        }
        if (!imageWrap) {
          alert('Please select an Image Wrap option (Full or Half Wrap Around) before continuing.');
          const el = document.querySelector('input[name="image-wrap"]');
          if (el) el.focus();
          return;
        }

        localStorage.setItem('text_lines', textLines || '');
        localStorage.setItem('text_wrap',  textWrap  ? textWrap.value  : '');
        localStorage.setItem('image_wrap', imageWrap ? imageWrap.value : '');
        localStorage.setItem('text_orientation', textOrientation);
      }

      orderBtn.disabled = true;
      orderBtn.textContent = "📸 Capturing your design...";

      const productName = isBookmarkPage    ? 'Custom Bookmark'
                        : isCoasterPage     ? 'Slate Coaster'
                        : isKeychainPage    ? (document.title.toLowerCase().includes('slate') ? 'Slate Keychain' : 'Walnut Keychain')
                        : isWaterBottlePage ? 'Water Bottle'
                        : 'Custom Notebook';

      localStorage.setItem("product", productName);
      localStorage.setItem("color", selectedColor || "");
      localStorage.setItem("font", selectedFont || "");
      localStorage.setItem("font_size", selectedFont ? `${previewFontSize}px` : "");
      localStorage.setItem("engraving_text", selectedEngravingText.trim() || "");
      const engLines = getEngravingLines();
      localStorage.setItem("engraving_line1", engLines[0] || "");
      localStorage.setItem("engraving_line2", engLines[1] || "");
      localStorage.setItem("engraving_line3", engLines[2] || "");
      // For notebook page, front designs are managed by the inline script
      const notebookFrontDesigns = (typeof window.getFrontDesigns === 'function') ? window.getFrontDesigns() : null;
      const frontDesignsForOrder = notebookFrontDesigns || selectedDesigns;

      localStorage.setItem("design_number", frontDesignsForOrder.map(d => d.name).join(', '));

      // Save back designs from the notebook inline script (if present)
      if (typeof window.getBackDesigns === 'function') {
        const backDesignsArr = window.getBackDesigns();
        localStorage.setItem("design_number_back", backDesignsArr.map(d => d.name).join(', '));
      }

      const designsData = frontDesignsForOrder.map((d, i) => {
        // Inline notebook front designs just have name/src/size — no inch calc
        if (notebookFrontDesigns) {
          return { side: 'front', number: i + 1, name: d.name, size: (d.size || 25) + '%' };
        }
        const { xC, yC, xE, yE } = calcInches(d);
        const previewIn = d.sizeIn !== undefined ? d.sizeIn : (WB_MAX_H_IN / WB_SCALE_H);
        const rW = d.aspect ? Math.min(toRealW(previewIn * d.aspect), WB_MAX_W_IN) : null;
        const rH = (rW !== null && d.aspect) ? rW / d.aspect : Math.min(toRealH(previewIn), WB_MAX_H_IN);
        const sizeStr = rW !== null ? `${rW.toFixed(1)}"W × ${rH.toFixed(1)}"H` : `${rH.toFixed(1)}"H`;
        return { side: 1, number: d.number, name: d.name, size: sizeStr, centerX: `${xC}"`, centerY: `${yC}"`, leftEdge: `${xE}"`, topEdge: `${yE}"` };
      });

      // Include Side 2 designs if Half Wrap is selected
      const designs2Data = selectedDesigns2.map(d => {
        const { xC, yC, xE, yE } = calcInches(d);
        const previewIn = d.sizeIn !== undefined ? d.sizeIn : (WB_MAX_H_IN / WB_SCALE_H);
        const rW = d.aspect ? Math.min(toRealW(previewIn * d.aspect), WB_MAX_W_IN) : null;
        const rH = (rW !== null && d.aspect) ? rW / d.aspect : Math.min(toRealH(previewIn), WB_MAX_H_IN);
        const sizeStr = rW !== null ? `${rW.toFixed(1)}"W × ${rH.toFixed(1)}"H` : `${rH.toFixed(1)}"H`;
        return { side: 2, number: d.number, name: d.name, size: sizeStr, centerX: `${xC}"`, centerY: `${yC}"`, leftEdge: `${xE}"`, topEdge: `${yE}"` };
      });

      localStorage.setItem("designs", JSON.stringify([...designsData, ...designs2Data]));
      localStorage.setItem("design_number_side2", selectedDesigns2.map(d => d.name).join(', '));

      // For notebook page: merge backDesigns from inline script into designs JSON
      if (typeof window.getBackDesigns === 'function') {
        const nbBackDesigns = window.getBackDesigns();
        if (nbBackDesigns.length > 0) {
          const nbBackData = nbBackDesigns.map((d, i) => ({
            side: 'back', number: i + 1, name: d.name, size: (d.size || 25) + '%'
          }));
          const combined = JSON.parse(localStorage.getItem("designs") || '[]');
          localStorage.setItem("designs", JSON.stringify([...combined, ...nbBackData]));
        }
      }

      const txIn = ((textPosX / 100) * NOTEBOOK_WIDTH_IN).toFixed(2);
      const tyIn = ((textPosY / 100) * NOTEBOOK_HEIGHT_IN).toFixed(2);
      localStorage.setItem("text_pos_x", `${txIn} inches from left`);
      localStorage.setItem("text_pos_y", `${tyIn} inches from top`);
      const txIn2 = ((textPosX2 / 100) * NOTEBOOK_WIDTH_IN).toFixed(2);
      const tyIn2 = ((textPosY2 / 100) * NOTEBOOK_HEIGHT_IN).toFixed(2);
      localStorage.setItem("text_pos_x_side2", `${txIn2} inches from left`);
      localStorage.setItem("text_pos_y_side2", `${tyIn2} inches from top`);

      // ── SNAPSHOT: capture front + back preview ────
      try {
        // Capture the full preview section which includes both front and back
        const captureTarget = document.getElementById('preview-section') || (previewNotebook ? previewNotebook.parentElement : null);
        if (captureTarget && typeof html2canvas !== 'undefined') {
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

          const canvas = await html2canvas(captureTarget, {
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

          // Store base64 directly — no external upload needed
          localStorage.setItem("design_snapshot_url", "data:image/jpeg;base64," + base64);
          localStorage.setItem("design_snapshot_base64", base64);
        }
      } catch (err) {
        console.warn("Snapshot failed:", err);
        localStorage.setItem("design_snapshot_url", "Snapshot unavailable");
      }

      orderBtn.textContent = "✅ Redirecting to order form...";
      setTimeout(() => {
        const snapshotUrl = localStorage.getItem('design_snapshot_url') || '';
        if (localStorage.getItem('adding_item') === 'true') {
          localStorage.setItem('pending_item', JSON.stringify({
            product:    productName,
            design:     selectedDesigns.map(d => d.name).join(', '),
            color:      selectedColor || '',
            engraving:  selectedEngravingText.trim() || '',
            font:       selectedFont || '',
            snapshot:   snapshotUrl,
            text_lines: localStorage.getItem('text_lines') || '',
            text_wrap:  localStorage.getItem('text_wrap')  || '',
            image_wrap: localStorage.getItem('image_wrap') || ''
          }));
        } else {
          localStorage.setItem('from_catalog', 'true');
          localStorage.setItem('item_snapshot', snapshotUrl);
        }
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

  if (engravingText && document.getElementById("engraving-line1")) {
    // Restore individual lines if we have them, otherwise put full text in line 1
    const l1 = localStorage.getItem("engraving_line1");
    const l2 = localStorage.getItem("engraving_line2");
    const l3 = localStorage.getItem("engraving_line3");
    if (l1 !== null) {
      if (document.getElementById("engraving-line1")) document.getElementById("engraving-line1").value = l1;
      if (l2 && document.getElementById("engraving-line2")) document.getElementById("engraving-line2").value = l2;
      if (l3 && document.getElementById("engraving-line3")) document.getElementById("engraving-line3").value = l3;
    } else {
      if (document.getElementById("engraving-line1")) document.getElementById("engraving-line1").value = engravingText;
    }
  }
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
  if (designsSaved && document.getElementById("designs-data")) {
    try {
      const parsed = JSON.parse(designsSaved);
      const readable = parsed.map(d => {
        const side = d.side === 'front' ? 'Front' : d.side === 'back' ? 'Back' : `Side ${d.side}`;
        const parts = [`${side} - Design ${d.number}: ${d.name}`, `Size: ${d.size}`];
        if (d.centerX) parts.push(`Center: ${d.centerX} from left, ${d.centerY} from top`);
        if (d.leftEdge) parts.push(`Edge: ${d.leftEdge} from left, ${d.topEdge} from top`);
        return parts.join(' | ');
      }).join('\n');
      document.getElementById("designs-data").value = readable;
    } catch(e) {
      document.getElementById("designs-data").value = designsSaved;
    }
  }
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

  // ── EMAILJS ORDER NOTIFICATION ───────────────────────────
  const orderForm = document.querySelector('form[name="custom-notebook-order"]');
  if (orderForm) {
    orderForm.addEventListener('submit', async function(e) {
      e.preventDefault(); // Hold the form while EmailJS sends

      // Collect all form field values
      const getValue = id => (document.getElementById(id) || {}).value || '';
      const templateParams = {
        order_number:        getValue('order-number'),
        name:                getValue('name'),
        email:               getValue('email'),
        phone:               getValue('phone'),
        product:             getValue('product'),
        design_number:       getValue('design-number'),
        color:               getValue('color'),
        font:                getValue('font'),
        font_size:           getValue('font-size'),
        engraving_text:      getValue('engraving-text-form') || getValue('engraving-line1'),
        designs_data:        getValue('designs-data'),
        text_pos_x:          getValue('text-pos-x'),
        text_pos_y:          getValue('text-pos-y'),
        text_lines:          getValue('text-lines'),
        text_wrap:           getValue('text-wrap'),
        image_wrap:          getValue('image-wrap'),
        design_snapshot_url: getValue('design-snapshot-url'),
        design_snapshot_base64: localStorage.getItem('design_snapshot_base64') || '',
        notes:               getValue('notes'),
      };

      // Send email via EmailJS and wait for it to finish
      if (typeof emailjs !== 'undefined') {
        try {
          await emailjs.send('service_ge7r0cu', 'template_855gskr', templateParams);
          console.log('EmailJS sent successfully');
        } catch(err) {
          console.warn('EmailJS error:', err);
        }
      }

      // Re-enable any disabled fields so Netlify captures them
      orderForm.querySelectorAll('[disabled]').forEach(el => el.removeAttribute('disabled'));

      // Now submit to Netlify
      orderForm.submit();
    });
  }

  // ── KEYCHAIN PAGE: auto-init preview & design overlay ────
  // If this is a keychain page (has [data-color] buttons with walnut paths),
  // pre-select the first keychain so the preview image shows on load.
  const keychainBtns = document.querySelectorAll('[data-color]');
  if (keychainBtns.length > 0 && previewNotebook) {
    const firstBtn = keychainBtns[0];
    // Only auto-init if not already selected
    if (!selectedColor) {
      selectedColor = firstBtn.dataset.color;
      firstBtn.classList.add('selected');
      const keychainMap = {
        'Walnut Key Left':           'images/walnut/walnutkeyleft.png',
        'Walnut Key Right':          'images/walnut/walnutkeyright.png',
        'Walnut Key Up':             'images/walnut/walnutkeyup.png',
        'Slate Key Left':            'images/slate/slatekeyleft.png',
        'Slate Key Right':           'images/slate/slatekeyright.png',
        'Slate Key Up':              'images/slate/slatekeyup.png',
        'Book Left':                 'images/bookmark/bookleft.png',
        'Book Right':                'images/bookmark/bookright.png',
        'Book Up':                   'images/bookmark/bookup.png',
        'Aqua Water Bottle':         'images/water/aqua.png',
        'Dark Blue Water Bottle':    'images/water/darkblue.png',
        'Light Purple Water Bottle': 'images/water/lightpurple.png',
        'Black Water Bottle':        'images/water/black.png',
        'Dark Green Water Bottle':   'images/water/darkgreen.png',
        'Red Water Bottle':          'images/water/red.png',
        'Pink Water Bottle':         'images/water/pink.png'
      };
      previewNotebook.src = keychainMap[selectedColor] || '';
      if (previewSection) previewSection.style.display = 'block';
    }
  }


});
