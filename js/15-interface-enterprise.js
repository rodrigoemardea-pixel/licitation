// FIX: define confirmar() que closeModal chama mas nao existe
function confirmar(titulo, msg, onConfirm) {
  _confirmarAcao({icon:'\u26A0\uFE0F',titulo:titulo,msg:msg,btnLabel:'Sim',btnClass:'btn-danger',onConfirm:onConfirm});
}

function _debounce(fn,ms){var t;return function(){clearTimeout(t);var a=arguments,ctx=this;t=setTimeout(function(){fn.apply(ctx,a);},ms);};}
var _debouncedBusca=_debounce(function(v){buscaGlobal(v);},200);
// === PASSO 1: debounced wrappers ===
var _debFilterTable   = _debounce(function(tab,v){ filterTable(tab,v); }, 180);
var _debRenderAcomp   = _debounce(function(){ renderAcomp(); }, 180);
var _debRenderFinaliz = _debounce(function(){ renderFinalizadas(); }, 180);
var _debRenderEmpFin  = _debounce(function(){ renderEmpFinalizados(); }, 180);
function commitInlineAnalista(id,tipo,val){
  var r=_fullDB[tipo].find(function(x){return x.id===id;});if(!r)return;
  r.analista=val;save(tipo,_fullDB[tipo]);toast('Analista: '+val,'success');setTimeout(renderAll,80);
}

function validarIntegridade(sil){
  var p=0,f=0,dids={},eids={};
  (_fullDB.disputas||[]).forEach(function(d){dids[d.id]=true;});
  (_fullDB.empenhos||[]).forEach(function(e){eids[e.id]=true;});
  (_fullDB.empenhos||[]).forEach(function(e){if(e.disputaId&&!dids[e.disputaId]){p++;e.disputaId=null;f++;}});
  (_fullDB.empenhos||[]).forEach(function(e){if(!e.compras||!e.compras.length)return;var ids={};(e.itens||[]).forEach(function(i){ids[i.id]=true;});if(!Object.keys(ids).length)return;var a=e.compras.length;e.compras=e.compras.filter(function(c){return !c.itemId||ids[c.itemId];});var r=a-e.compras.length;p+=r;f+=r;});
  if(f>0)save('empenhos',_fullDB.empenhos);
  if(!sil)toast(p===0?'Integridade OK':'Corrigidas '+f+' ref. orfas',p===0?'success':'info');
  return{problemas:p,corrigidos:f};
}

// Override renderD: progress bar column
/* override renderD removido - progresso inline */

// Override renderE: pagination
(function(){
  var orig=renderE;
  renderE=function(){
    orig();
    var tb=document.getElementById('tbody-empenhos');if(!tb)return;
    if(!document.getElementById('pagination-empenhos')){var d=document.createElement('div');d.id='pagination-empenhos';d.className='pagination';d.style.display='none';tb.closest('.tab-pane').appendChild(d);}
    var rows=tb.querySelectorAll(':scope > tr');
    if(rows.length<=PAGE_SIZE){renderPagination('empenhos',rows.length);return;}
    var tp=Math.ceil(rows.length/PAGE_SIZE);if(_page.empenhos>tp)_page.empenhos=1;
    var s=(_page.empenhos-1)*PAGE_SIZE;
    rows.forEach(function(tr,i){tr.style.display=(i>=s&&i<s+PAGE_SIZE)?'':'none';});
    renderPagination('empenhos',rows.length);
  };
  var origF=filtrarEmpenhos;filtrarEmpenhos=function(){_page.empenhos=1;origF();};
})();

// Override atualizarDashboard: comparison selectors
(function(){
  var orig=atualizarDashboard;
  atualizarDashboard=function(){
    orig();
    var tb=document.querySelector('#tab-dashboard > div:first-child');
    if(tb&&!document.getElementById('dash-comp-mes1')){
      ['dash-comp-mes1','dash-comp-mes2'].forEach(function(id,ix){
        var fg=document.createElement('div');fg.className='filter-group';
        fg.innerHTML='<label>'+(ix===0?'Mes A:':'vs B:')+'</label><select id="'+id+'" onchange="atualizarDashboard()"><option value="">-</option></select>';
        tb.appendChild(fg);
      });
    }
    var ms={};DB.empenhos.forEach(function(e){(e.compras||[]).forEach(function(c){if(c.dpag)ms[c.dpag.slice(0,7)]=1;});});
    var sorted=Object.keys(ms).sort().reverse();
    ['dash-comp-mes1','dash-comp-mes2'].forEach(function(id){
      var sel=document.getElementById(id);if(!sel||sel.options.length>1)return;
      sorted.forEach(function(m){var o=document.createElement('option');o.value=m;var p=m.split('-');o.textContent=new Date(p[0],parseInt(p[1])-1).toLocaleString('pt-BR',{month:'short',year:'numeric'});sel.appendChild(o);});
    });
  };
})();

// Auto integrity + menu button + rewire busca
setTimeout(function(){if(!window._ic){window._ic=1;validarIntegridade(true);}},4000);

setTimeout(function(){var bi=document.getElementById('busca-global-input');if(bi){bi.oninput=function(){_debouncedBusca(this.value);};}},500);

// =====================================================================
// LICITATIONBIZNIS SAAS ENTERPRISE 1.0
// Apenas estrutura geral: menu lateral, header fixo e busca global preservada
// =====================================================================
(function(){
  function enhanceTabs(){
    var tabs = document.querySelector('.tabs');
    if (!tabs || tabs.dataset.lbSaasEnhanced) return;
    tabs.dataset.lbSaasEnhanced = '1';
    tabs.setAttribute('aria-label', 'Navegação principal do LicitationBiznis');
    var map = [['painel','◫'], ['dashboard','◩'], ['contratos','▣'], ['empenhos','◧'], ['acompanhamentos','◎'], ['proposta','◈'], ['compras','◌'], ['config','⚙']];
    tabs.querySelectorAll('.tab-btn').forEach(function(btn){
      var key = (btn.textContent || btn.title || '').trim().toLowerCase();
      var found = map.find(function(p){ return key.indexOf(p[0]) !== -1; });
      var icon = found ? found[1] : '•';
      if (!btn.querySelector('.lb-nav-icon')) {
        var span = document.createElement('span');
        span.className = 'lb-nav-icon';
        span.textContent = icon;
        span.style.cssText = 'width:24px;height:24px;border-radius:9px;display:inline-grid;place-items:center;background:rgba(255,255,255,.10);margin-right:8px;font-size:13px;flex:0 0 24px;';
        btn.insertBefore(span, btn.firstChild);
      }
    });
  }

  function closeActionMenus(){
    document.querySelectorAll('.action-dropdown-menu').forEach(function(menu){
      menu.style.display = 'none';
      menu.dataset.lbOpen = '0';
    });
  }

  function openActionMenu(event, btn){
    if (event) { event.preventDefault(); event.stopPropagation(); }
    if (!btn) return false;
    var wrap = btn.closest ? btn.closest('.action-dropdown') : null;
    var menu = wrap ? wrap.querySelector('.action-dropdown-menu') : btn.nextElementSibling;
    if (!menu) return false;
    var alreadyOpen = menu.dataset.lbOpen === '1' || menu.style.display === 'block';
    closeActionMenus();
    if (alreadyOpen) return false;
    menu.style.display = 'block';
    menu.dataset.lbOpen = '1';
    menu.style.position = 'fixed';
    menu.style.zIndex = '2147483000';
    menu.style.pointerEvents = 'auto';
    var rect = btn.getBoundingClientRect();
    var menuW = Math.max(menu.offsetWidth || 190, 190);
    var menuH = Math.max(menu.scrollHeight || menu.offsetHeight || 180, 120);
    var left = rect.right - menuW;
    var top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + menuW > window.innerWidth - 8) left = window.innerWidth - menuW - 8;
    if (top + menuH > window.innerHeight - 8) top = rect.top - menuH - 6;
    if (top < 8) top = 8;
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    return false;
  }

  window.openActionMenu = openActionMenu;
  window.closeActionMenus = closeActionMenus;

  document.addEventListener('click', function(event){
    var btn = event.target && event.target.closest ? event.target.closest('.action-dropdown-btn') : null;
    if (btn) { openActionMenu(event, btn); return; }
    var menu = event.target && event.target.closest ? event.target.closest('.action-dropdown-menu') : null;
    if (!menu) closeActionMenus();
  }, true);

  document.addEventListener('keydown', function(event){ if (event.key === 'Escape') closeActionMenus(); });
  window.addEventListener('resize', closeActionMenus);

  function init(){
    document.body.classList.add('lb-saas-enterprise');
    enhanceTabs();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

console.log('v2 OK');


// =====================================================================
// MELHORIAS OPERACIONAIS SIMPLES 2026
// Preferencias locais, densidade, contadores, feedback e acessibilidade.
// =====================================================================
(function(){
  var PREFIX='lb-pref:';
  var lastClickedRow=null;
  var syncTimer=null;
  function get(k,f){try{var v=localStorage.getItem(PREFIX+k);return v===null?f:JSON.parse(v)}catch(e){return f}}
  function set(k,v){try{localStorage.setItem(PREFIX+k,JSON.stringify(v))}catch(e){}}

  function rememberControls(){
    document.addEventListener('change',function(e){
      var el=e.target;if(!el||!el.id||!(/^(filtro-|dash-|search-)/.test(el.id)))return;
      set('control:'+el.id,el.value);
      updateFilterUI();
    },true);
    document.addEventListener('input',function(e){
      var el=e.target;if(!el||!el.id||!/^search-/.test(el.id))return;
      clearTimeout(el._lbSave);el._lbSave=setTimeout(function(){set('control:'+el.id,el.value);updateFilterUI()},250);
    },true);
    document.querySelectorAll('select[id^="filtro-"],select[id^="dash-"],input[id^="search-"]').forEach(function(el){
      var v=get('control:'+el.id,null);if(v===null)return;
      var valid=el.tagName!=='SELECT'||Array.prototype.some.call(el.options,function(o){return o.value===v});
      if(valid){el.value=v;el.dispatchEvent(new Event(el.tagName==='INPUT'?'input':'change',{bubbles:true}))}
    });
  }

  function rememberTab(){
    document.addEventListener('click',function(e){
      var btn=e.target.closest&&e.target.closest('.tab-btn');if(!btn)return;
      var pane=btn.getAttribute('data-tab')||btn.dataset.tab||'';
      if(!pane){var oc=btn.getAttribute('onclick')||'';var m=oc.match(/switchTab\(['\"]([^'\"]+)/);if(m)pane=m[1]}
      if(pane)set('last-tab',pane);
    },true);
    var key=get('last-tab','');if(!key)return;
    setTimeout(function(){
      var btn=document.querySelector('.tab-btn[data-tab="'+key+'"]')||Array.prototype.find.call(document.querySelectorAll('.tab-btn'),function(b){return (b.getAttribute('onclick')||'').indexOf("'"+key+"'")>=0});
      if(btn&&!btn.classList.contains('active'))btn.click();
    },700);
  }

  function addUtilityBars(){
    document.querySelectorAll('.tab-pane').forEach(function(pane){
      if(pane.querySelector(':scope > .lb-utility-bar'))return;
      var table=pane.querySelector('table');if(!table)return;
      var bar=document.createElement('div');bar.className='lb-utility-bar';
      bar.innerHTML='<span class="lb-record-count">0 registros</span><button class="lb-utility-btn lb-reset-sort" type="button">Restaurar ordenacao</button><button class="lb-utility-btn lb-density-toggle" type="button">Densidade</button>';
      var anchor=pane.querySelector('.table-wrapper,.table-wrap');if(anchor)pane.insertBefore(bar,anchor);
      bar.querySelector('.lb-reset-sort').onclick=function(){resetSort(pane.id)};
      bar.querySelector('.lb-density-toggle').onclick=toggleDensity;
    });
  }

  function updateCounts(){
    document.querySelectorAll('.tab-pane').forEach(function(pane){
      var count=pane.querySelector(':scope > .lb-utility-bar .lb-record-count');var body=pane.querySelector('tbody');if(!count||!body)return;
      var rows=Array.prototype.filter.call(body.querySelectorAll(':scope > tr'),function(r){return !r.querySelector('.empty-state')&&!/display:\s*none/.test(r.getAttribute('style')||'')});
      count.textContent=rows.length===1?'1 registro exibido':rows.length+' registros exibidos';
    });
  }

  function resetSort(id){
    try{
      if(id==='tab-disputas'&&window.SS){SS.disputas={c:'data',a:false};renderD()}
      else if(id==='tab-empenhos'&&window.SS){SS.empenhos={c:'dias',a:true};renderE()}
      else if(id==='tab-acompanhamentos'&&typeof _acompSort!=='undefined'){_acompSort={campo:'retorno',asc:true};renderAcomp()}
      else if(id==='tab-finalizadas'&&typeof _sortFinalizadas!=='undefined'){_sortFinalizadas={campo:'dataFinalizacao',asc:false};renderFinalizadas()}
      else if(id==='tab-emp-finalizados'&&typeof _sortEmpFinalizados!=='undefined'){_sortEmpFinalizados={campo:'dataPagamento',asc:false};renderEmpFinalizados()}
      localStorage.removeItem('_sortState');if(typeof toast==='function')toast('Ordenacao padrao restaurada.','info');
    }catch(e){console.warn('Nao foi possivel restaurar a ordenacao',e)}
  }

  function applyDensity(){var d=get('density','compact');document.body.classList.remove('lb-density-compact','lb-density-comfortable');document.body.classList.add('lb-density-'+d);document.querySelectorAll('.lb-density-toggle').forEach(function(b){b.textContent=d==='compact'?'Densidade: compacta':'Densidade: confortavel'})}
  function toggleDensity(){set('density',get('density','compact')==='compact'?'comfortable':'compact');applyDensity()}

  function updateFilterUI(){
    document.querySelectorAll('.tab-pane').forEach(function(pane){
      var controls=pane.querySelectorAll('select[id^="filtro-"],input[id^="search-"]');var active=0;
      controls.forEach(function(el){var v=(el.value||'').trim();if(v&&v!=='todos')active++});
      pane.querySelectorAll('button[onclick*="limparFiltro"],button[onclick*="limparFiltros"]').forEach(function(btn){btn.classList.toggle('lb-filter-clear-hidden',active===0)});
    });
  }

  function addCharCounters(){
    document.querySelectorAll('textarea').forEach(function(el){
      if(el.nextElementSibling&&el.nextElementSibling.classList.contains('lb-char-counter'))return;
      if(!el.maxLength||el.maxLength<0)el.maxLength=500;
      var c=document.createElement('span');c.className='lb-char-counter';el.insertAdjacentElement('afterend',c);
      function upd(){c.textContent=el.value.length+' / '+el.maxLength}el.addEventListener('input',upd);upd();
    });
  }

  function requiredFields(){
    document.querySelectorAll('.modal').forEach(function(modal){
      var required=modal.querySelectorAll('[required]');if(!required.length)return;
      required.forEach(function(el){var label=el.closest('.fg')&&el.closest('.fg').querySelector('label');if(label&&!label.querySelector('.lb-required-mark'))label.insertAdjacentHTML('beforeend','<span class="lb-required-mark">*</span>')});
      var body=modal.querySelector('.modal-body');if(body&&!body.querySelector('.lb-required-note'))body.insertAdjacentHTML('afterbegin','<p class="lb-required-note">* Campos obrigatorios</p>');
    });
  }

  function syncStatus(){
    var host=document.querySelector('#user-menu-wrap')||document.querySelector('header');if(!host||document.getElementById('lb-sync-status'))return;
    var el=document.createElement('span');el.id='lb-sync-status';el.className='lb-sync-status';host.appendChild(el);
    function state(s,t){el.dataset.state=s;el.textContent=t}
    function online(){state(navigator.onLine?'saved':'offline',navigator.onLine?'Sincronizado':'Offline')}
    window.addEventListener('online',online);window.addEventListener('offline',online);online();
    document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(!b)return;var t=(b.textContent||'').toLowerCase();if(!/(salvar|finalizar|excluir|reabrir|importar)/.test(t))return;state('saving','Salvando...');clearTimeout(syncTimer);syncTimer=setTimeout(online,1800)},true);
  }

  function saveFeedback(){
    document.addEventListener('click',function(e){
      var btn=e.target.closest&&e.target.closest('button');if(!btn)return;
      var t=(btn.textContent||'').trim();if(!/^salvar/i.test(t))return;
      if(btn.classList.contains('lb-saving'))return;
      btn.dataset.lbText=t;btn.classList.add('lb-saving');btn.textContent='Salvando';
      setTimeout(function(){if(!btn.isConnected)return;btn.classList.remove('lb-saving');btn.textContent=btn.dataset.lbText||'Salvar';flashLastRow()},1500);
    },true);
    document.addEventListener('click',function(e){var tr=e.target.closest&&e.target.closest('tbody tr');if(tr)lastClickedRow=tr},true);
  }
  function flashLastRow(){
    var row=lastClickedRow&&lastClickedRow.isConnected?lastClickedRow:null;
    if(!row){var pane=document.querySelector('.tab-pane.active');row=pane&&pane.querySelector('tbody tr')}
    if(row){row.classList.remove('lb-row-flash');void row.offsetWidth;row.classList.add('lb-row-flash')}
  }

  function breadcrumb(){
    document.querySelectorAll('.lb-page-head-main').forEach(function(box){if(box.querySelector('.lb-breadcrumb'))return;var title=(box.querySelector('.lb-page-title')||{}).textContent||'';var group=/finalizados/i.test(title)?'Historico':/painel|dashboard/i.test(title)?'Visao geral':'Operacao';box.insertAdjacentHTML('afterbegin','<div class="lb-breadcrumb">'+group+' / '+title+'</div>')});
  }

  function quickFilters(){
    var emp=document.getElementById('tab-empenhos');if(emp&&!emp.querySelector('.lb-quick-filters')){
      var q=document.createElement('div');q.className='lb-quick-filters';q.innerHTML='<button class="lb-quick-filter" data-days="0">Todos</button><button class="lb-quick-filter" data-days="30">+30 dias</button><button class="lb-quick-filter" data-days="60">+60 dias</button><button class="lb-quick-filter" data-days="90">+90 dias</button>';
      var anchor=emp.querySelector('.table-wrapper');if(anchor)emp.insertBefore(q,anchor);
      q.onclick=function(e){var b=e.target.closest('.lb-quick-filter');if(!b)return;var sel=document.getElementById('filtro-atraso-empenhos');if(sel){sel.value=b.dataset.days==='0'?'todos':b.dataset.days;sel.dispatchEvent(new Event('change',{bubbles:true}))}q.querySelectorAll('button').forEach(function(x){x.classList.toggle('active',x===b)})};
    }
  }

  function copyValues(){
    document.addEventListener('dblclick',function(e){var td=e.target.closest&&e.target.closest('td');if(!td)return;var text=(td.innerText||'').trim();if(!text)return;navigator.clipboard&&navigator.clipboard.writeText(text).then(function(){if(typeof toast==='function')toast('Valor copiado.','success')})});
    document.querySelectorAll('tbody td').forEach(function(td){td.classList.add('lb-copyable');td.title=td.title||'Duplo clique para copiar'});
  }

  function observe(){
    var root=document.querySelector('.content');if(!root||!window.MutationObserver)return;var timer;
    new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(function(){updateCounts();updateFilterUI();addCharCounters();requiredFields();copyValues()},100)}).observe(root,{subtree:true,childList:true});
  }

  function pageHeaders(){
    var meta={painel:['Painel','Acompanhe indicadores e pendencias da operacao.'],dashboard:['Dashboard','Analise contratos, recebimentos e desempenho.'],acompanhamentos:['Acompanhamentos','Organize processos, retornos e recursos.'],disputas:['Contratos ativos','Consulte contratos, saldos e resultados previstos.'],empenhos:['Empenhos pendentes','Acompanhe compras, pagamentos e prazos.'],finalizadas:['Contratos finalizados','Consulte contratos encerrados e lucro recebido.'],'emp-finalizados':['Empenhos finalizados','Consulte pagamentos concluidos e resultados realizados.']};
    Object.keys(meta).forEach(function(k){var pane=document.getElementById('tab-'+k);if(!pane||pane.querySelector(':scope > .lb-page-head'))return;var h=document.createElement('div');h.className='lb-page-head';h.innerHTML='<div class="lb-page-head-main"><h1 class="lb-page-title">'+meta[k][0]+'</h1><p class="lb-page-subtitle">'+meta[k][1]+'</p></div>';pane.insertBefore(h,pane.firstChild)});
  }
  function init(){
    document.body.classList.add('lb-modern-ui');pageHeaders();rememberTab();addUtilityBars();applyDensity();rememberControls();updateFilterUI();addCharCounters();requiredFields();syncStatus();saveFeedback();breadcrumb();quickFilters();copyValues();updateCounts();observe();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
