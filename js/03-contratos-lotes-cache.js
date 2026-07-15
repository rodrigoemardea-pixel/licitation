// ===== LOTES =====
let lotesTemp = [];

function adicionarLote() {
  lotesTemp.push({ id: uid(), descricao: '', qtd: 1, vunit: 0 });
  renderLotes();
}

function removerLote(idx) {
  lotesTemp.splice(idx, 1);
  renderLotes();
}

function renderLotes() {
  const c = document.getElementById('lotes-container');
  if (!c) return;
  if (!lotesTemp.length) {
    c.innerHTML = '';
    const tot = document.getElementById('lotes-totais');
    if (tot) tot.style.display = 'none';
    const av = document.getElementById('lotes-aviso');
    if (av) av.style.display = 'none';
    sincLoteVenda(0);
    return;
  }
  const disputaId = EID.disputas;
  c.innerHTML = lotesTemp.map((l, i) => {
    const qtd        = l.qtd || 1;
    const total      = qtd * (l.vunit||0);
    // compraPrev e custoPrev são valores UNITÁRIOS — multiplica pela qtd para obter o total
    const compraPrevUnit = l.compraPrev || 0;
    const custoPrevUnit  = l.custoPrev  || 0;
    const compraPrevTotal = compraPrevUnit * qtd;
    const custoPrevTotal  = custoPrevUnit  * qtd;
    const lucPrev         = total - compraPrevTotal - custoPrevTotal;
    return '<div style="display:grid;grid-template-columns:1fr 70px 100px 100px 100px 90px 100px 30px;gap:4px;align-items:center;margin-bottom:4px;" id="lote-row-'+i+'">' +
      '<input type="text" class="fc" value="'+(l.descricao||'')+'" placeholder="Ex: Armário" style="font-size:12px;padding:5px 8px;" oninput="lotesTemp['+i+'].descricao=this.value">' +
      '<input type="number" class="fc" value="'+(l.qtd||1)+'" min="1" step="1" style="font-size:12px;padding:5px 8px;" oninput="lotesTemp['+i+'].qtd=+this.value;atualizarLoteTotais('+i+')">' +
      '<input type="number" class="fc" value="'+(l.vunit||'')+'" placeholder="0,00" step="0.01" style="font-size:12px;padding:5px 8px;" oninput="lotesTemp['+i+'].vunit=+this.value;atualizarLoteTotais('+i+')">' +
      '<input type="number" class="fc" id="lote-total-'+i+'" value="'+total.toFixed(2)+'" readonly style="font-size:12px;padding:5px 8px;background:var(--bg-inset);color:var(--accent);font-weight:600;">' +
      '<input type="number" class="fc" value="'+(compraPrevUnit||'')+'" placeholder="unit." step="0.01" title="Valor unitário de compra previsto (será multiplicado pela qtd)" style="font-size:12px;padding:5px 8px;" oninput="lotesTemp['+i+'].compraPrev=+this.value;atualizarLoteTotais('+i+')">' +
      '<div style="display:flex;gap:2px;align-items:center;">' +
        '<input type="number" class="fc" id="lote-custo-prev-input-'+i+'" value="'+(custoPrevUnit||'')+'" placeholder="unit." step="0.01" title="Custo unitário previsto (será multiplicado pela qtd)" style="font-size:12px;padding:5px 8px;flex:1;" oninput="lotesTemp['+i+'].custoPrev=+this.value;atualizarLoteTotais('+i+')">' +
        '<button type="button" title="Calcular custo via calculadora rápida" onclick="abrirCalcParaLote('+i+')" style="padding:4px 7px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);cursor:pointer;font-size:13px;white-space:nowrap;flex-shrink:0;">🧮</button>' +
      '</div>' +
      '<input type="number" class="fc" id="lote-luc-prev-'+i+'" value="'+lucPrev.toFixed(2)+'" readonly style="font-size:12px;padding:5px 8px;background:var(--bg-inset);color:var(--success);font-weight:700;" title="Lucro previsto total = Vl.Total - (Compra × Qtd) - (Custo × Qtd)">' +
      '<button class="btn-lote-del" onclick="removerLote('+i+')">✕</button>' +
    '</div>';
  }).join('');
  atualizarTotalContrato();
}

// Atualiza só os campos calculados de uma linha, SEM re-renderizar (preserva o foco)
function atualizarLoteTotais(i) {
  const l = lotesTemp[i];
  const qtd   = l.qtd  || 0;
  const total = qtd * (l.vunit||0);
  const totEl = document.getElementById('lote-total-'+i);
  if (totEl) totEl.value = total.toFixed(2);
  // compraPrev e custoPrev são unitários — multiplica pela qtd
  const compraPrevTotal = (l.compraPrev||0) * qtd;
  const custoPrevTotal  = (l.custoPrev||0)  * qtd;
  const lucPrev = total - compraPrevTotal - custoPrevTotal;
  const lucEl = document.getElementById('lote-luc-prev-'+i);
  if (lucEl) lucEl.value = lucPrev.toFixed(2);
  atualizarTotalContrato();
}

function atualizarTotalContrato() {
  const total    = lotesTemp.reduce((s, l) => s + (l.qtd||0)*(l.vunit||0), 0);
  const lucPrevTotal = lotesTemp.reduce((s, l) => {
    const qtd = l.qtd || 0;
    const t   = qtd * (l.vunit||0);
    return s + t - (l.compraPrev||0)*qtd - (l.custoPrev||0)*qtd;
  }, 0);
  const totEl = document.getElementById('lotes-totais');
  if (totEl) {
    totEl.style.display = 'flex';
    document.getElementById('lt-count').textContent = lotesTemp.length;
    document.getElementById('lt-total').textContent = fmt(total);
    const lpEl = document.getElementById('lt-luc-prev');
    if (lpEl) lpEl.textContent = fmt(lucPrevTotal);
  }
  const aviso = document.getElementById('lotes-aviso');
  if (aviso) aviso.style.display = 'none';
  sincLoteVenda(total);
}

function sincLoteVenda(total) {
  // d-venda removido junto com seção financeira — nada a sincronizar
}

// ===== EXCEL =====

// Dias sem recebimento (desde dcomp ou, se vazio, data mais antiga das compras)
function diasSemPagamento(r) {
  if (r && r.id) {
    const cached = _memoCache.diasSemPag.get(r.id);
    if (cached !== undefined) return cached;
  }
  const compras = r.compras || [];
  let temRecebimento = false;
  for (let i = 0; i < compras.length; i++) {
    if (compras[i].dpag && (compras[i].rec || 0) > 0) { temRecebimento = true; break; }
  }
  if (temRecebimento) {
    if (r && r.id) _memoCache.diasSemPag.set(r.id, 0);
    return 0;
  }
  let dataRef = r.dcomp;
  if (!dataRef) {
    let menor = null;
    for (let i = 0; i < compras.length; i++) {
      const d = compras[i].dcompra;
      if (d && (menor === null || d < menor)) menor = d;
    }
    dataRef = menor;
  }
  if (!dataRef) {
    if (r && r.id) _memoCache.diasSemPag.set(r.id, 0);
    return 0;
  }
  const hojeMs = _memoCache.hojeMs || Date.now();
  const dias = Math.floor((hojeMs - new Date(dataRef).getTime()) / 86400000);
  if (r && r.id) _memoCache.diasSemPag.set(r.id, dias);
  return dias;
}
// Empenho pago = todos os itens têm ao menos uma compra com dpag preenchido
function disputaEstaFinalizada(disputaId) {
  const d = DB.disputas.find(x => x.id === disputaId);
  if (!d) return false;
  // Critério 1: precisa ter ao menos 1 empenho
  const todosEmpenhos = _empenhosDaDisputa(disputaId);
  if (!todosEmpenhos.length) return false;
  // Critério 2: todos os empenhos precisam estar pagos
  if (!todosEmpenhos.every(e => empenhoEstaPago(e))) return false;
  // Critério 3: não pode haver saldo restante nos lotes
  const lotes = d.lotes || [];
  const saldoRestante = lotes.reduce((s, l) => s + Math.max(0, (l.qtd||0) - calcQtdEnviada(disputaId, l.id)), 0);
  return saldoRestante === 0;
}

function verificarAutoFinalizarDisputa(disputaId) {
  const d = DB.disputas.find(x => x.id === disputaId);
  if (!d) return;
  if (disputaEstaFinalizada(disputaId)) {
    if (!d.finalizada) {
      d.finalizada = true;
      d.dataFinalizacao = d.dataFinalizacao || new Date().toISOString().slice(0,10);
      d.finalizadaAuto = true;
    }
  } else {
    // Se não atende mais os critérios e foi finalizada automaticamente, reabre
    if (d.finalizada && d.finalizadaAuto) {
      d.finalizada = false;
      d.dataFinalizacao = null;
      d.finalizadaAuto = false;
    }
  }
}

function empenhoEstaPago(r) {
  if (r && r.id) {
    const cached = _memoCache.empenhoPago.get(r.id);
    if (cached !== undefined) return cached;
  }
  const itens = (r.itens && r.itens.length) ? r.itens : (r.loteId ? [{id:'leg1'}] : []);
  if (!itens.length) {
    if (r && r.id) _memoCache.empenhoPago.set(r.id, false);
    return false;
  }
  const compras = r.compras || [];
  let result = true;
  for (let i = 0; i < itens.length; i++) {
    const item = itens[i];
    let ok = false;
    for (let j = 0; j < compras.length; j++) {
      const c = compras[j];
      if (c.itemId === item.id && c.dpag && (c.rec || 0) > 0) { ok = true; break; }
    }
    if (!ok) { result = false; break; }
  }
  if (r && r.id) _memoCache.empenhoPago.set(r.id, result);
  return result;
}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const fmt=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmtP=v=>(Number(v||0)*100).toFixed(1)+'%';
const fmtD=s=>{if(!s)return'—';const[y,m,d]=s.split('-');return`${d}/${m}/${y}`;};
const parseAliq = (v) => {
  if (!v) return 0;
  return parseFloat(v.replace(',', '.')) / 100;
};

// ─── Repositório completo (todos os analistas) ───────────────────────────────
let _fullDB = { disputas:[], empenhos:[], acomp:[], comentarios:[], tarefas:[] };

// === PASSO 2: Versionamento e cache de cálculos derivados ===
let _dbVersion = 0;
let _memoCache = {
  version: 0,
  empenhosByDisputa: null,
  qtdEnviada: new Map(),
  diasSemPag: new Map(),
  empenhoPago: new Map(),
  valorContrato: new Map(),
  hojeMs: 0
};

function _bumpDbVersion() {
  _dbVersion++;
  _memoCache.version = _dbVersion;
  _memoCache.empenhosByDisputa = null;
  _memoCache.qtdEnviada.clear();
  _memoCache.diasSemPag.clear();
  _memoCache.empenhoPago.clear();
  _memoCache.valorContrato.clear();
  _memoCache.hojeMs = Date.now();
}

function _getEmpenhosByDisputa() {
  if (_memoCache.empenhosByDisputa) return _memoCache.empenhosByDisputa;
  const map = new Map();
  (_fullDB.empenhos || []).forEach(e => {
    if (!e.disputaId) return;
    let arr = map.get(e.disputaId);
    if (!arr) { arr = []; map.set(e.disputaId, arr); }
    arr.push(e);
  });
  _memoCache.empenhosByDisputa = map;
  return map;
}

function _empenhosDaDisputa(disputaId) {
  if (!disputaId) return [];
  return _getEmpenhosByDisputa().get(disputaId) || [];
}

// ─── DB: proxy com getters — SEMPRE retorna os dados filtrados para o usuário ─
// Quando isAdmin=true  → retorna tudo.
// Quando isAdmin=false → retorna só os registros cujo analista === analistaDoUsuario.
// Assim, NENHUMA função de renderização precisa ser alterada.
const DB = {
  get disputas()    { return isAdmin ? _fullDB.disputas    : _fullDB.disputas.filter(r => r.analista === analistaDoUsuario); },
  get empenhos()    { return isAdmin ? _fullDB.empenhos    : _fullDB.empenhos.filter(r => r.analista === analistaDoUsuario); },
  get acomp()       { return isAdmin ? _fullDB.acomp       : _fullDB.acomp.filter(r => r.analista === analistaDoUsuario); },
  get comentarios() { return _fullDB.comentarios; },
  get tarefas()     { return _fullDB.tarefas; },
  // Setters: usados por código legado que faz DB[k] = array.
  set disputas(v)    { _fullDB.disputas    = v; },
  set empenhos(v)    { _fullDB.empenhos    = v; },
  set acomp(v)       { _fullDB.acomp       = v; },
  set comentarios(v) { _fullDB.comentarios = v; },
  set tarefas(v)     { _fullDB.tarefas     = v; },
};

let graficos = {};

// ===== INICIALIZAÇÃO =====
function inicializarApp(dadosSalvos) {
  const temDados = dadosSalvos &&
    (dadosSalvos.initialized ||
     (Array.isArray(dadosSalvos.disputas) && dadosSalvos.disputas.length > 0) ||
     (Array.isArray(dadosSalvos.empenhos) && dadosSalvos.empenhos.length > 0));

  if (temDados) {
    DB.disputas = dadosSalvos.disputas || [];
    DB.empenhos = dadosSalvos.empenhos || [];
    renderAll();
  } else {
    // Nenhum dado — mostra tela de boas-vindas
    const tela = document.getElementById('tela-boasvindas');
    if (tela) tela.style.display = 'flex';
    renderAll();
  }
}

function iniciarSemDados() {
  DB.disputas = [];
  DB.empenhos = [];
  save('disputas', DB.disputas);
  save('empenhos', DB.empenhos);
  document.getElementById('tela-boasvindas').style.display = 'none';
  renderActive();
  toast('Sistema iniciado! Cadastre seu primeiro contrato.', 'info');
}

// (boot movido para o final do script)

