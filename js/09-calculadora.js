// ========== CALCULADORA RÁPIDA ==========
const ICMS_ESTADOS = {
  AC:7,AL:7,AM:7,AP:7,BA:7,CE:7,DF:7,ES:7,GO:7,MA:7,MT:7,
  MG:18,PA:7,PB:7,PR:12,PE:7,PI:7,RN:7,RS:12,RJ:12,
  RO:7,RR:7,SC:12,SP:12,SE:7,TO:7
};

let calcDisputaSelecionada = null;
let calcItemParaAdicionar = null; // item clicado aguardando qtd/vcompra
let calcItensCalculo = [];        // array de {item, qtd, vcompra}

function abrirCalculadora() {
  calcDisputaSelecionada = null;
  calcItemParaAdicionar = null;
  calcItensCalculo = [];
  g('calc-passo1').style.display = '';
  g('calc-passo2').style.display = 'none';
  g('calc-busca-disputa').value = '';
  calcFiltrarDisputas();
  g('modal-calc').classList.add('open');
}

function calcFiltrarDisputas() {
  const q = (g('calc-busca-disputa').value || '').toLowerCase();
  const lista = g('calc-lista-disputas');
  // Only show active (non-finalized) contracts
  const disputas = DB.disputas.filter(d => {
    if (d.finalizada) return false;
    if (!q) return true;
    return (d.orgao||'').toLowerCase().includes(q) ||
           (d.processo||'').toLowerCase().includes(q) ||
           (d.estado||'').toLowerCase().includes(q) ||
           (d.produto||'').toLowerCase().includes(q);
  });
  if (!disputas.length) {
    lista.innerHTML = '<div style="text-align:center;color:var(--text-tertiary);padding:20px;font-size:13px;">Nenhum contrato ativo encontrado</div>';
    return;
  }
  lista.innerHTML = disputas.map(d => {
    const empCount = DB.empenhos.filter(e => e.disputaId === d.id && !e.finalizado).length;
    const lotes = d.lotes || [];
    const vlContrato = lotes.reduce((s,l) => s + (l.qtd||0)*(l.vunit||0), 0);
    const compraPrev = lotes.reduce((s,l) => s + (l.compraPrev||0)*(l.qtd||0), 0);
    const lucroPrev = vlContrato - compraPrev - lotes.reduce((s,l) => s + (l.custoPrev||0)*(l.qtd||0), 0);
    const cor = d.empresa === 'Hamate' ? '#7c3aed' : 'var(--accent)';
    const totalItens = lotes.length;
    return `<div onclick="calcSelecionarDisputa('${d.id}')" style="border:2px solid var(--border-light);border-radius:12px;cursor:pointer;transition:all .15s;overflow:hidden;" onmouseover="this.style.borderColor='${cor}';this.style.boxShadow='0 2px 12px ${cor}22'" onmouseout="this.style.borderColor='var(--border-light)';this.style.boxShadow='none'">
      <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div style="min-width:0;flex:1;">
          <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${d.orgao}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">${d.estado||'—'} · ${d.processo||'—'} · ${d.tipo||''}</div>
        </div>
        <span style="font-size:11px;padding:2px 10px;border-radius:12px;background:${cor}18;color:${cor};font-weight:700;flex-shrink:0;">${d.empresa}</span>
      </div>
      <div style="padding:8px 14px 12px;display:flex;gap:16px;background:var(--bg-surface-soft);border-top:1px solid var(--border-light);font-size:11px;flex-wrap:wrap;">
        <span style="color:var(--text-tertiary);">📦 <strong style="color:var(--text-primary);">${totalItens}</strong> iten(s)</span>
        <span style="color:var(--text-tertiary);">💰 <strong style="color:var(--accent);">${fmt(vlContrato)}</strong></span>
        <span style="color:var(--text-tertiary);">🛒 <strong style="color:var(--warning);">${fmt(compraPrev)}</strong> prev.</span>
        <span style="color:var(--text-tertiary);">📈 <strong style="color:var(--success);">${fmt(lucroPrev)}</strong> lucro prev.</span>
        <span style="color:var(--text-tertiary);">📄 <strong style="color:var(--text-secondary);">${empCount}</strong> empenho(s) aberto(s)</span>
      </div>
    </div>`;
  }).join('');
}

function calcSelecionarDisputa(id) {
  const d = DB.disputas.find(x => x.id === id);
  if (!d) return;
  calcDisputaSelecionada = d;
  calcItemParaAdicionar = null;
  calcItensCalculo = [];

  g('calc-disputa-titulo').textContent = d.orgao + ' · ' + d.processo;
  const badge = g('calc-empresa-badge');
  if (d.empresa === 'Hamate') {
    badge.textContent = 'Hamate';
    badge.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:12px;background:var(--purple-soft);color:var(--purple);font-weight:700;';
  } else {
    badge.textContent = 'Gadita';
    badge.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:12px;background:var(--info-soft);color:var(--accent);font-weight:700;';
  }

  g('calc-tipo-gadita').style.display = d.empresa === 'Gadita' ? '' : 'none';
  g('calc-pct-simples').value = d.empresa === 'Hamate' ? 9 : 13.5;
  g('calc-estado-display').textContent = (d.estado || '—');
  const icms = ICMS_ESTADOS[d.estado] || 7;
  g('calc-icms-display').textContent = icms + '%';
  g('calc-credito-icms').value = '';
  g('calc-custo-empresa').checked = false;

  // Montar lista de itens direto dos lotes do contrato (independente de ter empenho)
  const lotes = d.lotes || [];
  let itens = lotes.map(l => ({
    itemId: l.id,
    descricao: l.descricao || 'Item',
    qtd: l.qtd || 1,
    vunit: l.vunit || 0
  }));

  // Fallback: se o contrato não tiver lotes, tenta carregar dos empenhos (legado)
  if (!itens.length) {
    const empenhos = DB.empenhos.filter(e => e.disputaId === id);
    empenhos.forEach(emp => {
      (emp.itens || []).forEach(item => {
        if (!itens.find(x => x.itemId === item.id)) {
          const _vu = item.vunit || (item.vtotal && item.qtd ? item.vtotal/item.qtd : 0) || emp.vunit || 0;
          itens.push({ itemId: item.id, empId: emp.id, descricao: item.descricao||item.loteDesc||'Item', qtd: item.qtd||1, vunit: _vu });
        }
      });
      if (!(emp.itens||[]).length) {
        const _vu = emp.vunit || (emp.qtd ? emp.vem/emp.qtd : emp.vem) || 0;
        itens.push({ itemId: emp.id, empId: emp.id, descricao: emp.produto||'Empenho #'+emp.num, qtd: emp.qtd||1, vunit: _vu });
      }
    });
  }
  calcItensDisputa = itens;

  const listaEl = g('calc-itens-lista');
  if (!itens.length) {
    listaEl.innerHTML = '<div style="color:var(--text-tertiary);font-size:12px;">Nenhum item cadastrado neste contrato.</div>';
  } else {
    listaEl.innerHTML = itens.map(it =>
      `<div onclick="calcAbrirFormItem('${it.itemId}')" id="calc-item-${it.itemId}" style="padding:8px 12px;border:2px solid var(--border-light);border-radius:8px;cursor:pointer;font-size:12px;transition:all .15s;min-width:180px;flex:1;">
        <div style="font-weight:700;">${it.descricao}</div>
        <div style="color:var(--text-secondary);font-size:11px;">Qtd: ${it.qtd} · R$ ${it.vunit.toFixed(2).replace('.',',')} /un</div>
      </div>`
    ).join('');
  }

  g('calc-form-item').style.display = 'none';
  g('calc-itens-adicionados-wrap').style.display = 'none';
  g('calc-resultado-wrap').style.display = 'none';
  g('calc-icms-detalhes').innerHTML = '';
  g('calc-passo1').style.display = 'none';
  g('calc-passo2').style.display = '';
  calcTipoChanged();
}

let calcItensDisputa = [];
let _calcRetornarLoteIdx = null; // índice do lote que receberá o custo calculado

// Abre a calculadora rápida a partir do botão 🧮 no form de lote do contrato
function abrirCalcParaLote(loteIdx) {
  const lote = lotesTemp[loteIdx];
  if (!lote) return;

  // Determina o contrato sendo editado para pré-configurar a calculadora
  const disputaId = EID.disputas;
  const contrato = disputaId ? DB.disputas.find(d => d.id === disputaId) : null;

  _calcRetornarLoteIdx = loteIdx;
  g('calc-retornar-wrap').style.display = 'none';

  // Abre a calculadora
  abrirCalculadora();

  // Se tiver contrato selecionado, pré-seleciona ela e carrega o item do lote
  if (contrato) {
    // Pequeno delay para garantir que o modal abriu e o DOM está pronto
    setTimeout(() => {
      calcSelecionarDisputa(contrato.id);
      // Tenta encontrar o item correspondente ao lote pelo id
      const itemCorrespondente = calcItensDisputa.find(it => it.itemId === lote.id);
      if (itemCorrespondente) {
        calcAbrirFormItem(itemCorrespondente.itemId);
      } else if (calcItensDisputa.length === 1) {
        // Se só tem um item, seleciona automaticamente
        calcAbrirFormItem(calcItensDisputa[0].itemId);
      }
      // Preenche o valor de compra unitário já informado no lote
      const vcompraInput = g('calc-form-vcompra');
      if (vcompraInput && lote.compraPrev) {
        vcompraInput.value = lote.compraPrev.toFixed(2);
      }
    }, 100);
  }
}

// Usa o custo calculado e preenche o campo custoPrev do lote
function calcUsarCusto() {
  if (_calcRetornarLoteIdx === null) return;
  const d = calcDisputaSelecionada;
  if (!d || !calcItensCalculo.length) { toast('Faça o cálculo antes de usar o resultado.', 'error'); return; }

  const tipo = calcGetTipo();
  const creditoICMS = tipo === 'icms' ? (+g('calc-credito-icms').value || 0) : 0;

  // Calcula custo total
  let totalCusto = 0;
  calcItensCalculo.forEach(({ item, qtd }) => {
    const vemTotal = item.vunit * qtd;
    totalCusto += calcCustoItem(vemTotal, tipo, d);
  });
  totalCusto -= creditoICMS;

  // O custo unitário = custo total / qtd do lote
  const lote = lotesTemp[_calcRetornarLoteIdx];
  const qtdLote = lote.qtd || 1;
  const custoUnit = qtdLote > 0 ? totalCusto / qtdLote : totalCusto;

  // Preenche o campo no lotesTemp e atualiza o input
  lotesTemp[_calcRetornarLoteIdx].custoPrev = custoUnit;
  atualizarLoteTotais(_calcRetornarLoteIdx);

  // Atualiza visualmente o input do custo previsto
  const inputEl = document.getElementById('lote-custo-prev-input-' + _calcRetornarLoteIdx);
  if (inputEl) inputEl.value = custoUnit.toFixed(2);

  // Fecha calculadora e limpa estado
  closeModal('calc', true);
  _calcRetornarLoteIdx = null;
  g('calc-retornar-wrap').style.display = 'none';
  toast('Custo previsto preenchido: ' + fmt(totalCusto) + ' (total) · ' + fmt(custoUnit) + '/un', 'success');
}

function calcCancelarRetorno() {
  _calcRetornarLoteIdx = null;
  g('calc-retornar-wrap').style.display = 'none';
}

function calcAbrirFormItem(itemId) {
  const it = calcItensDisputa.find(x => x.itemId === itemId);
  if (!it) return;
  calcItemParaAdicionar = it;

  // Highlight
  document.querySelectorAll('[id^="calc-item-"]').forEach(el => {
    el.style.borderColor = 'var(--border-light)'; el.style.background = '';
  });
  const el = g('calc-item-' + itemId);
  if (el) { el.style.borderColor = 'var(--accent)'; el.style.background = 'var(--accent)10'; }

  g('calc-form-item-titulo').textContent = '＋ ' + it.descricao;
  g('calc-form-qtd').value = it.qtd;
  g('calc-form-vcompra').value = '';
  g('calc-form-item').style.display = '';
  g('calc-form-vcompra').focus();
}

function calcFecharFormItem() {
  g('calc-form-item').style.display = 'none';
  calcItemParaAdicionar = null;
  document.querySelectorAll('[id^="calc-item-"]').forEach(el => {
    el.style.borderColor = 'var(--border-light)'; el.style.background = '';
  });
}

function calcAdicionarItem() {
  const it = calcItemParaAdicionar;
  if (!it) return;
  const qtd = +g('calc-form-qtd').value || 1;
  const vcompra = +g('calc-form-vcompra').value || 0;

  // Se já existe o mesmo item, atualiza
  const existing = calcItensCalculo.findIndex(x => x.item.itemId === it.itemId);
  if (existing !== -1) {
    calcItensCalculo[existing] = { item: it, qtd, vcompra };
  } else {
    calcItensCalculo.push({ item: it, qtd, vcompra });
  }

  calcFecharFormItem();
  calcRenderTabela();
  calcRecalcular();
}

function calcRemoverItemCalculo(itemId) {
  calcItensCalculo = calcItensCalculo.filter(x => x.item.itemId !== itemId);
  calcRenderTabela();
  calcRecalcular();
}

function calcLimparItens() {
  calcItensCalculo = [];
  calcRenderTabela();
  calcRecalcular();
}

function calcGetTipo() {
  const d = calcDisputaSelecionada;
  if (!d) return 'simples';
  if (d.empresa !== 'Gadita') return 'simples';
  const radio = document.querySelector('input[name="calc-tipo"]:checked');
  return (radio && radio.value === 'novo') ? 'icms' : 'simples';
}

function calcCustoItem(vemTotal, tipo, d) {
  const pct = (+g('calc-pct-simples').value || 0) / 100;
  if (tipo === 'simples') return vemTotal * pct;
  // ICMS
  const icmsPct = (ICMS_ESTADOS[d.estado] || 7) / 100;
  const icmsVal   = vemTotal * icmsPct;
  const pisVal    = vemTotal * 0.0065;
  const cofinsVal = vemTotal * 0.03;
  const irpjVal   = vemTotal * 0.08 * 0.15;
  const csllVal   = (vemTotal * 0.12) * 0.09;   // ← (base×12%)×9%
  const empVal    = g('calc-custo-empresa').checked ? vemTotal * 0.03 : 0;
  return icmsVal + pisVal + cofinsVal + irpjVal + csllVal + empVal;
  // crédito ICMS é abatido no total, não por item
}

function calcRenderTabela() {
  const wrap = g('calc-itens-adicionados-wrap');
  if (!calcItensCalculo.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  const d = calcDisputaSelecionada;
  const tipo = calcGetTipo();

  let rows = '';
  calcItensCalculo.forEach(({ item, qtd, vcompra }) => {
    const vemTotal = item.vunit * qtd;
    const vcompraTotal = vcompra * qtd;
    const custo = calcCustoItem(vemTotal, tipo, d);
    const lucro = vemTotal - vcompraTotal - custo;
    rows += `<tr style="border-bottom:1px solid var(--border-light);">
      <td style="padding:6px 8px;font-weight:600;">${item.descricao}</td>
      <td style="padding:6px 8px;text-align:right;">${qtd}</td>
      <td style="padding:6px 8px;text-align:right;font-family:monospace;">${fmt(item.vunit)}</td>
      <td style="padding:6px 8px;text-align:right;font-family:monospace;">${vcompra ? fmt(vcompra) : '—'}</td>
      <td style="padding:6px 8px;text-align:right;font-family:monospace;color:var(--accent);">${fmt(vemTotal)}</td>
      <td style="padding:6px 8px;text-align:right;font-family:monospace;color:var(--warning);">${fmt(custo)}</td>
      <td style="padding:6px 8px;text-align:right;font-family:monospace;color:${lucro>=0?'var(--success)':'var(--danger)'};">${fmt(lucro)}</td>
      <td style="padding:6px 4px;text-align:center;"><button onclick="calcRemoverItemCalculo('${item.itemId}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:14px;" title="Remover">🗑</button></td>
    </tr>`;
  });
  g('calc-itens-tbody').innerHTML = rows;
}

function calcTipoChanged() {
  const tipo = calcGetTipo();
  g('calc-bloco-simples').style.display = tipo === 'simples' ? '' : 'none';
  g('calc-bloco-icms-info').style.display = tipo === 'icms' ? '' : 'none';
  g('calc-bloco-icms-opts').style.display = tipo === 'icms' ? '' : 'none';
  if (tipo === 'simples') {
    const d = calcDisputaSelecionada;
    g('calc-pct-simples').value = d ? (d.empresa === 'Hamate' ? 9 : 13.5) : 9;
  }
  calcRenderTabela();
  calcRecalcular();
}

function calcVoltarPasso1() {
  g('calc-passo1').style.display = '';
  g('calc-passo2').style.display = 'none';
  calcDisputaSelecionada = null;
  calcItemParaAdicionar = null;
  calcItensCalculo = [];
}

function calcLimparResultado() {
  ['calc-res-vem','calc-res-custo','calc-res-lucro','calc-res-margem'].forEach(id => { g(id).textContent = '—'; });
  g('calc-resultado-wrap').style.display = 'none';
}

function calcRecalcular() {
  const d = calcDisputaSelecionada;
  if (!d || !calcItensCalculo.length) { calcLimparResultado(); return; }

  const tipo = calcGetTipo();
  const creditoICMS = tipo === 'icms' ? (+g('calc-credito-icms').value || 0) : 0;

  let totalVem = 0, totalCusto = 0, totalCompra = 0;
  calcItensCalculo.forEach(({ item, qtd, vcompra }) => {
    const vemTotal = item.vunit * qtd;
    totalVem += vemTotal;
    totalCompra += vcompra * qtd;
    totalCusto += calcCustoItem(vemTotal, tipo, d);
  });
  totalCusto -= creditoICMS;

  const lucro = totalVem - totalCompra - totalCusto;
  const margem = totalCompra > 0 ? (lucro / totalCompra * 100) : 0;

  g('calc-resultado-wrap').style.display = '';
  g('calc-res-vem').textContent = fmt(totalVem);
  g('calc-res-custo').textContent = fmt(totalCusto);
  g('calc-res-lucro').textContent = fmt(lucro);
  g('calc-res-lucro').style.color = lucro >= 0 ? 'var(--success)' : 'var(--danger)';
  g('calc-res-margem').textContent = margem.toFixed(1) + '%';
  g('calc-res-margem').style.color = margem >= 0 ? 'var(--success)' : 'var(--danger)';

  // Detalhamento ICMS (sobre total)
  if (tipo === 'icms') {
    const icmsPct = ICMS_ESTADOS[d.estado] || 7;
    const icmsVal   = totalVem * (icmsPct/100);
    const pisVal    = totalVem * 0.0065;
    const cofinsVal = totalVem * 0.03;
    const irpjVal   = totalVem * 0.08 * 0.15;
    const csllVal   = (totalVem * 0.12) * 0.09;
    const empVal    = g('calc-custo-empresa').checked ? totalVem * 0.03 : 0;
    let linhas = [
      [`ICMS (${icmsPct}%)`, icmsVal],
      ['PIS (0,65%)', pisVal],
      ['COFINS (3%)', cofinsVal],
      ['IRPJ (Base×8%×15%)', irpjVal],
      ['CSLL (Base×12%×9%)', csllVal],
    ];
    if (empVal) linhas.push(['Custo Empresa (3%)', empVal]);
    if (creditoICMS) linhas.push(['(-) Crédito ICMS', -creditoICMS]);
    g('calc-icms-detalhes').innerHTML = linhas.map(([label, val]) =>
      `<div style="display:flex;justify-content:space-between;padding:2px 0;"><span>${label}</span><span style="font-weight:600;color:${val<0?'var(--success)':'var(--warning)'};">${val<0?'- ':''}R$ ${Math.abs(val).toFixed(2).replace('.',',')}</span></div>`
    ).join('');
  } else {
    g('calc-icms-detalhes').innerHTML = '';
  }

  // Atualiza tabela com novos custos calculados
  calcRenderTabela();

  // Mostra botão de retorno se chamado a partir de um lote do contrato
  if (_calcRetornarLoteIdx !== null) {
    g('calc-retornar-wrap').style.display = '';
    const lbl = g('calc-retornar-custo-label');
    if (lbl) lbl.textContent = fmt(totalCusto);
  } else {
    g('calc-retornar-wrap').style.display = 'none';
  }
}

// ========== CÁLCULO DE CUSTO NO MODAL DE COMPRA ==========
function calcCustoAutomatico() {
  const emp = DB.empenhos.find(x => x.id === compraEmpenhoId);
  if (!emp) return;
  const disp = emp.disputaId ? DB.disputas.find(d => d.id === emp.disputaId) : null;
  const painel = g('c-custo-calc-painel');
  painel.style.display = '';

  // Define empresa e ajusta opções
  const empresa = disp ? disp.empresa : 'Hamate';
  const estado  = disp ? (disp.estado || '') : '';
  const icmsLbl = g('c-calc-icms-lbl');

  // Mostra opção ICMS só para Gadita
  if (empresa === 'Gadita') {
    icmsLbl.style.display = '';
    g('c-calc-empresa-info').textContent = 'Gadita · ' + estado;
    g('c-calc-estado-label').textContent = 'Estado: ' + estado;
    const icmsPct = ICMS_ESTADOS[estado] || 7;
    g('c-calc-icms-label').textContent = 'ICMS: ' + icmsPct + '%';
    // Padrão: antigo (simples 13,5%)
    g('c-calc-simples').checked = true;
    g('c-calc-pct').value = 13.5;
  } else {
    icmsLbl.style.display = 'none';
    g('c-calc-simples').checked = true;
    g('c-calc-empresa-info').textContent = 'Hamate';
    g('c-calc-pct').value = 9;
  }
  g('c-calc-credito').value = '';
  g('c-calc-custo-emp').checked = false;
  calcCustoRecalcular();
}

function calcCustoRecalcular() {
  const tipo = document.querySelector('input[name="c-calc-tipo"]:checked')?.value || 'simples';
  g('c-calc-bloco-simples').style.display = tipo === 'simples' ? '' : 'none';
  g('c-calc-bloco-icms').style.display  = tipo === 'icms'    ? '' : 'none';

  // Base = vl empenho do item × qtd comprando
  const vemItem   = +gv('c-vem-item') || 0;
  const qtdEmp    = +gv('c-qtd-empenho') || 1;
  const qtdCompra = +gv('c-qtd') || 1;
  const vunitEmp  = qtdEmp > 0 ? vemItem / qtdEmp : 0;
  const base      = vunitEmp * qtdCompra;

  if (base <= 0) { g('c-calc-resultado').textContent = '—'; return; }

  let custo = 0;
  if (tipo === 'simples') {
    const pct = (+g('c-calc-pct').value || 0) / 100;
    custo = base * pct;
  } else {
    const emp  = DB.empenhos.find(x => x.id === compraEmpenhoId);
    const disp = emp?.disputaId ? DB.disputas.find(d => d.id === emp.disputaId) : null;
    const estado = disp?.estado || '';
    const icmsPct    = (ICMS_ESTADOS[estado] || 7) / 100;
    const icmsVal    = base * icmsPct;
    const pisVal     = base * 0.0065;
    const cofinsVal  = base * 0.03;
    const irpjVal    = base * 0.08 * 0.15;
    const csllVal    = (base * 0.12) * 0.09;
    const empVal     = g('c-calc-custo-emp').checked ? base * 0.03 : 0;
    const credito    = +g('c-calc-credito').value || 0;
    custo = icmsVal + pisVal + cofinsVal + irpjVal + csllVal + empVal - credito;
  }

  g('c-calc-resultado').textContent = 'R$ ' + custo.toFixed(2).replace('.', ',');
  g('c-calc-resultado')._valor = custo;
}

function calcCustoAplicar() {
  const custo = g('c-calc-resultado')._valor;
  if (custo === undefined || custo === null) return;
  g('c-custo').value = custo.toFixed(2);
  g('c-custo-calc-painel').style.display = 'none';
  calcCompra(); // recalcula lucro com novo custo
}

