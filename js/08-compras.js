// ========== COMPRAS INDIVIDUAIS ==========
let compraEmpenhoId = null;
let compraEditId = null;
let compraMSLuc = false;
let compraMSRec = false;
let compraLoteSelecionado = null;

// ===== PRAZO DE PAGAMENTO A PARTIR DA ENTREGA COMPLETA =====
function situacaoPrazoPagamento(r) {
  const compras = (r && r.compras) || [];
  if (!compras.length) return { codigo: 'sem-compras', rotulo: 'SEM COMPRAS', dataInicio: '' };
  if (empenhoEstaPago(r)) return { codigo: 'pago', rotulo: 'PAGO', dataInicio: '' };
  const compraSemStatus = compras.find(c => !c.statusEntrega);
  if (compraSemStatus) return { codigo: 'status-pendente', rotulo: 'STATUS DE ENTREGA PENDENTE', dataInicio: '' };
  const compraNaoRecebida = compras.find(c => c.statusEntrega !== 'recebida');
  if (compraNaoRecebida) {
    const rotulos = { aguardando_envio: 'AGUARDANDO ENVIO', em_transito: 'EM TRÂNSITO', nao_recebida: 'NÃO RECEBIDA' };
    return { codigo: 'entrega-pendente', rotulo: rotulos[compraNaoRecebida.statusEntrega] || 'ENTREGA PENDENTE', dataInicio: '' };
  }
  const compraRecebidaSemData = compras.find(c => !c.dataRecebimentoMercadoria);
  if (compraRecebidaSemData) return { codigo: 'data-pendente', rotulo: 'DATA DE RECEBIMENTO PENDENTE', dataInicio: '' };
  const dataInicio = compras.reduce((maior, c) => c.dataRecebimentoMercadoria > maior ? c.dataRecebimentoMercadoria : maior, '');
  return { codigo: 'contando', rotulo: '', dataInicio };
}

diasSemPagamento = function(r) {
  if (r && r.id) {
    const cached = _memoCache.diasSemPag.get(r.id);
    if (cached !== undefined) return cached;
  }
  const situacao = situacaoPrazoPagamento(r);
  if (situacao.codigo !== 'contando' || !situacao.dataInicio) {
    if (r && r.id) _memoCache.diasSemPag.set(r.id, 0);
    return 0;
  }
  const hoje = new Date(); hoje.setHours(12,0,0,0);
  const inicio = new Date(situacao.dataInicio + 'T12:00:00');
  const dias = Math.max(0, Math.floor((hoje.getTime() - inicio.getTime()) / 86400000));
  if (r && r.id) _memoCache.diasSemPag.set(r.id, dias);
  return dias;
};

function garantirCamposLogisticaCompra() {
  const campos = g('compra-campos');
  if (!campos || g('c-status-entrega')) return;
  const bloco = document.createElement('div');
  bloco.id = 'c-logistica-entrega';
  bloco.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:12px 0;padding:12px;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-surface-soft);';
  bloco.innerHTML = `
    <div class="form-group">
      <label for="c-status-entrega">Status da entrega</label>
      <select id="c-status-entrega" class="fc" onchange="atualizarCamposStatusEntrega()">
        <option value="aguardando_envio">Aguardando envio</option>
        <option value="em_transito">Em trânsito</option>
        <option value="nao_recebida">Não recebida</option>
        <option value="recebida">Recebida</option>
      </select>
    </div>
    <div class="form-group" id="c-data-prevista-wrap" style="display:none;">
      <label for="c-data-prevista-recebimento">Data prevista de recebimento</label>
      <input type="date" id="c-data-prevista-recebimento" class="fc">
    </div>
    <div class="form-group" id="c-data-recebimento-wrap" style="display:none;">
      <label for="c-data-recebimento-mercadoria">Data de recebimento da mercadoria</label>
      <input type="date" id="c-data-recebimento-mercadoria" class="fc">
    </div>`;
  campos.insertBefore(bloco, campos.firstChild);
}

function atualizarCamposStatusEntrega() {
  const status = gv('c-status-entrega');
  const wrapPrevista = g('c-data-prevista-wrap');
  const dataPrevista = g('c-data-prevista-recebimento');
  const wrapRecebimento = g('c-data-recebimento-wrap');
  const dataRecebimento = g('c-data-recebimento-mercadoria');
  if (wrapPrevista) wrapPrevista.style.display = status === 'em_transito' ? '' : 'none';
  if (wrapRecebimento) wrapRecebimento.style.display = status === 'recebida' ? '' : 'none';
  if (status !== 'em_transito' && dataPrevista) dataPrevista.value = '';
  if (status !== 'recebida' && dataRecebimento) dataRecebimento.value = '';
}

function togCompra(f) {
  if(f === 'luc') { compraMSLuc = !compraMSLuc; setCompraField('luc', compraMSLuc); }
  if(f === 'rec') { compraMSRec = !compraMSRec; setCompraField('rec', compraMSRec); }
  calcCompra();
}

function setCompraField(f, on) {
  const ai = g('c-'+f+'-a'); const mi = g('c-'+f+'-m'); const btn = g('tbtn-c-'+f);
  if(!ai||!mi||!btn) return;
  if(on) { ai.style.display='none'; mi.style.display='block'; btn.classList.add('on'); btn.innerHTML='<span class="dot"></span>Manual'; }
  else { ai.style.display='block'; mi.style.display='none'; btn.classList.remove('on'); btn.innerHTML='<span class="dot"></span>Auto'; }
}

function calcCompra() {
  const qtd = +gv('c-qtd') || 0;
  const vunit = +gv('c-vunit') || 0;
  const custo = +gv('c-custo') || 0;
  // Calcula total da compra: qtd comprada * valor unitário
  const vtotal = qtd * vunit;
  // Atualiza campo total (readonly)
  const vtotalEl = g('c-vtotal-compra');
  if(vtotalEl) vtotalEl.value = vtotal > 0 ? vtotal.toFixed(2) : '';
  // Lucro = valor empenho proporcional à qtd comprada - total compra - custo
  // O valor do empenho por unidade é: vemItem / qtdEmpenho
  const vemItem = +gv('c-vem-item') || 0;
  const qtdEmpenho = +gv('c-qtd-empenho') || 1;
  const vemUnitario = qtdEmpenho > 0 ? vemItem / qtdEmpenho : 0;
  const vemProporcional = vemUnitario * qtd; // valor do empenho para a qtd comprada
  const luc = vemProporcional - vtotal - custo;
  const rec = vtotal + luc; // = vemProporcional - custo
  if(!compraMSLuc) g('c-luc-a').value = fmt(luc);
  if(!compraMSRec) g('c-rec-a').value = fmt(rec);
  // % Lucro = lucro / valor total compra
  const lucroReal = compraMSLuc ? (+gv('c-luc-m') || 0) : luc;
  const pctLucro = vtotal > 0 ? (lucroReal / vtotal * 100) : 0;
  const pctEl = g('c-pct-lucro');
  if (pctEl) pctEl.value = vtotal > 0 ? pctLucro.toFixed(1) + '%' : '—';
}

function abrirCompra(empenhoId, compraId) {
  // Se não é edição, verificar saldo antes de abrir
  if (!compraId && !empenhoTemSaldo(empenhoId)) {
    toast('Todos os itens deste empenho já foram completamente comprados.', 'warning');
    return;
  }
  compraEmpenhoId = empenhoId;
  compraEditId = compraId || null;
  compraMSLuc = false; compraMSRec = false;
  setCompraField('luc', false); setCompraField('rec', false);
  compraLoteSelecionado = null;
  garantirCamposLogisticaCompra();
  ['c-data-prevista-recebimento','c-data-recebimento-mercadoria','c-lote-desc','c-qtd-empenho','c-vem-item','c-qtd','c-dcompra','c-plataforma','c-link','c-vunit','c-vtotal-compra','c-custo','c-dpag','c-recebido','c-obs','c-luc-m','c-rec-m'].forEach(id=>{const el=g(id);if(el)el.value='';});
  if (g('c-status-entrega')) g('c-status-entrega').value = 'aguardando_envio';
  atualizarCamposStatusEntrega();
  g('compra-campos').style.display = 'none';
  // Reseta painel de cálculo de custo
  const _painel = g('c-custo-calc-painel');
  if (_painel) _painel.style.display = 'none';
  const _calcSimples = g('c-calc-simples');
  if (_calcSimples) _calcSimples.checked = true;
  const _calcIcms = g('c-calc-icms');
  if (_calcIcms) _calcIcms.checked = false;
  const _calcCredito = g('c-calc-credito');
  if (_calcCredito) _calcCredito.value = '';
  const _calcCustoEmp = g('c-calc-custo-emp');
  if (_calcCustoEmp) _calcCustoEmp.checked = false;
  const _calcRes = g('c-calc-resultado');
  if (_calcRes) { _calcRes.textContent = '—'; _calcRes._valor = undefined; }
  
  const emp = DB.empenhos.find(x=>x.id===empenhoId); if(!emp) return;
  const disp = emp.disputaId ? DB.disputas.find(d=>d.id===emp.disputaId) : null;
  const lotes = disp ? (disp.lotes||[]) : [];
  
  // Filtra itens do empenho
  const itensEmp = (emp.itens||[]);
  
  if(!itensEmp.length) {
    g('compra-lote-selector-wrap').innerHTML = '<div style="color:var(--danger);padding:12px;">Este empenho não tem itens cadastrados. Edite o empenho primeiro.</div>';
    g('modal-compra').classList.add('open');
    g('ttl-compra').textContent = compraEditId ? 'EDITAR COMPRA' : 'NOVA COMPRA';
    return;
  }
  
  g('compra-lote-selector').innerHTML = itensEmp.map(item => {
    const lote = lotes.find(l=>l.id===item.loteId) || {};
    const qtdJaComprada = (emp.compras||[]).filter(c=>c.itemId===item.id).reduce((s,c)=>s+(c.qtd||0),0);
    const saldo = Math.max(0, (item.qtd||0) - qtdJaComprada);
    const semSaldo = saldo === 0;
    return `<div class="compra-lote-btn${semSaldo?' sem-saldo':''}" onclick="${semSaldo?'':'selecionarCompraLote(\''+empenhoId+'\',\''+item.id+'\')'}" id="clote-${item.id}">
      <div style="font-weight:700;font-size:12px;">${item.descricao||lote.descricao||'—'}</div>
      <div style="font-size:10px;color:var(--text-tertiary);">${item.qtd} un · ${fmt(item.vunit)}/un</div>
      <div style="font-size:10px;font-weight:700;color:${semSaldo?'var(--danger)':'var(--success)'};">${semSaldo?'✓ Completo':saldo+' un. disponíveis'}</div>
    </div>`;
  }).join('');
  
  g('compra-lote-selector-wrap').style.display = 'block';
  
  // Se editando, pré-seleciona
  if(compraEditId) {
    const compraExist = (emp.compras||[]).find(c=>c.id===compraEditId);
    if(compraExist) selecionarCompraLote(empenhoId, compraExist.itemId, compraExist);
  }
  
  g('ttl-compra').textContent = compraEditId ? 'EDITAR COMPRA' : 'NOVA COMPRA';
  g('modal-compra').classList.add('open');
}

function selecionarCompraLote(empenhoId, itemId, dadosExist) {
  compraLoteSelecionado = itemId;
  document.querySelectorAll('.compra-lote-btn').forEach(b=>b.classList.remove('selected'));
  const btn = g('clote-'+itemId); if(btn) btn.classList.add('selected');
  
  const emp = DB.empenhos.find(x=>x.id===empenhoId); if(!emp) return;
  const item = (emp.itens||[]).find(i=>i.id===itemId); if(!item) return;
  
  // Calcula qtd já comprada para este item (excluindo a compra em edição)
  const qtdJaComprada = (emp.compras||[])
    .filter(c => c.itemId === itemId && c.id !== (dadosExist?.id || null))
    .reduce((s,c) => s + (c.qtd||0), 0);
  const saldoDisponivel = Math.max(0, (item.qtd||0) - qtdJaComprada);
  
  g('c-lote-desc').value = item.descricao || '';
  g('c-qtd-empenho').value = item.qtd || 1;
  g('c-vem-item').value = ((item.qtd||1)*(item.vunit||0)).toFixed(2);
  
  // Atualiza saldo info e limite do campo qtd
  const saldoInfo = g('c-saldo-info');
  if(saldoInfo) saldoInfo.textContent = saldoDisponivel > 0 ? `· saldo: ${saldoDisponivel} un.` : '· sem saldo';
  const qtdField = g('c-qtd');
  if(qtdField) { qtdField.max = saldoDisponivel; qtdField.value = dadosExist ? dadosExist.qtd : Math.min(saldoDisponivel, item.qtd || 1); }
  
  if(dadosExist) {
    g('c-dcompra').value = dadosExist.dcompra||'';
    if (g('c-status-entrega')) g('c-status-entrega').value = dadosExist.statusEntrega || 'aguardando_envio';
    if (g('c-data-prevista-recebimento')) g('c-data-prevista-recebimento').value = dadosExist.dataPrevistaRecebimento || '';
    if (g('c-data-recebimento-mercadoria')) g('c-data-recebimento-mercadoria').value = dadosExist.dataRecebimentoMercadoria || '';
    atualizarCamposStatusEntrega();
    g('c-plataforma').value = dadosExist.plataforma||'';
    g('c-link').value = dadosExist.link||'';
    g('c-vunit').value = dadosExist.vunit||'';
    g('c-vtotal-compra').value = dadosExist.vtotal||'';
    g('c-custo').value = dadosExist.custo||'';
    g('c-dpag').value = dadosExist.dpag||'';
    g('c-recebido').value = dadosExist.recebido||'';
    g('c-obs').value = dadosExist.obs||'';
    // Só ativa manual se tiver valor real (não null, não undefined, não zero)
    if(dadosExist.lucManual !== undefined && dadosExist.lucManual !== null) { compraMSLuc = true; setCompraField('luc',true); g('c-luc-m').value = dadosExist.lucManual; }
    if(dadosExist.recManual !== undefined && dadosExist.recManual !== null) { compraMSRec = true; setCompraField('rec',true); g('c-rec-m').value = dadosExist.recManual; }
  }
  
  g('compra-campos').style.display = saldoDisponivel > 0 || dadosExist ? 'block' : 'none';
  if(saldoDisponivel === 0 && !dadosExist) {
    toast('Este item já está completamente comprado.', 'error');
    return;
  }
  calcCompra();
}

function saveCompra() {
  if(!compraLoteSelecionado) { toast('SELECIONE UM ITEM/LOTE', 'error'); return; }
  const emp = DB.empenhos.find(x=>x.id===compraEmpenhoId); if(!emp) return;
  const item = (emp.itens||[]).find(i=>i.id===compraLoteSelecionado); if(!item) return;
  
  const statusEntrega = gv('c-status-entrega') || 'aguardando_envio';
  const dataPrevistaRecebimento = gv('c-data-prevista-recebimento') || '';
  const dataRecebimentoMercadoria = gv('c-data-recebimento-mercadoria') || '';
  const dataCompra = gv('c-dcompra') || '';
  if (statusEntrega === 'em_transito' && !dataPrevistaRecebimento) {
    toast('INFORME A DATA PREVISTA DE RECEBIMENTO', 'error');
    const campo = g('c-data-prevista-recebimento'); if (campo) campo.focus(); return;
  }
  if (statusEntrega === 'em_transito' && dataCompra && dataPrevistaRecebimento < dataCompra) {
    toast('A DATA PREVISTA NÃO PODE SER ANTERIOR À DATA DA COMPRA', 'error');
    const campo = g('c-data-prevista-recebimento'); if (campo) campo.focus(); return;
  }
  if (statusEntrega === 'recebida' && !dataRecebimentoMercadoria) {
    toast('INFORME A DATA DE RECEBIMENTO DA MERCADORIA', 'error');
    const campo = g('c-data-recebimento-mercadoria'); if (campo) campo.focus(); return;
  }
  if (statusEntrega === 'recebida' && dataCompra && dataRecebimentoMercadoria < dataCompra) {
    toast('A DATA DE RECEBIMENTO NÃO PODE SER ANTERIOR À DATA DA COMPRA', 'error');
    const campo = g('c-data-recebimento-mercadoria'); if (campo) campo.focus(); return;
  }
  const qtdCompra = +gv('c-qtd')||1;

  // Valida saldo usando qtd do campo QTD EMPENHO (ITEM) visível no form
  const qtdEmpenhoItem = +gv('c-qtd-empenho') || 1;
  const qtdJaComprada = (emp.compras||[])
    .filter(c => c.itemId === compraLoteSelecionado && c.id !== (compraEditId || null))
    .reduce((s,c) => s + (c.qtd||0), 0);
  const saldoDisponivel = qtdEmpenhoItem - qtdJaComprada;
  if (qtdCompra > saldoDisponivel) {
    toast(`Saldo insuficiente: apenas ${saldoDisponivel} un. disponíveis para este item.`, 'error');
    return;
  }

  const vtotal = (+gv('c-vunit')||0) * qtdCompra;
  const vemItem = +gv('c-vem-item')||0;
  const qtdEmpenho = +gv('c-qtd-empenho')||1;
  const vemUnitario = qtdEmpenho > 0 ? vemItem / qtdEmpenho : 0;
  const vemProporcional = vemUnitario * qtdCompra;
  const custo = +gv('c-custo')||0;
  const lucCalc = vemProporcional - vtotal - custo;
  const recCalc = vtotal + lucCalc;
  
  const compra = {
    id: compraEditId || uid(),
    itemId: compraLoteSelecionado,
    qtd: +gv('c-qtd')||1,
    dcompra: gv('c-dcompra') || '',
    statusEntrega: statusEntrega,
    dataPrevistaRecebimento: statusEntrega === 'em_transito' ? dataPrevistaRecebimento : '',
    dataRecebimentoMercadoria: statusEntrega === 'recebida' ? dataRecebimentoMercadoria : '',
    plataforma: gv('c-plataforma').toUpperCase(),
    link: gv('c-link') || '',
    vunit: +gv('c-vunit')||0,
    vtotal: vtotal,
    custo: custo,
    luc: compraMSLuc ? (+gv('c-luc-m')||0) : lucCalc,
    lucManual: compraMSLuc ? (+gv('c-luc-m')||0) : null,
    rec: compraMSRec ? (+gv('c-rec-m')||0) : recCalc,
    recManual: compraMSRec ? (+gv('c-rec-m')||0) : null,
    dpag: gv('c-dpag') || '',
    recebido: +gv('c-recebido')||0,
    obs: gv('c-obs').toUpperCase()
  };
  
  if(!emp.compras) emp.compras = [];
  const idx = emp.compras.findIndex(c=>c.id===compra.id);
  if(idx !== -1) emp.compras[idx] = compra; else emp.compras.push(compra);

  // ===== AUTO-FINALIZAR EMPENHO se todos os itens estiverem pagos =====
  if (empenhoEstaPago(emp)) {
    if (!emp.finalizado) {
      emp.finalizado = true;
      emp.dataFinalizacao = emp.dataFinalizacao || new Date().toISOString().slice(0,10);
    }
  } else {
    // Se removeu pagamento, reabre automaticamente
    emp.finalizado = false;
    emp.dataFinalizacao = null;
  }

  // ===== AUTO-FINALIZAR DISPUTA se critérios atendidos =====
  if (emp.disputaId) verificarAutoFinalizarDisputa(emp.disputaId);

  // Fecha modal ANTES de salvar (evita race condition com onSnapshot do Firebase)
  const _empId = compraEmpenhoId;
  closeModal('compra', true);
  save('empenhos', DB.empenhos);
  toast(compraEditId ? 'COMPRA ATUALIZADA ✓' : 'COMPRA SALVA ✓', 'success');
  renderActive();
  setTimeout(()=>abrirPopupEmpenho(_empId), 150);
}

function delCompra(empenhoId, compraId) {
  const emp = DB.empenhos.find(x=>x.id===empenhoId); if(!emp) return;
  emp.compras = (emp.compras||[]).filter(c=>c.id!==compraId);
  // Se empenho não está mais pago, reabre automaticamente
  if (!empenhoEstaPago(emp)) {
    emp.finalizado = false;
    emp.dataFinalizacao = null;
  }
  // Verifico contrato
  if (emp.disputaId) verificarAutoFinalizarDisputa(emp.disputaId);
  save('empenhos', DB.empenhos);
  toast('COMPRA EXCLUÍDA', 'info');
  reconciliarFinalizacoes(); renderActive();
  setTimeout(()=>abrirPopupEmpenho(empenhoId), 100);
}

// ========== MÚLTIPLOS ITENS NO EMPENHO ==========
// Os itens do empenho são referências aos lotes do contrato com quantidade e valor específicos
// Já implementado via lotesSelecionados - mas precisamos permitir múltiplos

