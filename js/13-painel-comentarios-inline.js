// ========== PAINEL DE CONTROLE ==========
function atualizarPainel() {
  const el = document.getElementById('painel-body'); if (!el) return;
  const agora = new Date();
  const mesAtual = agora.toISOString().slice(0,7);
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth()-1, 1).toISOString().slice(0,7);

  // KPIs
  const disputasAtivas = DB.disputas.filter(d=>!d.finalizada).length;
  const empenhosPendentes = DB.empenhos.filter(e=>!e.finalizado).length;

  const lucroTotal = DB.empenhos.reduce((s,e)=>{
    return s + (e.compras||[]).filter(c=>c.dpag).reduce((ss,c)=>{
      return ss + ((c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0));
    },0);
  },0);

  const lucroEmpenhado = DB.empenhos.filter(e=>!e.finalizado).reduce((s,e)=>{
    return s + (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((ss,c)=>{
      return ss + ((c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0));
    },0);
  },0);

  const lucroMes = DB.empenhos.reduce((s,e)=>{
    return s + (e.compras||[]).filter(c=>c.dpag&&c.dpag.startsWith(mesAtual)).reduce((ss,c)=>{
      return ss + ((c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0));
    },0);
  },0);

  // Próximos retornos (próximas 24h e vencidos)
  const proximosRetornos = (DB.acomp||[])
    .filter(r => r.retorno)
    .map(r => ({...r, _ret: new Date(r.retorno)}))
    .filter(r => r._ret > new Date(agora - 3600000*2)) // vencidos há menos de 2h ou futuros
    .sort((a,b) => a._ret - b._ret)
    .slice(0, 5);

  // Disputas por analista
  const porAnalista = {};
  DB.disputas.filter(d=>!d.finalizada).forEach(d => {
    const a = d.analista||'—';
    if (!porAnalista[a]) porAnalista[a] = { disputas:0, empenhos:0, lucro:0 };
    porAnalista[a].disputas++;
  });
  DB.empenhos.filter(e=>!e.finalizado).forEach(e => {
    const a = e.analista||'—';
    if (!porAnalista[a]) porAnalista[a] = { disputas:0, empenhos:0, lucro:0 };
    porAnalista[a].empenhos++;
    porAnalista[a].lucro += (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((ss,c)=>{
      return ss + ((c.luc!==undefined&&c.luc!==null)?c.luc:(c.rec||0)-(c.vtotal||0)-(c.custo||0));
    },0);
  });

  // Últimas atividades
  const ultimasDisputas = [...DB.disputas].sort((a,b)=>(b.data||'').localeCompare(a.data||'')).slice(0,3);
  const ultimosEmpenhos = [...DB.empenhos].filter(e=>!e.finalizado).sort((a,b)=>(b.data||'').localeCompare(a.data||'')).slice(0,3);

  // Empenhos em atraso por faixa
  const empPendentes = DB.empenhos.filter(e => !empenhoEstaPago(e) && !e.finalizado);
  const emp30 = empPendentes.filter(e => { const d = diasSemPagamento(e); return d >= 30 && d < 60; });
  const emp60 = empPendentes.filter(e => { const d = diasSemPagamento(e); return d >= 60 && d < 90; });
  const emp90 = empPendentes.filter(e => diasSemPagamento(e) >= 90);
  const empAtrasados = [...emp30, ...emp60, ...emp90].sort((a,b) => diasSemPagamento(b) - diasSemPagamento(a)).slice(0, 8);

  // Camada visual: calculos, selecao de registros e demais funcoes preservados.
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const actionId = id => esc(JSON.stringify(String(id)));
  const icon = name => {
    const paths = {
      file:'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
      receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8',
      wallet:'M3 6h17v15H3z M3 6V3h14v3 M15 11h5v5h-5z',
      clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l4 2',
      chart:'M4 20V10 M10 20V4 M16 20v-8 M21 20H2',
      calendar:'M4 5h16v16H4z M4 10h16 M8 2v6 M16 2v6',
      users:'M9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M3 20v-3a6 6 0 0 1 12 0v3z M17 4a3 3 0 0 1 0 6 M18 13a5 5 0 0 1 3 4v3',
      external:'M14 3h7v7 M21 3l-9 9 M10 3H3v18h18v-7',
      arrow:'M9 5l7 7-7 7'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.file}"/></svg>`;
  };
  const go = tab => `switchTab('${tab}',document.querySelector('.tabs .tab-btn[onclick*="${tab}"]'))${tab==='acompanhamentos'?';renderAcomp()':''}`;
  const empty = text => `<div class="pm-empty">${text}</div>`;
  const head = (name, glyph, tab) => `<div class="pm-card-head"><span class="pm-heading-icon">${icon(glyph)}</span><h2>${name}</h2>${tab?`<button type="button" class="pm-view-all" onclick="${esc(go(tab))}">Ver todos ${icon('arrow')}</button>`:''}</div>`;
  const kpi = (label,value,glyph,tone,caption,tab) => `<article class="pm-kpi pm-${tone}"><span class="pm-kpi-icon">${icon(glyph)}</span><div class="pm-kpi-main"><h2>${label}</h2><strong class="pm-value">${value}</strong>${tab?`<button type="button" class="pm-kpi-link" onclick="${esc(go(tab))}">${caption} ${icon('arrow')}</button>`:`<span class="pm-caption">${caption}</span>`}</div></article>`;
  const entries = Object.entries(porAnalista);
  const tomorrow = new Date(agora.getFullYear(),agora.getMonth(),agora.getDate()+1);
  const tomorrowCount = (DB.acomp||[]).filter(r=>r.retorno && new Date(r.retorno).toDateString()===tomorrow.toDateString()).length;
  const dateText = agora.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const pageHead = document.querySelector('#tab-painel > .lb-page-head');
  if(pageHead){
    let meta=pageHead.querySelector('.pm-page-meta');
    if(!meta){meta=document.createElement('div');meta.className='pm-page-meta';pageHead.appendChild(meta);}
    meta.innerHTML=`<div class="pm-current-date">${icon('calendar')}<span>${esc(dateText)}</span></div><div class="pm-agenda">${icon('calendar')}<div><strong>${tomorrowCount} ${tomorrowCount===1?'retorno para amanhã':'retornos para amanhã'}</strong><span>Conforme os agendamentos cadastrados</span></div></div>`;
  }
  el.innerHTML = `
    <section class="pm-kpis" aria-label="Indicadores do painel">
      ${kpi('Contratos ativos',disputasAtivas,'file','neutral','Ver contratos','disputas')}
      ${kpi('Empenhos pendentes',empenhosPendentes,'receipt','purple','Ver empenhos','empenhos')}
      ${kpi('Lucro total recebido',fmt(lucroTotal),'wallet','green','Acumulado')}
      ${kpi('Lucro empenhado',fmt(lucroEmpenhado),'clock','amber','A receber')}
      ${kpi('Lucro no mês',fmt(lucroMes),'chart','green',esc(agora.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})))}
    </section>
    <div class="pm-grid">
      <section class="pm-card">
        ${head('Próximos retornos','calendar','acompanhamentos')}
        <div class="pm-return-list">${proximosRetornos.map(r=>{
          const overdue=r._ret<agora;
          const today=r._ret.toDateString()===agora.toDateString();
          const isTomorrow=r._ret.toDateString()===tomorrow.toDateString();
          const label=overdue?'Vencido':today?'Hoje':isTomorrow?'Amanhã':'Agendado';
          let link='';
          try{const u=new URL(r.link);if(['http:','https:'].includes(u.protocol))link=u.href;}catch(_){}
          return `<div class="pm-return-row"><div class="pm-date ${overdue?'pm-overdue':''}"><strong>${r._ret.getDate().toString().padStart(2,'0')}</strong><span>${esc(r._ret.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''))}</span></div><div class="pm-row-main"><strong title="${esc(r.orgao)}">${esc(r.orgao||'—')}</strong><span>${esc(r.analista||'—')} · ${r._ret.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div><span class="pm-pill ${overdue?'pm-danger':today?'pm-warning':isTomorrow?'':'pm-scheduled'}">${label}</span>${link?`<a class="pm-icon-button" href="${esc(link)}" target="_blank" rel="noopener noreferrer" title="Abrir link do acompanhamento" aria-label="Abrir link de ${esc(r.orgao||'acompanhamento')}">${icon('external')}</a>`:''}</div>`;
        }).join('')||empty('Nenhum retorno agendado.')}</div>
      </section>
      <section class="pm-card pm-analysts">
        ${head('Por analista','users')}
        <div class="pm-table-wrap"><table class="pm-table"><thead><tr><th scope="col">Analista</th><th scope="col">Contratos</th><th scope="col">Empenhos</th><th scope="col">Lucro empenhado</th></tr></thead><tbody>${entries.map(([name,d],i)=>`<tr><td><div class="pm-person"><span class="pm-avatar pm-avatar-${i%4}">${esc(name.charAt(0).toUpperCase())}</span>${esc(name)}</div></td><td>${d.disputas}</td><td>${d.empenhos}</td><td>${fmt(d.lucro)}</td></tr>`).join('')||'<tr><td colspan="4" class="pm-empty">Sem dados por analista.</td></tr>'}</tbody></table></div>
        ${disputasAtivas?`<div class="pm-distribution"><span>Distribuição de contratos ativos</span><div class="pm-bar" aria-hidden="true">${entries.filter(([,d])=>d.disputas>0).map(([name,d],i)=>`<span class="pm-segment-${i%4}" style="width:${d.disputas/disputasAtivas*100}%" title="${esc(name)}: ${d.disputas} contratos"></span>`).join('')}</div><div class="pm-legend">${entries.filter(([,d])=>d.disputas>0).map(([name,d])=>`<span><b>${Math.round(d.disputas/disputasAtivas*100)}%</b> ${esc(name)}</span>`).join('')}</div></div>`:''}
      </section>
    </div>
    <div class="pm-grid">
      <section class="pm-card">
        ${head('Últimos contratos','file','disputas')}
        ${ultimasDisputas.map(d=>`<button type="button" class="pm-record" onclick="abrirPopupDisputa(${actionId(d.id)})"><span class="pm-row-main"><strong title="${esc(d.orgao)}">${esc(d.orgao||'—')}</strong><span>${esc(d.analista||'—')} · ${d.data?esc(new Date(d.data+'T12:00').toLocaleDateString('pt-BR')):'—'}</span></span><span class="pm-amount">${fmt(d.venda||0)}</span>${icon('arrow')}</button>`).join('')||empty('Nenhum contrato cadastrado.')}
      </section>
      <section class="pm-card">
        ${head('Últimos empenhos','receipt','empenhos')}
        ${ultimosEmpenhos.map(e=>`<button type="button" class="pm-record" onclick="abrirPopupEmpenho(${actionId(e.id)})"><span class="pm-row-main"><strong title="${esc(e.orgao)}">${e.num?'#'+esc(e.num)+' · ':''}${esc(e.orgao||'—')}</strong><span>${esc(e.analista||'—')} · ${e.data?esc(new Date(e.data+'T12:00').toLocaleDateString('pt-BR')):'—'}</span></span><span class="pm-amount">${fmt(e.vem||0)}</span>${icon('arrow')}</button>`).join('')||empty('Nenhum empenho pendente.')}
      </section>
    </div>`;
}

// ========== AGRUPAMENTO POR ÓRGÃO ==========
let _agrupado = true;
// Aplica estilo ativo no botão assim que o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  const btn = g('btn-agrupar-orgao');
  if(btn) { btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; }
});
function toggleAgrupamento() {
  _agrupado = !_agrupado;
  const btn = g('btn-agrupar-orgao');
  if(btn) btn.style.background = _agrupado ? 'var(--accent)' : '';
  if(btn) btn.style.color = _agrupado ? '#fff' : '';
  renderE();
}

function renderEAgrupado(rows, tb) {
  const grupos = {};
  rows.forEach(r => {
    const org = r.orgao || '—';
    if (!grupos[org]) {
      grupos[org] = { empenhos: [], analistas: new Set() };
    }
    grupos[org].empenhos.push(r);
    if (r.analista) grupos[org].analistas.add(r.analista);
  });

  // Mantém a ordem produzida por getSorted(). O primeiro empenho de cada órgão
  // define a posição do grupo, e os registros internos preservam a mesma ordenação.
  const sorted = Object.entries(grupos);

  tb.innerHTML = sorted.map(([org, grupo]) => {
    const analistasHTML = [...grupo.analistas].map(nome =>
      `<span class="badge ${_badgeClass(nome)}" style="font-size:10px;margin-left:6px;">${nome}</span>`
    ).join('');

    const linhas = grupo.empenhos.map((r, idx) => {
      const zebraTd = idx % 2 === 1 ? 'background:var(--bg-surface-soft);' : 'background:var(--bg-surface);';
      const dias = diasSemPagamento(r);
      const diasBadge = dias > 0
        ? `<span class="dias-badge ${dias>=90?'dias-90':dias>=60?'dias-60':dias>=30?'dias-30':'dias-ok'}">${dias>=90?'🔴 ':dias>=60?'🟠 ':dias>=30?'🟡 ':''}${dias}d</span>`
        : '<span class="dias-badge dias-ok">✓</span>';
      const compras = r.compras || [];
      const vals = eVals(r);
      const valorCompra = compras.length
        ? compras.reduce((s, c) => s + (c.vtotal || 0), 0)
        : vals.tot;
      const lucroEmp = compras.length
        ? compras.reduce((s, c) => s + (c.luc || 0), 0)
        : vals.luc;
      const aReceberEmp = compras.length
        ? compras.filter(c => !c.dpag || c.dpag === '').reduce((s, c) => s + (c.rec || 0), 0)
        : vals.rec;

      return `<tr style="cursor:pointer;" onclick="abrirPopupEmpenho('${r.id}')">
        <td class="mono hi" style="font-size:11px;font-weight:700;padding-left:20px;${zebraTd}">${r.num || '—'}</td>
        <td class="mono" style="text-align:right;color:var(--accent);font-weight:700;${zebraTd}">${fmt(r.vem)}</td>
        <td class="mono" style="text-align:right;color:var(--text-secondary);font-size:11px;${zebraTd}">${valorCompra > 0 ? fmt(valorCompra) : '—'}</td>
        <td class="mono" style="text-align:right;color:${lucroEmp >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700;${zebraTd}">${fmt(lucroEmp)}</td>
        <td class="mono" style="text-align:right;color:var(--warning);font-weight:700;${zebraTd}">${aReceberEmp > 0 ? fmt(aReceberEmp) : '—'}</td>
        <td style="text-align:center;${zebraTd}">${diasBadge}</td>
      </tr>`;
    }).join('');

    return `<tr style="background:var(--bg-inset);">
        <td colspan="6" style="padding:8px 12px;">
          <div style="display:flex;align-items:center;gap:12px;font-weight:700;font-size:13px;flex-wrap:wrap;">
            <span>🏢 ${org}${analistasHTML}</span>
            <span style="font-size:11px;color:var(--text-tertiary);">${grupo.empenhos.length} empenho(s)</span>
          </div>
        </td>
      </tr>${linhas}`;
  }).join('');
}

// ========== COMENTÁRIOS INTERNOS ==========
function renderComentarios(tipo, itemId) {
  const key = tipo + ':' + itemId;
  const todos = (DB.comentarios||[]).filter(c=>c.key===key).sort((a,b)=>a.ts-b.ts);
  return `<div class="detail-section" style="margin-top:16px;">💬 COMENTÁRIOS <span style="font-size:11px;color:var(--text-tertiary);">(${todos.length})</span></div>
  <div id="coment-list-${itemId}" style="max-height:200px;overflow-y:auto;margin-bottom:8px;">
    ${todos.length ? todos.map(c=>`
      <div style="padding:8px;background:var(--bg-surface-soft);border-radius:8px;margin-bottom:6px;position:relative;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span class="badge ${c.autor==='Márdea'?'bp':'bb'}" style="font-size:10px;">${c.autor}</span>
          <span style="font-size:10px;color:var(--text-tertiary);">${new Date(c.ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
          ${c.autor===usuarioLogado?`<button onclick="delComentario('${c.id}','${itemId}')" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--danger);font-size:12px;">✕</button>`:''}
        </div>
        <div style="font-size:12px;line-height:1.5;">${c.texto}</div>
      </div>`).join('') : '<div style="color:var(--text-tertiary);font-size:12px;padding:8px;">Nenhum comentário ainda.</div>'}
  </div>
  <div style="display:flex;gap:8px;">
    <input type="text" id="coment-input-${itemId}" placeholder="Escrever comentário..." style="flex:1;" class="fc" maxlength="300" onkeydown="if(event.key==='Enter')salvarComentario('${tipo}','${itemId}')">
    <button class="btn btn-primary btn-sm" onclick="salvarComentario('${tipo}','${itemId}')">Enviar</button>
  </div>`;
}

function salvarComentario(tipo, itemId) {
  const input = g('coment-input-'+itemId);
  if(!input||!input.value.trim()) return;
  if(!DB.comentarios) DB.comentarios=[];
  const novo = { id:uid(), key:tipo+':'+itemId, autor:usuarioLogado||'Usuário', texto:input.value.trim(), ts:Date.now() };
  DB.comentarios.push(novo);
  save('comentarios', DB.comentarios);
  input.value='';
  // Atualiza só a lista de comentários sem fechar o popup
  const listEl = g('coment-list-'+itemId);
  if(listEl) {
    const todos = DB.comentarios.filter(c=>c.key===tipo+':'+itemId).sort((a,b)=>a.ts-b.ts);
    listEl.innerHTML = todos.map(c=>`
      <div style="padding:8px;background:var(--bg-surface-soft);border-radius:8px;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span class="badge ${c.autor==='Márdea'?'bp':'bb'}" style="font-size:10px;">${c.autor}</span>
          <span style="font-size:10px;color:var(--text-tertiary);">${new Date(c.ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
          ${c.autor===usuarioLogado?`<button onclick="delComentario('${c.id}','${itemId}')" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--danger);font-size:12px;">✕</button>`:''}
        </div>
        <div style="font-size:12px;line-height:1.5;">${c.texto}</div>
      </div>`).join('');
    listEl.scrollTop = listEl.scrollHeight;
  }
}

function delComentario(comentId, itemId) {
  DB.comentarios = (DB.comentarios||[]).filter(c=>c.id!==comentId);
  save('comentarios', DB.comentarios);
  // Re-render full popup to refresh
  const popup = g('popup-e-body') || g('popup-d-body');
  // Just remove the element
  const allItems = document.querySelectorAll('[id^="coment-list-"]');
  allItems.forEach(el => {
    const iid = el.id.replace('coment-list-','');
    const todos = (DB.comentarios||[]).filter(c=>c.key.endsWith(':'+iid)).sort((a,b)=>a.ts-b.ts);
    if(todos.length===0) el.innerHTML='<div style="color:var(--text-tertiary);font-size:12px;padding:8px;">Nenhum comentário ainda.</div>';
    else el.innerHTML = todos.map(c=>`<div style="padding:8px;background:var(--bg-surface-soft);border-radius:8px;margin-bottom:6px;"><div style="font-size:12px;">${c.autor} · ${new Date(c.ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div><div style="font-size:12px;line-height:1.5;">${c.texto}</div></div>`).join('');
  });
}

// Helper: parseia campo retorno (datetime-local ou date) de forma segura
function parseRetorno(val) {
  if (!val) return null;
  const str = val.includes('T') ? val : val + 'T12:00';
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Helper: formata data de retorno para exibição
function fmtRetorno(val) {
  const d = parseRetorno(val);
  if (!d) return '—';
  return d.toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
}

// ========== LEGADO (não usado mais) ==========
// ========== OCR COM TESSERACT.JS ==========
// ========== INLINE EDIT ==========
function inlineEditStatus(id, tipo) {
  const statuses = tipo === 'disputas'
    ? [['em-analise','🔍 Em Análise'],['participando','⚡ Participando'],['aguardando-empenho','📄 Aguard. Empenho'],['empenhado','✅ Empenhado'],['finalizada','🏁 Finalizada']]
    : [['pendente','⏳ Pendente'],['pago','✅ Pago']];

  const r = DB[tipo].find(x => x.id === id);
  if (!r) return;

  const currentVal = tipo === 'disputas' ? getKanbanStatus(r) : (empenhoEstaPago(r) ? 'pago' : 'pendente');
  const cellId = `inline-status-${tipo}-${id}`;
  const cell = document.getElementById(cellId);
  if (!cell) return;

  const opts = statuses.map(([v, l]) => `<option value="${v}" ${v === currentVal ? 'selected' : ''}>${l}</option>`).join('');
  cell.innerHTML = `<select class="inline-edit-select" onchange="commitInlineStatus('${id}','${tipo}',this.value,this)" onblur="renderActive()">${opts}</select>`;
  cell.querySelector('select').focus();
}

function commitInlineStatus(id, tipo, newVal, el) {
  const r = DB[tipo].find(x => x.id === id);
  if (!r) return;

  if (tipo === 'disputas') {
    r.kanbanStatus = newVal;
    if (newVal === 'finalizada') { r.finalizada = true; r.dataFinalizacao = r.dataFinalizacao || new Date().toISOString().slice(0,10); }
    else { r.finalizada = false; }
    upsert('disputas', DB.disputas);
  }
  toast('Status atualizado!', 'success');
  setTimeout(() => renderActive(), 100);
}

function inlineEditDate(id, tipo) {
  const r = DB[tipo].find(x => x.id === id);
  if (!r) return;
  const cellId = `inline-date-${tipo}-${id}`;
  const cell = document.getElementById(cellId);
  if (!cell) return;

  const currentVal = r.data || '';
  cell.innerHTML = `<input type="date" class="inline-edit-input" value="${currentVal}"
    onchange="commitInlineDate('${id}','${tipo}',this.value)"
    onblur="renderActive()" style="width:120px;">`;
  cell.querySelector('input').focus();
}

function commitInlineDate(id, tipo, newVal) {
  const r = DB[tipo].find(x => x.id === id);
  if (!r) return;
  r.data = newVal;
  upsert(tipo, DB[tipo]);
  toast('Data atualizada!', 'success');
  setTimeout(() => renderActive(), 100);
}

// Helpers para carregar/salvar edital e NE nos modais
function carregarArquivosDisputa(r) {
  const editalUrl = g('d-edital-url'); const editalNome = g('d-edital-nome');
  const editalPreview = g('d-edital-preview'); const editalDrop = g('d-edital-dropzone');
  if (editalUrl) editalUrl.value = r.editalUrl || '';
  if (editalNome) editalNome.value = r.editalNome || '';
  if (r.editalUrl && editalPreview) {
    editalPreview.style.display = 'block';
    editalPreview.innerHTML = `<div class="file-badge"><a href="${r.editalUrl}" target="_blank" style="color:inherit;text-decoration:none;">📑 ${r.editalNome || 'Edital'}</a><span class="file-badge-remove" onclick="limparArquivoStorage('d-edital','📑 Clique ou arraste o PDF do edital (máx. 15MB)')">✕</span></div>`;
  } else if (editalPreview) { editalPreview.style.display = 'none'; }
}

function carregarArquivosEmpenho(r) {
  const neUrl = g('e-ne-url'); const neNome = g('e-ne-nome');
  const nePreview = g('e-ne-preview');
  // Carregar preview do PDF se já existir
  if (r.neUrl && neUrl) {
    neUrl.value = r.neUrl;
    if (neNome) neNome.value = r.neNome || '';
    const lbl = g('e-ne-upload-label'); if(lbl) lbl.textContent = '✅ ' + (r.neNome || 'PDF carregado');
    if (nePreview) {
      nePreview.style.display = 'flex';
      const lnk = g('e-ne-link'); if(lnk) lnk.textContent = '📄 ' + (r.neNome || 'PDF do empenho');
    }
  }
  if (neUrl) neUrl.value = r.neUrl || '';
  if (neNome) neNome.value = r.neNome || '';
  if (r.neUrl && nePreview) {
    nePreview.style.display = 'block';
    nePreview.innerHTML = `<div class="file-badge"><a href="${r.neUrl}" target="_blank" style="color:inherit;text-decoration:none;">🖼 ${r.neNome || 'Nota de Empenho'}</a><span class="file-badge-remove" onclick="limparArquivoStorage('e-ne','🖼 Clique ou arraste a Nota de Empenho (imagem ou PDF)')">✕</span></div>`;
  } else if (nePreview) { nePreview.style.display = 'none'; }
}

// Empenhos atrasados: verifica 1x por dia na carga inicial (via setTimeout no onSnapshot)
// Alertas de retorno: gerenciados pelo checarRetornos (a cada 30s)

// ========== DROPDOWN DE AÇÕES ==========
function openActionMenu(event, btn) {
  event.stopPropagation();
  const menu = btn.nextElementSibling;
  if (!menu) return;
  
  // Toggle: if already open, close it
  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    return;
  }
  
  // Close any other open menu first
  closeActionMenus();
  
  // Position the menu relative to the viewport
  const rect = btn.getBoundingClientRect();
  menu.style.display = 'block';
  
  const menuW = 180;
  const menuH = menu.scrollHeight || 200;
  let left = rect.right - menuW;
  let top = rect.bottom + 4;
  
  if (left < 8) left = 8;
  if (top + menuH > window.innerHeight - 8) top = rect.top - menuH - 4;
  
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.position = 'fixed';
  
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeActionMenus, { once: true });
  }, 0);
}

function closeActionMenus() {
  document.querySelectorAll('.action-dropdown-menu').forEach(m => m.style.display = 'none');
}

// Close on scroll
document.addEventListener('scroll', closeActionMenus, true);

