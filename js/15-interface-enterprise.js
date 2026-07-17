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

// Paginação de empenhos aplicada diretamente aos registros em renderE.
(function(){
  function garantirPaginacaoEmpenhos(){
    var tb=document.getElementById('tbody-empenhos');
    if(!tb||document.getElementById('pagination-empenhos'))return;
    var d=document.createElement('div');d.id='pagination-empenhos';d.className='pagination';d.style.display='none';
    var pane=tb.closest('.tab-pane');if(pane)pane.appendChild(d);
  }
  var orig=renderE;renderE=function(){garantirPaginacaoEmpenhos();orig();};
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
// LICITATIONBIZNIS MODERN UI 2026
// Camada visual progressiva: nao altera regras de negocio ou persistencia.
// =====================================================================
(function(){
  var pageMeta = {
    painel: ['Painel', 'Acompanhe os principais indicadores e pendencias da operacao.'],
    dashboard: ['Dashboard', 'Analise contratos, recebimentos, resultados e desempenho por periodo.'],
    acompanhamentos: ['Acompanhamentos', 'Organize processos em acompanhamento, retornos e recursos.'],
    disputas: ['Contratos ativos', 'Consulte contratos em andamento, saldos, empenhos e resultados previstos.'],
    empenhos: ['Empenhos pendentes', 'Acompanhe compras, pagamentos pendentes e prazos de recebimento.'],
    finalizadas: ['Contratos finalizados', 'Consulte o historico de contratos encerrados e o lucro recebido.'],
    'emp-finalizados': ['Empenhos finalizados', 'Consulte pagamentos concluidos e resultados financeiros realizados.']
  };

  function addPageHeaders(){
    Object.keys(pageMeta).forEach(function(key){
      var pane = document.getElementById('tab-' + key);
      if (!pane || pane.querySelector(':scope > .lb-page-head')) return;
      var meta = pageMeta[key];
      var head = document.createElement('div');
      head.className = 'lb-page-head';
      head.innerHTML = '<div class="lb-page-head-main">' +
        '<h1 class="lb-page-title">' + meta[0] + '</h1>' +
        '<p class="lb-page-subtitle">' + meta[1] + '</p>' +
        '</div><div class="lb-page-actions" aria-label="Acoes da tela"></div>';
      pane.insertBefore(head, pane.firstChild);
    });
  }

  function addNavigationGroups(){
    var tabs = document.querySelector('.tabs');
    if (!tabs || tabs.querySelector('.lb-nav-section')) return;
    var buttons = Array.prototype.slice.call(tabs.querySelectorAll(':scope > .tab-btn'));
    var painel = buttons.find(function(b){ return (b.textContent || '').toLowerCase().indexOf('painel') >= 0; });
    var acomp = buttons.find(function(b){ return (b.textContent || '').toLowerCase().indexOf('acompanhamentos') >= 0; });
    var finalizadas = buttons.find(function(b){ return (b.textContent || '').toLowerCase().indexOf('finalizadas') >= 0; });
    function section(label, before){
      if (!before) return;
      var el = document.createElement('div');
      el.className = 'lb-nav-section';
      el.textContent = label;
      tabs.insertBefore(el, before);
    }
    section('Visao geral', painel);
    section('Operacao', acomp);
    section('Historico', finalizadas);
  }

  function improveSearch(){
    var input = document.getElementById('busca-global-input');
    if (!input) return;
    input.placeholder = 'Pesquisar contratos, empenhos, orgaos ou processos...';
    input.setAttribute('aria-label', 'Busca global');
    input.setAttribute('title', 'Pesquisar em todo o sistema. Atalho: Ctrl + K');
    var hint = document.querySelector('.busca-kbd-hint');
    if (hint) hint.textContent = 'Ctrl K';
  }

  function improveTables(){
    document.querySelectorAll('table').forEach(function(table){
      table.setAttribute('role', 'table');
      table.querySelectorAll('thead th').forEach(function(th){
        th.setAttribute('scope', 'col');
        if (th.onclick || th.getAttribute('onclick')) th.setAttribute('tabindex', '0');
      });
    });
  }

  function addKeyboardSorting(){
    document.addEventListener('keydown', function(event){
      var th = event.target && event.target.closest ? event.target.closest('th[onclick]') : null;
      if (!th || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      th.click();
    });
  }

  function improveTooltips(){
    document.querySelectorAll('tbody td').forEach(function(td){
      var text = (td.textContent || '').trim().replace(/\s+/g, ' ');
      if (text.length > 34 && !td.title) td.title = text;
    });
  }

  function observeDynamicContent(){
    var content = document.querySelector('.content');
    if (!content || typeof MutationObserver === 'undefined') return;
    var timer;
    new MutationObserver(function(){
      clearTimeout(timer);
      timer = setTimeout(function(){ improveTables(); improveTooltips(); }, 80);
    }).observe(content, { subtree:true, childList:true });
  }

  function standardizeButtons(){
    document.querySelectorAll('.toolbar .btn').forEach(function(btn){
      btn.setAttribute('type', btn.getAttribute('type') || 'button');
    });
    document.querySelectorAll('.modal-footer .btn-primary,.modal-footer .btn-success').forEach(function(btn){
      btn.dataset.lbPrimaryAction = '1';
    });
  }

  function enhanceEmptyStates(){
    document.querySelectorAll('.empty-state').forEach(function(state){
      state.setAttribute('role', 'status');
      state.setAttribute('aria-live', 'polite');
    });
  }

  function initModernUI(){
    document.body.classList.add('lb-modern-ui');
    addPageHeaders();
    addNavigationGroups();
    improveSearch();
    improveTables();
    improveTooltips();
    standardizeButtons();
    enhanceEmptyStates();
    addKeyboardSorting();
    observeDynamicContent();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initModernUI);
  else initModernUI();
})();
