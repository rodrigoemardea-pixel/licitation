/* LICITATIONBIZNIS: acessibilidade, persistencia e consistencia de UI */
(function(){
  'use strict';

  const STORAGE_PREFIX = 'lb-ui:';
  let lastFocused = null;

  function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }
  function visible(el){ return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }

  function enhanceDialogs(){
    qsa('.modal-overlay,.detail-popup-overlay,.wizard-overlay,.confirm-modal-overlay,.shortcuts-modal').forEach(overlay => {
      const dialog = overlay.querySelector('.modal,.detail-popup,.wizard,.confirm-modal-box,.shortcuts-modal-box');
      if(!dialog) return;
      dialog.setAttribute('role','dialog');
      dialog.setAttribute('aria-modal','true');
      const title = dialog.querySelector('.modal-title,.detail-popup-title,.confirm-modal-title,.shortcuts-modal-title,h2');
      if(title){
        if(!title.id) title.id = 'dialog-title-' + Math.random().toString(36).slice(2,9);
        dialog.setAttribute('aria-labelledby',title.id);
      }
      overlay.setAttribute('aria-hidden', visible(overlay) ? 'false' : 'true');
    });
  }

  function syncDialogState(){
    const openOverlay = qsa('.modal-overlay.open,.detail-popup-overlay.open,.wizard-overlay.open,.confirm-modal-overlay.open,.shortcuts-modal.open').find(visible);
    document.body.classList.toggle('lb-modal-open', !!openOverlay);
    qsa('.modal-overlay,.detail-popup-overlay,.wizard-overlay,.confirm-modal-overlay,.shortcuts-modal').forEach(el => {
      el.setAttribute('aria-hidden', el === openOverlay ? 'false' : 'true');
    });
    if(openOverlay){
      lastFocused = lastFocused || document.activeElement;
      const target = openOverlay.querySelector('input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex="0"]');
      if(target && !openOverlay.contains(document.activeElement)) setTimeout(()=>target.focus(),0);
    } else if(lastFocused && document.contains(lastFocused)){
      lastFocused.focus();
      lastFocused = null;
    }
  }

  function closeTopDialog(){
    const overlay = qsa('.modal-overlay.open,.detail-popup-overlay.open,.wizard-overlay.open,.confirm-modal-overlay.open,.shortcuts-modal.open').filter(visible).pop();
    if(!overlay) return false;
    const close = overlay.querySelector('.modal-close,.detail-close,[onclick*="closeModal"],[onclick*="fecharPopup"],[onclick*="closeConfirm"],[onclick*="closeWizard"]');
    if(close){ close.click(); return true; }
    return false;
  }

  function trapFocus(event){
    if(event.key !== 'Tab') return;
    const overlay = qsa('.modal-overlay.open,.detail-popup-overlay.open,.wizard-overlay.open,.confirm-modal-overlay.open,.shortcuts-modal.open').filter(visible).pop();
    if(!overlay) return;
    const items = qsa('button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', overlay).filter(visible);
    if(!items.length) return;
    const first=items[0], last=items[items.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  }

  function enhanceSortableHeaders(){
    qsa('th[onclick*="sort"],th[id^="sort-"]').forEach(th => {
      th.tabIndex = 0;
      th.setAttribute('role','button');
      if(!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort','none');
      th.addEventListener('keydown', e => {
        if(e.key==='Enter' || e.key===' '){ e.preventDefault(); th.click(); }
      });
    });
  }

  function syncSortAria(){
    qsa('th[onclick*="sort"],th[id^="sort-"]').forEach(th => {
      th.setAttribute('aria-sort', th.classList.contains('sort-asc') ? 'ascending' : th.classList.contains('sort-desc') ? 'descending' : 'none');
    });
  }

  function persistControls(){
    qsa('select[id^="filtro-"],select[id^="dash-filtro-"],input[id^="search-"]').forEach(control => {
      const key = STORAGE_PREFIX + control.id;
      try{
        const saved = sessionStorage.getItem(key);
        if(saved !== null && Array.from(control.options || []).some(o=>o.value===saved) || (saved !== null && control.tagName==='INPUT')) control.value=saved;
      }catch(_e){}
      control.addEventListener(control.tagName==='INPUT' ? 'input' : 'change', () => {
        try{ sessionStorage.setItem(key,control.value); }catch(_e){}
      });
    });
  }

  function improveRequiredFields(){
    qsa('label .required-mark').forEach(()=>{});
    qsa('label').forEach(label => {
      if(/\*\s*obrigatório/i.test(label.textContent) && !label.querySelector('.required-mark')){
        const inputId = label.getAttribute('for');
        if(inputId){ const field=document.getElementById(inputId); if(field) field.required=true; }
      }
    });
  }

  function addAccessibleNames(){
    qsa('button').forEach(btn => {
      if(!btn.getAttribute('aria-label') && !btn.textContent.trim()){
        const title=btn.getAttribute('title'); if(title) btn.setAttribute('aria-label',title);
      }
    });
  }

  function init(){
    document.body.classList.add('lb-modern-ui');
    enhanceDialogs();
    enhanceSortableHeaders();
    syncSortAria();
    persistControls();
    improveRequiredFields();
    addAccessibleNames();

    const observer = new MutationObserver(() => { syncDialogState(); syncSortAria(); });
    observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','style']});
    syncDialogState();

    document.addEventListener('keydown', e => {
      if(e.key==='Escape' && closeTopDialog()){ e.preventDefault(); return; }
      trapFocus(e);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();


/* FIX: exibição dos campos logísticos criados dinamicamente no modal de compra */
(function(){
  'use strict';

  function sincronizarCamposLogisticos(select){
    if(!select || select.id !== 'c-status-entrega') return;
    var status = select.value;
    var previstaWrap = document.getElementById('c-data-prevista-wrap');
    var previstaInput = document.getElementById('c-data-prevista-recebimento');
    var recebimentoWrap = document.getElementById('c-data-recebimento-wrap');
    var recebimentoInput = document.getElementById('c-data-recebimento-mercadoria');

    if(previstaWrap){
      previstaWrap.style.setProperty('display', status === 'em_transito' ? 'block' : 'none', 'important');
    }
    if(recebimentoWrap){
      recebimentoWrap.style.setProperty('display', status === 'recebida' ? 'block' : 'none', 'important');
    }
    if(status !== 'em_transito' && previstaInput) previstaInput.value = '';
    if(status !== 'recebida' && recebimentoInput) recebimentoInput.value = '';
  }

  document.addEventListener('change', function(event){
    if(event.target && event.target.id === 'c-status-entrega'){
      sincronizarCamposLogisticos(event.target);
    }
  }, true);

  document.addEventListener('click', function(event){
    if(event.target && event.target.id === 'c-status-entrega'){
      sincronizarCamposLogisticos(event.target);
    }
  }, true);

  var observer = new MutationObserver(function(){
    var select = document.getElementById('c-status-entrega');
    if(select) sincronizarCamposLogisticos(select);
  });

  function iniciar(){
    observer.observe(document.body, { childList:true, subtree:true });
    var select = document.getElementById('c-status-entrega');
    if(select) sincronizarCamposLogisticos(select);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
