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

  el.innerHTML = `
    <div style="padding:4px 0 16px;">
      <div style="font-size:20px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">👋 Olá, ${usuarioLogado||'usuário'}!</div>
      <div style="font-size:13px;color:var(--text-secondary);">${agora.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
    </div>

    
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px;">
      <div class="card" style="border-left:4px solid var(--accent);cursor:pointer;" onclick="switchTab('disputas',document.querySelector('[onclick*=\\'disputas\\']'))">
        <div class="card-label">Contratos Ativos</div>
        <div class="card-value cv-blue">${disputasAtivas}</div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">Ver disputas →</div>
      </div>
      <div class="card" style="border-left:4px solid var(--purple);cursor:pointer;" onclick="switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])">
        <div class="card-label">Empenhos Pendentes</div>
        <div class="card-value cv-purple">${empenhosPendentes}</div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">Ver empenhos →</div>
      </div>
      <div class="card" style="border-left:4px solid var(--success);">
        <div class="card-label">Lucro Total Recebido</div>
        <div class="card-value cv-green">${fmt(lucroTotal)}</div>
      </div>
      <div class="card" style="border-left:4px solid var(--warning);">
        <div class="card-label">Lucro Empenhado</div>
        <div class="card-value cv-yellow">${fmt(lucroEmpenhado)}</div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">A receber</div>
      </div>
      <div class="card" style="border-left:4px solid var(--accent);">
        <div class="card-label">Lucro no Mês</div>
        <div class="card-value cv-blue">${fmt(lucroMes)}</div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${new Date().toLocaleDateString('pt-BR',{month:'long'})}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">

      
      <div class="card">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          ⏰ Próximos Retornos
          <button onclick="switchTab('acompanhamentos',document.querySelector('[onclick*=acompanhamentos]'));renderAcomp();" class="btn btn-ghost btn-sm" style="font-size:11px;margin-left:auto;">Ver todos</button>
        </div>
        ${proximosRetornos.length ? proximosRetornos.map(r => {
          const vencido = r._ret < agora;
          const hoje = r._ret.toDateString() === agora.toDateString();
          return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-light);">
            <div style="font-size:20px;">${vencido?'🔴':hoje?'🟠':'🟡'}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.orgao}</div>
              <div style="font-size:10px;color:var(--text-tertiary);">${r.analista} · ${r._ret.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            ${r.link ? `<a href="${r.link}" target="_blank" style="font-size:16px;">🔗</a>` : ''}
          </div>`;
        }).join('') : '<div style="color:var(--text-tertiary);font-size:12px;padding:12px 0;text-align:center;">Nenhum retorno agendado 🎉</div>'}
      </div>

      
      <div class="card">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px;">👥 Por Analista</div>
        ${Object.entries(porAnalista).map(([nome, dados]) => `
          <div style="margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span class="badge ${_badgeClass(nome)}" style="font-size:11px;">${nome}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
              <div style="background:var(--bg-surface-soft);border-radius:8px;padding:6px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:var(--accent);">${dados.disputas}</div>
                <div style="font-size:9px;color:var(--text-tertiary);">Contratos</div>
              </div>
              <div style="background:var(--bg-surface-soft);border-radius:8px;padding:6px;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:var(--purple);">${dados.empenhos}</div>
                <div style="font-size:9px;color:var(--text-tertiary);">Empenhos</div>
              </div>
              <div style="background:var(--bg-surface-soft);border-radius:8px;padding:6px;text-align:center;">
                <div style="font-size:12px;font-weight:700;color:var(--warning);">${fmt(dados.lucro)}</div>
                <div style="font-size:9px;color:var(--text-tertiary);">Empenhado</div>
              </div>
            </div>
          </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:12px;">Sem dados</div>'}
      </div>
    </div>

    
    ${(emp30.length || emp60.length || emp90.length) ? `
    <div class="card" style="margin-bottom:24px;border-left:4px solid var(--danger);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
        <div style="font-size:13px;font-weight:700;">⏳ Empenhos Pendentes com Atraso</div>
        <button onclick="switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])" class="btn btn-ghost btn-sm" style="font-size:11px;margin-left:auto;">Ver todos</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
        <div style="background:var(--warning-soft);border:1px solid var(--warning);border-radius:10px;padding:10px;text-align:center;cursor:pointer;" onclick="switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])">
          <div style="font-size:22px;font-weight:800;color:var(--warning);">${emp30.length}</div>
          <div style="font-size:10px;color:var(--text-secondary);font-weight:600;">🟡 30–60 dias</div>
        </div>
        <div style="background:var(--danger-soft);border:1px solid var(--danger);border-radius:10px;padding:10px;text-align:center;cursor:pointer;" onclick="switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])">
          <div style="font-size:22px;font-weight:800;color:var(--danger);">${emp60.length}</div>
          <div style="font-size:10px;color:var(--text-secondary);font-weight:600;">🟠 60–90 dias</div>
        </div>
        <div style="background:var(--danger-soft);border:2px solid var(--danger);border-radius:10px;padding:10px;text-align:center;cursor:pointer;" onclick="switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])">
          <div style="font-size:22px;font-weight:800;color:var(--danger);">${emp90.length}</div>
          <div style="font-size:10px;color:var(--text-secondary);font-weight:600;">🔴 +90 dias</div>
        </div>
      </div>
      ${empAtrasados.length ? `<div style="overflow-x:auto;"><table style="width:100%;font-size:12px;border-collapse:collapse;">
        <thead><tr style="background:var(--bg-surface-soft);">
          <th style="padding:7px 8px;text-align:left;">Empenho</th>
          <th style="padding:7px 8px;text-align:left;">Órgão</th>
          <th style="padding:7px 8px;text-align:left;">Analista</th>
          <th style="padding:7px 8px;text-align:right;">A Receber</th>
          <th style="padding:7px 8px;text-align:center;">Dias</th>
        </tr></thead>
        <tbody>
          ${empAtrasados.map(e => {
            const dias = diasSemPagamento(e);
            const cor = dias>=90?'var(--danger)':dias>=60?'var(--warning)':'var(--text-secondary)';
            const ico = dias>=90?'🔴':dias>=60?'🟠':'🟡';
            const aRec = (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((s,c)=>s+(c.rec||0),0);
            return '<tr onclick="abrirPopupEmpenho(\'' + e.id + '\')" style="cursor:pointer;border-bottom:1px solid var(--border-light);">'
              + '<td style="padding:7px 8px;font-weight:600;font-family:var(--font-mono);">' + (e.num?'#'+e.num:'—') + '</td>'
              + '<td style="padding:7px 8px;">' + (e.orgao||'—') + '</td>'
              + '<td style="padding:7px 8px;"><span class="badge ' + _badgeClass(e.analista) + '" style="font-size:10px;">' + (e.analista||'—') + '</span></td>'
              + '<td style="padding:7px 8px;text-align:right;font-family:var(--font-mono);color:var(--accent);">' + fmt(aRec) + '</td>'
              + '<td style="padding:7px 8px;text-align:center;font-weight:700;color:' + cor + ';">' + ico + ' ' + dias + 'd</td>'
              + '</tr>';
          }).join('')}
        </tbody>
      </table></div>` : ''}
    </div>` : ''}

    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;">🏆 Últimos Contratos</div>
        ${ultimasDisputas.map(d=>`
          <div onclick="abrirPopupDisputa('${d.id}')" style="cursor:pointer;padding:8px 0;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.orgao}</div>
              <div style="font-size:10px;color:var(--text-tertiary);">${d.analista||'—'} · ${d.data?new Date(d.data+'T12:00').toLocaleDateString('pt-BR'):'—'}</div>
            </div>
            <span style="font-size:11px;color:var(--accent);font-weight:600;">${fmt(d.venda||0)}</span>
          </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:12px;">Nenhum contrato</div>'}
      </div>
      <div class="card">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;">📄 Últimos Empenhos</div>
        ${ultimosEmpenhos.map(e=>`
          <div onclick="abrirPopupEmpenho('${e.id}')" style="cursor:pointer;padding:8px 0;border-bottom:1px solid var(--border-light);display:flex;align-items:center;gap:8px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.num?'#'+e.num+' — ':''} ${e.orgao||'—'}</div>
              <div style="font-size:10px;color:var(--text-tertiary);">${e.analista||'—'} · ${e.data?new Date(e.data+'T12:00').toLocaleDateString('pt-BR'):'—'}</div>
            </div>
            <span style="font-size:11px;color:var(--accent);font-weight:600;">${fmt(e.vem||0)}</span>
          </div>`).join('') || '<div style="color:var(--text-tertiary);font-size:12px;">Nenhum empenho</div>'}
      </div>
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

