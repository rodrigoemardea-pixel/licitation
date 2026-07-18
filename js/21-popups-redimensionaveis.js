/* LICITATIONBIZNIS - POPUPS REDIMENSIONAVEIS - VERSAO CORRIGIDA
   Arquivo autonomo: injeta o CSS e ativa os quatro cantos de redimensionamento. */
(function () {
  'use strict';

  const POPUPS = {
    'popup-disputa': { minWidth: 700, minHeight: 430 },
    'popup-empenho': { minWidth: 640, minHeight: 410 },
    'popup-acomp': { minWidth: 540, minHeight: 370 }
  };
  const STORAGE_PREFIX = 'lb-popup-dimensoes-v2:';
  const STYLE_ID = 'lb-popup-resize-style-v2';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #popup-disputa .detail-popup,
      #popup-empenho .detail-popup,
      #popup-acomp .detail-popup {
        position: relative !important;
        box-sizing: border-box !important;
        max-width: calc(100vw - 16px) !important;
        max-height: calc(100dvh - 16px) !important;
      }
      .detail-popup.lb-popup-redimensionado,
      .detail-popup.lb-popup-redimensionando {
        position: fixed !important;
        margin: 0 !important;
        transform: none !important;
        max-width: calc(100vw - 8px) !important;
        max-height: calc(100dvh - 8px) !important;
      }
      .detail-popup.lb-popup-redimensionando {
        user-select: none !important;
        transition: none !important;
      }
      .lb-canto-redimensionar {
        position: absolute !important;
        z-index: 2147483646 !important;
        width: 30px !important;
        height: 30px !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        touch-action: none !important;
        user-select: none !important;
      }
      .lb-canto-redimensionar::before {
        content: '' !important;
        position: absolute !important;
        width: 12px !important;
        height: 12px !important;
        opacity: .85 !important;
        pointer-events: none !important;
      }
      .lb-canto-nw { left: 0 !important; top: 0 !important; cursor: nwse-resize !important; }
      .lb-canto-ne { right: 0 !important; top: 0 !important; cursor: nesw-resize !important; }
      .lb-canto-sw { left: 0 !important; bottom: 0 !important; cursor: nesw-resize !important; }
      .lb-canto-se { right: 0 !important; bottom: 0 !important; cursor: nwse-resize !important; }
      .lb-canto-nw::before { left: 6px; top: 6px; border-left: 3px solid #2d6a4f; border-top: 3px solid #2d6a4f; }
      .lb-canto-ne::before { right: 6px; top: 6px; border-right: 3px solid #2d6a4f; border-top: 3px solid #2d6a4f; }
      .lb-canto-sw::before { left: 6px; bottom: 6px; border-left: 3px solid #2d6a4f; border-bottom: 3px solid #2d6a4f; }
      .lb-canto-se::before { right: 6px; bottom: 6px; border-right: 3px solid #2d6a4f; border-bottom: 3px solid #2d6a4f; }
      .lb-canto-redimensionar:hover::before { opacity: 1 !important; filter: drop-shadow(0 0 2px rgba(45,106,79,.45)); }
      .lb-resize-indicador {
        position: absolute !important;
        right: 42px !important;
        top: 18px !important;
        z-index: 60 !important;
        padding: 4px 8px !important;
        border: 1px solid #b9d4c8 !important;
        border-radius: 7px !important;
        background: #edf6f1 !important;
        color: #2d6a4f !important;
        font: 700 9px/1.2 'DM Sans', system-ui, sans-serif !important;
        letter-spacing: .15px !important;
        pointer-events: none !important;
      }
      #popup-d-body, #popup-e-body, #popup-ac-body {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: auto !important;
      }
      @media (max-width: 760px), (pointer: coarse) {
        .lb-resize-indicador { display: none !important; }
        .lb-canto-redimensionar { width: 38px !important; height: 38px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getBox(overlay) {
    return overlay ? overlay.querySelector('.detail-popup') : null;
  }

  function getSaved(id) {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_PREFIX + id) || 'null');
      return value && Number.isFinite(value.width) && Number.isFinite(value.height) ? value : null;
    } catch (_) { return null; }
  }

  function save(id, box) {
    const rect = box.getBoundingClientRect();
    try {
      localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      }));
    } catch (_) {}
  }

  function applyCentered(box, width, height) {
    const w = clamp(width, 300, window.innerWidth - 8);
    const h = clamp(height, 300, window.innerHeight - 8);
    box.classList.add('lb-popup-redimensionado');
    box.style.setProperty('width', w + 'px', 'important');
    box.style.setProperty('height', h + 'px', 'important');
    box.style.setProperty('left', Math.max(4, (window.innerWidth - w) / 2) + 'px', 'important');
    box.style.setProperty('top', Math.max(4, (window.innerHeight - h) / 2) + 'px', 'important');
  }

  function reset(overlay) {
    const box = getBox(overlay);
    if (!box) return;
    try { localStorage.removeItem(STORAGE_PREFIX + overlay.id); } catch (_) {}
    box.classList.remove('lb-popup-redimensionado', 'lb-popup-redimensionando');
    ['width', 'height', 'left', 'top'].forEach(name => box.style.removeProperty(name));
  }

  function startResize(event, overlay, direction) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const box = getBox(overlay);
    const cfg = POPUPS[overlay.id];
    if (!box || !cfg) return;

    const initial = box.getBoundingClientRect();
    const sx = event.clientX;
    const sy = event.clientY;
    const pointerId = event.pointerId;
    const handle = event.currentTarget;

    box.classList.add('lb-popup-redimensionado', 'lb-popup-redimensionando');
    box.style.setProperty('width', initial.width + 'px', 'important');
    box.style.setProperty('height', initial.height + 'px', 'important');
    box.style.setProperty('left', initial.left + 'px', 'important');
    box.style.setProperty('top', initial.top + 'px', 'important');

    if (handle.setPointerCapture && pointerId !== undefined) handle.setPointerCapture(pointerId);

    function move(e) {
      if (pointerId !== undefined && e.pointerId !== pointerId) return;
      e.preventDefault();
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      let width = initial.width;
      let height = initial.height;
      let left = initial.left;
      let top = initial.top;

      if (direction.indexOf('e') >= 0) width = initial.width + dx;
      if (direction.indexOf('s') >= 0) height = initial.height + dy;
      if (direction.indexOf('w') >= 0) width = initial.width - dx;
      if (direction.indexOf('n') >= 0) height = initial.height - dy;

      width = clamp(width, cfg.minWidth, window.innerWidth - 8);
      height = clamp(height, cfg.minHeight, window.innerHeight - 8);
      if (direction.indexOf('w') >= 0) left = initial.right - width;
      if (direction.indexOf('n') >= 0) top = initial.bottom - height;
      left = clamp(left, 4, Math.max(4, window.innerWidth - width - 4));
      top = clamp(top, 4, Math.max(4, window.innerHeight - height - 4));

      box.style.setProperty('width', width + 'px', 'important');
      box.style.setProperty('height', height + 'px', 'important');
      box.style.setProperty('left', left + 'px', 'important');
      box.style.setProperty('top', top + 'px', 'important');
    }

    function finish(e) {
      if (pointerId !== undefined && e.pointerId !== pointerId) return;
      box.classList.remove('lb-popup-redimensionando');
      save(overlay.id, box);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', finish);
      handle.removeEventListener('pointercancel', finish);
      if (handle.releasePointerCapture && pointerId !== undefined) {
        try { handle.releasePointerCapture(pointerId); } catch (_) {}
      }
    }

    handle.addEventListener('pointermove', move, { passive: false });
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
  }

  function installOne(id) {
    const overlay = document.getElementById(id);
    const box = getBox(overlay);
    if (!overlay || !box || box.dataset.lbResizeReady === '1') return;

    ['nw', 'ne', 'sw', 'se'].forEach(direction => {
      const handle = document.createElement('div');
      handle.className = 'lb-canto-redimensionar lb-canto-' + direction;
      handle.title = 'Arraste este canto para alterar largura e altura. Duplo clique para restaurar.';
      handle.setAttribute('aria-label', 'Redimensionar janela');
      handle.addEventListener('pointerdown', e => startResize(e, overlay, direction));
      handle.addEventListener('dblclick', e => {
        e.preventDefault();
        e.stopPropagation();
        reset(overlay);
      });
      box.appendChild(handle);
    });

    const indicator = document.createElement('div');
    indicator.className = 'lb-resize-indicador';
    indicator.textContent = 'Arraste os cantos';
    box.appendChild(indicator);

    box.dataset.lbResizeReady = '1';
    const saved = getSaved(id);
    if (saved) applyCentered(box, saved.width, saved.height);
  }

  function installAll() {
    Object.keys(POPUPS).forEach(installOne);
  }

  function start() {
    injectStyles();
    installAll();
    const observer = new MutationObserver(installAll);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', function () {
      Object.keys(POPUPS).forEach(id => {
        const box = getBox(document.getElementById(id));
        if (!box || !box.classList.contains('lb-popup-redimensionado')) return;
        const rect = box.getBoundingClientRect();
        applyCentered(box, rect.width, rect.height);
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
