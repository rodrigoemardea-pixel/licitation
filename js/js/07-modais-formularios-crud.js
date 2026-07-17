// ========== MODAL ==========
let EID={};
let _acompConvertendoId = null;
function openModal(tab){
  if (tab === 'acomp') {
    clearAcomp();
    // Pré-preenche empresa com HAMATE por padrão
    const selEmpresa = g('ac-empresa');
    if (selEmpresa) selEmpresa.value = 'Hamate';
    // Pré-preenche e bloqueia analista para não-admins
    if (!isAdmin && analistaDoUsuario) {
      setAnalistaSelect('ac-analista', analistaDoUsuario);
      const sel = g('ac-analista');
      if (sel) sel.disabled = true;
    }
    document.getElementById('modal-acomp').classList.add('open');
    return;
  }
  EID[tab]=null;
  if(tab==='disputas'){
    clearD();
    lotesTemp = []; renderLotes();
    g('ttl-disputas').textContent='Novo Contrato'; g('d-data').value=today();
    // Pré-preenche e bloqueia analista para não-admins
    if (!isAdmin && analistaDoUsuario) {
      setAnalistaSelect('d-analista', analistaDoUsuario);
      const sel = g('d-analista');
      if (sel) sel.disabled = true;
    }
  } else if(tab==='empenhos') {
    toast('Para criar um empenho, abra umo contrato e clique em "+ Novo Empenho".', 'info');
    return;
  }
  if(tab!=='empenhos-disputa') g('modal-'+tab).classList.add('open');
}
function closeModal(tab, force) { 
  const modal = g('modal-'+tab);
  if (!modal) return;
  // Check for dirty fields
  if (!force) {
    const inputs = modal.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea');
    const hasData = [...inputs].some(el => el.value && el.value.trim() !== '' && !el.readOnly && !el.disabled && el.style.display !== 'none');
    if (hasData && modal._isDirty) {
      confirmar('Fechar sem salvar?', 'As alterações não salvas serão perdidas.', () => {
        modal._isDirty = false;
        modal.classList.remove('open');
        _restoreTab();
      });
      return;
    }
  }
  modal._isDirty = false;
  modal.classList.remove('open');
  _restoreTab();
}

// Mark modal as dirty when user types
document.addEventListener('input', e => {
  const modal = e.target.closest('.modal-overlay');
  if (modal) modal._isDirty = true;
});
document.addEventListener('change', e => {
  const modal = e.target.closest('.modal-overlay');
  if (modal) modal._isDirty = true;
});

function _restoreTab() {
  const algumAberto = document.querySelector('.modal-overlay.open, .detail-popup-overlay.open');
  if (algumAberto) return;
  const btn = [...document.querySelectorAll('.tab-btn')].find(b => {
    const onclick = b.getAttribute('onclick') || '';
    return onclick.includes("'" + _activeTab + "'") || onclick.includes('"' + _activeTab + '"');
  });
  if (btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = g('tab-' + _activeTab);
    if (pane) pane.classList.add('active');
  }
}
const today=()=>new Date().toISOString().slice(0,10);

function novoEmpenhoParaDisputa(disputaId) {
  fecharPopup('disputa');
  EID['empenhos'] = null;
  clearE();
  lotesSelecionados = {};
  const wrap = g('lote-selector-wrap'); if(wrap) wrap.style.display = 'none';
  g('ttl-empenhos').textContent = 'Novo Empenho';
  g('e-data').value = today();
  populateDisputaSelect(disputaId);
  // Pré-preenche analista para usuários não-admin
  if (!isAdmin && analistaDoUsuario) {
    setAnalistaSelect('e-analista', analistaDoUsuario);
    const sel = g('e-analista');
    if (sel) sel.disabled = true;
  }
  g('modal-empenhos').classList.add('open');
}

// ========== WIZARD RÁPIDO ==========
let wizardStep = 1;
let wizardData = {};

function openQuickWizard(tipo) {
  wizardStep = 1;
  wizardData = { tipo };
  g('wizard-tipo').value = tipo;
  atualizarWizard();
  g('wizard-quick').classList.add('open');
}

function closeWizard() {
  g('wizard-quick').classList.remove('open');
}

function atualizarWizard() {
  g('wizard-step-1').style.display = wizardStep === 1 ? 'block' : 'none';
  g('wizard-step-2').style.display = wizardStep === 2 ? 'block' : 'none';
  g('wizard-step-3').style.display = wizardStep === 3 ? 'block' : 'none';
  
  g('wiz-step1').className = wizardStep >= 1 ? 'step active' : 'step';
  g('wiz-step2').className = wizardStep >= 2 ? 'step active' : 'step';
  g('wiz-step3').className = wizardStep >= 3 ? 'step active' : 'step';
  
  g('wizard-next').style.display = wizardStep < 3 ? 'inline-flex' : 'none';
  g('wizard-finish').style.display = wizardStep === 3 ? 'inline-flex' : 'none';
}

function wizardNext() {
  if(wizardStep === 1) {
    wizardData.tipo = g('wizard-tipo').value;
  } else if(wizardStep === 2) {
    wizardData.orgao = g('wizard-orgao').value;
  }
  wizardStep++;
  atualizarWizard();
}

function wizardFinish() {
  wizardData.processo = g('wizard-processo').value;
  
  // Criar registro rápido
  if(wizardData.tipo === 'disputas') {
    const novaDisputa = {
      id: uid(),
      data: today(),
      orgao: wizardData.orgao || '',
      estado: '',
      empresa: '',
      tipo: '',
      rp: '',
      processo: wizardData.processo || '',
      sistema: '',
      analista: '',
      linkSistema: '',
      linkProposta: '',
      compra: 0,
      venda: 0,
      aliq: 0.145,
      situacao: 'Em recurso',
      observacao: '',
      M: {}
    };
    _fullDB.disputas.push(novaDisputa);
    save('disputas', _fullDB.disputas);
    toast('Contrato criado com sucesso!', 'success');
  } else {
    const novoEmpenho = {
      id: uid(),
      num: wizardData.processo || '',
      data: today(),
      orgao: wizardData.orgao || '',
      analista: analistaDoUsuario || 'Márdea',
      produto: '',
      plataforma: '',
      dcomp: today(),
      vunit: 0,
      qtd: 1,
      vem: 0,
      aliq: 0.13,
      recebido: 0,
      dreceb: '',
      observacao: '',
      M: {}
    };
    _fullDB.empenhos.push(novoEmpenho);
    save('empenhos', _fullDB.empenhos);
    toast('Empenho criado com sucesso!', 'success');
  }
  
  closeWizard();
  renderActive();
}

// ========== ATALHOS DE TECLADO ==========
document.addEventListener('keydown', (e) => {
  // Ctrl+N = Novo contrato/empenho (dependendo da aba ativa)
  if (e.ctrlKey && e.key === 'n') {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-btn.active');
    if(activeTab.textContent.includes('Contratos')) {
      openModal('disputas');
    } else if(activeTab.textContent.includes('Empenhos')) {
      toast('Para criar um empenho, abra umo contrato e clique em "+ Novo Empenho".', 'info');
    }
  }
  
  // Ctrl+K = Focar na busca
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-pane.active');
    if(activeTab.id === 'tab-disputas') {
      g('search-disputas').focus();
    } else if(activeTab.id === 'tab-empenhos') {
      g('search-empenhos').focus();
    }
  }
  
  // Ctrl+Q = Abrir wizard rápido
  if (e.ctrlKey && e.key === 'q') {
    e.preventDefault();
    const activeTab = document.querySelector('.tab-btn.active');
    if(activeTab.textContent.includes('Contratos')) {
      openQuickWizard('disputas');
    } else if(activeTab.textContent.includes('Empenhos')) {
      openQuickWizard('empenhos');
    }
  }
  
  // Esc = Fechar modais
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open, .wizard-overlay.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});

// ========== DISPUTAS ==========
function clearD(){
  _acompConvertendoId = null; // limpa conversão pendente
  resetFields('d');
  ['d-data','d-orgao','d-estado','d-empresa','d-tipo','d-processo','d-sistema','d-analista','d-observacao','d-proposta-url','d-proposta-nome','d-contrato-url','d-contrato-nome','d-contrato-data','d-contrato-vencimento'].forEach(id=>{const e=g(id);if(e)e.value='';});

  const cp = g('d-contrato-preview'); if(cp) { cp.style.display='none'; }
  const cl = g('d-contrato-upload-label'); if(cl) cl.textContent='Clique ou arraste o PDF do contrato aqui';
  const ca = g('d-contrato-upload-area'); if(ca) ca.style.borderColor='var(--border)';
  g('d-empresa').value='Hamate'; g('d-tipo').value='Pregão Eletrônico'; g('d-rp').value='NÃO'; g('d-sistema').value='Licitanet';
  setAnalistaSelect('d-analista', (isAdmin ? 'Márdea' : analistaDoUsuario) || 'Márdea');
  calcD();
}
function _validarLotesSaldo(disputaId) {
  // FIX 8: impede saldo negativo nos lotes
  const d = DB.disputas.find(x => x.id === disputaId);
  if (!d) return true;
  const problemas = [];
  (lotesTemp||[]).forEach(l => {
    const qtdEnviada = calcQtdEnviada(disputaId, l.id);
    if ((l.qtd||0) < qtdEnviada) {
      problemas.push(`Lote <strong>${l.descricao||l.id}</strong>: quantidade nova (${l.qtd}) é menor que já empenhado (${qtdEnviada} un.)`);
    }
  });
  if (problemas.length) {
    toast('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ' + problemas[0].replace(/<[^>]+>/g,'') + ' — ajuste a quantidade.', 'error');
    return false;
  }
  return true;
}

function saveD(){
  // MELHORIA 12: Validação com feedback visual
  if (!validarFormDisputa()) {
    toast('Preencha os campos obrigatórios destacados em vermelho', 'error');
    return;
  }
  // Validação: lotes obrigatórios
  const lotesValidos = lotesTemp.filter(l => l.descricao && l.vunit > 0);
  if (!lotesValidos.length) {
    const aviso = g('lotes-aviso');
    if (aviso) { aviso.style.display = 'block'; aviso.scrollIntoView({behavior:'smooth',block:'center'}); }
    toast('Adicione pelo menos 1 item/lote com descrição e valor', 'error');
    return;
  }
  const M={};
  // Calcula valor do contrato a partir dos lotes
  const valorContrato = lotesValidos.reduce((s,l)=>s+(l.qtd||1)*(l.vunit||0),0);
  const row={
    id: EID.disputas||uid(),
    data: gv('d-data'),
    orgao: gv('d-orgao').toUpperCase(),
    estado: gv('d-estado'),
    empresa: gv('d-empresa'),
    tipo: gv('d-tipo'),
    rp: gv('d-rp'),
    processo: gv('d-processo').toUpperCase(),
    sistema: gv('d-sistema'),
    analista: gv('d-analista'),
    linkSistema: '',
    linkProposta: '',
    compra: 0,
    venda: valorContrato, // sempre = soma dos lotes
    aliq: 0,
    situacao: '',
    observacao: gv('d-observacao').toUpperCase(),
    propostaUrl: gv('d-proposta-url') || '',
    propostaNome: gv('d-proposta-nome') || '',

    contratoUrl: gv('d-contrato-url') || '',
    contratoNome: gv('d-contrato-nome') || '',
    contratoData: gv('d-contrato-data') || '',
    contratoVencimento: gv('d-contrato-vencimento') || '',
    lotes: lotesValidos.map(l => ({ id: l.id || uid(), descricao: (l.descricao||'').toUpperCase(), qtd: l.qtd||1, vunit: l.vunit||0, compraPrev: l.compraPrev||0, custoPrev: l.custoPrev||0 })),
    M
  };
  // FIX 8: verificar saldo negativo ao editar lotes
  if (EID.disputas && !_validarLotesSaldo(EID.disputas)) return;
  upsert('disputas',row);

  // Sincroniza descrições nos empenhos e compras vinculados
  if (EID.disputas) {
    const lotesMap = {};
    row.lotes.forEach(l => { lotesMap[l.id] = l.descricao; });

    DB.empenhos.filter(e => e.disputaId === row.id).forEach(e => {
      let alterado = false;
      // Atualiza descrição nos itens do empenho
      (e.itens||[]).forEach(item => {
        const novaDesc = lotesMap[item.loteId];
        if (novaDesc && item.descricao !== novaDesc) {
          item.descricao = novaDesc;
          alterado = true;
        }
      });
      // Atualiza produto (campo legado) 
      if (alterado) {
        e.produto = (e.itens||[]).map(i=>i.descricao).join(' / ');
        save('empenhos', DB.empenhos);
      }
    });
  }

  // Se veio de conversão de acompanhamento, remove o acomp
  if (_acompConvertendoId && !EID.disputas) {
    _fullDB.acomp = (_fullDB.acomp||[]).filter(a => a.id !== _acompConvertendoId);
    save('acomp', _fullDB.acomp);
    _acompConvertendoId = null;
    toast('Contrato criado e acompanhamento removido da lista!', 'success');
  } else {
    toast(EID.disputas?'Contrato atualizado':'Contrato salvo','success');
  }
  closeModal('disputas', true); reconciliarFinalizacoes(); renderActive();
}
function editD(id){
  const r=DB.disputas.find(x=>x.id===id); if(!r) return;
  EID.disputas=id; clearD();
  g('d-data').value=r.data||''; g('d-orgao').value=r.orgao||''; g('d-estado').value=r.estado||'';
  g('d-empresa').value=r.empresa||''; g('d-tipo').value=r.tipo||''; g('d-rp').value=r.rp||'';
  g('d-processo').value=r.processo||''; g('d-sistema').value=r.sistema||'';
  setAnalistaSelect('d-analista', r.analista || analistaDoUsuario);
  // Para não-admins, bloqueia troca de analista
  const _dAnSel = g('d-analista');
  if (_dAnSel) _dAnSel.disabled = !isAdmin;

  g('d-observacao').value=r.observacao||'';

  // Carrega proposta se existir
  const urlEl = g('d-proposta-url'); if(urlEl) urlEl.value = r.propostaUrl || '';
  const nomeEl = g('d-proposta-nome'); if(nomeEl) nomeEl.value = r.propostaNome || '';
  // Carrega edital se existir
  carregarArquivosDisputa(r);
  // Carrega contrato
  carregarContratoDisputa(r);

  // Carrega lotes (garante que todos tenham ID e preserva campos de previsão)
  lotesTemp = (r.lotes || []).map(l => ({ id: l.id || uid(), descricao: l.descricao||'', qtd: l.qtd||1, vunit: l.vunit||0, compraPrev: l.compraPrev||0, custoPrev: l.custoPrev||0 }));
  renderLotes();
  calcD();
  syncMasterCheckbox('d');
  g('ttl-disputas').textContent='Editar Contrato'; g('modal-disputas').classList.add('open');
}

// ========== EMPENHOS ==========
function clearE(){
  resetFields('e');
  vemManual = false;
  const aiVem = g('e-vem-a'); const miVem = g('e-vem');
  if(aiVem) { aiVem.style.display='block'; aiVem.value=''; }
  if(miVem) { miVem.style.display='none'; miVem.value=''; }
  const btnVem = g('tbtn-e-vem'); if(btnVem){ btnVem.classList.remove('on'); btnVem.innerHTML='<span class="dot"></span>Auto'; }
  ['e-num','e-data','e-analista','e-dcomp','e-vunit','e-qtd','e-vem','e-recebido','e-dreceb','e-tot-m','e-imp-m','e-luc-m','e-pct-m','e-rec-m','e-observacao','e-ne-url','e-ne-nome'].forEach(id=>{const e=g(id);if(e)e.value='';}); const neP=g('e-ne-preview'); if(neP){neP.style.display='none';} const neL=g('e-ne-upload-label'); if(neL) neL.textContent='Clique ou arraste o PDF do empenho aqui'; const neF=g('e-ne-file'); if(neF) neF.value=''; _ocrExtractedData=null;
  g('e-aliq').value='13'; g('e-qtd').value='1'; 
  calcE();
}
let _skipDupCheck = false;
function _continuarSaveE() { _skipDupCheck = true; saveE(); }
function saveE(){
  // MELHORIA 12: Validação com feedback visual
  if (!validarFormEmpenho()) {
    toast('Preencha os campos obrigatórios destacados em vermelho', 'error');
    return;
  }
  const disputaId = gv('e-disputa-id');
  if (!disputaId) {
    toast('SELECIONE A CONTRATO VINCULADO (OBRIGATÓRIO)', 'error');
    g('e-disputa-id').focus();
    return;
  }
  // Detecção de empenho duplicado
  const numDigitado = gv('e-num').toUpperCase().trim();
  if (numDigitado && !_skipDupCheck) {
    const duplicado = DB.empenhos.find(e => e.num === numDigitado && e.id !== (EID.empenhos||''));
    if (duplicado) {
      // MELHORIA 8: Usa modal estilizado para confirmar duplicação
      _confirmarAcao({icon:'⚠️', titulo:'Empenho duplicado', msg:`Já existe um empenho com o número <strong>${numDigitado}</strong> (${duplicado.orgao||'?'}).<br><br>Deseja salvar mesmo assim?`, btnLabel:'Salvar mesmo assim', btnClass:'btn-ghost', onConfirm: () => { _continuarSaveE(); }});
      return;
    }
  }
  _skipDupCheck = false;
  // Pega todos os lotes selecionados
  const lotesKeys = Object.keys(lotesSelecionados);
  const disp = DB.disputas.find(d => d.id === disputaId);
  if (disp && (disp.lotes||[]).length > 0 && !lotesKeys.length) {
    const aviso = g('lote-aviso');
    if (aviso) { aviso.style.display = 'block'; }
    toast('SELECIONE PELO MENOS UM ITEM/LOTE DO EMPENHO', 'error');
    return;
  }
  
  // Monta itens do empenho — preserva IDs existentes para não quebrar vínculos com compras
  const itensExistentes = EID.empenhos ? (DB.empenhos.find(x=>x.id===EID.empenhos)?.itens || []) : [];
  const itens = lotesKeys.map(loteId => {
    const qtd = lotesSelecionados[loteId] || 1;
    const lote = disp ? (disp.lotes||[]).find(l=>l.id===loteId) : null;
    // Reutiliza o ID do item existente com mesmo loteId, para preservar referências das compras
    const itemExistente = itensExistentes.find(i => i.loteId === loteId);
    return {
      id: itemExistente ? itemExistente.id : uid(),
      loteId: loteId,
      descricao: lote ? lote.descricao : '',
      qtd: qtd,
      vunit: lote ? lote.vunit : 0
    };
  });
  
  const M={};
  if(MS.e.tot) M.tot=gn('e-tot-m');
  if(MS.e.imp) M.imp=gn('e-imp-m');
  if(MS.e.luc) M.luc=gn('e-luc-m');
  if(MS.e.pct) M.pct=gn('e-pct-m');
  if(MS.e.rec) M.rec=gn('e-rec-m');
  
  // vem: auto-calculado ou manual
  const vemVal = vemManual ? gn('e-vem') : (itens.reduce((s,i)=>s+(i.qtd||0)*(i.vunit||0),0));
  
  // Compatibilidade retroativa: loteId e qtdLote para empenhos com 1 lote
  const primeiroItem = itens[0] || null;
  
  const row={
    id: EID.empenhos||uid(),
    num: gv('e-num').toUpperCase(),
    data: gv('e-data'),
    orgao: disp ? disp.orgao : '',
    analista: gv('e-analista') || analistaDoUsuario || '',
    produto: itens.map(i=>i.descricao).join(' / ') || '',
    plataforma: '',
    dcomp: gv('e-dcomp'),
    vunit: primeiroItem ? primeiroItem.vunit : 0,
    qtd: primeiroItem ? primeiroItem.qtd : 1,
    qtdLote: primeiroItem ? primeiroItem.qtd : null,
    loteId: primeiroItem ? primeiroItem.loteId : null,
    itens: itens, // NOVO: array de itens
    vem: vemVal,
    aliq: parseAliq(gv('e-aliq')),
    recebido: gn('e-recebido'),
    dreceb: gv('e-dreceb'),
    observacao: gv('e-observacao').toUpperCase(),

    neUrl: gv('e-ne-url') || '',
    neNome: gv('e-ne-nome') || '',
    disputaId: disputaId,
    compras: (EID.empenhos ? (DB.empenhos.find(x=>x.id===EID.empenhos)?.compras || []) : []), // preserva compras
    M
  };
  upsert('empenhos',row);
  const _isNew = !EID.empenhos;
  toast(_isNew ? 'EMPENHO SALVO' : 'EMPENHO ATUALIZADO', 'success');
  closeModal('empenhos', true);
  reconciliarFinalizacoes(); renderActive();
  // Após salvar, abre o popup de detalhe do empenho
  setTimeout(() => abrirPopupEmpenho(row.id), 150);
}
function editE(id){
  const r=DB.empenhos.find(x=>x.id===id); if(!r) return;
  EID.empenhos=id; clearE();
  g('e-num').value=r.num||''; g('e-data').value=r.data||'';
  setAnalistaSelect('e-analista', r.analista || analistaDoUsuario);
  // Para não-admins, bloqueia troca de analista
  const _eAnSel = g('e-analista');
  if (_eAnSel) _eAnSel.disabled = !isAdmin;
  g('e-observacao').value=r.observacao||'';

  // Carrega NE
  carregarArquivosEmpenho(r);
  g('e-dcomp').value=r.dcomp||''; 
  g('e-aliq').value= (r.aliq*100).toFixed(1).replace('.',',');
  g('e-recebido').value=r.recebido||''; g('e-dreceb').value=r.dreceb||''; 
  
  // vemManual
  vemManual = false;
  const aiVem = g('e-vem-a'); const miVem = g('e-vem');
  if(aiVem) aiVem.style.display = 'block';
  if(miVem) { miVem.style.display = 'none'; miVem.value = r.vem||''; }
  const btnVem = g('tbtn-e-vem'); if(btnVem){ btnVem.classList.remove('on'); btnVem.innerHTML='<span class="dot"></span>Auto'; }
  
  // Restaura seleção de lotes
  lotesSelecionados = {};
  populateDisputaSelect(r.disputaId || null);
  if (r.disputaId) {
    setTimeout(() => {
      // Suporte a múltiplos itens
      if(r.itens && r.itens.length > 0) {
        r.itens.forEach(item => {
          const lotes = getLotesComSaldo(r.disputaId, r.id);
          const lote = lotes.find(l=>l.id===item.loteId);
          if(lote) {
            const saldoMaisEste = lote.qtdRestante + item.qtd;
            lotesSelecionados[item.loteId] = item.qtd;
            const card = g('lcard-'+item.loteId);
            if(card) { card.classList.add('selected'); const chk=card.querySelector('input[type=checkbox]'); if(chk) chk.checked=true; }
            const qtdWrap = g('lqtd-wrap-'+item.loteId); if(qtdWrap) qtdWrap.style.display = 'flex';
            const input = g('lqtd-'+item.loteId); if(input) { input.value = item.qtd; input.max = saldoMaisEste; }
            const valEl = g('lval-'+item.loteId); if(valEl) valEl.textContent = fmt(item.qtd*(lote.vunit||0));
          }
        });
      } else if (r.loteId) {
        // compatibilidade com formato antigo (1 lote)
        const lotes = getLotesComSaldo(r.disputaId, r.id);
        const lote = lotes.find(l => l.id === r.loteId);
        if (lote) {
          const saldoMaisEste = lote.qtdRestante + (r.qtdLote || 0);
          lotesSelecionados[r.loteId] = r.qtdLote || 1;
          const card = g('lcard-'+r.loteId);
          if(card) { card.classList.add('selected'); const chk=card.querySelector('input[type=checkbox]'); if(chk) chk.checked=true; }
          const qtdWrap = g('lqtd-wrap-'+r.loteId); if(qtdWrap) qtdWrap.style.display = 'flex';
          const input = g('lqtd-'+r.loteId); if(input) { input.value = r.qtdLote||1; input.max = saldoMaisEste; }
        }
      }
      atualizarVemTotal();
    }, 50);
  }
  const M=r.M||{};
  if(M.tot!==undefined){ g('e-tot-m').value=M.tot; setField('e','tot',true); }
  if(M.imp!==undefined){ g('e-imp-m').value=M.imp; setField('e','imp',true); }
  if(M.luc!==undefined){ g('e-luc-m').value=M.luc; setField('e','luc',true); }
  if(M.pct!==undefined){ g('e-pct-m').value=M.pct; setField('e','pct',true); }
  if(M.rec!==undefined){ g('e-rec-m').value=M.rec; setField('e','rec',true); }
  calcE();
  syncMasterCheckbox('e');
  g('ttl-empenhos').textContent='EDITAR EMPENHO'; g('modal-empenhos').classList.add('open');
}

// ========== CRUD ==========
function upsert(tab, row) {
  const arr = _fullDB[tab] || [];
  const idx = arr.findIndex(r => r.id === row.id);
  if (idx !== -1) arr[idx] = row;
  else arr.push(row);
  _fullDB[tab] = arr;
  save(tab, arr);
}
let PDel=null;
function delRow(tab,id){
  PDel={tab,id};
  let msg = 'Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.';
  let titulo = 'Confirmar exclusão';
  let icon = '🗑️';
  if(tab === 'disputas') {
    const disp = DB.disputas.find(r=>r.id===id);
    const empsVinculados = DB.empenhos.filter(e=>e.disputaId===id);
    const totalCompras = empsVinculados.reduce((s,e)=>s+(e.compras||[]).length,0);
    const nome = disp ? disp.orgao : 'esto contrato';
    titulo = `Excluir contrato`;
    icon = '⚠️';
    if(empsVinculados.length > 0) {
      msg = `Ao excluir o contrato <strong>${nome}</strong>, serão excluídos também:<br><br>`
          + `• <strong>${empsVinculados.length} empenho(s)</strong> vinculado(s)<br>`
          + (totalCompras > 0 ? `• <strong>${totalCompras} compra(s)</strong> registrada(s)<br>` : '')
          + `<br>Esta ação <strong>não pode ser desfeita</strong>.`;
    } else {
      msg = `Tem certeza que deseja excluir o contrato <strong>${nome}</strong>?<br><br>Esta ação não pode ser desfeita.`;
    }
  } else if(tab === 'empenhos') {
    const emp = DB.empenhos.find(r=>r.id===id);
    const nome = emp ? `#${emp.num||'?'} · ${emp.orgao||'?'}` : 'este empenho';
    const totalCompras = (emp?.compras||[]).length;
    titulo = `Excluir empenho`;
    icon = totalCompras > 0 ? '⚠️' : '🗑️';
    msg = totalCompras > 0
      ? `Ao excluir o empenho <strong>${nome}</strong>, serão excluídas também <strong>${totalCompras} compra(s)</strong> registrada(s).<br><br>Esta ação não pode ser desfeita.`
      : `Tem certeza que deseja excluir o empenho <strong>${nome}</strong>?<br><br>Esta ação não pode ser desfeita.`;
  }
  const iconEl = g('confirm-modal-icon'); if(iconEl) iconEl.textContent = icon;
  const titleEl = g('confirm-modal-title'); if(titleEl) titleEl.textContent = titulo;
  const el = g('confirm-msg'); if(el) el.innerHTML = msg;
  // Garante que o botão aponta para confirmDel (padrão de exclusão)
  const _btn = g('confirm-del-btn');
  if(_btn) { _btn.textContent = 'Sim, excluir'; _btn.className = 'btn btn-danger'; _btn.style.minWidth = '110px'; _btn.onclick = confirmDel; }
  g('modal-confirm').classList.add('open');
}
function closeConfirm(){ PDel=null; g('modal-confirm').classList.remove('open'); const btn=g('confirm-del-btn'); if(btn) btn.onclick=confirmDel; btn && (btn.className='btn btn-danger'); btn && (btn.style.minWidth='110px'); }
function confirmDel(){
  if(!PDel) return;
  if(PDel.tab === 'disputas') {
    _fullDB.empenhos = _fullDB.empenhos.filter(e => e.disputaId !== PDel.id);
    save('empenhos', _fullDB.empenhos);
  }
  _fullDB[PDel.tab] = _fullDB[PDel.tab].filter(r => r.id !== PDel.id);
  save(PDel.tab, _fullDB[PDel.tab]);
  closeConfirm();
  renderActive();
  toast('Excluído com sucesso','info');
}

// ========== EXCLUSÃO EM LOTE ==========
function toggleSelectAll(tab, checked) {
  document.querySelectorAll('.chk-row-' + tab).forEach(chk => { chk.checked = checked; });
  atualizarBotaoLote(tab);
}
function onRowCheck(tab) {
  const all = document.querySelectorAll('.chk-row-' + tab);
  const checked = document.querySelectorAll('.chk-row-' + tab + ':checked');
  const chkAll = g('chk-all-' + tab);
  if (chkAll) { chkAll.checked = all.length > 0 && checked.length === all.length; chkAll.indeterminate = checked.length > 0 && checked.length < all.length; }
  atualizarBotaoLote(tab);
}
function atualizarBotaoLote(tab) {
  const cnt = document.querySelectorAll('.chk-row-' + tab + ':checked').length;
  const btn = g('btn-del-lote-' + tab);
  const span = g('cnt-sel-' + tab);
  if (btn) btn.style.display = cnt > 0 ? '' : 'none';
  if (span) span.textContent = cnt;
}
function deletarSelecionados(tab) {
  const ids = Array.from(document.querySelectorAll('.chk-row-' + tab + ':checked')).map(c => c.dataset.id);
  if (!ids.length) return;
  // Usa modal estilizado em vez do confirm nativo
  PDel = { tab, ids };
  const iconEl = g('confirm-modal-icon'); if(iconEl) iconEl.textContent = '⚠️';
  const titleEl = g('confirm-modal-title'); if(titleEl) titleEl.textContent = `Excluir ${ids.length} registro(s)`;
  const el = g('confirm-msg');
  const cascata = tab === 'disputas' ? DB.empenhos.filter(e => ids.includes(e.disputaId)).length : 0;
  if(el) el.innerHTML = `Você está prestes a excluir <strong>${ids.length} ${tab === 'disputas' ? 'contrato(s)' : 'empenho(s)'}</strong>.`
    + (cascata > 0 ? `<br><br>Isso também excluirá <strong>${cascata} empenho(s) vinculado(s)</strong>.` : '')
    + `<br><br>Esta ação <strong>não pode ser desfeita</strong>.`;
  const btn = g('confirm-del-btn');
  if(btn) {
    btn.onclick = () => {
      if (tab === 'disputas') {
        _fullDB.empenhos = _fullDB.empenhos.filter(e => !ids.includes(e.disputaId));
        save('empenhos', _fullDB.empenhos);
      }
      _fullDB[tab] = _fullDB[tab].filter(r => !ids.includes(r.id));
      save(tab, _fullDB[tab]);
      renderActive();
      const chkAll = g('chk-all-' + tab);
      if (chkAll) { chkAll.checked = false; chkAll.indeterminate = false; }
      atualizarBotaoLote(tab);
      toast(ids.length + ' registro(s) excluído(s)', 'info');
      PDel = null;
      closeConfirm();
    };
  }
  g('modal-confirm').classList.add('open');
}

// ========== EXPORT ==========
function exportCSV(tab){
  const H={ 
    disputas:['Data','Órgão','Estado','Empresa','Tipo','RP','Processo','Sistema','Analista','LinkSistema','LinkProposta','PrevCompra','PrevVenda','Alíquota','Impostos','PrevLucro','%Lucro','Situação','Observação'], 
    empenhos:['Empenho','Data','Órgão','Analista','Produto','Plataforma','DataCompra','ValUnit','Qtd','Total','ValEmpenho','Alíquota','Imposto','Lucro','%Lucro','AReceber','Recebido','DataReceb','Observação'] 
  };
  const R={ 
    disputas:DB.disputas.map(r=>{const v=dVals(r); return[r.data,r.orgao,r.estado,r.empresa,r.tipo,r.rp,r.processo,r.sistema,r.analista,r.linkSistema,r.linkProposta,r.compra,r.venda,r.aliq,v.imp,v.luc,v.pct,r.situacao,r.observacao||'']; }), 
    empenhos:DB.empenhos.map(r=>{const v=eVals(r); return[r.num,r.data,r.orgao,r.analista,r.produto,r.plataforma,r.dcomp,r.vunit,r.qtd,v.tot,r.vem,r.aliq,v.imp,v.luc,v.pct,v.rec,r.recebido,r.dreceb,r.observacao||'']; }) 
  };
  const csv=[H[tab],...R[tab]].map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'})); a.download=`${tab}_${today()}.csv`; a.click(); toast('CSV exportado','success');
}

// ========== EXPORT XLSX (SheetJS) ==========
function exportXLSX(tab) {
  if (typeof XLSX === 'undefined') { exportCSV(tab); return; }

  if (tab === 'empenhos') {
    const idsSelecionados = Array.from(
      document.querySelectorAll('.chk-row-empenhos:checked')
    ).map(chk => chk.dataset.id);

    if (!idsSelecionados.length) {
      toast('Selecione ao menos um empenho para exportar.', 'error');
      return;
    }

    const idsSet = new Set(idsSelecionados);
    const empenhosSelecionados = DB.empenhos.filter(r =>
      idsSet.has(r.id) && !r.finalizado
    );

    const cabecalho = [
      'Órgão',
      'Número Empenho',
      'Valor do Empenho',
      'Valor da Compra',
      'Custo',
      'Lucro a Receber',
      'Valor a Receber'
    ];

    const linhas = empenhosSelecionados.map(r => {
      const compras = r.compras || [];
      const comprasPendentes = compras.filter(compra => !compra.dpag || compra.dpag === '');
      const valorCompra = compras.reduce((total, compra) => total + (compra.vtotal || 0), 0);
      const custo = compras.reduce((total, compra) => total + (compra.custo || 0), 0);
      const lucroAReceber = comprasPendentes.reduce((total, compra) => {
        const lucro = compra.luc !== undefined && compra.luc !== null
          ? compra.luc
          : (compra.rec || 0) - (compra.vtotal || 0) - (compra.custo || 0);
        return total + lucro;
      }, 0);
      const valorAReceber = comprasPendentes.reduce(
        (total, compra) => total + (compra.rec || 0), 0
      );

      return [
        r.orgao || '',
        r.num || '',
        r.vem || 0,
        valorCompra,
        custo,
        lucroAReceber,
        valorAReceber
      ];
    });

    const linhaTotais = [
      'TOTAL',
      '',
      linhas.reduce((soma, linha) => soma + (linha[2] || 0), 0),
      linhas.reduce((soma, linha) => soma + (linha[3] || 0), 0),
      linhas.reduce((soma, linha) => soma + (linha[4] || 0), 0),
      linhas.reduce((soma, linha) => soma + (linha[5] || 0), 0),
      linhas.reduce((soma, linha) => soma + (linha[6] || 0), 0)
    ];

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas, linhaTotais]);
    ws['!cols'] = [
      { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 16 }, { wch: 22 }, { wch: 22 }
    ];

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
      if (cell) cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'EEF2F6' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    for (let R = 1; R <= range.e.r; R++) {
      for (let C = 2; C <= 6; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell) cell.z = 'R$ #,##0.00';
      }
    }

    const totalRow = range.e.r;
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = ws[XLSX.utils.encode_cell({ r: totalRow, c: C })];
      if (cell) cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D9EAD3' } },
        alignment: { horizontal: C < 2 ? 'left' : 'right', vertical: 'center' }
      };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empenhos');
    XLSX.writeFile(wb, `Empenhos_selecionados_${today()}.xlsx`);
    toast(`Excel exportado: ${linhas.length} empenho(s) selecionado(s)`, 'success');
    return;
  }

  const H = {
    disputas: ['Data','Órgão','UF','Empresa','Tipo','RP','Processo','Sistema','Analista','Vl.Contrato','Compra Prev.','Custo Prev.','Lucro Prev.','% Lucro','Situação','Observação']
  };
  const R = {
    disputas: DB.disputas.filter(r => !r.finalizada && matches('disputas', r)).map(r => {
      const v = dVals(r);
      return [r.data, r.orgao, r.estado, r.empresa, r.tipo, r.rp, r.processo, r.sistema, r.analista,
        getValorContrato(r), r.compra||0, r.custo||0, v.luc, v.pct+'%', r.situacao||'', r.observacao||''];
    })
  };
  const ws = XLSX.utils.aoa_to_sheet([H[tab], ...R[tab]]);
  ws['!cols'] = H[tab].map(h => ({ wch: Math.max(h.length + 2, 12) }));
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({r:0, c:C})];
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'EEF2F6' } } };
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos');
  XLSX.writeFile(wb, `Contratos_${today()}.xlsx`);
  toast(`Excel exportado: ${R[tab].length} registros`, 'success');
}

// ========== BACKUP / RESTAURAR ==========
function exportarBackup() {
  try {
    const dados = {
      disputas: DB.disputas,
      empenhos: DB.empenhos,
      initialized: true,
      exportadoEm: new Date().toLocaleString('pt-BR'),
      versao: '1.0'
    };
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob(['\ufeff' + json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'licitacoes_backup_' + today() + '.json';
    a.style.display = 'none';
    document.body.appendChild(a);  // necessário para Edge/Firefox
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    toast('Backup exportado! ' + DB.disputas.length + ' disputas e ' + DB.empenhos.length + ' empenhos.', 'success');
  } catch(err) {
    alert('Erro ao exportar: ' + err.message);
  }
}

function importarBackup(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.disputas || !data.empenhos) { toast('Arquivo inválido','error'); return; }
      DB.disputas = data.disputas;
      DB.empenhos = data.empenhos;
      save('disputas', DB.disputas);
      save('empenhos', DB.empenhos);
      renderAll();
      toast('Backup importado com sucesso!', 'success');
    } catch(err) { toast('Erro ao importar backup','error'); }
  };
  reader.readAsText(file);
}

function toast(msg,type='info'){ const icons={success:'✅',error:'❌',info:'ℹ️'}; const el=document.createElement('div'); el.className=`toast ${type}`; el.innerHTML=`<span>${icons[type]}</span> ${msg}`; g('toasts').appendChild(el); setTimeout(()=>el.remove(),3000); }

document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o && o.id!=='modal-acomp'){o.classList.remove('open');PDel=null;disputaAtiva=null;}}));

