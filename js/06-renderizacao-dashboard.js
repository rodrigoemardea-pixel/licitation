// === PASSO 1: Reconciliação de finalização (caminho frio) ===
function reconciliarFinalizacoes() {
  DB.empenhos.forEach(e => {
    if (empenhoEstaPago(e)) {
      const disp = e.disputaId ? DB.disputas.find(d => d.id === e.disputaId) : null;
      const itensEmp = (e.itens && e.itens.length) ? e.itens : [];
      const qtdOk = itensEmp.length === 0 || itensEmp.every(item => {
        const lote = disp ? (disp.lotes||[]).find(l => l.id === item.loteId) : null;
        const qtdContratada = item.qtd || (lote ? lote.qtd : 0) || 0;
        const qtdComprada = (e.compras||[]).filter(c => c.itemId === item.id).reduce((s,c) => s + (c.qtd||0), 0);
        return qtdContratada === 0 || qtdComprada >= qtdContratada;
      });
      if (qtdOk && !e.finalizado) {
        e.finalizado = true;
        e.dataFinalizacao = e.dataFinalizacao || new Date().toISOString().slice(0,10);
      }
    }
  });
  DB.disputas.forEach(d => { if (!d.finalizada || d.finalizadaAuto) verificarAutoFinalizarDisputa(d.id); });
}

// === PASSO 1: Renderizações leves ===
function renderShell() {
  updateBadges();
  updateHeader();
  popularFiltroMes();
  atualizarNotificacoes();
}

// === PASSO 1: Renderiza apenas a aba visível ===
function renderActive() {
  renderShell();
  switch (_activeTab) {
    case 'painel':           atualizarPainel(); break;
    case 'dashboard':        atualizarDashboard(); break;
    case 'disputas':         renderD(); break;
    case 'empenhos':         renderE(); break;
    case 'finalizadas':      renderFinalizadas(); break;
    case 'emp-finalizados':  renderEmpFinalizados(); break;
    case 'acompanhamentos':  renderAcomp(); break;
  }
}

// === PASSO 1: renderAll completo - usado em boot/import ===
function renderAll(){
  reconciliarFinalizacoes();
  renderD();
  renderE();
  renderEmpFinalizados();
  renderFinalizadas();
  renderShell();
  if (_activeTab === 'painel') atualizarPainel();
  if (_activeTab === 'dashboard') atualizarDashboard();
  if (_activeTab === 'acompanhamentos') renderAcomp();
}

function updateBadges(){ 
  const _finQtd = DB.disputas.filter(d=>d.finalizada).length;
  const _ativasQtd = DB.disputas.filter(d=>!d.finalizada).length;
  const _empFinQtd = DB.empenhos.filter(e=>e.finalizado).length;
  const _empAtivosQtd = DB.empenhos.filter(e=>!e.finalizado).length;
  const _acompQtd = (DB.acomp||[]).filter(r=>r.status==='pendente'||r.status==='recurso').length;
  const _acompVencidos = (DB.acomp||[]).filter(r=>r.retorno && new Date(r.retorno)<new Date()).length;
  g('badge-disputas').textContent = _ativasQtd;
  g('badge-empenhos').textContent = _empAtivosQtd;
  const _badgeFin = g('badge-finalizadas'); if(_badgeFin) _badgeFin.textContent = _finQtd; 
  const _badgeEmpFin = g('badge-emp-finalizados'); if(_badgeEmpFin) _badgeEmpFin.textContent = _empFinQtd;
  const _badgeAcomp = g('badge-acomp'); 
  if (_badgeAcomp) { 
    _badgeAcomp.textContent = _acompQtd;
    _badgeAcomp.style.background = _acompVencidos > 0 ? 'var(--danger)' : 'var(--warning)';
    _badgeAcomp.style.color = '#fff';
  }
}

function updateHeader(){ /* header stats removido */ }

function verificarAlertas() {
  const empenhosSemPagamento = DB.empenhos.filter(r => {
    const compras = r.compras || [];
    const todoPago = empenhoEstaPago(r);
    if (todoPago) return false;
    const dias = diasSemPagamento(r);
    return dias >= 60;
  });
  const banner = g('alerta-empenhos-banner');
  const txt = g('alerta-empenhos-txt');
  if (banner && txt) {
    if (empenhosSemPagamento.length > 0) {
      banner.style.display = 'flex';
      txt.textContent = `${empenhosSemPagamento.length} empenho${empenhosSemPagamento.length>1?'s':''} há mais de 60 dias sem recebimento`;
    } else {
      banner.style.display = 'none';
    }
  }

  // Alertas de vencimento de contrato
  const hoje = new Date();
  const contratosVencendo = DB.disputas.filter(d => {
    if (!d.contratoVencimento || d.finalizada) return false;
    const vs = d.contratoVencimento;
    const venc = vs.includes('/') ? new Date(vs.split('/').reverse().join('-')+'T12:00') : new Date(vs+'T12:00');
    if (isNaN(venc.getTime())) return false;
    const dias = Math.floor((venc - hoje) / 86400000);
    return dias <= 60; // vence em até 60 dias ou já venceu
  });
  const bannerContrato = g('alerta-contratos-banner');
  const txtContrato = g('alerta-contratos-txt');
  if (bannerContrato && txtContrato) {
    if (contratosVencendo.length > 0) {
      bannerContrato.style.display = 'flex';
      const vencidos = contratosVencendo.filter(d => {
        const parts = d.contratoVencimento.split('/');
        const venc = new Date(parts[2]+'-'+parts[1]+'-'+parts[0]+'T12:00');
        return venc < hoje;
      });
      txtContrato.textContent = vencidos.length > 0
        ? `${vencidos.length} contrato(s) VENCIDO(S) e ${contratosVencendo.length - vencidos.length} vencendo em breve`
        : `${contratosVencendo.length} contrato(s) vencendo nos próximos 60 dias`;
    } else {
      bannerContrato.style.display = 'none';
    }
  }
}

function filtrarAtraso60() {
  const sel = g('filtro-atraso-empenhos');
  if (sel) sel.value = '60';
  filtrarEmpenhos();
  switchTab('empenhos', document.querySelectorAll('.tab-btn')[2]);
}

// ========== DASHBOARD COMPLETO ==========
function atualizarDashboard() {
  const filtroAn = (g('dash-filtro-analista')?.value) || 'todos';
  const filtroPer = (g('dash-filtro-periodo')?.value) || 'todos';
  const hoje = new Date();
  const mesAtual = hoje.toISOString().substring(0,7);
  const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth()-1, 1).toISOString().substring(0,7);

  // Filtro de período
  const dentroperiodo = (data) => {
    if (filtroPer === 'todos') return true;
    if (!data) return false;
    const d = data.substring(0,7);
    if (filtroPer === 'mes') return d === mesAtual;
    if (filtroPer === 'trim') {
      const limit = new Date(hoje.getFullYear(), hoje.getMonth()-2, 1).toISOString().substring(0,7);
      return d >= limit;
    }
    if (filtroPer === 'ano') return d.substring(0,4) === mesAtual.substring(0,4);
    return true;
  };

  const disputasFiltradas = DB.disputas.filter(r =>
    (filtroAn === 'todos' || r.analista === filtroAn) && dentroperiodo(r.data)
  );
  const empenhosFiltrados = DB.empenhos.filter(r =>
    (filtroAn === 'todos' || r.analista === filtroAn) && dentroperiodo(r.data)
  );

  // KPIs
  const totalRecebido = empenhosFiltrados.reduce((s,r)=>s+(r.recebido||0), 0);
  const totalLucroEmpenhos = empenhosFiltrados.reduce((s,r)=>s+(r.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
    const luc = (c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
    return ss+luc;
  },0), 0);
  const totalEmpenhadoVal = empenhosFiltrados.reduce((s,r)=>s+(r.vem||0), 0);
  const aReceber = totalEmpenhadoVal - totalRecebido;
  const emAtraso = empenhosFiltrados.filter(r=>!empenhoEstaPago(r)&&diasSemPagamento(r)>=60).length;
  const disputasComEmpenho = disputasFiltradas.filter(d => DB.empenhos.some(e=>e.disputaId===d.id)).length;
  const taxaConv = disputasFiltradas.length ? Math.round(disputasComEmpenho/disputasFiltradas.length*100) : 0;

  const setKpi = (id, val) => { const el = g(id); if(el) el.textContent = val; };
  setKpi('dk-contratos', disputasFiltradas.filter(d=>!d.finalizada).length);
  setKpi('dk-empenhos', empenhosFiltrados.filter(e=>!e.finalizado).length);
  setKpi('dk-recebido', fmt(totalRecebido));
  setKpi('dk-lucro', fmt(totalLucroEmpenhos));
  setKpi('dk-conversao', taxaConv + '%');
  setKpi('dk-areceber', fmt(aReceber));
  const atrasoEl = g('dk-atraso');
  if(atrasoEl) atrasoEl.innerHTML = emAtraso > 0
    ? `<span style="color:var(--danger);font-size:22px;font-weight:800;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> ${emAtraso}</span><div style="font-size:11px;color:var(--text-tertiary);">empenhos &gt;60 dias</div>`
    : `<span style="color:var(--success);font-size:22px;font-weight:800;">✓</span><div style="font-size:11px;color:var(--text-tertiary);">tudo em dia</div>`;

  // Tabela urgentes (pendentes >30 dias)
  const urgentes = empenhosFiltrados.filter(r=>!empenhoEstaPago(r)&&diasSemPagamento(r)>=30)
    .sort((a,b)=>diasSemPagamento(b)-diasSemPagamento(a)).slice(0,10);
  const tbU = g('dash-tbody-urgentes');
  if(tbU) tbU.innerHTML = urgentes.length ? urgentes.map(r=>{
    const dias = diasSemPagamento(r);
    const cor = dias>=90?'var(--danger)':dias>=60?'var(--warning)':'var(--text-secondary)';
    return `<tr><td style="padding:7px 8px;font-weight:600;font-family:var(--font-mono);">${r.num||'—'}</td>
      <td style="padding:7px 8px;">${r.orgao||'—'}</td>
      <td style="padding:7px 8px;"><span class="badge ${_badgeClass(r.analista)}" style="font-size:10px;">${r.analista||'—'}</span></td>
      <td style="padding:7px 8px;text-align:right;font-family:var(--font-mono);color:var(--accent);">${fmt(r.vem)}</td>
      <td style="padding:7px 8px;text-align:center;font-weight:700;color:${cor};">${dias}d</td></tr>`;
  }).join('') : '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-tertiary);">✅ Nenhum empenho pendente há mais de 30 dias</td></tr>';

  // Ranking de órgãos
  const orgRank = {};
  disputasFiltradas.forEach(d=>{
    if(!orgRank[d.orgao]) orgRank[d.orgao] = {disputas:0, contrato:0, lucro:0};
    orgRank[d.orgao].disputas++;
    orgRank[d.orgao].contrato += getValorContrato(d);
    const emps = DB.empenhos.filter(e=>e.disputaId===d.id);
    orgRank[d.orgao].lucro += emps.reduce((s,e)=>s+(e.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
      const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
      return ss+luc;
    },0),0);
  });
  const rankTop = Object.entries(orgRank).sort((a,b)=>b[1].contrato-a[1].contrato).slice(0,10);
  const tbR = g('dash-tbody-ranking');
  const medalhas = ['🥇','🥈','🥉'];
  if(tbR) tbR.innerHTML = rankTop.length ? rankTop.map(([org,v],i)=>
    `<tr><td style="padding:7px 8px;font-weight:700;">${medalhas[i]||'#'+(i+1)}</td>
    <td style="padding:7px 8px;">${org}</td>
    <td style="padding:7px 8px;text-align:right;">${v.disputas}</td>
    <td style="padding:7px 8px;text-align:right;font-family:var(--font-mono);color:var(--accent);font-weight:600;">${fmt(v.contrato)}</td>
    <td style="padding:7px 8px;text-align:right;font-family:var(--font-mono);color:var(--success);font-weight:600;">${fmt(v.lucro)}</td></tr>`
  ).join('') : '<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-tertiary);">Nenhum contrato encontrado</td></tr>';

  // ===== VISÃO DE CAIXA =====
  const empPendentes = empenhosFiltrados.filter(e => !e.finalizado && !empenhoEstaPago(e));
  const caixaBands = { b30:[], b60:[], b90:[], b90p:[] };
  empPendentes.forEach(e => {
    const dias = diasSemPagamento(e);
    const aReceber = (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((s,c)=>s+(c.rec||0),0);
    const entry = { e, dias, aReceber };
    if (dias <= 30) caixaBands.b30.push(entry);
    else if (dias <= 60) caixaBands.b60.push(entry);
    else if (dias <= 90) caixaBands.b90.push(entry);
    else caixaBands.b90p.push(entry);
  });
  const sumBand = b => b.reduce((s,x)=>s+x.aReceber,0);
  ['30','60','90','90p'].forEach(k => {
    const band = caixaBands['b'+k];
    const el = g('caixa-'+k); if(el) el.textContent = fmt(sumBand(band));
    const qt = g('caixa-'+k+'-qt'); if(qt) qt.textContent = band.length + ' empenho(s)';
  });
  const allBands = [
    ...caixaBands.b30.map(x=>({...x,faixa:'≤30d',cor:'var(--success)'})),
    ...caixaBands.b60.map(x=>({...x,faixa:'31-60d',cor:'var(--warning)'})),
    ...caixaBands.b90.map(x=>({...x,faixa:'61-90d',cor:'var(--danger)'})),
    ...caixaBands.b90p.map(x=>({...x,faixa:'>90d',cor:'var(--purple)'}))
  ].sort((a,b)=>b.dias-a.dias).slice(0,15);
  const tbC = g('dash-tbody-caixa');
  if(tbC) tbC.innerHTML = allBands.length ? allBands.map(({e,dias,aReceber,faixa,cor})=>
    `<tr style="cursor:pointer;" onclick="abrirPopupEmpenho('${e.id}')">
      <td style="padding:7px 8px;font-weight:600;font-family:monospace;">${e.num||'—'}</td>
      <td style="padding:7px 8px;">${(e.orgao||'—').substring(0,30)}</td>
      <td style="padding:7px 8px;"><span class="badge ${_badgeClass(e.analista)}" style="font-size:10px;">${e.analista||'—'}</span></td>
      <td style="padding:7px 8px;text-align:right;font-weight:700;color:var(--accent);">${fmt(aReceber)}</td>
      <td style="padding:7px 8px;text-align:center;font-weight:700;">${dias}d</td>
      <td style="padding:7px 8px;text-align:center;"><span style="background:${cor};color:#fff;border-radius:12px;padding:2px 8px;font-size:10px;font-weight:700;">${faixa}</span></td>
    </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--text-tertiary);">✅ Nenhum empenho pendente</td></tr>';

  // ===== TOP DEVEDORES =====
  const devedores = {};
  empenhosFiltrados.filter(e=>!e.finalizado&&!empenhoEstaPago(e)).forEach(e=>{
    const org = e.orgao||'?';
    if(!devedores[org]) devedores[org] = { count:0, total:0, maxDias:0 };
    devedores[org].count++;
    devedores[org].total += (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((s,c)=>s+(c.rec||0),0);
    devedores[org].maxDias = Math.max(devedores[org].maxDias, diasSemPagamento(e));
  });
  const topDev = Object.entries(devedores).sort((a,b)=>b[1].total-a[1].total).slice(0,8);
  const tbDev = g('dash-tbody-devedores');
  if(tbDev) tbDev.innerHTML = topDev.length ? topDev.map(([org,v])=>{
    const cor = v.maxDias>=90?'var(--danger)':v.maxDias>=60?'var(--warning)':'var(--text-secondary)';
    return `<tr><td style="padding:7px 8px;">${org.substring(0,28)}</td>
      <td style="padding:7px 8px;text-align:right;">${v.count}</td>
      <td style="padding:7px 8px;text-align:right;font-weight:700;color:var(--accent);">${fmt(v.total)}</td>
      <td style="padding:7px 8px;text-align:center;font-weight:700;color:${cor};">${v.maxDias}d</td></tr>`;
  }).join('') : '<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--text-tertiary);">✅ Nenhum devedor</td></tr>';

  // ===== TAXA DE RECEBIMENTO POR ÓRGÃO =====
  const taxaOrg = {};
  empenhosFiltrados.forEach(e=>{
    const org = e.orgao||'?';
    if(!taxaOrg[org]) taxaOrg[org] = { pagos:0, total:0 };
    taxaOrg[org].total++;
    if(empenhoEstaPago(e)) taxaOrg[org].pagos++;
  });
  const topTaxa = Object.entries(taxaOrg).filter(([,v])=>v.total>=2).sort((a,b)=>b[1].total-a[1].total).slice(0,8);
  const tbTaxa = g('dash-tbody-taxa');
  if(tbTaxa) tbTaxa.innerHTML = topTaxa.length ? topTaxa.map(([org,v])=>{
    const pct = Math.round(v.pagos/v.total*100);
    const cor = pct>=80?'var(--success)':pct>=50?'var(--warning)':'var(--danger)';
    return `<tr><td style="padding:7px 8px;">${org.substring(0,28)}</td>
      <td style="padding:7px 8px;text-align:center;">${v.pagos}</td>
      <td style="padding:7px 8px;text-align:center;">${v.total}</td>
      <td style="padding:7px 8px;text-align:center;">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="flex:1;height:6px;background:var(--bg-inset);border-radius:3px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${cor};border-radius:3px;"></div>
          </div>
          <span style="font-weight:700;color:${cor};font-size:11px;">${pct}%</span>
        </div>
      </td></tr>`;
  }).join('') : '<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--text-tertiary);">Poucos dados ainda</td></tr>';

  const porMes = {};
  empenhosFiltrados.forEach(e => {
    (e.compras||[]).filter(c=>c.dpag&&c.dpag!=='').forEach(c=>{
      const m = (c.dpag||'').substring(0,7);
      if(!m) return;
      if(!porMes[m]) porMes[m] = { rec: 0, luc: 0 };
      porMes[m].rec += c.rec||0;
      const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
      porMes[m].luc += luc;
    });
  });
  const meses = Object.keys(porMes).sort().slice(-12);
  if(graficos.lucroMensal) graficos.lucroMensal.destroy();
  const ctx1 = document.getElementById('grafico-lucro-mensal')?.getContext('2d');
  if(ctx1) graficos.lucroMensal = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: meses.map(m => m.substring(5)+'/'+m.substring(2,4)),
      datasets: [
        { label: 'Recebido', data: meses.map(m=>porMes[m].rec), backgroundColor: 'rgba(37,99,235,0.7)', borderRadius: 4 },
        { label: 'Lucro', data: meses.map(m=>porMes[m].luc), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels:{font:{size:10}} } }, scales: { y: { ticks: { callback: v => 'R$'+v.toLocaleString('pt-BR') } } } }
  });

  // Gráfico 2: Situações disputas
  const situacoes = { 'Ativas': disputasFiltradas.filter(d=>!d.finalizada).length, 'Finalizadas': disputasFiltradas.filter(d=>d.finalizada).length };
  if(graficos.situacoes) graficos.situacoes.destroy();
  const ctx2 = document.getElementById('grafico-situacoes')?.getContext('2d');
  const cores = ['var(--accent)','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];
  if(ctx2) graficos.situacoes = new Chart(ctx2, {
    type: 'doughnut',
    data: { labels: Object.keys(situacoes), datasets: [{ data: Object.values(situacoes), backgroundColor: ['var(--accent)','#10b981'], borderWidth: 2, borderColor: 'var(--bg-surface)' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels:{font:{size:10}, boxWidth:12} } } }
  });

  // Gráfico 3: Top 5 órgãos por lucro
  const orgaos = {};
  empenhosFiltrados.forEach(e => {
    const lucro = (e.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
      const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
      return ss+luc;
    },0);
    orgaos[e.orgao||'?'] = (orgaos[e.orgao||'?']||0) + lucro;
  });
  const top5 = Object.entries(orgaos).sort((a,b)=>b[1]-a[1]).slice(0,5);
  if(graficos.orgaos) graficos.orgaos.destroy();
  const ctx3 = document.getElementById('grafico-orgaos')?.getContext('2d');
  if(ctx3) graficos.orgaos = new Chart(ctx3, {
    type: 'bar',
    data: { labels: top5.map(o=>o[0].substring(0,14)), datasets: [{ data: top5.map(o=>o[1]), backgroundColor: cores, borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: {
      legend:{display:false},
      tooltip:{ callbacks:{ title: (items) => top5[items[0].dataIndex][0], label: (item) => ' R$'+item.raw.toLocaleString('pt-BR',{minimumFractionDigits:2}) } }
    }, scales: { x: { ticks: { callback: v => 'R$'+v.toLocaleString('pt-BR') } } } }
  });

  // Gráfico 4: Performance por analista
  const analistas = {};
  empenhosFiltrados.forEach(e => {
    const lucro = (e.compras||[]).filter(c=>c.dpag&&c.dpag!=='').reduce((ss,c)=>{
      const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
      return ss+luc;
    },0);
    analistas[e.analista||'?'] = (analistas[e.analista||'?']||0) + lucro;
  });
  if(graficos.analistas) graficos.analistas.destroy();
  const ctx4 = document.getElementById('grafico-analistas')?.getContext('2d');
  if(ctx4) graficos.analistas = new Chart(ctx4, {
    type: 'pie',
    data: { labels: Object.keys(analistas), datasets: [{ data: Object.values(analistas), backgroundColor: ['var(--accent)','#10b981','#f59e0b','#8b5cf6'], borderWidth: 2, borderColor: 'var(--bg-surface)' }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels:{font:{size:10}} } } }
  });

  // Gráfico 5: Velocidade de pagamento
  const velOrgao = {};
  empenhosFiltrados.forEach(e => {
    const comprasPagas = (e.compras||[]).filter(c=>c.dpag&&c.dpag!=='');
    if (!comprasPagas.length) return;
    // Usa a última data de compra (dcompra) como referência; cai para data do empenho se não houver
    const dcomprasDatas = comprasPagas.map(c=>c.dcompra).filter(Boolean).sort();
    const dataRef = dcomprasDatas.length ? dcomprasDatas[dcomprasDatas.length - 1] : e.data;
    if (!dataRef) return;
    comprasPagas.forEach(c => {
      const dias = Math.floor((new Date(c.dpag) - new Date(dataRef)) / 86400000);
      if (dias < 0 || dias > 730) return;
      if (!velOrgao[e.orgao||'?']) velOrgao[e.orgao||'?'] = [];
      velOrgao[e.orgao||'?'].push(dias);
    });
  });
  const velMedia = Object.entries(velOrgao).map(([o,ds])=>([o, Math.round(ds.reduce((a,b)=>a+b,0)/ds.length)])).sort((a,b)=>a[1]-b[1]).slice(0,6);
  if(graficos.velocidade) graficos.velocidade.destroy();
  const ctx5 = document.getElementById('grafico-velocidade')?.getContext('2d');
  if(ctx5) graficos.velocidade = new Chart(ctx5, {
    type: 'bar',
    data: { labels: velMedia.map(v=>v[0].substring(0,12)), datasets: [{ label: 'Dias médios', data: velMedia.map(v=>v[1]), backgroundColor: velMedia.map(v=>v[1]<=30?'#10b981':v[1]<=60?'#f59e0b':'#ef4444'), borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins:{
      legend:{display:false},
      tooltip:{ callbacks:{ title: (items) => velMedia[items[0].dataIndex][0], label: (item) => ' '+item.raw+' dias' } }
    }, scales:{ y:{title:{display:true,text:'dias'}} } }
  });

  // Gráfico 6: Comparativo mês atual vs anterior
  const recMes = (m) => empenhosFiltrados.reduce((s,e)=>s+(e.compras||[]).filter(c=>c.dpag&&(c.dpag||'').substring(0,7)===m).reduce((ss,c)=>ss+(c.rec||0),0),0);
  const lucMes = (m) => empenhosFiltrados.reduce((s,e)=>s+(e.compras||[]).filter(c=>c.dpag&&(c.dpag||'').substring(0,7)===m).reduce((ss,c)=>{
    const luc=(c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0);
    return ss+luc;
  },0),0);
  if(graficos.comparativo) graficos.comparativo.destroy();
  const ctx6 = document.getElementById('grafico-comparativo')?.getContext('2d');
  const lblMesAt = mesAtual.substring(5)+'/'+mesAtual.substring(2,4);
  const lblMesAnt = mesAnterior.substring(5)+'/'+mesAnterior.substring(2,4);
  if(ctx6) graficos.comparativo = new Chart(ctx6, {
    type: 'bar',
    data: {
      labels: ['Recebido', 'Lucro'],
      datasets: [
        { label: lblMesAnt, data: [recMes(mesAnterior), lucMes(mesAnterior)], backgroundColor: 'rgba(0,102,255,0.4)', borderRadius: 4 },
        { label: lblMesAt, data: [recMes(mesAtual), lucMes(mesAtual)], backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{position:'top',labels:{font:{size:10}}}}, scales:{y:{ticks:{callback:v=>'R$'+v.toLocaleString('pt-BR')}}} }
  });
}

let disputaAtiva = null;

function verEmpenhosDisputa(disputaId) {
  const disp = DB.disputas.find(d => d.id === disputaId);
  if(!disp) return;
  
  disputaAtiva = disputaId;
  
  // Banner de info do contrato
  const {luc, pct} = dVals(disp);
  g('disp-info-banner').innerHTML = `
    <span>🏢 Órgão:<strong>${disp.orgao||'—'}</strong></span>
    <span>📋 Processo:<strong>${disp.processo||'—'}</strong></span>
    <span>🏷️ Situação:<strong>${disp.situacao||'—'}</strong></span>
    <span>💰 Prev.Lucro:<strong style="color:var(--success)">${fmt(luc)}</strong></span>
    <span>📅 Data:<strong>${fmtD(disp.data)}</strong></span>
  `;
  
  g('ttl-empenhos-disputa').textContent = `📄 Empenhos · ${disp.orgao||'?'}`;
  
  const emps = DB.empenhos.filter(e => e.disputaId === disputaId);
  g('disp-emp-count').textContent = `${emps.length} empenho(s) vinculado(s)`;
  
  if(!emps.length) {
    g('disp-emp-body').innerHTML = '<div class="emp-disp-empty">Nenhum empenho vinculado a este contrato.<br><small>Clique em "+ Novo Empenho Vinculado" para adicionar.</small></div>';
    g('disp-emp-totais').innerHTML = '';
  } else {
    g('disp-emp-body').innerHTML = `
      <table class="emp-disp-table">
        <thead><tr>
          <th>Nº Empenho</th>
          <th>Data</th>
          <th>Produto</th>
          <th>Val. Empenho</th>
          <th>Compra Total</th>
          <th>Lucro</th>
          <th>%</th>
          <th>A Receber</th>
          <th>Recebido</th>
          <th>Status</th>
          <th>Ações</th>
        </tr></thead>
        <tbody>
        ${emps.map(e => {
          const v = eVals(e);
          const pago = e.recebido > 0;
          return `<tr class="${pago?'pago':''}">
            <td class="mono" style="font-weight:600;">${e.num||'—'}</td>
            <td class="mono">${fmtD(e.data)}</td>
            <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;" title="${e.produto||''}">${e.produto||'—'}</td>
            <td class="mono" style="color:var(--accent)">${fmt(e.vem)}</td>
            <td class="mono">${fmt(v.tot)}</td>
            <td class="mono" style="color:${v.luc>=0?'var(--success)':'var(--danger)'}">${fmt(v.luc)}</td>
            <td class="mono">${fmtP(v.pct)}</td>
            <td class="mono">${fmt(v.rec)}</td>
            <td class="mono" style="color:var(--success)">${e.recebido>0?fmt(e.recebido):'—'}</td>
            <td><span class="${pago?'status-pago':'status-pendente'}">${pago?'✅ Pago':'⏳ Pendente'}</span></td>
            <td>
              <button class="btn btn-ghost btn-sm" onclick="closeModal('empenhos-disputa');editE('${e.id}')" title="Editar">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="delEmpenhoDisputa('${e.id}')" title="Excluir">🗑</button>
            </td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>`;
    
    // Totais
    const totalVem = emps.reduce((s,e) => s + e.vem, 0);
    const totalRec = emps.reduce((s,e) => s + (e.recebido||0), 0);
    const totalLuc = emps.reduce((s,e) => s + eVals(e).luc, 0);
    const aReceber = emps.filter(e => !e.recebido || e.recebido===0).reduce((s,e) => s + eVals(e).rec, 0);
    g('disp-emp-totais').innerHTML = `
      <div><div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Total Empenhado</div><div style="font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--accent)">${fmt(totalVem)}</div></div>
      <div><div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Lucro Total</div><div style="font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--success)">${fmt(totalLuc)}</div></div>
      <div><div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">Recebido</div><div style="font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--success)">${fmt(totalRec)}</div></div>
      <div><div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;">A Receber</div><div style="font-size:14px;font-weight:700;font-family:var(--font-mono);color:var(--warning)">${fmt(aReceber)}</div></div>
    `;
  }
  
  g('modal-empenhos-disputa').classList.add('open');
}

function delEmpenhoDisputa(id) {
  _fullDB.empenhos = _fullDB.empenhos.filter(r => r.id !== id);
  save('empenhos', _fullDB.empenhos);
  toast('Empenho excluído', 'info');
  renderActive();
  if(disputaAtiva) verEmpenhosDisputa(disputaAtiva);
}

function novoEmpenhoDaDisputa() {
  closeModal('empenhos-disputa', true);
  if (disputaAtiva) {
    novoEmpenhoParaDisputa(disputaAtiva);
  } else {
    toast('Selecione um contrato primeiro.', 'error');
  }
}

function populateDisputaSelect(preSelectId) {
  const sel = g('e-disputa-id');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Selecione o órgão —</option>';

  // Só listo contratos com saldo (ou a pré-selecionada em modo edição)
  const comSaldo = DB.disputas
    .map(d => {
      const lotes = d.lotes || [];
      const saldoTotal = lotes.reduce((s, l) => s + Math.max(0, (l.qtd||0) - calcQtdEnviada(d.id, l.id)), 0);
      return { d, saldoTotal };
    })
    .filter(x => x.saldoTotal > 0 || x.d.id === preSelectId)
    .sort((a, b) => a.d.orgao.localeCompare(b.d.orgao));

  if (comSaldo.length === 0) {
    const opt = document.createElement('option');
    opt.disabled = true;
    opt.textContent = '— Nenhum contrato com saldo disponível —';
    sel.appendChild(opt);
  }

  comSaldo.forEach(({ d, saldoTotal }) => {
    const opt = document.createElement('option');
    opt.value = d.id;
    const editando = d.id === preSelectId && saldoTotal === 0;
    opt.textContent = `${d.orgao}${d.estado ? ' · ' + d.estado : ''} · ${fmtD(d.data)} · ${editando ? '(editando)' : saldoTotal + ' un. restantes'}`;
    if (d.id === preSelectId) opt.selected = true;
    sel.appendChild(opt);
  });

  if (preSelectId) onDisputaSelecionada(preSelectId);
}

