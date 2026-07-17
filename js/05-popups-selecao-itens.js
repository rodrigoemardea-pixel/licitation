// ===== POPUP DETALHES =====
function abrirPopupDisputa(id) {
  const r = DB.disputas.find(x => x.id === id);
  if (!r) return;
  const { imp, luc, pct } = dVals(r);
  const contrato = getValorContrato(r);
  const lotes = getLotesComSaldo(id);
  const emps = _empenhosDaDisputa(id);
  
  // Lucro realizado = soma do lucro das compras que têm data de pagamento preenchida
  const lucroRealizado = emps.reduce((s,e) => {
    return s + (e.compras||[]).filter(c=>c.dpag).reduce((ss,c)=>ss+(c.luc||0),0);
  }, 0);
  // Totais financeiros consolidados do contrato
  const totalComprasDisp = emps.reduce((s,e) => s + (e.compras||[]).reduce((ss,c) => ss + (c.vtotal||0), 0), 0);
  const totalCustosDisp = emps.reduce((s,e) => s + (e.compras||[]).reduce((ss,c) => ss + (c.custo||0), 0), 0);
  const totalLucroDisp = emps.reduce((s,e) => s + (e.compras||[]).reduce((ss,c) => ss + (c.luc||0), 0), 0);
  const totalAReceberDisp = emps.reduce((s,e) => s + (e.compras||[]).filter(c => !c.dpag || c.dpag === '').reduce((ss,c) => ss + (c.rec||0), 0), 0);
  // Lucro previsto = soma de (vlTotal - compraPrev*qtd - custoPrev*qtd) de cada lote
  const lucroPrevisto = lotes.reduce((s,l) => {
    const qtd   = l.qtd || 0;
    const total = qtd * (l.vunit||0);
    return s + total - (l.compraPrev||0)*qtd - (l.custoPrev||0)*qtd;
  }, 0);

  // Atalhos para todos os empenhos vinculados a este contrato.
  const empenhosRelacionadosHTML = emps.length ?
    '<section class="lb-related-empenhos" style="margin:0 0 14px;padding:10px 12px;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-surface-soft);">' +
      '<div style="font-size:10px;font-weight:700;color:var(--text-tertiary);letter-spacing:.05em;margin-bottom:7px;">EMPENHOS DESTE CONTRATO</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
        emps.map(e =>
          '<button type="button" class="btn btn-ghost btn-sm" onclick="abrirPopupEmpenho(\'' + e.id + '\')" title="Abrir empenho ' + escapeHTML(e.num || '') + '">' +
            '#' + escapeHTML(e.num || 'SEM NÚMERO') + (e.finalizado ? ' · FINALIZADO' : '') +
          '</button>'
        ).join('') +
      '</div>' +
    '</section>' : '';

  const lotesHTML = lotes.length ? `
    <div class="detail-section">📦 ITENS / LOTES</div>
    <table class="lotes-status-table">
      <thead><tr><th>Descrição</th><th>Qtd</th><th>Vl.Unit</th><th>Empenhado</th><th>Enviado (Compras)</th><th>Restante</th><th>Progresso</th><th>Empenhos</th><th>Pago?</th></tr></thead>
      <tbody>${lotes.map(l => {
        const pctVal = l.qtd > 0 ? Math.min(100, Math.round(l.qtdEnviada / l.qtd * 100)) : 0;
        const cls = l.qtdRestante <= 0 ? 'saldo-zero' : l.qtdEnviada > 0 ? 'saldo-parcial' : 'saldo-ok';
        const empsLote = emps.filter(e => {
          if(e.itens && e.itens.length) return e.itens.some(i=>i.loteId===l.id);
          return e.loteId === l.id;
        });
        // Calcula qtd enviada via compras registradas nos empenhos deste lote
        const qtdViaCompras = empsLote.reduce((s, e) => {
          const itensEmp = e.itens && e.itens.length ? e.itens : (e.loteId === l.id ? [{id:'leg', loteId:l.id}] : []);
          const itemEmp = itensEmp.find(i=>i.loteId===l.id);
          if(!itemEmp) return s;
          return s + (e.compras||[]).reduce((ss,c) => ss + (c.itemId === itemEmp.id ? (c.qtd||0) : 0), 0);
        }, 0);
        // Verifica se algum item deste lote tem compra com data de pagamento preenchida
        const algumPago = empsLote.some(e => {
          const itensEmp = e.itens && e.itens.length ? e.itens : (e.loteId === l.id ? [{id:'leg', loteId:l.id}] : []);
          const itemEmp = itensEmp.find(i=>i.loteId===l.id);
          if(!itemEmp) return false;
          return (e.compras||[]).some(c => c.itemId === itemEmp.id && c.dpag);
        });
        const statusPag = empsLote.length === 0 ? '—' : algumPago ? '<span class="status-pago">✅ PAGO</span>' : '<span class="status-pendente">⏳ PENDENTE</span>';
        const temSaldo = (l.qtdRestante || 0) > 0;
        const rowClick = temSaldo ? `onclick="novoEmpenhoComItem('${id}','${l.id}')" title="Clique para criar empenho para este item" style="cursor:pointer;background:var(--info-soft);"` : '';
        return '<tr ' + rowClick + '>' +
          '<td><strong>' + (l.descricao||'—').toUpperCase() + '</strong>' + (temSaldo ? ' <span style="font-size:9px;background:var(--accent);color:#fff;border-radius:4px;padding:1px 5px;">+ Empenhar</span>' : '') + '</td>' +
          '<td class="mono">' + (l.qtd||0) + '</td>' +
          '<td class="mono">' + fmt(l.vunit) + '</td>' +
          '<td class="mono" style="color:var(--accent);font-weight:600;">' + l.qtdEnviada + '</td>' +
          '<td class="mono" style="color:var(--success);font-weight:600;">' + qtdViaCompras + '</td>' +
          '<td class="mono ' + cls + '">' + (l.qtdRestante > 0 ? l.qtdRestante : '✓ COMPLETO') + '</td>' +
          '<td><div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:' + pctVal + '%"></div></div></td>' +
          '<td>' + (empsLote.map(e => '<span onclick="abrirPopupEmpenho(\''+e.id+'\')" style="cursor:pointer;color:var(--accent);font-size:10px;font-weight:600;margin-right:4px;">#' + e.num + '</span>').join('') || '—') + '</td>' +
          '<td>' + statusPag + '</td>' +
          '</tr>';
      }).join('')}</tbody>
    </table>` : '<p style="color:var(--text-tertiary);font-size:12px;margin-top:8px;">Nenhum item cadastrado.</p>';

  // Todas as compras de todos os empenhos desto contrato
  const todasCompras = [];
  emps.forEach(e => {
    const itensEmp = (e.itens && e.itens.length ? e.itens :
      (e.loteId ? [{ id:'leg1', loteId:e.loteId, descricao:e.produto||'', qtd:e.qtd||1, vunit:e.vunit||0 }] : []))
      .map(item => {
        // Sempre busca descrição ao vivo do lote do contrato
        const loteAtual = (r.lotes||[]).find(l => l.id === item.loteId);
        return loteAtual ? { ...item, descricao: loteAtual.descricao } : item;
      });
    (e.compras||[]).forEach(c => {
      const itemRef = itensEmp.find(i => i.id === c.itemId);
      todasCompras.push({ ...c, _empNum: e.num||'—', _produto: (itemRef?.descricao||e.produto||'—').toUpperCase() });
    });
  });

  const comprasDisputaHTML = todasCompras.length ? `
    <div class="detail-section" style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;">
      <span>🛒 TODAS AS COMPRAS DO CONTRATO</span>
      <button class="btn btn-ghost btn-sm" onclick="exportarComprasDisputa('${id}')" style="color:var(--success);border-color:var(--success);font-weight:700;">⬇ Exportar Selecionadas</button>
    </div>
    <table class="lotes-status-table" style="margin-top:8px;">
      <thead><tr>
        <th style="width:30px;"><input type="checkbox" id="chk-all-disp-${id}" onchange="toggleTodasComprasDisputa('${id}',this.checked)" title="Selecionar todas"></th>
        <th>Nº Emp.</th><th>Produto</th><th>Plataforma</th><th>Qtd</th><th>Vl.Compra</th><th>Custo</th><th>Lucro</th><th>A Receber</th><th>Link</th>
      </tr></thead>
      <tbody>${todasCompras.map(c => {
        const linkBtn = c.link ? `<a href="${c.link}" target="_blank" style="color:var(--accent);font-size:11px;">🔗 ver</a>` : '—';
        return '<tr>' +
        '<td style="text-align:center;"><input type="checkbox" class="chk-compra-disp-'+id+'" data-cid="'+c.id+'" style="cursor:pointer;"></td>' +
          '<td class="mono" style="font-weight:700;font-size:11px;">#'+c._empNum+'</td>' +
          '<td style="font-size:11px;font-weight:600;">'+c._produto+'</td>' +
          '<td style="font-size:11px;">'+(c.plataforma||'—')+'</td>' +
          '<td class="mono">'+(c.qtd||0)+'</td>' +
          '<td class="mono">'+fmt(c.vtotal||0)+'</td>' +
          '<td class="mono" style="color:var(--warning);">'+fmt(c.custo||0)+'</td>' +
          '<td class="mono" style="color:var(--success);font-weight:700;">'+fmt(c.luc||0)+'</td>' +
          '<td class="mono" style="color:var(--accent);">'+fmt(c.rec||0)+'</td>' +
          '<td>'+linkBtn+'</td>' +
          '</tr>';
      }).join('')}
      </tbody>
    </table>` : '';

  g('popup-d-title').textContent = (r.orgao || 'DISPUTA').toUpperCase();
  g('popup-d-sub').textContent = (r.processo||'') + ' · ' + (r.sistema||'') + ' · ' + fmtD(r.data);
  g('popup-d-body').innerHTML =
    '<div class="detail-grid-3">' +
      '<div class="detail-field"><div class="detail-field-label">EMPRESA</div><div class="detail-field-value">' + (r.empresa||'—') + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">ANALISTA</div><div class="detail-field-value">' + (r.analista||'—') + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">UF / TIPO / RP</div><div class="detail-field-value">' + (r.estado||'—') + ' · ' + (r.tipo||'') + ' · RP ' + (r.rp||'—') + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">VALOR DO CONTRATO</div><div class="detail-field-value" style="color:var(--accent)">' + fmt(contrato || r.venda) + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">LUCRO PREVISTO</div><div class="detail-field-value" style="color:var(--warning);font-weight:700;">' + fmt(lucroPrevisto) + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">LUCRO REALIZADO</div><div class="detail-field-value" style="color:var(--success);font-weight:700;">' + fmt(lucroRealizado) + '</div></div>' +
      '</div>' +
      '<div class="detail-section" style="margin-top:14px;">💰 RESUMO FINANCEIRO</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;">' +
      '<div style="background:var(--bg-surface-soft);border:1px solid var(--border-light);border-left:3px solid var(--warning);border-radius:10px;padding:12px 14px;text-align:center;">' +
      '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">TOTAL COMPRAS</div>' +
      '<div style="font-size:15px;font-weight:800;color:var(--warning);font-family:var(--font-mono);">' + fmt(totalComprasDisp) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg-surface-soft);border:1px solid var(--border-light);border-left:3px solid var(--text-tertiary);border-radius:10px;padding:12px 14px;text-align:center;">' +
      '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">TOTAL CUSTOS</div>' +
      '<div style="font-size:15px;font-weight:800;color:var(--text-secondary);font-family:var(--font-mono);">' + fmt(totalCustosDisp) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg-surface-soft);border:1px solid var(--border-light);border-left:3px solid var(--success);border-radius:10px;padding:12px 14px;text-align:center;">' +
      '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">LUCRO TOTAL</div>' +
      '<div style="font-size:15px;font-weight:800;color:' + (totalLucroDisp >= 0 ? 'var(--success)' : 'var(--danger)') + ';font-family:var(--font-mono);">' + fmt(totalLucroDisp) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg-surface-soft);border:1px solid var(--border-light);border-left:3px solid var(--accent);border-radius:10px;padding:12px 14px;text-align:center;">' +
      '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:4px;">A RECEBER</div>' +
      '<div style="font-size:15px;font-weight:800;color:var(--accent);font-family:var(--font-mono);">' + fmt(totalAReceberDisp) + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="detail-grid-3">' +

      (r.contratoData ? '<div class="detail-field"><div class="detail-field-label">DT. CONTRATO</div><div class="detail-field-value" style="font-weight:700;">' + fmtD(r.contratoData) + '</div></div>' : '') +
      (r.contratoVencimento ? (() => { const hoje=new Date(); const vs=r.contratoVencimento; const venc=vs.includes('/')?new Date(vs.split('/').reverse().join('-')+'T12:00'):new Date(vs+'T12:00'); const dias=Math.floor((venc-hoje)/86400000); const cor=dias<0?'var(--danger)':dias<=30?'var(--warning)':'var(--success)'; const label=dias<0?`VENCIDO há ${Math.abs(dias)}d`:dias<=30?`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Vence em ${dias}d`:`✅ Vence em ${dias}d`; const exib=venc.toLocaleDateString('pt-BR'); return '<div class="detail-field"><div class="detail-field-label">VENCIMENTO CONTRATO</div><div class="detail-field-value" style="color:'+cor+';font-weight:700;">'+exib+' <span style="font-size:11px;padding:2px 7px;background:'+cor+'20;border-radius:10px;">'+label+'</span></div></div>'; })() : '') +
    '</div>' +
    (r.observacao ? '<div class="detail-field" style="margin-bottom:12px;"><div class="detail-field-label">OBSERVAÇÃO</div><div class="detail-field-value" style="font-size:13px;font-weight:400;">' + r.observacao.toUpperCase() + '</div></div>' : '') +
    empenhosRelacionadosHTML +
    lotesHTML +
    comprasDisputaHTML +
    renderComentarios('disputa', id);

  const editBtnD = g('popup-d-edit-btn');
  const newEmpBtnD = g('popup-d-new-emp-btn');
  const reabrirBtn = g('popup-d-reabrir-btn');

  if (editBtnD) {
    editBtnD.onclick = () => { fecharPopup('disputa'); editD(id); };
    editBtnD.style.display = r.finalizada ? 'none' : '';
  }

  if (newEmpBtnD) {
    newEmpBtnD.onclick = () => novoEmpenhoParaDisputa(id);
    newEmpBtnD.style.display = r.finalizada ? 'none' : '';
  }

  // Botão reabrir — só aparece se o contrato está finalizado
  if (reabrirBtn) {
    if (r.finalizada) {
      reabrirBtn.style.display = '';
      reabrirBtn.onclick = () => { fecharPopup('disputa'); reabrirDisputa(id); };
    } else {
      reabrirBtn.style.display = 'none';
    }
  }
  // Botão excluir — só aparece em contratos ATIVOS (não finalizados) SEM empenho vinculado
  const delBtnD = g('popup-d-del-btn');
  if (delBtnD) {
    const temEmpenho = DB.empenhos.some(e => e.disputaId === id);
    if (!r.finalizada && !temEmpenho) {
      delBtnD.style.display = '';
      delBtnD.onclick = () => { fecharPopup('disputa'); delRow('disputas', id); };
    } else {
      delBtnD.style.display = 'none';
      delBtnD.onclick = null;
    }
  }
  g('popup-disputa').classList.add('open');
}

function abrirPopupEmpenho(id) {
  const r = DB.empenhos.find(x => x.id === id);
  if (!r) return;
  const { tot, imp, luc, pct, rec } = eVals(r);
  const dias = diasSemPagamento(r);
  const disp = r.disputaId ? DB.disputas.find(d => d.id === r.disputaId) : null;
  // Itens do empenho — descrição sempre buscada ao vivo do contrato para refletir edições
  const itensRaw = r.itens && r.itens.length ? r.itens : 
    (r.loteId ? [{ id:'leg1', loteId:r.loteId, descricao:r.produto||'', qtd:r.qtd||1, vunit:r.vunit||0 }] : []);
  const itens = itensRaw.map(item => {
    if (item.loteId && disp) {
      const loteAtual = (disp.lotes||[]).find(l => l.id === item.loteId);
      if (loteAtual) return { ...item, descricao: loteAtual.descricao, vunit: loteAtual.vunit };
    }
    return item;
  });
  
  const compras = r.compras || [];
  
  const itensHTML = itens.length ? `
    <div class="detail-section">📦 ITENS DO EMPENHO</div>
    <table class="lotes-status-table">
      <thead><tr><th>Item</th><th>Qtd</th><th>Vl.Unit</th><th>Vl.Total</th><th>Compras</th><th>Pago?</th></tr></thead>
      <tbody>${itens.map(item => {
        const comprasItem = compras.filter(c=>c.itemId===item.id);
        const totalPago = comprasItem.filter(c=>c.dpag).reduce((s,c)=>s+c.luc,0);
        const totalRec = comprasItem.reduce((s,c)=>s+c.rec,0);
        const pago = comprasItem.some(c=>c.dpag);
        return '<tr>' +
          '<td><strong>'+(item.descricao||'—').toUpperCase()+'</strong></td>' +
          '<td class="mono">'+(item.qtd||0)+'</td>' +
          '<td class="mono">'+fmt(item.vunit)+'</td>' +
          '<td class="mono" style="color:var(--accent);font-weight:700;">'+fmt((item.qtd||0)*(item.vunit||0))+'</td>' +
          '<td class="mono">'+comprasItem.length+'</td>' +
          '<td>'+(pago ? '<span class="status-pago">✅ PAGO</span>' : '<span class="status-pendente">⏳ PENDENTE</span>')+'</td>' +
          '</tr>';
      }).join('')}</tbody>
    </table>` : '';
  
  const comprasHTML = compras.length ? `
    <div class="detail-section" style="display:flex;align-items:center;justify-content:space-between;">
      <span>🛒 COMPRAS INDIVIDUAIS</span>
      <button class="btn btn-ghost btn-sm" onclick="exportarComprasSelecionadas('${r.id}')" style="color:var(--success);border-color:var(--success);font-weight:700;">⬇ Exportar Selecionadas</button>
    </div>
    <table class="lotes-status-table" id="tabela-compras-${r.id}">
      <thead><tr>
        <th style="width:30px;"><input type="checkbox" id="chk-all-compras-${r.id}" onchange="toggleTodasCompras('${r.id}',this.checked)" title="Selecionar todas"></th>
        <th>Item</th><th>Plataforma</th><th>Dt.Compra</th><th>Qtd</th><th>Vl.Compra</th><th>Custo</th><th>Lucro</th><th>A Receber</th><th>Pago</th><th>Dt.Pag</th><th>Ações</th>
      </tr></thead>
      <tbody>${compras.map(c => {
        const itemRef = itens.find(i=>i.id===c.itemId);
        const pago = c.recebido > 0;
        const linkBtn = c.link ? `<a href="${c.link}" target="_blank" title="${c.link}" style="font-size:10px;color:var(--accent);">🔗</a>` : '';
        return '<tr>' +
          '<td style="text-align:center;"><input type="checkbox" class="chk-compra-'+r.id+'" data-cid="'+c.id+'" style="cursor:pointer;"></td>' +
          '<td style="font-size:10px;">'+((itemRef?.descricao||'—').toUpperCase())+'</td>' +
          '<td style="font-size:10px;font-weight:600;">'+(c.plataforma||'—')+' '+linkBtn+'</td>' +
          '<td class="mono" style="color:var(--text-secondary);">'+(fmtD(c.dcompra)||'—')+'</td>' +
          '<td class="mono">'+(c.qtd||0)+'</td>' +
          '<td class="mono">'+fmt(c.vtotal||0)+'</td>' +
          '<td class="mono" style="color:var(--warning);">'+fmt(c.custo||0)+'</td>' +
          '<td class="mono" style="color:var(--success);font-weight:700;">'+fmt(c.luc||0)+'</td>' +
          '<td class="mono" style="color:var(--accent);">'+fmt(c.rec||0)+'</td>' +
          '<td>'+(pago?'<span class="status-pago">✅ '+fmt(c.recebido)+'</span>':'<span class="status-pendente">—</span>')+'</td>'+
          '<td class="mono">'+(fmtD(c.dpag)||'—')+'</td>' +
          '<td onclick="event.stopPropagation()">' +
            '<button class="btn btn-ghost btn-sm" onclick="fecharPopup(\'empenho\');fecharPopup(\'disputa\');abrirCompra(\''+r.id+'\',\''+c.id+'\')" title="Editar">✏️</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="duplicarCompra(\''+r.id+'\',\''+c.id+'\')" title="Duplicar compra" style="color:var(--accent);border-color:var(--accent);">📄</button>' +
            '<button class="btn btn-danger btn-sm" onclick="delCompra(\''+r.id+'\',\''+c.id+'\')" title="Excluir">🗑</button>' +
          '</td>' +
          '</tr>';
      }).join('')}</tbody>
      <tfoot>
        <tr style="background:var(--bg-inset);font-weight:700;border-top:2px solid var(--border);">
          <td colspan="5" style="padding:6px 8px;font-size:11px;color:var(--text-secondary);text-align:right;letter-spacing:.05em;">TOTAL</td>
          <td class="mono" style="padding:6px 8px;font-size:12px;color:var(--accent);" title="Vlr Compra">${fmt(compras.reduce((s,c)=>s+(c.vtotal||0),0))}</td>
          <td class="mono" style="padding:6px 8px;font-size:12px;color:var(--warning);" title="Custo/Imposto">${fmt(compras.reduce((s,c)=>s+(c.custo||0),0))}</td>
          <td class="mono" style="padding:6px 8px;font-size:12px;color:var(--success);font-weight:800;" title="Lucro">${fmt(compras.reduce((s,c)=>s+(c.luc||0),0))}</td>
          <td class="mono" style="padding:6px 8px;font-size:13px;color:var(--accent);font-weight:800;" title="A Receber">${fmt(compras.reduce((s,c)=>s+(c.rec||0),0))}</td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>` : `<div class="detail-section">🛒 COMPRAS</div><div style="color:var(--text-tertiary);font-size:12px;padding:8px;">Nenhuma compra cadastrada.</div>`;

  // Impostos calculados a partir das compras realizadas (soma dos custos)
  const impRealizado = compras.reduce((s,c) => s + (c.custo||0), 0);

  g('popup-e-title').textContent = 'EMPENHO #' + (r.num || '—');
  g('popup-e-sub').textContent = (r.orgao||'').toUpperCase() + ' · ' + fmtD(r.data);
  g('popup-e-body').innerHTML =
    '<div class="detail-grid-3">' +
      '<div class="detail-field"><div class="detail-field-label">ANALISTA</div><div class="detail-field-value">' + (r.analista||'—') + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">STATUS</div><div class="detail-field-value">' + (empenhoEstaPago(r) ? '<span class="status-pago">✅ PAGO</span>' : '<span class="status-pendente">⏳ PENDENTE</span>') + '</div></div>' +
    '</div>' +

    (r.neUrl ? '<div class="detail-field" style="margin-bottom:12px;"><div class="detail-field-label">📄 PDF DO EMPENHO</div><div class="detail-field-value"><a href="'+r.neUrl+'" target="_blank" class="btn btn-ghost btn-sm" style="color:var(--success);border-color:var(--success);text-decoration:none;">📄 '+(r.neNome||'PDF do Empenho')+'</a></div></div>' : '') +
    (disp ? '<div class="detail-field" style="margin-bottom:12px;"><div class="detail-field-label">CONTRATO VINCULADO</div><div class="detail-field-value" style="cursor:pointer;color:var(--accent)" onclick="fecharPopup(\'empenho\');abrirPopupDisputa(\''+disp.id+'\')">🔗 ' + disp.orgao.toUpperCase() + ' · ' + disp.processo + '</div></div>' : '') +
    '<div class="detail-grid">' +
      '<div class="detail-field"><div class="detail-field-label">VAL. EMPENHO</div><div class="detail-field-value" style="color:var(--accent)">' + fmt(r.vem) + '</div></div>' +
      '<div class="detail-field"><div class="detail-field-label">IMPOSTOS</div><div class="detail-field-value" style="color:var(--warning)">' + fmt(impRealizado) + (compras.length === 0 ? ' <span style="font-size:9px;color:var(--text-tertiary);">(sem compras)</span>' : '') + '</div></div>' +

      '<div class="detail-field"><div class="detail-field-label">LUCRO REALIZADO</div><div class="detail-field-value" style="color:var(--success)">' + fmt(compras.filter(c=>c.dpag).reduce((s,c)=>s+c.luc,0)) + '</div></div>' +

      '<div class="detail-field"><div class="detail-field-label">DIAS SEM PAG.</div><div class="detail-field-value">' + (function(){ const s = situacaoPrazoPagamento(r); return s.codigo === 'contando' ? dias + ' DIAS' : (s.codigo === 'pago' ? '✓ PAGO' : s.rotulo); })() + '</div></div>' +
    '</div>' +
    itensHTML +
    '<div style="margin-top:12px;">' +
      (function(){ const _temP = empenhoTemSaldo(r.id); return '<button class="btn ' + (_temP ? 'btn-primary' : 'btn-ghost') + ' btn-sm" onclick="' + (_temP ? 'fecharPopup(\'empenho\');fecharPopup(\'disputa\');abrirCompra(\'' + r.id + '\')' : '') + '" style="width:100%;' + (!_temP ? 'opacity:0.45;cursor:not-allowed;pointer-events:none;' : '') + '" title="' + (!_temP ? 'Todos os itens já foram completamente comprados' : '') + '">＋ ' + (_temP ? 'NOVA COMPRA PARA ESTE EMPENHO' : 'ITENS JÁ COMPLETAMENTE COMPRADOS') + '</button>'; })() +
    '</div>' +
    comprasHTML +
    (r.observacao ? '<div class="detail-field" style="margin-top:12px;"><div class="detail-field-label">OBSERVAÇÃO</div><div class="detail-field-value" style="font-size:13px;font-weight:400;">' + r.observacao.toUpperCase() + '</div></div>' : '') +
    renderComentarios('empenho', id);

  g('popup-e-edit-btn').onclick = () => { fecharPopup('empenho'); fecharPopup('disputa'); editE(id); };
  const delBtnE = g('popup-e-del-btn');
  if (delBtnE) {
    delBtnE.onclick = () => {
      fecharPopup('empenho');
      fecharPopup('disputa');
      delRow('empenhos', id);
    };
  }
  g('popup-empenho').classList.add('open');
}

function fecharPopup(tipo) {
  g('popup-' + tipo).classList.remove('open');
  _restoreTab();
}

// ===== LOTE SELECTOR no modal empenho =====
let lotesSelecionados = {}; // loteId -> qtd
let vemManual = false;

function togVemManual() {
  vemManual = !vemManual;
  const btn = g('tbtn-e-vem');
  const ai = g('e-vem-a'); const mi = g('e-vem');
  if(vemManual) { ai.style.display='none'; mi.style.display='block'; if(btn){btn.classList.add('on');btn.innerHTML='<span class="dot"></span>Manual';} }
  else { ai.style.display='block'; mi.style.display='none'; if(btn){btn.classList.remove('on');btn.innerHTML='<span class="dot"></span>Auto';} recalcVem(); }
  calcE();
}

function recalcVem() {
  if(vemManual) return;
  // Soma vunit*qtd de todos lotes selecionados
  let total = 0;
  const disputaId = gv('e-disputa-id');
  if(disputaId) {
    const disp = DB.disputas.find(d=>d.id===disputaId);
    if(disp) {
      Object.entries(lotesSelecionados).forEach(([loteId, qtd]) => {
        const lote = (disp.lotes||[]).find(l=>l.id===loteId);
        if(lote) total += (lote.vunit||0)*qtd;
      });
    }
  }
  const ai = g('e-vem-a');
  if(ai) ai.value = fmt(total);
  // Para calcE, sincronizar no campo hidden
  const mi = g('e-vem'); if(mi && !vemManual) mi.value = total.toFixed(2);
  return total;
}

function onDisputaSelecionada(disputaId) {
  lotesSelecionados = {};
  const wrap = g('lote-selector-wrap');
  const container = g('lote-selector-container');
  if (!disputaId) { if(wrap) wrap.style.display = 'none'; return; }
  const disp = DB.disputas.find(d => d.id === disputaId);
  // Preenche analista automaticamente a partir do contrato
  const analistaEl = g('e-analista');
  if(analistaEl && disp) analistaEl.value = disp.analista || '';
  if (!disp || !(disp.lotes||[]).length) { if(wrap) wrap.style.display = 'none'; return; }
  // Ao editar, exclui o próprio empenho do cálculo de saldo para não travar os itens
  const excludeId = EID.empenhos || null;
  const lotes = getLotesComSaldo(disputaId, excludeId);
  if(wrap) wrap.style.display = 'block';
  if(container) container.innerHTML = lotes.map(l => {
    const semSaldo = l.qtdRestante <= 0;
    const dataAttrs = semSaldo ? '' : `data-lid="${l.id}" data-maxqtd="${l.qtdRestante}" data-vunit="${l.vunit}" onclick="toggleLoteCard(this)"`;
    return `<div class="lote-selector-card${semSaldo?' sem-saldo':''}" id="lcard-${l.id}" ${dataAttrs} style="display:flex;flex-direction:column;gap:4px;">`
      + `<div style="display:flex;align-items:flex-start;gap:8px;">`
      + `<input type="checkbox" name="lote-check" ${semSaldo?'disabled':''} style="margin:3px 0 0;flex-shrink:0;">`
      + `<div style="flex:1;min-width:0;">`
      + `<div style="font-weight:700;font-size:12px;line-height:1.3;">${(l.descricao||'—').toUpperCase()}</div>`
      + `<div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">Vl.Unit: ${fmt(l.vunit)} · Contratado: ${l.qtd||0} · Enviado: ${l.qtdEnviada}</div>`
      + `</div>`
      + `<span class="lote-saldo-badge ${semSaldo?'lote-saldo-zero':'lote-saldo-ok'}" style="flex-shrink:0;">${semSaldo?'✓ Completo':l.qtdRestante+' restantes'}</span>`
      + `</div>`
      + `<div class="lote-qtd-input-wrap" id="lqtd-wrap-${l.id}" style="display:none;">`
      + `<label>Qtd:</label>`
      + `<input type="number" min="1" max="${l.qtdRestante}" value="${l.qtdRestante}" id="lqtd-${l.id}" onclick="event.stopPropagation()" data-lid="${l.id}" data-vunit="${l.vunit}" data-maxqtd="${l.qtdRestante}" oninput="atualizarVemPorLoteEl(this)">`
      + `<div style="font-size:12px;font-weight:700;color:var(--accent);" id="lval-${l.id}"></div>`
      + `</div>`
      + `</div>`;
  }).join('');
  const tvWrap = g('lote-valor-total-wrap'); if(tvWrap) tvWrap.style.display = 'none';
}

function toggleLoteCard(el) {
  const loteId = el.dataset.lid;
  const maxQtd = +el.dataset.maxqtd;
  const vunit  = +el.dataset.vunit;
  const isSelected = el.classList.contains('selected');
  if(isSelected) {
    // Desseleciona
    el.classList.remove('selected');
    const chk = el.querySelector('input[type=checkbox]'); if(chk) chk.checked = false;
    const qtdWrap = g('lqtd-wrap-'+loteId); if(qtdWrap) qtdWrap.style.display = 'none';
    const valEl = g('lval-'+loteId); if(valEl) valEl.textContent = '';
    delete lotesSelecionados[loteId];
  } else {
    // Seleciona
    el.classList.add('selected');
    const chk = el.querySelector('input[type=checkbox]'); if(chk) chk.checked = true;
    const qtdWrap = g('lqtd-wrap-'+loteId); if(qtdWrap) qtdWrap.style.display = 'flex';
    lotesSelecionados[loteId] = maxQtd;
    const qtdInput = g('lqtd-'+loteId); if(qtdInput) qtdInput.value = maxQtd;
    const valEl = g('lval-'+loteId); if(valEl) valEl.textContent = fmt(vunit*maxQtd);
  }
  const av = g('lote-aviso'); if(av) av.style.display = 'none';
  atualizarVemTotal();
}
function atualizarVemTotal() {
  const disputaId = gv('e-disputa-id');
  const disp = disputaId ? DB.disputas.find(d=>d.id===disputaId) : null;
  let total = 0;
  Object.entries(lotesSelecionados).forEach(([loteId, qtd]) => {
    const lote = disp ? (disp.lotes||[]).find(l=>l.id===loteId) : null;
    if(lote) total += (lote.vunit||0)*qtd;
    const valEl = g('lval-'+loteId); if(valEl) valEl.textContent = fmt((lote?.vunit||0)*qtd);
  });
  const tvWrap = g('lote-valor-total-wrap');
  const tvCalc = g('lote-valor-total-calc');
  if(tvWrap) tvWrap.style.display = Object.keys(lotesSelecionados).length > 0 ? 'block' : 'none';
  if(tvCalc) tvCalc.textContent = fmt(total);
  if(!vemManual) {
    const ai = g('e-vem-a'); if(ai) ai.value = fmt(total);
    const mi = g('e-vem'); if(mi) mi.value = total.toFixed(2);
    calcE();
  }
}
function atualizarVemPorLoteEl(input) {
  atualizarVemPorLote(input.dataset.lid, +input.dataset.vunit, +input.dataset.maxqtd);
}

function atualizarVemPorLote(loteId, vunit, maxQtd) {
  const input = g('lqtd-' + loteId);
  if (!input) return;
  let qtd = parseInt(input.value) || 1;
  if (qtd < 1) qtd = 1;
  if (qtd > maxQtd) { qtd = maxQtd; input.value = maxQtd; }
  lotesSelecionados[loteId] = qtd;
  atualizarVemTotal();
}

var _expandedDisputas = new Set();
function renderD(){
  const allRows=getSorted('disputas').filter(r=>!r.finalizada && matches('disputas',r));
  const tb=g('tbody-disputas');
  // Show skeleton while data is being prepared
  if (!tb) return;
  if(!allRows.length){ tb.innerHTML='<tr><td colspan="6"><div class="empty-state"><div class="icon">🏆</div><p>Nenhum contrato encontrado</p></div></td></tr>'; sumD(); renderPagination('disputas', 0); return; }
  // Reset page if out of bounds
  const totalPages = Math.ceil(allRows.length / PAGE_SIZE);
  if (_page.disputas > totalPages) _page.disputas = 1;
  const start = (_page.disputas - 1) * PAGE_SIZE;
  const rows = allRows.slice(start, start + PAGE_SIZE);
  renderPagination('disputas', allRows.length);

  const htmlParts = [];
  rows.forEach((r, idx) => {
    const{luc}=dVals(r);
    const lotes = r.lotes || [];
    const totalContratado = lotes.reduce((s,l)=>s+(l.qtd||0), 0);
    const totalEnviado = lotes.reduce((s,l)=>s+calcQtdEnviada(r.id, l.id), 0);
    const pctProg = totalContratado > 0 ? Math.round(totalEnviado/totalContratado*100) : 0;
    const contrato = getValorContrato(r);

    // ── Empenhos abertos vinculados a esto contrato ──
    const empsAbertos = _empenhosDaDisputa(r.id).filter(e => !e.finalizado);
    const expanded = false; // sub-rows desativadas
    const _q = FLT['disputas'] || '';

    // ── Alerta vencimento de contrato ──
    let contratoAlerta = '';
    let rowStyle = 'cursor:pointer;';
    if (r.contratoVencimento) {
      const vs = r.contratoVencimento;
      const vencDate = vs.includes('/') ? new Date(vs.split('/').reverse().join('-')+'T12:00') : new Date(vs+'T12:00');
      if (!isNaN(vencDate.getTime())) {
        const diasVenc = Math.floor((vencDate - new Date()) / 86400000);
        if (diasVenc < 0) {
          rowStyle = 'cursor:pointer;border-left:4px solid var(--danger);background:rgba(239,68,68,0.04);';
          contratoAlerta = '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--danger-soft);color:var(--danger);border-radius:10px;padding:1px 7px;font-size:9px;font-weight:700;margin-left:5px;">🔴 CONTRATO VENCIDO</span>';
        } else if (diasVenc <= 15) {
          rowStyle = 'cursor:pointer;border-left:4px solid var(--warning);background:rgba(245,158,11,0.05);';
          contratoAlerta = '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--warning-soft);color:var(--warning);border-radius:10px;padding:1px 7px;font-size:9px;font-weight:700;margin-left:5px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Vence em ' + diasVenc + 'd</span>';
        }
      }
    }

    // ── Badge de empenhos abertos ──
    const empBadge = empsAbertos.length > 0
      ? ' ' + empsAbertos.map(e => '<a onclick="event.stopPropagation();abrirPopupEmpenho(\'' + e.id + '\')" style="cursor:pointer;color:var(--accent);font-size:10px;font-weight:700;margin-left:3px;text-decoration:underline;">#' + (e.num||'?') + '</a>').join(' ')
      : '';

    const _lts = r.lotes||[];
    const _vlCont     = _lts.reduce((s,l)=>s+(l.qtd||0)*(l.vunit||0),0);
    const _compraPrev = _lts.reduce((s,l)=>s+(l.compraPrev||0)*(l.qtd||0),0);
    const _custoPrev  = _lts.reduce((s,l)=>s+(l.custoPrev||0)*(l.qtd||0),0);
    const _lucPrev    = _vlCont - _compraPrev - _custoPrev;
    const _empsD = _empenhosDaDisputa(r.id);
    const _lucReal = _empsD.reduce((s,e)=>s+(e.compras||[]).filter(c=>c.dpag).reduce((ss,c)=>ss+(c.luc||0),0),0);

    var _progCor = pctProg>=100?'var(--success)':pctProg>0?'var(--accent)':'var(--border-light)';
    htmlParts.push(
      '<tr style="' + rowStyle + '" onclick="abrirPopupDisputa(\'' + r.id + '\')">' +
      '<td class="inline-edit-cell" onclick="event.stopPropagation()" id="inline-date-disputas-' + r.id + '">' +
        '<span class="mono" style="font-size:11px;">' + fmtD(r.data) + '</span>' +
        '<span class="inline-edit-trigger" onclick="inlineEditDate(\'' + r.id + '\',\'disputas\')">✏️</span>' +
      '</td>' +
      '<td style="max-width:250px;"><div style="font-weight:600;font-size:13px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + (r.orgao||'') + '">' + (r.orgao||'—') + contratoAlerta + empBadge + '</div><span class="estado-badge" style="font-size:9px;">' + (r.estado||'—') + '</span></td>' +
      '<td><span class="badge ' + (_badgeClass(r.analista)) + '" style="font-size:10px;">' + (r.analista||'—') + '</span></td>' +
      '<td class="mono" style="color:var(--accent);font-weight:700;font-size:11px;">'+(_vlCont>0?fmt(_vlCont):'—')+'</td>' +
      '<td class="mono" style="color:var(--warning);font-weight:700;font-size:11px;">'+(_lucPrev!==0?fmt(_lucPrev):'—')+'</td>' +
      '<td style="text-align:center;padding-left:12px;padding-right:12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;width:100%;min-width:180px;">' +
          '<div class="progress-bar-wrap" style="position:relative;flex:1;width:100%;height:8px;min-width:0;overflow:hidden;border-radius:999px;background:var(--bg-inset);">' +
            '<div class="progress-bar-fill" style="display:block;height:100%;max-width:100%;width:'+Math.max(0,Math.min(100,pctProg))+'%;background:'+_progCor+';border-radius:999px;"></div>' +
          '</div>' +
          '<span style="flex:0 0 30px;text-align:right;font-size:9px;color:var(--text-tertiary);">'+pctProg+'%</span>' +
        '</div>' +
      '</td>' +
      '</tr>'
    );

    // ── Sub-rows: empenhos abertos desto contrato ──
    if (expanded && empsAbertos.length > 0) {
      // Header da seção de empenhos
      const totalVem   = empsAbertos.reduce((s,e)=>s+(e.vem||0),0);
      const totalComp  = empsAbertos.reduce((s,e)=>s+(e.compras||[]).reduce((ss,c)=>ss+(c.vtotal||0),0),0);
      const totalLucro = empsAbertos.reduce((s,e)=>s+(e.compras||[]).reduce((ss,c)=>ss+(c.luc||0),0),0);
      const totalRec   = empsAbertos.reduce((s,e)=>s+(e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((ss,c)=>ss+(c.rec||0),0),0);
      const maxDias    = empsAbertos.reduce((max,e)=>Math.max(max,diasSemPagamento(e)),0);
      const corDias    = maxDias>=90?'var(--danger)':maxDias>=60?'var(--warning)':maxDias>=30?'var(--text-secondary)':'var(--success)';

      htmlParts.push(
        '<tr style="background:var(--bg-inset);" onclick="event.stopPropagation()">' +
        '<td colspan="10" style="padding:6px 12px 6px 32px;">' +
          '<div style="display:flex;align-items:center;gap:14px;font-size:11px;font-weight:600;flex-wrap:wrap;">' +
            '<span style="color:var(--text-tertiary);font-weight:700;">📄 EMPENHOS EM ABERTO</span>' +
            '<span style="color:var(--text-tertiary);">' + empsAbertos.length + ' empenho(s)</span>' +
            '<span style="color:var(--accent);margin-left:auto;">Emp: ' + fmt(totalVem) + '</span>' +
            '<span style="color:var(--text-secondary);">Compra: ' + fmt(totalComp) + '</span>' +
            '<span style="color:var(--success);font-weight:700;">Lucro: ' + fmt(totalLucro) + '</span>' +
            '<span style="color:var(--warning);">A receber: ' + fmt(totalRec) + '</span>' +
            (maxDias > 0 ? '<span style="color:' + corDias + ';">Maior atraso: ' + maxDias + 'd</span>' : '') +
          '</div>' +
        '</td></tr>'
      );

      empsAbertos.forEach((e, eIdx) => {
        const zebraTd = eIdx % 2 === 1 ? 'background:var(--bg-surface-soft);' : 'background:var(--bg-surface);';
        const dias = diasSemPagamento(e);
        let diasBadge = '—';
        if (dias > 0) {
          const cls = dias>=90?'dias-90':dias>=60?'dias-60':dias>=30?'dias-30':'dias-ok';
          const icon = dias>=90?'🔴 ':dias>=60?'🟠 ':dias>=30?'🟡 ':'';
          diasBadge = '<span class="dias-badge ' + cls + '">' + icon + dias + 'd</span>';
        } else if (dias === 0) {
          diasBadge = '<span class="dias-badge dias-ok">✓</span>';
        }
        const _vlComp = (e.compras||[]).reduce((s,c)=>s+(c.vtotal||0),0);
        const _vlLucro = (e.compras||[]).reduce((s,c)=>s+(c.luc||0),0);
        const _vlRec   = (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((s,c)=>s+(c.rec||0),0);
        const btnS = 'padding:4px 7px;font-size:13px;border-radius:7px;';
        const lote = e.loteId ? (r.lotes||[]).find(l=>l.id===e.loteId) : null;
        const loteDesc = lote ? '<div style="font-size:9px;color:var(--text-tertiary);margin-top:1px;">🗂 ' + lote.descricao.substring(0,24) + (lote.descricao.length>24?'…':'') + '</div>' : '';
        // Custo real: soma de custo das compras realizadas
        const _custoReal = (e.compras||[]).reduce((s,c)=>s+(c.custo||0),0);
        htmlParts.push(
          '<tr style="cursor:pointer;" onclick="abrirPopupEmpenho(\'' + e.id + '\')">' +
          '<td style="' + zebraTd + '"></td>' +
          '<td style="' + zebraTd + '"></td>' +
          '<td style="padding-left:32px;' + zebraTd + '">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="font-size:10px;color:var(--text-tertiary);">└</span>' +
              '<span class="mono" style="font-size:11px;font-weight:700;color:var(--text-primary);">' + (e.num||'—') + '</span>' +
              (e.analista ? '<span class="badge ' + (_badgeClass(e.analista)) + '" style="font-size:9px;">' + e.analista + '</span>' : '') +
            '</div>' +
            loteDesc +
          '</td>' +
          '<td style="' + zebraTd + '"></td>' +
          '<td class="mono" style="color:var(--accent);font-weight:700;font-size:11px;' + zebraTd + '">' + fmt(e.vem) + '</td>' +
          '<td class="mono" style="color:var(--text-secondary);font-size:11px;' + zebraTd + '">' + (_vlComp>0?fmt(_vlComp):'—') + '</td>' +
          '<td class="mono" style="color:var(--warning);font-size:11px;' + zebraTd + '">' + (_custoReal>0?fmt(_custoReal):'—') + '</td>' +
          '<td class="mono" style="color:var(--success);font-size:11px;' + zebraTd + '">' + (_vlLucro>0?fmt(_vlLucro):'—') + '</td>' +
          '<td style="' + zebraTd + '">' + diasBadge + '</td>' +
          '<td onclick="event.stopPropagation()" style="white-space:nowrap;' + zebraTd + '">' +
            '<button class="btn btn-ghost btn-sm" onclick="abrirPopupEmpenho(\'' + e.id + '\')" title="Ver empenho" style="' + btnS + '">🔍</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="editE(\'' + e.id + '\')" title="Editar" style="' + btnS + '">✏️</button>' +
            (() => { const _temD = empenhoTemSaldo(e.id); return '<button class="btn btn-ghost btn-sm" onclick="' + (_temD ? "abrirCompra('" + e.id + "')" : '') + '" title="' + (_temD ? 'Nova Compra' : 'Sem saldo disponível') + '" style="' + btnS + ';' + (_temD ? 'color:var(--success);border-color:var(--success);' : 'opacity:0.35;cursor:not-allowed;') + '">🛒</button>'; })() +
          '</td></tr>'
        );
      });
    }
  });

  tb.innerHTML = htmlParts.join('');
  sumD();
}

function sumD(){
  const a=DB.disputas.filter(r=>!r.finalizada && matches('disputas',r));
  const tv=a.reduce((s,r)=>s+getValorContrato(r),0);
  const idsDisputas = new Set(a.map(r=>r.id));
  const empsVinculados = DB.empenhos.filter(e=>idsDisputas.has(e.disputaId));

  // Total comprado: soma de todas as compras dos empenhos vinculados
  const totalComprado = empsVinculados.reduce((s,e)=>s+(e.compras||[]).reduce((ss,c)=>ss+(c.vtotal||0),0),0);

  // Lucro recebido: apenas compras COM data de pagamento preenchida
  const lucroRecebidoD = empsVinculados.reduce((s,e)=>s+(e.compras||[])
    .filter(c=>c.dpag && c.dpag!=='')
    .reduce((ss,c)=>{
      const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
      return ss+luc;
    },0),0);

  // Lucro empenhado: compras SEM data de pagamento (ainda a receber)
  const lucroEmpenhado = empsVinculados.filter(e=>!e.finalizado)
    .reduce((s,e)=>s+(e.compras||[])
      .filter(c=>!c.dpag || c.dpag==='')
      .reduce((ss,c)=>{
        const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
        return ss+luc;
      },0),0);

  // % Lucro = lucro recebido (pagos) / total comprado
  const pctLucro = totalComprado > 0 ? (lucroRecebidoD / totalComprado * 100) : 0;
  const corPct = pctLucro >= 0 ? 'var(--success)' : 'var(--danger)';
  const fmtPct = v => (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%';

  // Lucro previsto: soma de todos os lotes das disputas ativas
  const lucroPrevTotal = a.reduce((s, r) => {
    return s + (r.lotes||[]).reduce((ss, l) => {
      const qtd = l.qtd || 0;
      const total = qtd * (l.vunit||0);
      return ss + total - (l.compraPrev||0)*qtd - (l.custoPrev||0)*qtd;
    }, 0);
  }, 0);

  g('sum-disputas').innerHTML=`
    <div class="card"><div class="card-label">Total</div><div class="card-value cv-blue">${a.length}</div></div>
    <div class="card"><div class="card-label">Valor Contratado</div><div class="card-value cv-blue">${fmt(tv)}</div></div>
    <div class="card"><div class="card-label">Total Comprado</div><div class="card-value cv-yellow">${fmt(totalComprado)}</div></div>
    <div class="card" style="border-left:3px solid var(--warning);"><div class="card-label">💡 Lucro Previsto</div><div class="card-value cv-yellow">${fmt(lucroPrevTotal)}</div></div>
    <div class="card"><div class="card-label">Lucro Recebido</div><div class="card-value cv-green">${fmt(lucroRecebidoD)}</div></div>
    <div class="card" style="border-left:3px solid var(--warning);"><div class="card-label">Lucro Empenhado</div><div class="card-value cv-yellow">${fmt(lucroEmpenhado)}</div></div>
    <div class="card" style="border-left:3px solid ${corPct};"><div class="card-label">% Lucro</div><div class="card-value" style="color:${corPct};">${fmtPct(pctLucro)}</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:3px;">lucro recebido / total comprado</div></div>`;

}

// Verifica se um empenho ainda tem saldo de itens para comprar
function empenhoTemSaldo(empenhoId) {
  const emp = DB.empenhos.find(x => x.id === empenhoId);
  if (!emp) return false;
  const itens = emp.itens || [];
  if (!itens.length) return true; // sem itens = permite compra livre
  return itens.some(item => {
    const qtdComprada = (emp.compras || [])
      .filter(c => c.itemId === item.id)
      .reduce((s, c) => s + (c.qtd || 0), 0);
    return qtdComprada < (item.qtd || 0);
  });
}

function atualizarHeaderEmpenhosAgrupado() {
  const headerRow = document.querySelector('#tab-empenhos table thead tr');
  if (!headerRow) return;
  if (_agrupado) {
    headerRow.innerHTML = `
      <th style="min-width:130px;" onclick="sort('empenhos','num')" id="sort-empenhos-num" title="Ordenar pelo número do empenho">Empenho</th>
      <th class="money" style="min-width:130px;text-align:right;" onclick="sort('empenhos','valorEmpenho')" id="sort-empenhos-valorEmpenho" title="Ordenar pelo valor do empenho">Val. Empenho</th>
      <th class="money" style="min-width:130px;text-align:right;" onclick="sort('empenhos','valorCompra')" id="sort-empenhos-valorCompra" title="Ordenar pelo valor das compras">Valor Compra</th>
      <th class="money" style="min-width:110px;text-align:right;" onclick="sort('empenhos','lucroCompras')" id="sort-empenhos-lucroCompras" title="Ordenar pelo lucro">Lucro</th>
      <th class="money" style="min-width:130px;text-align:right;" onclick="sort('empenhos','aReceber')" id="sort-empenhos-aReceber" title="Ordenar pelo valor a receber">A Receber</th>
      <th style="min-width:90px;text-align:center;" onclick="sort('empenhos','dias')" id="sort-empenhos-dias" title="Ordenar por dias">⏱️ Dias</th>
    `;
  } else {
    headerRow.innerHTML = `
      <th style="width:36px;text-align:center;"><input type="checkbox" id="chk-all-empenhos" title="Selecionar todos" onchange="toggleSelectAll('empenhos',this.checked)" style="cursor:pointer;width:15px;height:15px;"></th>
      <th onclick="sort('empenhos', 'num')" id="sort-empenhos-num" title="Ordenar pelo número do empenho">Empenho</th>
      <th onclick="sort('empenhos', 'orgao')" id="sort-empenhos-orgao" title="Ordenar por órgão">Órgão</th>
      <th onclick="sort('empenhos', 'analista')" id="sort-empenhos-analista" title="Ordenar por analista">Analista</th>
      <th onclick="sort('empenhos','dias')" id="sort-empenhos-dias" style="cursor:pointer;user-select:none;" title="Ordenar por dias">⏱️ Dias</th>
    `;
  }
}

function renderE(){
  // Sincroniza estilo do botão de agrupamento
  const _btnAgr = g('btn-agrupar-orgao');
  if(_btnAgr) { _btnAgr.style.background = _agrupado ? 'var(--accent)' : ''; _btnAgr.style.color = _agrupado ? '#fff' : ''; }
  atualizarHeaderEmpenhosAgrupado();
  const rows=getSorted('empenhos').filter(r=>matches('empenhos',r) && !r.finalizado);
  const tb=g('tbody-empenhos');
  if(!rows.length){ tb.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="icon">📄</div><p>Nenhum empenho</p></div></td></tr>'; sumE(); verificarAlertas(); return; }
  if(_agrupado) { renderEAgrupado(rows, tb); sumE(); verificarAlertas(); return; }
  tb.innerHTML=rows.map(r=>{
    const{luc}=eVals(r);
    const compras = r.compras || [];
    const todoPago = empenhoEstaPago(r);
    const naoRecebido = !todoPago;
    const dias = diasSemPagamento(r);
    const numDisplay = r.num ? `${hl(r.num, FLT['empenhos'])}<button class="copy-btn" onclick="event.stopPropagation();copyToClipboard('${r.num}',this)" title="Copiar número">⎘</button>` : '—';
    let rowClass = '', diasBadge = '';
    if (naoRecebido && dias > 0) {
      if (dias >= 90)      { rowClass = 'alerta-90'; diasBadge = '<span class="dias-badge dias-90">🔴 '+dias+'d</span>'; }
      else if (dias >= 60) { rowClass = 'alerta-60'; diasBadge = '<span class="dias-badge dias-60">🟠 '+dias+'d</span>'; }
      else if (dias >= 30) { rowClass = 'alerta-30'; diasBadge = '<span class="dias-badge dias-30">🟡 '+dias+'d</span>'; }
      else                 { diasBadge = '<span class="dias-badge dias-ok">'+dias+'d</span>'; }
    } else if (!naoRecebido) {
      diasBadge = '<span class="dias-badge dias-ok">✓</span>';
    } else { diasBadge = '—'; }

    let loteInfo = '—';
    if (r.disputaId) {
      const disp = DB.disputas.find(d => d.id === r.disputaId);
      if (disp) {
        const lote = r.loteId ? (disp.lotes||[]).find(l => l.id === r.loteId) : null;
        loteInfo = '<span style="cursor:pointer;color:var(--accent);font-size:11px;font-weight:600;" onclick="event.stopPropagation();abrirPopupDisputa(\''+disp.id+'\')">🔗 '+(lote ? lote.descricao.substring(0,16)+(lote.descricao.length>16?'…':'') : disp.orgao.substring(0,14))+'</span>';
      }
    }

    const btnStyle = 'padding:5px 9px;font-size:15px;line-height:1;border-radius:8px;';
    const _vlCompra = (r.compras||[]).reduce((s,c)=>s+(c.vtotal||0),0);
    const _vlLucro  = (r.compras||[]).reduce((s,c)=>s+(c.luc||0),0);
    const _vlRec    = (r.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((s,c)=>s+(c.rec||0),0);
    return '<tr class="'+rowClass+'" style="cursor:pointer;" onclick="abrirPopupEmpenho(\'' + r.id + '\')">' +
      '<td onclick="event.stopPropagation()" style="text-align:center;"><input type="checkbox" class="chk-row-empenhos" data-id="' + r.id + '" onchange="onRowCheck(\'empenhos\')" style="cursor:pointer;width:15px;height:15px;"></td>' +
      '<td class="mono hi" style="font-size:11px;font-weight:600;">' + (r.num||'—') + '</td>' +
      '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;">' + (r.orgao||'—') + '</td>' +
      '<td><span class="badge ' + (_badgeClass(r.analista)) + '" style="font-size:10px;">' + (r.analista||'—') + '</span></td>' +
      '<td>' + diasBadge + '</td>' +
      '</tr>';
  }).join('');
  sumE();
  verificarAlertas();
}
function sumE(){
  const a=DB.empenhos.filter(r=>matches('empenhos',r) && !r.finalizado);
  const te=a.reduce((s,r)=>s+r.vem,0);
  const totalComprado=a.reduce((s,r)=>s+(r.compras||[]).reduce((ss,c)=>ss+(c.vtotal||0),0),0);
  const lucroEmpenhado = a.reduce((s,r)=>s+(r.compras||[])
    .filter(c=>!c.dpag || c.dpag==='')
    .reduce((ss,c)=>{
      const luc = (c.luc !== undefined && c.luc !== null) ? c.luc : (c.rec||0)-(c.vtotal||0)-(c.custo||0);
      return ss + luc;
    },0),0);

  const pctLucroEmpenhado = totalComprado > 0 ? (lucroEmpenhado / totalComprado * 100) : 0;
  const fmtPct = v => (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%';
  const corEmp = pctLucroEmpenhado >= 0 ? 'var(--warning)' : 'var(--danger)';

  g('sum-empenhos').innerHTML=
    '<div class="card"><div class="card-label">Empenhos</div><div class="card-value cv-blue">'+a.length+'</div></div>'+
    '<div class="card"><div class="card-label">Total Empenhado</div><div class="card-value">'+fmt(te)+'</div></div>'+
    '<div class="card"><div class="card-label">Total Comprado</div><div class="card-value cv-yellow">'+fmt(totalComprado)+'</div></div>'+
    '<div class="card" style="border-left:3px solid var(--warning);"><div class="card-label">Lucro Empenhado</div><div class="card-value cv-yellow">'+fmt(lucroEmpenhado)+'</div></div>'+
    '<div class="card" style="border-left:3px solid '+corEmp+';"><div class="card-label">% Lucro Empenhado</div><div class="card-value" style="color:'+corEmp+';">'+fmtPct(pctLucroEmpenhado)+'</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:3px;">lucro empenhado / total comprado</div></div>';

  // "A receber": empenhos ainda não pagos
  // "A receber" = soma do campo rec das compras ainda não pagas
  const aReceber = a.reduce((s,r) =>
    s + (r.compras||[]).filter(c => !c.dpag || c.dpag === '').reduce((ss,c) => ss + (c.rec||0), 0)
  , 0);

  // Adiciona card "A Receber"
  g('sum-empenhos').innerHTML +=
    '<div class="card" style="border-left:3px solid var(--purple);"><div class="card-label">⏳ A Receber</div><div class="card-value" style="color:var(--purple);">'+fmt(aReceber)+'</div></div>';

  // Update tfoot empenhos
  // Os totais do rodapé devem refletir exatamente os registros exibidos na tela.
  // Na visão agrupada, as colunas exibidas são: Empenho, Val. Empenho, Valor Compra, Lucro, A Receber e Dias.
  const tfRowE = document.getElementById('tfoot-empenhos-row');
  if (tfRowE && a.length > 0 && _agrupado) {
    const totalValorEmpenhoTela = a.reduce((s, r) => s + (r.vem || 0), 0);
    const totalValorCompraTela = a.reduce((s, r) => {
      const compras = r.compras || [];
      const vals = eVals(r);
      return s + (compras.length ? compras.reduce((ss, c) => ss + (c.vtotal || 0), 0) : vals.tot);
    }, 0);
    const totalLucroTela = a.reduce((s, r) => {
      const compras = r.compras || [];
      const vals = eVals(r);
      return s + (compras.length ? compras.reduce((ss, c) => ss + (c.luc || 0), 0) : vals.luc);
    }, 0);
    const totalAReceberTela = a.reduce((s, r) => {
      const compras = r.compras || [];
      const vals = eVals(r);
      return s + (compras.length ? compras.filter(c => !c.dpag || c.dpag === '').reduce((ss, c) => ss + (c.rec || 0), 0) : vals.rec);
    }, 0);

    tfRowE.style.display = '';
    tfRowE.innerHTML = `
      <td style="text-align:right;padding:10px 12px;color:var(--text-tertiary);font-size:10px;text-transform:uppercase;letter-spacing:0.3px;background:var(--bg-surface-soft);">TOTAIS</td>
      <td class="mono" style="text-align:right;color:var(--accent);font-weight:800;background:var(--bg-surface-soft);" id="tfoot-e-vem">${fmt(totalValorEmpenhoTela)}</td>
      <td class="mono" style="text-align:right;color:var(--text-secondary);font-weight:800;background:var(--bg-surface-soft);" id="tfoot-e-compra">${fmt(totalValorCompraTela)}</td>
      <td class="mono" style="text-align:right;color:${totalLucroTela >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:800;background:var(--bg-surface-soft);" id="tfoot-e-lucro">${fmt(totalLucroTela)}</td>
      <td class="mono" style="text-align:right;color:var(--warning);font-weight:800;background:var(--bg-surface-soft);" id="tfoot-e-areceber">${fmt(totalAReceberTela)}</td>
      <td style="background:var(--bg-surface-soft);"></td>
    `;
  } else if (tfRowE) {
    // Na visão simples essas colunas financeiras não são exibidas; por isso o rodapé fica oculto para evitar uma linha vazia.
    tfRowE.style.display = 'none';
    tfRowE.innerHTML = '';
  }
}

