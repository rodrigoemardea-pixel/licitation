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
