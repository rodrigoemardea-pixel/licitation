// ========== FUNÇÕES DE CÁLCULO ==========
function dVals(r){
  const M=r.M||{};
  const imp=M.imp!==undefined?M.imp:r.venda*r.aliq;
  const luc=M.luc!==undefined?M.luc:r.venda-r.compra-imp;
  const pct=M.pct!==undefined?M.pct:(r.compra>0?luc/r.compra:0);
  return{imp,luc,pct};
}
function eVals(r){
  const M=r.M||{};
  const tot=M.tot!==undefined?M.tot:r.vunit*r.qtd;
  const imp=M.imp!==undefined?M.imp:r.vem*r.aliq;
  const luc=M.luc!==undefined?M.luc:r.vem-tot-imp;
  const pct=M.pct!==undefined?M.pct:(tot>0?luc/tot:0);
  const rec=M.rec!==undefined?M.rec:tot+luc;
  return{tot,imp,luc,pct,rec};
}

// ========== TOGGLE MANUAL ==========
let MS={d:{},e:{}};

function tog(p,f){
  const on=!MS[p][f];
  setField(p,f,on);
  syncMasterCheckbox(p);
  if(p==='e') calcE(); else calcD();
}

function setField(p,f,on){
  MS[p][f]=on;
  const ai=document.getElementById(`${p}-${f}-a`);
  const mi=document.getElementById(`${p}-${f}-m`);
  const btn=document.getElementById(`tbtn-${p}-${f}`);
  if(!ai||!mi||!btn)return;
  
  if(on){
    ai.style.display='none';
    mi.style.display='block';
    btn.classList.add('on');
    btn.innerHTML='<span class="dot"></span>Manual';
  } else {
    ai.style.display='block';
    mi.style.display='none';
    btn.classList.remove('on');
    btn.innerHTML='<span class="dot"></span>Auto';
  }
}

function resetFields(p){
  MS[p]={};
  const fields=p==='d'?['imp','luc','pct']:['tot','imp','luc','pct','rec'];
  fields.forEach(f=>setField(p,f,false));
  const cb=document.getElementById(`${p}-all`); if(cb)cb.checked=false;
}

function allManual(p,on){
  const fields=p==='d'?['imp','luc','pct']:['tot','imp','luc','pct','rec'];
  fields.forEach(f=>setField(p,f,on));
  if(p==='e') calcE(); else calcD();
}

function syncMasterCheckbox(p){
  const fields=p==='d'?['imp','luc','pct']:['tot','imp','luc','pct','rec'];
  const allOn=fields.every(f=>MS[p][f]);
  const cb=document.getElementById(`${p}-all`); if(cb)cb.checked=allOn;
}

// ========== CÁLCULOS AUTOMÁTICOS ==========
function calcD(){
  // Seção financeira removida — função mantida para compatibilidade
}

function calcE(){
  const vu=+g('e-vunit').value||0, q=+g('e-qtd').value||0, ve=+g('e-vem').value||0;
  const a = parseAliq(g('e-aliq').value);
  const tot=vu*q, imp=ve*a, luc=ve-tot-imp, pct=tot>0?luc/tot:0, rec=tot+luc;
  
  if(!MS.e.tot) g('e-tot-a').value=fmt(tot);
  if(!MS.e.imp) g('e-imp-a').value=fmt(imp);
  if(!MS.e.luc) g('e-luc-a').value=fmt(luc);
  if(!MS.e.pct) g('e-pct-a').value=fmtP(pct);
  if(!MS.e.rec) g('e-rec-a').value=fmt(rec);
  
  // Se houver valores manuais, garantir que apareçam
  if(MS.e.tot && g('e-tot-m').value) g('e-tot-m').value = g('e-tot-m').value;
  if(MS.e.imp && g('e-imp-m').value) g('e-imp-m').value = g('e-imp-m').value;
  if(MS.e.luc && g('e-luc-m').value) g('e-luc-m').value = g('e-luc-m').value;
  if(MS.e.pct && g('e-pct-m').value) g('e-pct-m').value = g('e-pct-m').value;
  if(MS.e.rec && g('e-rec-m').value) g('e-rec-m').value = g('e-rec-m').value;
}

const g=id=>document.getElementById(id);
const gv=id=>g(id)?g(id).value:'';
const gn=id=>parseFloat(g(id)?g(id).value:0)||0;

// ========== VARIÁVEIS DE FILTRO ==========
let filtroAnalista = 'todos';
let filtroAnalistaDisputas = 'todos';
let filtroEmpresaDisputas = 'todas';
let filtroTipoDisputas = 'todos';
let filtroRpDisputas = 'todos';
let filtroSistemaDisputas = 'todos';
let filtroEstadoDisputas = 'todos';
let filtroStatusEmpenhos = 'todos';
let filtroAnalistaEmpenhos = 'todos';
let filtroVinculoEmpenhos = 'todos';
let filtroEmpenhoDisputas = 'todos';
let filtroSituacaoDisputas = 'todos';
let filtroComprasEmpenhos = 'todos';

// ========== FUNÇÕES DE FILTRO ==========
// Marca filter-groups como ativos quando têm valor não-padrão
function markActiveFilters(scopeEl) {
  const root = scopeEl ? (typeof scopeEl === 'string' ? document.getElementById(scopeEl) : scopeEl) : document;
  if (!root) return;
  root.querySelectorAll('.filter-group').forEach(fg => {
    const sel = fg.querySelector('select');
    if (!sel) return;
    const defaultVal = sel.options[0]?.value ?? '';
    fg.classList.toggle('active', sel.value !== defaultVal);
  });
}

function markAllActiveFilters() {
  document.querySelectorAll('.toolbar').forEach(tb => markActiveFilters(tb));
  // Update active filter counters
  [['disputas','badge-filtros-disputas','cnt-filtros-disputas'],
   ['empenhos','badge-filtros-empenhos','cnt-filtros-empenhos']].forEach(([tab, badgeId, cntId]) => {
    const pane = document.getElementById('tab-' + tab);
    if (!pane) return;
    const activeCount = pane.querySelectorAll('.filter-group.active').length;
    const badge = document.getElementById(badgeId);
    const cnt = document.getElementById(cntId);
    if (badge) badge.classList.toggle('visible', activeCount > 0);
    if (cnt) cnt.textContent = activeCount;
  });
}

function filtrarDisputas() {
  _page.disputas = 1;
  markAllActiveFilters();
  markActiveFilters(null);
  filtroEmpenhoDisputas = g('filtro-empenho-disputas')?.value || 'todos';
  filtroEmpresaDisputas = g('filtro-empresa-disputas').value;
  filtroTipoDisputas = g('filtro-tipo-disputas').value;
  filtroRpDisputas = g('filtro-rp-disputas').value;
  filtroSistemaDisputas = g('filtro-sistema-disputas').value;
  filtroEstadoDisputas = g('filtro-estado-disputas').value;
  // Não-admins: sempre força o filtro de analista para o seu nome
  if (!isAdmin) {
    filtroAnalistaDisputas = analistaDoUsuario;
    filtroAnalista = analistaDoUsuario;
    const el = g('filtro-analista-disputas'); if (el) el.value = analistaDoUsuario;
  } else {
    filtroAnalistaDisputas = g('filtro-analista-disputas')?.value || 'todos';
  }
  filtroMesDisputas = g('filtro-mes-disputas')?.value || 'todos';
  renderD();
}

let filtroAtrasoEmpenhos = 'todos';

function filtrarEmpenhos() {
  markAllActiveFilters();
  // Não-admins: sempre força o filtro de analista para o seu nome
  if (!isAdmin) {
    filtroAnalistaEmpenhos = analistaDoUsuario;
    const el = g('filtro-analista-empenhos'); if (el) el.value = analistaDoUsuario;
  } else {
    filtroAnalistaEmpenhos = g('filtro-analista-empenhos').value;
  }
  filtroComprasEmpenhos = g('filtro-compras-empenhos')?.value || 'todos';
  filtroAtrasoEmpenhos = g('filtro-atraso-empenhos')?.value || 'todos';
  renderE();
}

function limparFiltrosDisputas() {
  _page.disputas = 1;
  markAllActiveFilters();
  ['filtro-empenho-disputas','filtro-empresa-disputas','filtro-tipo-disputas','filtro-rp-disputas','filtro-sistema-disputas','filtro-estado-disputas','filtro-analista-disputas','filtro-mes-disputas'].forEach(id => {
    const el = g(id); if(el) el.selectedIndex = 0;
  });
  filtroEmpresaDisputas = 'todas';
  filtroTipoDisputas = 'todos';
  filtroRpDisputas = 'todos';
  filtroSistemaDisputas = 'todos';
  filtroEstadoDisputas = 'todos';
  filtroAnalistaDisputas = 'todos';
  filtroEmpenhoDisputas = 'todos';
  filtroMesDisputas = 'todos';
  g('search-disputas').value = '';
  FLT.disputas = '';
  renderD();
  const de = document.getElementById('filtro-data-de-disputas');
  const ate = document.getElementById('filtro-data-ate-disputas');
  if (de) de.value = '';
  if (ate) ate.value = '';
}

function limparFiltrosEmpenhos() {
  markAllActiveFilters();
  g('filtro-analista-empenhos').value = 'todos';
  if(g('filtro-compras-empenhos')) g('filtro-compras-empenhos').value = 'todos';
  if(g('filtro-atraso-empenhos')) g('filtro-atraso-empenhos').value = 'todos';
  filtroAnalistaEmpenhos = 'todos';
  filtroComprasEmpenhos = 'todos';
  filtroAtrasoEmpenhos = 'todos';
  g('search-empenhos').value = '';
  FLT.empenhos = '';
  renderE();
}

// ========== TABS ==========
let _activeTab = 'disputas'; // rastreia a aba ativa atual

function switchTab(tab,btn){
  _activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  g('tab-'+tab).classList.add('active');
  renderActive();
}

// ========== PAGINATION ==========
const PAGE_SIZE = 50;
let _page = { disputas: 1, empenhos: 1 };

function renderPagination(tab, totalRows) {
  const container = document.getElementById('pagination-' + tab);
  if (!container) return;
  const total = totalRows;
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  const cur = _page[tab];
  let html = `<button class="page-btn" onclick="_goPage('${tab}',${cur-1})" ${cur===1?'disabled':''}>‹</button>`;
  // Show window of pages
  const from = Math.max(1, cur - 2);
  const to   = Math.min(pages, cur + 2);
  if (from > 1) html += `<button class="page-btn" onclick="_goPage('${tab}',1)">1</button>${from>2?'<span class="page-info">…</span>':''}`;
  for (let p = from; p <= to; p++) {
    html += `<button class="page-btn ${p===cur?'active':''}" onclick="_goPage('${tab}',${p})">${p}</button>`;
  }
  if (to < pages) html += `${to<pages-1?'<span class="page-info">…</span>':''}<button class="page-btn" onclick="_goPage('${tab}',${pages})">${pages}</button>`;
  html += `<button class="page-btn" onclick="_goPage('${tab}',${cur+1})" ${cur===pages?'disabled':''}>›</button>`;
  html += `<span class="page-info">${((cur-1)*PAGE_SIZE)+1}–${Math.min(cur*PAGE_SIZE,total)} de ${total}</span>`;
  container.innerHTML = html;
}

function _goPage(tab, p) {
  const pages = Math.ceil(_filteredCount(tab) / PAGE_SIZE);
  _page[tab] = Math.max(1, Math.min(p, pages));
  if (tab === 'disputas') renderD(); else renderE();
  // Scroll table to top
  const tw = document.querySelector(`#tab-${tab} .table-wrapper`);
  if (tw) tw.scrollTop = 0;
}

function _filteredCount(tab) {
  if (tab === 'disputas') return getSorted('disputas').filter(r => !r.finalizada && matches('disputas', r)).length;
  return getSorted('empenhos').filter(r => matches('empenhos', r) && !r.finalizado).length;
}

// Reset page when filtering
const _origFiltrarDisputas = typeof filtrarDisputas !== 'undefined' ? filtrarDisputas : null;

// ========== SORT E FILTRO ==========
// Persist sort state across tab switches
const _savedSort = (() => { try { return JSON.parse(localStorage.getItem('_sortState') || '{}'); } catch(e) { return {}; } })();
let SS={
  disputas: _savedSort.disputas || {c:'data',a:false},
  empenhos: _savedSort.empenhos || {c:'data',a:false}
};
let FLT={disputas:'',empenhos:''};

function sort(tab,col){
  if(SS[tab].c === col) {
    SS[tab].a = !SS[tab].a;
  } else {
    SS[tab] = {c: col, a: false};
  }
  // Persist sort state
  try { localStorage.setItem('_sortState', JSON.stringify({disputas: SS.disputas, empenhos: SS.empenhos})); } catch(e){}
  
  // Atualizar indicadores visuais
  document.querySelectorAll(`#sort-${tab}-${SS[tab].c}`).forEach(el => {
    el.className = SS[tab].a ? 'sort-desc' : 'sort-asc';
  });
  
  if(tab === 'disputas') renderD(); else renderE();
}

function getSorted(tab){
  const{c,a}=SS[tab];
  return[...DB[tab]].sort((x,y)=>{
    let va=x[c]??'',vb=y[c]??'';
    
    // Tratamento especial para valores calculados
    if(c === 'lucro' && tab === 'disputas') {
      va = dVals(x).luc;
      vb = dVals(y).luc;
    } else if(c === 'pct' && tab === 'disputas') {
      va = dVals(x).pct;
      vb = dVals(y).pct;
    } else if(c === 'lucro' && tab === 'empenhos') {
      va = eVals(x).luc;
      vb = eVals(y).luc;
    } else if(c === 'pct' && tab === 'empenhos') {
      va = eVals(x).pct;
      vb = eVals(y).pct;
    } else if(c === 'recebido' && tab === 'empenhos') {
      va = x.recebido || 0;
      vb = y.recebido || 0;
    } else if(c === 'dias' && tab === 'empenhos') {
      va = diasSemPagamento(x) || 0;
      vb = diasSemPagamento(y) || 0;
    } else if(!isNaN(parseFloat(va)) && !isNaN(parseFloat(vb))) {
      va = parseFloat(va) || 0;
      vb = parseFloat(vb) || 0;
    }
    
    if(va < vb) return a ? 1 : -1;
    if(va > vb) return a ? -1 : 1;
    return 0;
  });
}

function filterTable(tab,v){FLT[tab]=v.toLowerCase(); if(tab==='disputas') renderD(); else renderE();}

// Copy to clipboard utility
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      btn.textContent = '✓';
      btn.parentElement?.classList.add('copied-flash');
      setTimeout(() => { btn.textContent = '⎘'; btn.parentElement?.classList.remove('copied-flash'); }, 1200);
    }
    toast('Copiado: ' + text, 'success');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    toast('Copiado!', 'success');
  });
}

// Highlight search term in a string
function hl(text, query) {
  if (!query || !text) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(text).replace(new RegExp('(' + escaped + ')', 'gi'), '<mark class="search-hl">$1</mark>');
}

function matches(tab,r){
  const q=FLT[tab];
  
  // Filtro por analista global
  if(filtroAnalista !== 'todos' && r.analista !== filtroAnalista) return false;
  
  if(tab === 'disputas') {
    if(filtroEmpresaDisputas !== 'todas' && r.empresa !== filtroEmpresaDisputas) return false;
    if(filtroTipoDisputas !== 'todos' && r.tipo !== filtroTipoDisputas) return false;
    if(filtroRpDisputas !== 'todos' && r.rp !== filtroRpDisputas) return false;
    if(filtroSistemaDisputas !== 'todos' && r.sistema !== filtroSistemaDisputas) return false;
    if(filtroEstadoDisputas !== 'todos' && r.estado !== filtroEstadoDisputas) return false;
    if(filtroAnalistaDisputas !== 'todos' && r.analista !== filtroAnalistaDisputas) return false;
    if(filtroEmpenhoDisputas !== 'todos') {
      const temEmpenho = DB.empenhos.some(e => e.disputaId === r.id);
      if(filtroEmpenhoDisputas === 'com-empenho' && !temEmpenho) return false;
      if(filtroEmpenhoDisputas === 'sem-empenho' && temEmpenho) return false;
    }
    if(filtroMesDisputas !== 'todos') {
      if(!(r.data||'').startsWith(filtroMesDisputas)) return false;
    }
  }
  
  if(tab === 'empenhos') {
    if(filtroAnalistaEmpenhos !== 'todos' && r.analista !== filtroAnalistaEmpenhos) return false;
    // Filtro compras
    if(filtroComprasEmpenhos !== 'todos') {
      const temCompras = (r.compras || []).length > 0;
      if(filtroComprasEmpenhos === 'com-compras' && !temCompras) return false;
      if(filtroComprasEmpenhos === 'sem-compras' && temCompras) return false;
    }
    if(filtroAtrasoEmpenhos !== 'todos') {
      const pago = empenhoEstaPago(r);
      if(pago) return false; // pagos não entram no filtro de atraso
      const dias = diasSemPagamento(r);
      if(filtroAtrasoEmpenhos === '30' && dias < 30) return false;
      if(filtroAtrasoEmpenhos === '60' && dias < 60) return false;
      if(filtroAtrasoEmpenhos === '90' && dias < 90) return false;
    }
  }
  
  // Filtro de pesquisa texto
  if(!q) return true;
  return Object.values(r).some(v=>String(v||'').toLowerCase().includes(q));
}

// ========== BADGES ==========
const badgeD=s=>{const m={'Em recurso':'by',Habilitado:'bb',Homologado:'bp',Contratado:'bg',Comprado:'by',Pago:'bg'}; return`<span class="badge ${m[s]||'bx'}">${s||'—'}</span>`; };
const mTag=r=>Object.keys(r.M||{}).length?`<span class="badge by" style="font-size:8px;padding:2px 4px;margin-left:2px;">M</span>`:'';

// ========== FUNÇÕES DE DUPLICAÇÃO ==========
// ===== LOTES HELPERS =====
function calcQtdEnviada(disputaId, loteId, excludeEmpenhoId) {
  const key = disputaId + '|' + loteId + '|' + (excludeEmpenhoId || '');
  const cached = _memoCache.qtdEnviada.get(key);
  if (cached !== undefined) return cached;
  const arr = _empenhosDaDisputa(disputaId);
  let s = 0;
  for (let i = 0; i < arr.length; i++) {
    const e = arr[i];
    if (e.id === excludeEmpenhoId) continue;
    if (e.itens && e.itens.length) {
      const item = e.itens.find(it => it.loteId === loteId);
      if (item) s += item.qtd || 0;
    } else if (e.loteId === loteId) {
      s += e.qtdLote || 0;
    }
  }
  _memoCache.qtdEnviada.set(key, s);
  return s;
}

function getValorContrato(r) {
  if (r && r.id) {
    const cached = _memoCache.valorContrato.get(r.id);
    if (cached !== undefined) return cached;
  }
  const lotes = r.lotes || [];
  let s = 0;
  for (let i = 0; i < lotes.length; i++) {
    s += (lotes[i].qtd || 0) * (lotes[i].vunit || 0);
  }
  if (r && r.id) _memoCache.valorContrato.set(r.id, s);
  return s;
}

function getLotesComSaldo(disputaId, excludeEmpenhoId) {
  const disp = DB.disputas.find(d => d.id === disputaId);
  if (!disp) return [];
  return (disp.lotes || []).map(l => {
    const qtdEnviada = calcQtdEnviada(disputaId, l.id, excludeEmpenhoId);
    return { ...l, qtdEnviada, qtdRestante: (l.qtd || 0) - qtdEnviada };
  });
}

