/* LICITATIONBIZNIS - POPUPS DE DETALHAMENTO REDIMENSIONAVEIS
   Permite alterar largura e altura arrastando qualquer canto.
   Duplo clique em um canto restaura o tamanho padrão. */
(function () {
  'use strict';

  const CONFIG = {
    'popup-disputa': { minWidth: 680, minHeight: 420 },
    'popup-empenho': { minWidth: 620, minHeight: 400 },
    'popup-acomp': { minWidth: 520, minHeight: 360 }
  };
  const STORAGE_PREFIX = 'lb-popup-size-v1:';
  const DIRECTIONS = ['nw', 'ne', 'sw', 'se'];

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function popupBox(overlay) {
    return overlay ? overlay.querySelector(':scope > .detail-popup') : null;
  }

  function viewportLimits() {
    return {
      width: Math.max(300, window.innerWidth - 8),
      height: Math.max(300, window.innerHeight - 8)
    };
  }

  function saveSize(id, box) {
    try {
      localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({
        width: Math.round(box.getBoundingClientRect().width),
        height: Math.round(box.getBoundingClientRect().height)
      }));
    } catch (_) {}
  }

  function readSize(id) {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_PREFIX + id) || 'null');
      return data && Number.isFinite(data.width) && Number.isFinite(data.height) ? data : null;
    } catch (_) {
      return null;
    }
  }

  function centerBox(box, width, height) {
    const limits = viewportLimits();
    const w = clamp(width, 300, limits.width);
    const h = clamp(height, 300, limits.height);
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    box.style.left = Math.max(4, (window.innerWidth - w) / 2) + 'px';
    box.style.top = Math.max(4, (window.innerHeight - h) / 2) + 'px';
    box.classList.add('lb-resized');
  }

  function restoreSavedSize(overlay) {
    const box = popupBox(overlay);
    const saved = readSize(overlay.id);
    if (!box || !saved) return;
    centerBox(box, saved.width, saved.height);
  }

  function resetSize(overlay) {
    const box = popupBox(overlay);
    if (!box) return;
    try { localStorage.removeItem(STORAGE_PREFIX + overlay.id); } catch (_) {}
    box.classList.remove('lb-resized', 'lb-resizing');
    ['width', 'height', 'left', 'top', 'position'].forEach(prop => box.style.removeProperty(prop));
  }

  function beginResize(event, overlay, direction) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();

    const box = popupBox(overlay);
    if (!box) return;
    const config = CONFIG[overlay.id];
    const start = box.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const handle = event.currentTarget;

    box.style.width = start.width + 'px';
    box.style.height = start.height + 'px';
    box.style.left = start.left + 'px';
    box.style.top = start.top + 'px';
    box.classList.add('lb-resized', 'lb-resizing');
    document.body.classList.add('lb-popup-resizing');
    document.body.style.cursor = getComputedStyle(handle).cursor;
    if (handle.setPointerCapture && pointerId !== undefined) handle.setPointerCapture(pointerId);

    function move(e) {
      if (pointerId !== undefined && e.pointerId !== pointerId) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const limits = viewportLimits();
      let left = start.left;
      let top = start.top;
      let width = start.width;
      let height = start.height;

      if (direction.includes('e')) width = start.width + dx;
      if (direction.includes('s')) height = start.height + dy;
      if (direction.includes('w')) {
        width = start.width - dx;
        left = start.left + dx;
      }
      if (direction.includes('n')) {
        height = start.height - dy;
        top = start.top + dy;
      }

      width = clamp(width, config.minWidth, limits.width);
      height = clamp(height, config.minHeight, limits.height);

      if (direction.includes('w')) left = start.right - width;
      if (direction.includes('n')) top = start.bottom - height;
      left = clamp(left, 4, Math.max(4, window.innerWidth - width - 4));
      top = clamp(top, 4, Math.max(4, window.innerHeight - height - 4));

      box.style.width = width + 'px';
      box.style.height = height + 'px';
      box.style.left = left + 'px';
      box.style.top = top + 'px';
    }

    function end(e) {
      if (pointerId !== undefined && e.pointerId !== pointerId) return;
      box.classList.remove('lb-resizing');
      document.body.classList.remove('lb-popup-resizing');
      document.body.style.removeProperty('cursor');
      saveSize(overlay.id, box);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      if (handle.releasePointerCapture && pointerId !== undefined && handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
    }

    handle.addEventListener('pointermove', move, { passive: false });
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function install(overlay) {
    if (!overlay || overlay.dataset.lbResizable === '1') return;
    const box = popupBox(overlay);
    if (!box) return;

    DIRECTIONS.forEach(direction => {
      const handle = document.createElement('div');
      handle.className = 'lb-resize-handle lb-resize-handle--' + direction;
      handle.dataset.direction = direction;
      handle.setAttribute('aria-hidden', 'true');
      handle.title = 'Arraste para redimensionar. Clique duas vezes para restaurar.';
      handle.addEventListener('pointerdown', event => beginResize(event, overlay, direction));
      handle.addEventListener('dblclick', event => {
        event.preventDefault();
        event.stopPropagation();
        resetSize(overlay);
      });
      box.appendChild(handle);
    });

    overlay.dataset.lbResizable = '1';
    restoreSavedSize(overlay);
  }

  function installAll() {
    Object.keys(CONFIG).forEach(id => install(document.getElementById(id)));
  }

  function keepInsideViewport() {
    Object.keys(CONFIG).forEach(id => {
      const overlay = document.getElementById(id);
      const box = popupBox(overlay);
      if (!box || !box.classList.contains('lb-resized')) return;
      const rect = box.getBoundingClientRect();
      centerBox(box, rect.width, rect.height);
    });
  }

  function start() {
    installAll();
    new MutationObserver(installAll).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', keepInsideViewport, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
