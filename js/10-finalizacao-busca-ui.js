// ========== DISPUTAS FINALIZADAS ==========
function finalizarDisputa(id) {
  const d = DB.disputas.find(x => x.id === id);
  if (!d) return;
  _confirmarAcao({icon:'✅', titulo:'Finalizar contrato', msg:`Finalizar o contrato <strong>${d.orgao||id}</strong>?<br>Ela será movida para a aba Finalizadas.`, btnLabel:'✅ Finalizar', btnClass:'btn-success', onConfirm: () => {
    d.finalizada = true; d.finalizadaAuto = false; d.dataFinalizacao = new Date().toISOString().slice(0,10);
    save('disputas', DB.disputas); renderActive(); toast('Contrato finalizado! ✅', 'success');
  }}); return;
}

function reabrirDisputa(id) {
  const d = DB.disputas.find(x => x.id === id);
  if (!d) return;
  const empsFinalizados = DB.empenhos.filter(e => e.disputaId === id && e.finalizado);
  const msgEmps = empsFinalizados.length > 0
    ? `<br><br><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> <strong>${empsFinalizados.length} empenho(s)</strong> vinculado(s) também será(ão) reaberto(s) automaticamente.`
    : '';
  const totalCompras = empsFinalizados.reduce((s,e) => s + (e.compras||[]).filter(c => c.dpag || c.rec > 0).length, 0);
  const msgCompras = totalCompras > 0
    ? `<br><span style="color:var(--warning);font-size:12px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> As datas de pagamento das <strong>${totalCompras} compra(s)</strong> serão apagadas para evitar refinalização automática. Valores a receber são preservados.</span>`
    : '';
  _confirmarAcao({icon:'↩️', titulo:'Reabrir contrato', msg:`Reabrir o contrato <strong>${d.orgao||id}</strong>?<br>Ela voltará para Contratos Ativos.${msgEmps}${msgCompras}`, btnLabel:'Reabrir', btnClass:'btn-ghost', onConfirm: () => {
    d.finalizada = false; d.dataFinalizacao = null; d.finalizadaAuto = false;
    // Reabre empenhos e limpa dpag/rec das compras para quebrar o ciclo de auto-finalização
    empsFinalizados.forEach(e => {
      e.finalizado = false; e._manualFinalizado = false; e.dataFinalizacao = null;
      (e.compras||[]).forEach(c => { c.dpag = ''; }); // Limpa apenas dpag; rec preservado
    });
    save('disputas', DB.disputas);
    if (empsFinalizados.length) save('empenhos', DB.empenhos);
    renderActive(); toast('Contrato e empenhos reabertos! Datas de pagamento limpas, valores preservados.', 'info');
  }}); return;
}

// ===== DUPLICAR COMPRA =====
function duplicarCompra(empId, compraId) {
  const emp = DB.empenhos.find(x => x.id === empId);
  if (!emp) return;
  const original = (emp.compras||[]).find(c => c.id === compraId);
  if (!original) return;
  const nova = { ...original, id: uid(), dpag: '', recebido: 0, _duplicada: true };
  emp.compras = [...(emp.compras||[]), nova];
  upsert('empenhos', emp);
  toast('Compra duplicada! Edite os dados necessários.', 'success');
  setTimeout(() => abrirPopupEmpenho(empId), 150);
}

// ===== BUSCA GLOBAL =====
function buscaGlobal(q) {
  const panel = g('busca-global-result');
  if (!q || q.length < 2) { panel.style.display = 'none'; return; }
  const qL = q.toLowerCase();
  const resultados = [];

  // ===== DISPUTAS — todos os campos + lotes =====
  DB.disputas.forEach(d => {
    const campos = [
      d.orgao, d.processo, d.plataforma, d.analista, d.estado,
      d.observacao, d.empresa, fmtD(d.data),
      ...(d.lotes||[]).map(l => l.descricao),
      ...(d.lotes||[]).map(l => String(l.qtd||'')),
    ];
    if (campos.some(c => (c||'').toLowerCase().includes(qL))) {
      // Descobre qual campo bateu para mostrar no sub
      const matchLote = (d.lotes||[]).find(l => (l.descricao||'').toLowerCase().includes(qL));
      const sub = matchLote
        ? `Lote: ${matchLote.descricao.substring(0,30)}`
        : (d.finalizada ? '✅ Finalizada' : '🔵 Em andamento') + ' · ' + (fmtD(d.data)||'');
      resultados.push({
        tipo: '🏆 Contrato',
        label: (d.orgao||'—') + (d.processo ? ' · ' + d.processo : ''),
        sub,
        onclick: `fecharBuscaGlobal();abrirPopupDisputa('${d.id}')`
      });
    }
  });

  // ===== EMPENHOS — todos os campos + lotes + compras =====
  DB.empenhos.forEach(e => {
    const camposEmp = [
      e.orgao, e.num, e.analista, e.plataforma, e.observacao,
      e.produto, fmtD(e.data), String(e.vem||''),
      ...(e.lotes||[]).map(l => l.descricao),
    ];
    if (camposEmp.some(c => (c||'').toLowerCase().includes(qL))) {
      const matchLote = (e.lotes||[]).find(l => (l.descricao||'').toLowerCase().includes(qL));
      resultados.push({
        tipo: '📄 Empenho',
        label: '#' + (e.num||'?') + ' · ' + (e.orgao||'—'),
        sub: matchLote ? `Lote: ${matchLote.descricao.substring(0,25)}` : fmt(e.vem),
        onclick: `fecharBuscaGlobal();abrirPopupEmpenho('${e.id}')`
      });
    }

    // ===== COMPRAS deste empenho =====
    (e.compras||[]).forEach(c => {
      const camposCompra = [
        c.plataforma, c.pedido, c.nf, c.transportadora,
        c.observacao, String(c.vtotal||''), String(c.rec||''),
        String(c.luc||''), fmtD(c.dpag), fmtD(c.dped), fmtD(c.dent),
      ];
      if (camposCompra.some(f => (f||'').toLowerCase().includes(qL))) {
        const detalhe = c.pedido ? 'Pedido: ' + c.pedido
          : c.nf ? 'NF: ' + c.nf
          : c.plataforma || 'Compra';
        resultados.push({
          tipo: '🛒 Compra',
          label: (e.orgao||'—') + ' · ' + (c.plataforma||'—'),
          sub: detalhe + ' · ' + fmt(c.vtotal),
          onclick: `fecharBuscaGlobal();abrirPopupEmpenho('${e.id}')`
        });
      }
    });
  });

  // ===== ACOMPANHAMENTOS =====
  (DB.acomp||[]).forEach(a => {
    const campos = [a.orgao, a.sistema, a.observacao, a.analista, a.estado, a.status, fmtRetorno(a.retorno)];
    if (campos.some(c => (c||'').toLowerCase().includes(qL))) {
      resultados.push({
        tipo: '👁 Acompanhamento',
        label: (a.orgao||'—') + (a.sistema ? ' · ' + a.sistema : ''),
        sub: (a.status||'') + (a.retorno ? ' · ' + fmtRetorno(a.retorno) : ''),
        onclick: `fecharBuscaGlobal();switchTab('acompanhamentos',document.querySelectorAll('.tab-btn')[5])`
      });
    }
  });

  if (!resultados.length) {
    panel.innerHTML = '<div style="color:var(--text-tertiary);font-size:12px;padding:8px;">Nenhum resultado para "' + q + '"</div>';
  } else {
    panel.innerHTML = resultados.slice(0, 15).map(r =>
      `<div onclick="${r.onclick}" style="padding:8px;cursor:pointer;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;" onmouseover="this.style.background='var(--bg-surface-soft)'" onmouseout="this.style.background=''">
        <div style="min-width:0;flex:1;">
          <div style="font-size:10px;color:var(--text-tertiary);">${r.tipo}</div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.label}</div>
        </div>
        <div style="font-size:11px;color:var(--accent-hover);white-space:nowrap;margin-left:8px;max-width:120px;overflow:hidden;text-overflow:ellipsis;">${r.sub}</div>
      </div>`
    ).join('') + (resultados.length > 15 ? `<div style="color:var(--text-tertiary);font-size:11px;padding:6px 8px;text-align:center;">+${resultados.length-15} resultado(s) — refine a busca</div>` : '');
  }
  panel.style.display = 'block';
}
function fecharBuscaGlobal() {
  const p = g('busca-global-result'); if(p) p.style.display='none';
  const i = g('busca-global-input'); if(i) i.value='';
}
document.addEventListener('click', e => {
  if (!e.target.closest('#busca-global-input') && !e.target.closest('#busca-global-result')) {
    const p = g('busca-global-result'); if(p) p.style.display='none';
  }
  if (!e.target.closest('#notif-bell') && !e.target.closest('#notif-panel')) {
    const p = g('notif-panel'); if(p) p.style.display='none';
  }
});

// ===== MELHORIA 8: Função auxiliar para confirmar ações com modal estilizado =====
function _confirmarAcao({ icon = '⚠️', titulo = 'Confirmar', msg = '', btnLabel = 'Confirmar', btnClass = 'btn-danger', onConfirm }) {
  const iconEl = g('confirm-modal-icon'); if(iconEl) iconEl.textContent = icon;
  const titleEl = g('confirm-modal-title'); if(titleEl) titleEl.textContent = titulo;
  const el = g('confirm-msg'); if(el) el.innerHTML = msg;
  const btn = g('confirm-del-btn');
  if(btn) {
    btn.textContent = btnLabel;
    btn.className = 'btn ' + btnClass;
    btn.style.minWidth = '120px';
    // Substitui completamente o handler — sem conflito com atributo onclick
    btn.onclick = () => { onConfirm(); PDel = null; closeConfirm(); };
  }
  g('modal-confirm').classList.add('open');
}

// Escape fecha busca e modais
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharBuscaGlobal();
    closeActionMenus();
    const modal = g('modal-confirm');
    if (modal && modal.classList.contains('open')) closeConfirm();
    document.querySelectorAll('.modal-overlay.open, .wizard-overlay.open').forEach(el => { el.classList.remove('open'); });
  }
});

// ===== MELHORIA 10: Monitor de status offline/online =====
(function monitorarConexao() {
  const banner = () => g('offline-banner');
  function mostrarOffline() {
    const b = banner(); if (!b) return;
    const icon = g('offline-icon'); const msg = g('offline-msg');
    if(icon) icon.textContent = '📡';
    if(msg) msg.textContent = 'Sem conexão — trabalhando offline';
    b.style.background = '#1e293b';
    b.style.borderColor = '#ef4444';
    b.classList.add('show');
  }
  function mostrarOnline() {
    const b = banner(); if (!b) return;
    const icon = g('offline-icon'); const msg = g('offline-msg');
    if(icon) icon.textContent = '✅';
    if(msg) msg.textContent = 'Conexão restaurada — dados sincronizados';
    b.style.borderColor = '#10b981';
    b.classList.add('show');
    setTimeout(() => b.classList.remove('show'), 3000);
  }
  window.addEventListener('offline', mostrarOffline);
  window.addEventListener('online', mostrarOnline);
  if (!navigator.onLine) mostrarOffline();
})();

// ===== MELHORIA 12: Validação de formulário com feedback visual =====
function validarCampo(id, regra, msgErro) {
  const el = g(id); if (!el) return true;
  const val = (el.value || '').trim();
  const ok = regra(val);
  el.classList.toggle('field-error', !ok);
  // Remove mensagem de erro anterior
  const old = el.parentElement?.querySelector('.field-error-msg');
  if (old) old.remove();
  if (!ok && msgErro) {
    const span = document.createElement('span');
    span.className = 'field-error-msg';
    span.innerHTML = '⚠ ' + msgErro;
    el.parentElement?.appendChild(span);
  }
  // Remove classe de erro ao começar a digitar
  if (!ok) el.addEventListener('input', () => { el.classList.remove('field-error'); const m = el.parentElement?.querySelector('.field-error-msg'); if(m) m.remove(); }, { once: true });
  return ok;
}

function validarFormDisputa() {
  let ok = true;
  ok = validarCampo('d-data', v => !!v, 'Data obrigatória') && ok;
  ok = validarCampo('d-orgao', v => v.length >= 3, 'Órgão muito curto (mín. 3 caracteres)') && ok;
  ok = validarCampo('d-analista', v => !!v, 'Selecione um analista') && ok;
  return ok;
}

function validarFormEmpenho() {
  let ok = true;
  ok = validarCampo('e-data', v => !!v, 'Data obrigatória') && ok;
  ok = validarCampo('e-num', v => v.length >= 2, 'Número do empenho obrigatório') && ok;
  // Se o campo analista está oculto (não-admin), preenche automaticamente antes de validar
  const fgEAn = g('fg-e-analista');
  const anEl = g('e-analista');
  if (fgEAn && fgEAn.style.display === 'none' && analistaDoUsuario) {
    setAnalistaSelect('e-analista', analistaDoUsuario);
    if (anEl) anEl.disabled = false; // temporariamente para passar na validação
  }
  ok = validarCampo('e-analista', v => !!v, 'Selecione um analista') && ok;
  if (fgEAn && fgEAn.style.display === 'none' && anEl) anEl.disabled = true; // re-bloqueia
  return ok;
}

// ===== TOGGLE TEMA =====
// ===== RESUMO DIÁRIO =====
function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Bom dia';
  if (h < 18) return '🌤️ Boa tarde';
  return '🌙 Boa noite';
}

function mostrarResumoDiario() {
  const hoje = new Date().toISOString().slice(0,10);
  const saved = JSON.parse(localStorage.getItem('resumoDiario') || '{}');
  if (saved.data === hoje && saved.naoMostrar) return;

  const titulo = document.getElementById('resumo-titulo');
  const dataEl = document.getElementById('resumo-data');
  const body = document.getElementById('resumo-body');
  if (!titulo || !body) return;

  const nomeUsuario = usuarioLogado || 'você';
  titulo.textContent = saudacao() + ', ' + nomeUsuario + '!';

  const diasSemana = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const agora = new Date();
  dataEl.textContent = diasSemana[agora.getDay()] + ', ' + agora.toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'});

  // Calcular dados
  const empPendentes = DB.empenhos.filter(e => !e.finalizado && !empenhoEstaPago(e));
  const emp30 = empPendentes.filter(e => diasSemPagamento(e) >= 30);
  const emp60 = empPendentes.filter(e => diasSemPagamento(e) >= 60);
  const aReceber = empPendentes.reduce((s,e) => s + (e.compras||[]).filter(c=>!c.dpag||c.dpag==='').reduce((ss,c)=>ss+(c.rec||0),0), 0);
  const dispSemEmp = DB.disputas.filter(d => {
    if (d.finalizada || d.cancelada) return false;
    const temEmp = DB.empenhos.some(e => e.disputaId === d.id);
    if (temEmp) return false;
    const dias = d.data ? Math.floor((new Date() - new Date(d.data)) / 86400000) : 0;
    return dias >= 15;
  });

  // Tarefas do dia
  const tarefasHoje = (DB.tarefas||[]).filter(t => !t.concluida && t.prazo && t.prazo <= hoje);
  const tarefasResp = tarefasHoje.filter(t => !t.responsavel || t.responsavel === usuarioLogado);

  let html = '';

  // Card A receber
  html += `<div style="background:var(--bg-surface-soft);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
    <span style="font-size:24px;">💰</span>
    <div><div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;font-weight:600;">Total a receber</div>
    <div style="font-size:20px;font-weight:800;color:var(--success);">${fmt(aReceber)}</div>
    <div style="font-size:11px;color:var(--text-tertiary);">${empPendentes.length} empenho(s) pendente(s)</div></div>
  </div>`;

  // Alertas
  const alertas = [];
  if (emp60.length) alertas.push({ icon:'🔴', msg: `${emp60.length} empenho(s) com +60 dias sem pagamento`, cor:'var(--danger)' });
  else if (emp30.length) alertas.push({ icon:'🟡', msg: `${emp30.length} empenho(s) com +30 dias sem pagamento`, cor:'var(--warning)' });
  if (dispSemEmp.length) alertas.push({ icon:'📋', msg: `${dispSemEmp.length} contrato(s) sem empenho há +15 dias`, cor:'var(--accent)' });
  if (tarefasResp.length) alertas.push({ icon:'📌', msg: `${tarefasResp.length} tarefa(s) no prazo hoje`, cor:'var(--purple)' });

  if (alertas.length) {
    html += `<div style="display:flex;flex-direction:column;gap:6px;">`;
    alertas.forEach(a => {
      html += `<div style="background:var(--bg-surface-soft);border-left:3px solid ${a.cor};border-radius:6px;padding:10px 14px;font-size:13px;display:flex;align-items:center;gap:8px;">
        <span>${a.icon}</span><span>${a.msg}</span></div>`;
    });
    html += `</div>`;
  } else {
    html += `<div style="background:var(--bg-surface-soft);border-radius:10px;padding:14px 16px;text-align:center;color:var(--success);font-size:13px;font-weight:600;">✅ Tudo em dia! Nenhum alerta pendente.</div>`;
  }

  body.innerHTML = html;
  document.getElementById('resumo-nao-mostrar').checked = false;
  document.getElementById('modal-resumo-diario').classList.add('open');
}
// ===== TAREFAS =====
let _tarefaContexto = { tipo: '', id: '', nome: '' };
function renderTarefas() {
  const { tipo, id } = _tarefaContexto;
  const lista = document.getElementById('tarefa-lista');
  if (!lista) return;
  const tarefas = (DB.tarefas||[]).filter(t => t.tipo === tipo && t.refId === id);
  if (!tarefas.length) {
    lista.innerHTML = '<div style="color:var(--text-tertiary);font-size:12px;text-align:center;padding:12px;">Nenhuma tarefa cadastrada</div>';
    return;
  }
  const hoje = new Date().toISOString().slice(0,10);
  lista.innerHTML = tarefas.map(t => {
    const vencida = !t.concluida && t.prazo && t.prazo < hoje;
    const proxima = !t.concluida && t.prazo && t.prazo === hoje;
    const corBorda = t.concluida ? 'var(--success)' : vencida ? 'var(--danger)' : proxima ? 'var(--warning)' : 'var(--border-light)';
    return `<div style="background:var(--bg-surface-soft);border-left:3px solid ${corBorda};border-radius:8px;padding:10px 12px;display:flex;align-items:flex-start;gap:10px;">
      <input type="checkbox" ${t.concluida?'checked':''} onchange="toggleTarefa('${t.id}')" style="margin-top:2px;cursor:pointer;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;${t.concluida?'text-decoration:line-through;color:var(--text-tertiary);':''}">${t.desc}</div>
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;display:flex;gap:8px;">
          ${t.responsavel ? `<span>👤 ${t.responsavel}</span>` : ''}
          ${t.prazo ? `<span style="color:${vencida?'var(--danger)':proxima?'var(--warning)':'var(--text-tertiary)'};">📅 ${new Date(t.prazo+'T12:00').toLocaleDateString('pt-BR')}</span>` : ''}
        </div>
      </div>
      <button onclick="excluirTarefa('${t.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:14px;padding:0;" title="Excluir">🗑</button>
    </div>`;
  }).join('');
}
// ===== NOTIFICAÇÕES =====
let _notifDismissed = new Set(JSON.parse(localStorage.getItem('notifDismissed') || '[]'));

function _salvarNotifDismissed() {
  localStorage.setItem('notifDismissed', JSON.stringify([..._notifDismissed]));
}

function limparTodasNotificacoes() {
  _notifDismissed = new Set(['__all__' + Date.now()]);
  // Adiciona todas as chaves atuais ao dismissed
  const hoje = new Date();
  const emp90 = DB.empenhos.filter(e => !e.finalizado && diasSemPagamento(e) >= 90);
  const emp60 = DB.empenhos.filter(e => !e.finalizado && diasSemPagamento(e) >= 60 && diasSemPagamento(e) < 90);
  const emp30 = DB.empenhos.filter(e => !e.finalizado && diasSemPagamento(e) >= 30 && diasSemPagamento(e) < 60);
  if (emp90.length) _notifDismissed.add('emp90');
  if (emp60.length) _notifDismissed.add('emp60');
  if (emp30.length) _notifDismissed.add('emp30');
  _notifDismissed.add('disp-sem-emp');
  _notifDismissed.add('emp-sem-compra');
  _salvarNotifDismissed();
  const badge = g('notif-badge');
  if (badge) badge.style.display = 'none';
  const list = g('notif-list');
  if (list) list.innerHTML = '<div style="color:var(--text-tertiary);font-size:12px;">Sem alertas no momento ✅</div>';
}

function dispensarNotificacao(chave) {
  _notifDismissed.add(chave);
  _salvarNotifDismissed();
  atualizarNotificacoes();
}

function toggleNotificacoes() {
  const p = g('notif-panel');
  if (!p) return;
  if (p.style.display === 'none') {
    atualizarNotificacoes();
    p.style.display = 'block';
    // Esconde badge ao abrir
    const badge = g('notif-badge');
    if (badge) badge.style.display = 'none';
    // Fecha ao clicar fora
    setTimeout(() => {
      function fecharFora(ev) {
        const container = p.closest('[style*="position:relative"]') || p.parentElement;
        if (!container.contains(ev.target)) {
          p.style.display = 'none';
          document.removeEventListener('click', fecharFora, true);
        }
      }
      document.addEventListener('click', fecharFora, true);
    }, 0);
  } else {
    p.style.display = 'none';
  }
}
function atualizarNotificacoes() {
  const alertas = [];
  const hoje = new Date();

  const emp30 = DB.empenhos.filter(e => !e.finalizado && diasSemPagamento(e) >= 30 && diasSemPagamento(e) < 60);
  const emp60 = DB.empenhos.filter(e => !e.finalizado && diasSemPagamento(e) >= 60 && diasSemPagamento(e) < 90);
  const emp90 = DB.empenhos.filter(e => !e.finalizado && diasSemPagamento(e) >= 90);

  if (emp90.length && !_notifDismissed.has('emp90'))
    alertas.push({ chave:'emp90', icon:'🔴', msg:`${emp90.length} empenho(s) com +90 dias sem pagamento`, onclick:"toggleNotificacoes();switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])" });
  if (emp60.length && !_notifDismissed.has('emp60'))
    alertas.push({ chave:'emp60', icon:'🟠', msg:`${emp60.length} empenho(s) com +60 dias sem pagamento`, onclick:"toggleNotificacoes();switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])" });
  if (emp30.length && !_notifDismissed.has('emp30'))
    alertas.push({ chave:'emp30', icon:'🟡', msg:`${emp30.length} empenho(s) com +30 dias sem pagamento`, onclick:"toggleNotificacoes();switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])" });

  const dispSemEmp = DB.disputas.filter(d => {
    if (d.finalizada) return false;
    if (DB.empenhos.some(e => e.disputaId === d.id)) return false;
    if (!d.data) return false;
    return Math.floor((hoje - new Date(d.data)) / 86400000) >= 15;
  });
  if (dispSemEmp.length && !_notifDismissed.has('disp-sem-emp'))
    alertas.push({ chave:'disp-sem-emp', icon:'📋', msg:`${dispSemEmp.length} contrato(s) sem empenho há +15 dias`, onclick:"toggleNotificacoes();switchTab('disputas',document.querySelectorAll('.tab-btn')[2])" });

  const empSemCompra = DB.empenhos.filter(e => !e.finalizado && !(e.compras||[]).length);
  if (empSemCompra.length && !_notifDismissed.has('emp-sem-compra'))
    alertas.push({ chave:'emp-sem-compra', icon:'⚠️', msg:`${empSemCompra.length} empenho(s) sem compra cadastrada`, onclick:"toggleNotificacoes();switchTab('empenhos',document.querySelectorAll('.tab-btn')[3])" });

  const badge = g('notif-badge');
  const list = g('notif-list');
  if (badge && g('notif-panel').style.display === 'none') {
    badge.textContent = alertas.length;
    badge.style.display = alertas.length ? 'block' : 'none';
  }
  if (list) {
    list.innerHTML = alertas.length
      ? alertas.map(a => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:8px;border-radius:8px;margin-bottom:4px;border-left:3px solid var(--warning);background:var(--warning-soft);">
          <span style="font-size:16px;flex-shrink:0;cursor:pointer;" onclick="${a.onclick}">${a.icon}</span>
          <span style="font-size:12px;line-height:1.5;color:var(--text-primary);flex:1;cursor:pointer;" onclick="${a.onclick}">${a.msg}</span>
          <button onclick="dispensarNotificacao('${a.chave}')" title="Dispensar" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:14px;padding:0 2px;flex-shrink:0;" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-tertiary)'">✕</button>
        </div>`).join('')
      : '<div style="color:var(--text-tertiary);font-size:12px;">Sem alertas no momento ✅</div>';
  }
}

