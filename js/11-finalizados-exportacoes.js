// ===== FILTRO DE MÊS/ANO DISPUTAS =====
function popularFiltroMes() {
  const sel = g('filtro-mes-disputas');
  if (!sel) return;
  const meses = new Set();
  DB.disputas.forEach(d => { if (d.data) meses.add(d.data.slice(0,7)); });
  const sorted = [...meses].sort().reverse();
  sel.innerHTML = '<option value="todos">Todos</option>' +
    sorted.map(m => {
      const [y, mo] = m.split('-');
      const nome = new Date(y, parseInt(mo)-1).toLocaleString('pt-BR',{month:'short',year:'numeric'});
      return `<option value="${m}">${nome}</option>`;
    }).join('');
}
let filtroMesDisputas = 'todos';

// ===== FILTRO MÊS/ANO PAGAMENTO — EMP. FINALIZADOS =====
function popularFiltroMesPagEmpFin() {
  const sel = g('filtro-mes-pag-emp-fin');
  if (!sel) return;
  const cur = sel.value;
  const meses = new Set();
  DB.empenhos.forEach(e => {
    if (!e.finalizado) return;
    (e.compras||[]).forEach(c => { if (c.dpag) meses.add(c.dpag.slice(0,7)); });
  });
  const sorted = [...meses].sort().reverse();
  sel.innerHTML = '<option value="todos">Todos</option>' +
    sorted.map(m => {
      const [y, mo] = m.split('-');
      const nome = new Date(y, parseInt(mo)-1).toLocaleString('pt-BR',{month:'long',year:'numeric'});
      return `<option value="${m}"${cur===m?' selected':''}>${nome.charAt(0).toUpperCase()+nome.slice(1)}</option>`;
    }).join('');
}

// ===== FILTRO MÊS/ANO FINALIZAÇÃO — DISPUTAS FINALIZADAS =====
function popularFiltroMesFinalizadas() {
  const sel = g('filtro-mes-finalizadas');
  if (!sel) return;
  const cur = sel.value;
  const meses = new Set();
  DB.disputas.forEach(d => { if (d.finalizada && d.dataFinalizacao) meses.add(d.dataFinalizacao.slice(0,7)); });
  const sorted = [...meses].sort().reverse();
  sel.innerHTML = '<option value="todos">Todos</option>' +
    sorted.map(m => {
      const [y, mo] = m.split('-');
      const nome = new Date(y, parseInt(mo)-1).toLocaleString('pt-BR',{month:'long',year:'numeric'});
      return `<option value="${m}"${cur===m?' selected':''}>${nome.charAt(0).toUpperCase()+nome.slice(1)}</option>`;
    }).join('');
}

function renderFinalizadas() {
  popularFiltroMesFinalizadas();
  const q = (g('search-finalizadas')?.value || '').toLowerCase();
  const analistaFin = g('filtro-analista-finalizadas')?.value || 'todos';
  const mesFin = g('filtro-mes-finalizadas')?.value || 'todos';
  const rows = DB.disputas.filter(d => {
    if (!d.finalizada) return false;
    if (analistaFin !== 'todos' && d.analista !== analistaFin) return false;
    if (mesFin !== 'todos') {
      const anoMes = (d.dataFinalizacao||'').substring(0,7);
      if (anoMes !== mesFin) return false;
    }
    if (!q) return true;
    return (d.orgao||'').toLowerCase().includes(q) || (d.processo||'').toLowerCase().includes(q) || (d.estado||'').toLowerCase().includes(q);
  }).sort((a,b) => (b.dataFinalizacao||'').localeCompare(a.dataFinalizacao||''));

  const tb = g('tbody-finalizadas');
  if (!rows.length) {
    tb.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">✅</div><p>Nenhum contrato finalizado</p></div></td></tr>';
    sumFinalizadas(rows);
    return;
  }
  tb.innerHTML = rows.map((r, idx) => {
    const contrato = getValorContrato(r);
    const emps = _empenhosDaDisputa(r.id);
    const lucroRec = emps.reduce((s,e) =>
      s + (e.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=> {
        const luc = (c.luc!==undefined&&c.luc!==null) ? c.luc : (c.rec||0)-(c.vtotal||0)-(c.custo||0);
        return ss+luc;
      },0), 0);
    const zebraTd = idx % 2 === 1 ? 'background:var(--bg-surface-soft);' : 'background:var(--bg-surface);';
    return '<tr style="cursor:pointer;" onclick="abrirPopupDisputa(\'' + r.id + '\')">' +
      '<td class="mono" style="font-size:11px;' + zebraTd + '">' + fmtD(r.data) + '</td>' +
      '<td style="' + zebraTd + '"><div style="font-weight:600;font-size:13px;">' + (r.orgao||'—') + '</div><span class="estado-badge" style="font-size:9px;">' + (r.estado||'—') + '</span></td>' +
      '<td style="' + zebraTd + '"><span class="badge ' + (_badgeClass(r.analista)) + '" style="font-size:10px;">' + (r.analista||'—') + '</span></td>' +
      '<td style="' + zebraTd + '"><span style="font-size:11px;padding:2px 7px;border-radius:10px;font-weight:700;background:' + (r.empresa==='Hamate'?'#7c3aed20':'var(--accent)20') + ';color:' + (r.empresa==='Hamate'?'#7c3aed':'var(--accent)') + ';">' + (r.empresa||'—') + '</span></td>' +
      
      '<td class="mono" style="color:var(--success);font-weight:600;' + zebraTd + '">' + fmt(lucroRec) + '</td>' +
      '<td class="mono" style="font-size:11px;color:var(--text-tertiary);' + zebraTd + '">' + fmtD(r.dataFinalizacao) + '</td>' +
      '</tr>';
  }).join('');
  sumFinalizadas(rows);
}

function sumFinalizadas(rows) {
  const tv = rows.reduce((s,r) => s + getValorContrato(r), 0);
  const lucroTotal = rows.reduce((s,r) => {
    const emps = _empenhosDaDisputa(r.id);
    return s + emps.reduce((s2,e) =>
      s2 + (e.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
        const luc = (c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
        return ss+luc;
      },0), 0);
  }, 0);
  const el = g('sum-finalizadas');
  if (el) el.innerHTML =
    '<div class="card"><div class="card-label">Finalizadas</div><div class="card-value cv-green">' + rows.length + '</div></div>' +
    '<div class="card"><div class="card-label">Valor Contratado</div><div class="card-value cv-blue">' + fmt(tv) + '</div></div>' +
    '<div class="card"><div class="card-label">Lucro Recebido</div><div class="card-value cv-green">' + fmt(lucroTotal) + '</div></div>';
}

// ========== EMPENHOS FINALIZADOS ==========
function _doFinalizarEmpenho(id) {
  const e = DB.empenhos.find(x => x.id === id); if (!e) return;
  e.finalizado = true; e._manualFinalizado = true;
  e.dataFinalizacao = e.dataFinalizacao || new Date().toISOString().slice(0,10);
  if (e.disputaId) verificarAutoFinalizarDisputa(e.disputaId);
  save('empenhos', DB.empenhos); renderActive(); toast('Empenho finalizado! ✅', 'success');
}
function _doReabrirEmpenho(id) {
  const e = DB.empenhos.find(x => x.id === id); if (!e) return;
  e.finalizado = false; e._manualFinalizado = false; e.dataFinalizacao = null;
  // Limpa apenas dpag para evitar re-finalização automática; rec preservado
  (e.compras||[]).forEach(c => { c.dpag = ''; });
  if (e.disputaId) { const d = DB.disputas.find(x => x.id === e.disputaId); if (d && d.finalizada) { d.finalizada = false; d.dataFinalizacao = null; d.finalizadaAuto = false; } }
  save('empenhos', DB.empenhos); renderActive(); toast('Empenho reaberto! Data de pagamento limpa, valores preservados.', 'info');
}
function finalizarEmpenho(id) {
  const e = DB.empenhos.find(x => x.id === id); if (!e) return;
  const compras = e.compras || [];

  if (compras.length === 0) {
    toast('<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Cadastre ao menos uma compra antes de finalizar o empenho.', 'error');
    return;
  }

  const semDpag     = compras.filter(c => !c.dpag || c.dpag === '');
  const semRecebido = compras.filter(c => !c.recebido || c.recebido <= 0);
  const problemas   = [];
  if (semDpag.length     > 0) problemas.push(`${semDpag.length} compra(s) sem <strong>data de pagamento</strong>`);
  if (semRecebido.length > 0) problemas.push(`${semRecebido.length} compra(s) sem <strong>valor recebido</strong>`);

  if (problemas.length > 0) {
    // Encontra a primeira compra pendente (sem dpag ou sem recebido) para abrir direto na edição
    const primeiraPendente = compras.find(c => !c.dpag || c.dpag === '' || !c.recebido || c.recebido <= 0);
    _confirmarAcao({
      icon: '⚠️',
      titulo: 'Empenho incompleto',
      msg: `Não é possível finalizar o empenho <strong>${e.num||id}</strong>.<br><br>
Pendências encontradas:<br>• ${problemas.join('<br>• ')}<br><br>
Edite as compras e informe a data de pagamento e o valor recebido antes de finalizar.`,
      btnLabel: 'Editar compras',
      btnClass: 'btn-primary',
      onConfirm: () => {
        fecharPopup('empenho');
        fecharPopup('disputa');
        if (primeiraPendente) {
          // Abre direto na edição da compra pendente
          abrirCompra(id, primeiraPendente.id);
        } else {
          abrirCompra(id);
        }
      }
    });
    return;
  }

  _confirmarAcao({icon:'📦', titulo:'Finalizar empenho', msg:`Finalizar o empenho <strong>${e.num||id}</strong>?<br>Ele será movido para a aba Emp. Finalizados.`, btnLabel:'📦 Finalizar', btnClass:'btn-success', onConfirm: () => { _doFinalizarEmpenho(id); }});
}

function reabrirEmpenho(id) {
  const e = DB.empenhos.find(x => x.id === id); if (!e) return;
  _confirmarAcao({icon:'↩️', titulo:'Reabrir empenho', msg:`Reabrir o empenho <strong>${e.num||id}</strong>?<br>Ele voltará para a aba Empenhos.`, btnLabel:'Reabrir', btnClass:'btn-ghost', onConfirm: () => { _doReabrirEmpenho(id); }});
}

let _agrupadoFin = false;

function toggleAgrupamentoFin() {
  _agrupadoFin = !_agrupadoFin;
  const btn = g('btn-agrupar-orgao-fin');
  if (btn) { btn.style.background = _agrupadoFin ? 'var(--accent)' : ''; btn.style.color = _agrupadoFin ? '#fff' : ''; }
  renderEmpFinalizados();
}

function renderEmpFinalizados() {
  popularFiltroMesPagEmpFin();
  const q = (g('search-emp-finalizados')?.value || '').toLowerCase();
  const analista = g('filtro-analista-emp-fin')?.value || 'todos';
  const mesPag = g('filtro-mes-pag-emp-fin')?.value || 'todos';

  // Helper: retorna a data de pagamento mais recente das compras do empenho
  function getDataPagamento(e) {
    const datas = (e.compras||[]).map(c => c.dpag||'').filter(d => d !== '').sort();
    return datas.length ? datas[datas.length - 1] : '';
  }

  const rows = DB.empenhos.filter(e => {
    if (!e.finalizado) return false;
    if (analista !== 'todos' && e.analista !== analista) return false;
    if (mesPag !== 'todos') {
      const dp = getDataPagamento(e);
      const anoMes = dp.substring(0,7);
      if (anoMes !== mesPag) return false;
    }
    if (!q) return true;
    return (e.num||'').toLowerCase().includes(q) || (e.orgao||'').toLowerCase().includes(q);
  }).sort((a,b) => (getDataPagamento(b)||'').localeCompare(getDataPagamento(a)||''));

  const tb = g('tbody-emp-finalizados');
  if (!tb) return;
  if (!rows.length) {
    tb.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="icon">📦</div><p>Nenhum empenho finalizado</p></div></td></tr>';
    sumEmpFinalizados(rows);
    return;
  }

  if (_agrupadoFin) {
    const grupos = {};
    rows.forEach(r => {
      const org = r.orgao || '—';
      if (!grupos[org]) grupos[org] = { empenhos: [], totalVem: 0, analistas: new Set() };
      grupos[org].empenhos.push(r);
      grupos[org].totalVem += r.vem || 0;
      if (r.analista) grupos[org].analistas.add(r.analista);
    });

    const sorted = Object.entries(grupos).sort((a,b)=>b[1].totalVem-a[1].totalVem);
    tb.innerHTML = sorted.map(([org, g_]) => {
      const analistasHTML = [...g_.analistas].map(nome =>
        `<span class="badge ${_badgeClass(nome)}" style="font-size:10px;margin-left:6px;">${nome}</span>`
      ).join('');

      const linhasEmp = g_.empenhos.map((r, idx) => {
        const lucroRec = (r.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
          const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0); return ss+luc;
        },0);
        const dpagDatas = (r.compras||[]).map(c=>c.dpag||'').filter(d=>d!=='').sort();
        const dpagExib = dpagDatas.length ? dpagDatas[dpagDatas.length-1] : '';
        const zebraFinTd = idx % 2 === 1 ? 'background:var(--bg-surface-soft);' : 'background:var(--bg-surface);';
        return `<tr style="cursor:pointer;" onclick="abrirPopupEmpenho('${r.id}')">
          <td class="mono hi" style="font-size:11px;font-weight:600;padding-left:20px;${zebraFinTd}">${r.num||'—'}</td>
          <td style="${zebraFinTd}"></td>
          <td style="${zebraFinTd}"></td>
          <td class="mono" style="color:var(--success);font-weight:600;${zebraFinTd}">${fmt(lucroRec)}</td>
          <td class="mono" style="font-size:11px;color:var(--text-tertiary);${zebraFinTd}">${fmtD(dpagExib)}</td>
          </tr>`;
      }).join('');

      return `<tr style="background:var(--bg-inset);">
        <td colspan="5" style="padding:8px 12px;">
          <div style="display:flex;align-items:center;gap:12px;font-weight:700;font-size:13px;">
            <span>🏢 ${org}${analistasHTML}</span>
            <span style="font-size:11px;color:var(--text-tertiary);">${g_.empenhos.length} empenho(s)</span>
          </div>
        </td></tr>${linhasEmp}`;
    }).join('');
  } else {
    tb.innerHTML = rows.map(r => {
      const lucroRec = (r.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
        const luc = (c.luc!==undefined&&c.luc!==null) ? c.luc : (c.rec||0)-(c.vtotal||0)-(c.custo||0);
        return ss+luc;
      },0);
      const dpagDatas = (r.compras||[]).map(c=>c.dpag||'').filter(d=>d!=='').sort();
      const dpagExib = dpagDatas.length ? dpagDatas[dpagDatas.length-1] : '';
      return '<tr style="cursor:pointer;" onclick="abrirPopupEmpenho(\'' + r.id + '\')">' +
        '<td class="mono hi" style="font-size:11px;font-weight:600;">' + (r.num||'—') + '</td>' +
        '<td style="font-size:12px;">' + (r.orgao||'—') + '</td>' +
        '<td><span class="badge ' + (_badgeClass(r.analista)) + '" style="font-size:10px;">' + (r.analista||'—') + '</span></td>' +
        
        '<td class="mono" style="color:var(--success);font-weight:600;">' + fmt(lucroRec) + '</td>' +
        '<td class="mono" style="font-size:11px;color:var(--text-tertiary);">' + fmtD(dpagExib) + '</td>' +
        '</tr>';
    }).join('');
  }
  sumEmpFinalizados(rows);
}

function sumEmpFinalizados(rows) {
  const tv = rows.reduce((s,r) => s + (r.vem||0), 0);
  const totalComprado = rows.reduce((s,r) => s + (r.compras||[]).reduce((ss,c) => ss + (c.vtotal||0), 0), 0);
  const lucroTotal = rows.reduce((s,r) => s + (r.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
    const luc = (c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
    return ss+luc;
  },0), 0);
  const pct = totalComprado > 0 ? (lucroTotal / totalComprado * 100) : 0;
  const cor = pct >= 0 ? 'var(--success)' : 'var(--danger)';
  const fmtPct = v => (v >= 0 ? '+' : '') + v.toFixed(1).replace('.', ',') + '%';
  const el = g('sum-emp-finalizados');
  if (el) el.innerHTML =
    '<div class="card"><div class="card-label">Finalizados</div><div class="card-value cv-purple">' + rows.length + '</div></div>' +
    '<div class="card"><div class="card-label">Total Empenhado</div><div class="card-value cv-blue">' + fmt(tv) + '</div></div>' +
    '<div class="card"><div class="card-label">Total Comprado</div><div class="card-value cv-yellow">' + fmt(totalComprado) + '</div></div>' +
    '<div class="card"><div class="card-label">Lucro Total</div><div class="card-value cv-green">' + fmt(lucroTotal) + '</div></div>' +
    '<div class="card" style="border-left:3px solid '+cor+';"><div class="card-label">% Lucro</div><div class="card-value" style="color:'+cor+';">' + fmtPct(pct) + '</div><div style="font-size:10px;color:var(--text-tertiary);margin-top:3px;">lucro total / total comprado</div></div>';
}

// ========== EXPORTAR COMPRAS SELECIONADAS ==========
function toggleTodasCompras(empId, checked) {
  document.querySelectorAll('.chk-compra-' + empId).forEach(chk => chk.checked = checked);
}

function exportarComprasSelecionadas(empId) {
  const emp = DB.empenhos.find(x => x.id === empId);
  if (!emp) return;

  const selecionados = [...document.querySelectorAll('.chk-compra-' + empId + ':checked')].map(c => c.dataset.cid);
  if (!selecionados.length) { toast('Selecione ao menos uma compra!', 'error'); return; }

  const itensRaw = emp.itens && emp.itens.length ? emp.itens :
    (emp.loteId ? [{ id:'leg1', loteId:emp.loteId, descricao:emp.produto||'', qtd:emp.qtd||1, vunit:emp.vunit||0 }] : []);
  const disp = emp.disputaId ? DB.disputas.find(d => d.id === emp.disputaId) : null;
  const itens = itensRaw.map(item => {
    const loteAtual = disp ? (disp.lotes||[]).find(l => l.id === item.loteId) : null;
    return loteAtual ? { ...item, descricao: loteAtual.descricao } : item;
  });

  const comprasSel = (emp.compras||[]).filter(c => selecionados.includes(c.id));

  const cidade = (emp.orgao || 'Empenho').replace(/[/\\?%*:|"<>]/g, '-');
  const hoje = new Date().toISOString().slice(0,10);
  const nomeArquivo = cidade + ' - ' + hoje + '.xlsx';

  // FIX 10: cabeçalho inclui dados do empenho e disputa
  const cabecalho = ['Nº Empenho', 'Órgão', 'Data Empenho', 'Produto', 'Quantidade', 'Valor Compra (R$)', 'Custo (R$)', 'Lucro (R$)', 'Recebido (R$)', 'Dt. Pagamento', 'Plataforma'];
  const linhas = comprasSel.map(c => {
    const itemRef = itens.find(i => i.id === c.itemId);
    return [
      emp.num || '—',
      emp.orgao || '—',
      fmtD(emp.data),
      (itemRef?.descricao || '—').toUpperCase(),
      c.qtd || 0,
      c.vtotal || 0,
      c.custo || 0,
      c.luc || 0,
      c.rec || 0,
      c.dpag ? fmtD(c.dpag) : '—',
      c.plataforma || '—'
    ];
  });

  // Substitui texto da plataforma pela URL (Excel reconhece como hiperlink azul/sublinhado)
  const linhasComLink = comprasSel.map((c, i) => {
    const row = [...linhas[i]];
    if (c.link) row[10] = c.link;
    return row;
  });

  const wb = XLSX.utils.book_new();
  const tituloExport = (emp.num ? 'Empenho ' + emp.num + ' · ' : '') + cidade.toUpperCase();
  const ws = XLSX.utils.aoa_to_sheet([[tituloExport]]);
  ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:10} }];
  XLSX.utils.sheet_add_aoa(ws, [[], cabecalho, ...linhasComLink], { origin: 'A2' });

  // Centralizar todas as células preenchidas
  Object.keys(ws).filter(k => !k.startsWith('!')).forEach(ref => {
    if (!ws[ref].s) ws[ref].s = {};
    ws[ref].s.alignment = { horizontal: 'center', vertical: 'center' };
  });

  ws['!cols'] = [{wch:14},{wch:30},{wch:14},{wch:35},{wch:12},{wch:18},{wch:15},{wch:15},{wch:18},{wch:14},{wch:35}];

  XLSX.utils.book_append_sheet(wb, ws, 'Compras');
  XLSX.writeFile(wb, nomeArquivo, { cellStyles: true });
  toast('Excel exportado: ' + nomeArquivo + ' ✅', 'success');
}

// ========== EXPORTAR COMPRAS DA DISPUTA ==========
function toggleTodasComprasDisputa(dispId, checked) {
  document.querySelectorAll('.chk-compra-disp-' + dispId).forEach(chk => chk.checked = checked);
}

function exportarComprasDisputa(dispId) {
  const disp = DB.disputas.find(x => x.id === dispId);
  if (!disp) return;

  const emps = DB.empenhos.filter(e => e.disputaId === dispId);

  const todasCompras = [];
  emps.forEach(e => {
    const itensEmp = (e.itens && e.itens.length ? e.itens :
      (e.loteId ? [{ id:'leg1', loteId:e.loteId, descricao:e.produto||'', qtd:e.qtd||1, vunit:e.vunit||0 }] : []))
      .map(item => {
        const loteAtual = (disp.lotes||[]).find(l => l.id === item.loteId);
        return loteAtual ? { ...item, descricao: loteAtual.descricao } : item;
      });
    (e.compras||[]).forEach(c => {
      const itemRef = itensEmp.find(i => i.id === c.itemId);
      todasCompras.push({ ...c, _empNum: e.num||'—', _produto: (itemRef?.descricao||e.produto||'—').toUpperCase() });
    });
  });

  const selecionados = [...document.querySelectorAll('.chk-compra-disp-' + dispId + ':checked')].map(c => c.dataset.cid);
  if (!selecionados.length) { toast('Selecione ao menos uma compra!', 'error'); return; }

  const comprasSel = todasCompras.filter(c => selecionados.includes(c.id));

  const cidade = (disp.orgao || 'Contrato').replace(/[/\\?%*:|"<>]/g, '-');
  const hoje = new Date().toISOString().slice(0,10);
  const nomeArquivo = cidade + ' - ' + hoje + '.xlsx';

  // Cabeçalho sem coluna separada de link (plataforma já será o hiperlink)
  const cabecalho = ['Nº Empenho', 'Produto', 'Quantidade', 'Valor Compra (R$)', 'Custo (R$)', 'Lucro (R$)', 'A Receber (R$)', 'Plataforma'];

  const linhas = comprasSel.map(c => [
    '#' + c._empNum,
    c._produto,
    c.qtd || 0,
    c.vtotal || 0,
    c.custo || 0,
    c.luc || 0,
    c.rec || 0,
    c.plataforma || '—'
  ]);

  const totalVtotal = comprasSel.reduce((s,c) => s + (c.vtotal||0), 0);
  const totalCusto  = comprasSel.reduce((s,c) => s + (c.custo||0), 0);
  const totalLuc    = comprasSel.reduce((s,c) => s + (c.luc||0), 0);
  const totalRec    = comprasSel.reduce((s,c) => s + (c.rec||0), 0);
  const linhaTotais = ['', 'TOTAL', comprasSel.reduce((s,c)=>s+(c.qtd||0),0), totalVtotal, totalCusto, totalLuc, totalRec, ''];

  // Substitui texto da plataforma pela URL (Excel reconhece como hiperlink azul/sublinhado)
  const linhasComLink = comprasSel.map((c, i) => {
    const row = [...linhas[i]];
    if (c.link) row[7] = c.link;
    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([[cidade.toUpperCase()]]);
  ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:7} }];
  XLSX.utils.sheet_add_aoa(ws, [[], cabecalho, ...linhasComLink, [], linhaTotais], { origin: 'A2' });

  // Centralizar todas as células preenchidas
  Object.keys(ws).filter(k => !k.startsWith('!')).forEach(ref => {
    if (!ws[ref].s) ws[ref].s = {};
    ws[ref].s.alignment = { horizontal: 'center', vertical: 'center' };
  });

  ws['!cols'] = [{wch:14},{wch:35},{wch:12},{wch:18},{wch:15},{wch:15},{wch:18},{wch:35}];

  XLSX.utils.book_append_sheet(wb, ws, 'Compras');
  XLSX.writeFile(wb, nomeArquivo, { cellStyles: true });
  toast('Excel exportado: ' + nomeArquivo + ' ✅', 'success');
}

// ========== ARQUIVOS PDF (visualização simples, upload removido) ==========
// ══════════════════════════════════════════
//   SUPABASE — Upload PDF do Empenho
// ══════════════════════════════════════════

function baixarContrato(url, nome) {
  if (url) window.open(url, '_blank');
}
function baixarProposta(id) {
  const r = DB.disputas.find(x => x.id === id);
  if (r && r.propostaUrl) window.open(r.propostaUrl, '_blank');
}
function carregarContratoDisputa(r) {
  const urlEl = g('d-contrato-url'); if (urlEl) urlEl.value = r.contratoUrl || '';
  const nomeEl = g('d-contrato-nome'); if (nomeEl) nomeEl.value = r.contratoNome || '';
  const dataEl = g('d-contrato-data'); if (dataEl) dataEl.value = r.contratoData || '';
  const vencEl = g('d-contrato-vencimento'); if (vencEl) vencEl.value = r.contratoVencimento || '';
}

function calcVencimentoContrato() {
  const dataVal = g('d-contrato-data')?.value;
  const vencField = g('d-contrato-vencimento');
  if (!dataVal || !vencField) return;
  // Só calcula automaticamente se o campo de vencimento estiver vazio
  if (!vencField.value) {
    // Parseia YYYY-MM-DD manualmente para evitar problemas de fuso horário
    const [ano, mes, dia] = dataVal.split('-').map(Number);
    const m = String(mes).padStart(2,'0');
    const d = String(dia).padStart(2,'0');
    vencField.value = (ano + 1) + '-' + m + '-' + d;
  }
  atualizarCorVencimento();
}

function atualizarCorVencimento() {
  const vencField = g('d-contrato-vencimento');
  if (!vencField || !vencField.value) return;
  const venc = new Date(vencField.value + 'T12:00');
  const hoje = new Date();
  const diffDias = Math.floor((venc - hoje) / 86400000);
  vencField.style.color = diffDias < 0 ? 'var(--danger)' : diffDias <= 30 ? 'var(--warning)' : 'var(--success)';
  vencField.style.fontWeight = '700';
}
// ========== ABRIR NOVO EMPENHO COM ITEM PRÉ-PREENCHIDO ==========
function novoEmpenhoComItem(disputaId, loteId) {
  fecharPopup('disputa');
  EID['empenhos'] = null;
  clearE();
  lotesSelecionados = {};
  const wrap = g('lote-selector-wrap'); if(wrap) wrap.style.display = 'none';
  g('ttl-empenhos').textContent = 'Novo Empenho';
  g('e-data').value = today();
  populateDisputaSelect(disputaId);
  // Pré-preenche e bloqueia analista para não-admins
  if (!isAdmin && analistaDoUsuario) {
    setAnalistaSelect('e-analista', analistaDoUsuario);
    const sel = g('e-analista'); if (sel) sel.disabled = true;
  }
  g('modal-empenhos').classList.add('open');
  // Após o modal abrir, seleciona o lote automaticamente
  setTimeout(() => {
    const card = g('lcard-' + loteId);
    if (card && !card.classList.contains('sem-saldo')) {
      if (!card.classList.contains('selected')) toggleLoteCard(card);
      // Define quantidade máxima
      const maxQtd = +card.dataset.maxqtd || 1;
      const qtdInput = g('lqtd-' + loteId);
      if (qtdInput) { qtdInput.value = maxQtd; atualizarVemPorLoteEl(qtdInput); }
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 120);
}

