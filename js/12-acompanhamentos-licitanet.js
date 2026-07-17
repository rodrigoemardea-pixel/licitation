// ========== ACOMPANHAMENTOS ==========
let EID_acomp = null;
let _notifTimer = null;
let _notifShown = new Set();

function saveAcomp() {
  const orgao = document.getElementById('ac-orgao')?.value?.trim();
  if (!orgao) { toast('Informe o órgão!', 'error'); return; }
  const retornoVal = document.getElementById('ac-retorno')?.value || '';
  // FIX 6: avisar se data de retorno já está no passado — usa modal customizado
  if (retornoVal) {
    const retDate = new Date(retornoVal);
    if (retDate < new Date()) {
      _confirmarAcao({
        icon: '⚠️',
        titulo: 'Retorno no passado',
        msg: `A data de retorno informada já está no passado:<br><strong>${retDate.toLocaleString('pt-BR')}</strong><br><br>Deseja salvar mesmo assim?`,
        btnLabel: 'Salvar mesmo assim',
        btnClass: 'btn-ghost',
        onConfirm: () => { _doSaveAcomp(retornoVal); }
      });
      return;
    }
  }
  _doSaveAcomp(retornoVal);
}

function _doSaveAcomp(retornoVal) {
  const orgao = document.getElementById('ac-orgao')?.value?.trim();
  const row = {
    id: EID_acomp || uid(),
    data: document.getElementById('ac-data')?.value || '',
    orgao: orgao.toUpperCase(),
    estado: document.getElementById('ac-estado')?.value || '',
    sistema: document.getElementById('ac-sistema')?.value || '',
    analista: document.getElementById('ac-analista')?.value || '',
    status: document.getElementById('ac-status')?.value || 'pendente',
    empresa: document.getElementById('ac-empresa')?.value || '',
    tipo: document.getElementById('ac-tipo')?.value || '',
    processo: (document.getElementById('ac-processo')?.value || '').toUpperCase(),
    link: document.getElementById('ac-link')?.value || '',
    retorno: retornoVal,
    observacao: document.getElementById('ac-observacao')?.value?.toUpperCase() || '',
  };
  if (!_fullDB.acomp) _fullDB.acomp = [];
  // FIX 5: Status "perdida" → confirmar exclusão imediata
  if (row.status === 'perdida') {
    closeModal('acomp', true);
    _confirmarAcao({
      icon: '❌',
      titulo: 'Marcar como Perdida',
      msg: `O acompanhamento <strong>${row.orgao}</strong> será marcado como <strong>perdida</strong> e excluído da lista.<br><br>Deseja confirmar?`,
      btnLabel: '❌ Confirmar exclusão',
      btnClass: 'btn-danger',
      onConfirm: () => {
        _fullDB.acomp = (_fullDB.acomp||[]).filter(x => x.id !== row.id);
        save('acomp', _fullDB.acomp);
        EID_acomp = null;
        renderActive();
        toast('Acompanhamento removido (perdida).', 'info');
      }
    });
    return;
  }
  const idx = _fullDB.acomp.findIndex(x => x.id === row.id);
  if (idx !== -1) _fullDB.acomp[idx] = row; else _fullDB.acomp.push(row);
  save('acomp', _fullDB.acomp);
  toast(EID_acomp ? 'Acompanhamento atualizado!' : 'Acompanhamento salvo!', 'success');
  EID_acomp = null;
  closeModal('acomp', true);
  renderActive();
  // E-mail gerenciado exclusivamente pelo checarRetornos (2min antes)
}

function clearAcomp() {
  EID_acomp = null;
  ['ac-data','ac-orgao','ac-estado','ac-sistema','ac-analista','ac-status','ac-empresa','ac-tipo','ac-processo','ac-link','ac-retorno','ac-observacao'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  setAnalistaSelect('ac-analista', (isAdmin ? 'Márdea' : analistaDoUsuario) || 'Márdea');
  document.getElementById('ac-status').value = 'pendente';
  document.getElementById('ac-sistema').value = 'Licitanet';
  document.getElementById('ttl-acomp').textContent = 'Novo Acompanhamento';
}

function editAcomp(id) {
  const r = (DB.acomp||[]).find(x => x.id === id); if (!r) return;
  clearAcomp();
  EID_acomp = id;
  document.getElementById('ac-data').value = r.data || '';
  document.getElementById('ac-orgao').value = r.orgao || '';
  document.getElementById('ac-estado').value = r.estado || '';
  document.getElementById('ac-sistema').value = r.sistema || '';
  setAnalistaSelect('ac-analista', r.analista || analistaDoUsuario || '');
  document.getElementById('ac-status').value = r.status || 'pendente';
  document.getElementById('ac-empresa').value = r.empresa || '';
  document.getElementById('ac-tipo').value = r.tipo || '';
  document.getElementById('ac-processo').value = r.processo || '';
  document.getElementById('ac-link').value = r.link || '';
  document.getElementById('ac-retorno').value = r.retorno || '';
  document.getElementById('ac-observacao').value = r.observacao || '';
  document.getElementById('ttl-acomp').textContent = 'Editar Acompanhamento';
  document.getElementById('modal-acomp').classList.add('open');
}

function delAcomp(id) {
  const a = (DB.acomp||[]).find(x => x.id === id);
  PDel = { tab: 'acomp', id };
  const iconEl = g('confirm-modal-icon'); if(iconEl) iconEl.textContent = '👁️';
  const titleEl = g('confirm-modal-title'); if(titleEl) titleEl.textContent = 'Excluir acompanhamento';
  const el = g('confirm-msg'); if(el) el.innerHTML = `Tem certeza que deseja excluir o acompanhamento <strong>${a?.orgao||'?'}</strong>?<br><br>Esta ação não pode ser desfeita.`;
  const btn = g('confirm-del-btn');
  if(btn) btn.onclick = () => {
    _fullDB.acomp = (_fullDB.acomp||[]).filter(x => x.id !== id);
    save('acomp', _fullDB.acomp);
    renderActive();
    toast('Excluído!', 'success');
    PDel = null; closeConfirm();
  };
  g('modal-confirm').classList.add('open');
}


// ========== ABRIR TODOS OS ACOMPANHAMENTOS ==========
function abrirTodosAcompanhamentos() {
  // Aplica os mesmos filtros da tela
  const analista = document.getElementById('filtro-analista-acomp')?.value || 'todos';
  const status = document.getElementById('filtro-status-acomp')?.value || 'todos';
  const empresa = document.getElementById('filtro-empresa-acomp')?.value || 'todos';
  const tipoFiltro = document.getElementById('filtro-tipo-acomp')?.value || 'todos';
  const busca = (document.getElementById('search-acomp')?.value || '').toLowerCase();

  const rows = (DB.acomp||[]).filter(r => {
    if (analista !== 'todos' && r.analista !== analista) return false;
    if (status !== 'todos' && r.status !== status) return false;
    if (empresa !== 'todos' && r.empresa !== empresa) return false;
    if (tipoFiltro !== 'todos' && r.tipo !== tipoFiltro) return false;
    if (busca && !r.orgao?.toLowerCase().includes(busca) && !r.observacao?.toLowerCase().includes(busca)) return false;
    return true;
  });

  const comLink = rows.filter(r => r.link);
  if (!comLink.length) {
    showToast('Nenhum acompanhamento filtrado possui link cadastrado.', 'warning');
    return;
  }

  // Confirmação antes de abrir muitas abas
  if (comLink.length > 5) {
    if (!confirm(`Abrir ${comLink.length} abas simultaneamente?`)) return;
  }

  // Credenciais Licitanet salvas (se houver)
  const licitanetCreds = _getLicitanetCreds();

  comLink.forEach(r => {
    // Para acompanhamentos do Licitanet, tenta auto-login
    if (r.sistema === 'Licitanet' && licitanetCreds.user && licitanetCreds.pass) {
      _abrirComAutoLogin(r.link, licitanetCreds);
    } else {
      window.open(r.link, '_blank');
    }
  });

  showToast(`${comLink.length} aba(s) aberta(s).`, 'success');
}

// ========== LICITANET AUTO-LOGIN ==========
function _getLicitanetCreds() {
  return {
    user: localStorage.getItem('licitanet_user') || '',
    pass: localStorage.getItem('licitanet_pass') || ''
  };
}
function _setLicitanetCreds(user, pass) {
  if (user) localStorage.setItem('licitanet_user', user);
  else localStorage.removeItem('licitanet_user');
  if (pass) localStorage.setItem('licitanet_pass', pass);
  else localStorage.removeItem('licitanet_pass');
}

function configurarLicitanet() {
  const creds = _getLicitanetCreds();
  const overlay = document.createElement('div');
  overlay.id = 'licitanet-config-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:var(--bg-surface-solid);border-radius:var(--radius-xl);padding:32px;max-width:420px;width:90%;box-shadow:var(--shadow-xl);">
      <div style="font-size:18px;font-weight:700;margin-bottom:20px;">Credenciais Licitanet</div>
      <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:16px;">Salve suas credenciais para login automatico ao usar "Abrir Todos". Os dados ficam apenas no seu navegador (localStorage).</p>
      <div style="margin-bottom:12px;">
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Usuario</label>
        <input type="text" id="licitanet-cfg-user" value="${creds.user}" placeholder="Seu usuario Licitanet" style="width:100%;padding:10px 12px;border:1px solid var(--border-medium);border-radius:var(--radius-sm);font-size:13px;background:var(--bg-surface);color:var(--text-primary);">
      </div>
      <div style="margin-bottom:20px;">
        <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Senha</label>
        <input type="password" id="licitanet-cfg-pass" value="${creds.pass}" placeholder="Sua senha Licitanet" style="width:100%;padding:10px 12px;border:1px solid var(--border-medium);border-radius:var(--radius-sm);font-size:13px;background:var(--bg-surface);color:var(--text-primary);">
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="document.getElementById('licitanet-config-popup').remove();" class="btn btn-ghost">Cancelar</button>
        <button onclick="_salvarCredsLicitanet()" class="btn btn-primary">Salvar</button>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function _salvarCredsLicitanet() {
  const u = document.getElementById('licitanet-cfg-user')?.value?.trim() || '';
  const p = document.getElementById('licitanet-cfg-pass')?.value || '';
  _setLicitanetCreds(u, p);
  document.getElementById('licitanet-config-popup')?.remove();
  showToast(u ? 'Credenciais Licitanet salvas.' : 'Credenciais removidas.', 'success');
}

function _abrirComAutoLogin(linkOriginal, creds) {
  // Tenta auto-login via form POST em nova aba
  // O SSO do Licitanet fica em https://licita-sso.licitanet.com.br/
  // Se houver CSRF token ou outro bloqueio, apenas abre a pagina normalmente
  try {
    const loginUrl = 'https://licita-sso.licitanet.com.br/';
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = loginUrl;
    form.target = '_blank';
    form.style.display = 'none';
    // Campos comuns de login SSO Licitanet
    const fields = { username: creds.user, password: creds.pass, redirect: linkOriginal };
    for (const [k, v] of Object.entries(fields)) {
      const inp = document.createElement('input');
      inp.type = 'hidden'; inp.name = k; inp.value = v;
      form.appendChild(inp);
    }
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => form.remove(), 1000);
  } catch(e) {
    // Fallback: abre normalmente
    window.open(linkOriginal, '_blank');
  }
}

// Ordenação da tabela de acompanhamentos.
// A primeira seleção usa ordem crescente; novo clique na mesma coluna inverte a ordem.
let _acompSort = { campo: 'retorno', asc: true };

function sortAcomp(campo) {
  if (_acompSort.campo === campo) {
    _acompSort.asc = !_acompSort.asc;
  } else {
    _acompSort = { campo, asc: true };
  }
  renderAcomp();
}

function _valorOrdenacaoAcomp(registro, campo) {
  if (campo === 'tipo') {
    return `${registro.tipo || ''} ${registro.processo || ''}`.trim();
  }
  return registro[campo] || '';
}

function _compararAcomp(a, b) {
  const campo = _acompSort.campo;
  const valorA = _valorOrdenacaoAcomp(a, campo);
  const valorB = _valorOrdenacaoAcomp(b, campo);

  let resultado;
  if (campo === 'data' || campo === 'retorno') {
    const tempoA = valorA ? new Date(valorA).getTime() : Number.POSITIVE_INFINITY;
    const tempoB = valorB ? new Date(valorB).getTime() : Number.POSITIVE_INFINITY;
    resultado = tempoA - tempoB;
  } else {
    resultado = String(valorA).localeCompare(String(valorB), 'pt-BR', {
      sensitivity: 'base',
      numeric: true
    });
  }

  if (resultado === 0) {
    resultado = String(a.orgao || '').localeCompare(String(b.orgao || ''), 'pt-BR', {
      sensitivity: 'base',
      numeric: true
    });
  }

  return _acompSort.asc ? resultado : -resultado;
}

function _atualizarIndicadorOrdenacaoAcomp() {
  document.querySelectorAll('#tab-acompanhamentos th[id^="sort-acomp-"]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    th.removeAttribute('aria-sort');
  });

  const cabecalho = document.getElementById(`sort-acomp-${_acompSort.campo}`);
  if (!cabecalho) return;

  cabecalho.classList.add(_acompSort.asc ? 'sort-asc' : 'sort-desc');
  cabecalho.setAttribute('aria-sort', _acompSort.asc ? 'ascending' : 'descending');
}

let _paginaAcomp = 1;
const _itensPorPaginaAcomp = 8;
function irPaginaAcomp(p) { _paginaAcomp = p; renderAcomp(); }
function renderPaginacaoAcomp(total) {
  const tb=document.getElementById('tbody-acomp'); if(!tb)return;
  const pane=document.getElementById('tab-acompanhamentos');
  const wrap=tb.closest('.table-wrap')||tb.closest('.table-wrapper');
  if(pane) pane.style.minHeight='calc(100vh - 92px)';
  if(wrap) wrap.style.minHeight='330px';
  let box=document.getElementById('pagination-acomp-inline');
  if(!box){box=document.createElement('div');box.id='pagination-acomp-inline';box.className='pagination';const w=tb.closest('.table-wrap')||tb.closest('.table-wrapper');if(w?.parentNode)w.parentNode.insertBefore(box,w.nextSibling);}
  box.style.cssText='display:flex;justify-content:center;align-items:center;width:100%;margin:12px auto 0;padding:10px 0;';
  const pags=Math.ceil(total/_itensPorPaginaAcomp);
  if(pags<=1){box.style.display='none';box.innerHTML='';return;}
  _paginaAcomp=Math.max(1,Math.min(_paginaAcomp,pags));box.style.display='flex';
  let h=`<button class="page-btn" onclick="irPaginaAcomp(${_paginaAcomp-1})" ${_paginaAcomp===1?'disabled':''}>‹</button>`;
  for(let n=1;n<=pags;n++)h+=`<button class="page-btn ${n===_paginaAcomp?'active':''}" onclick="irPaginaAcomp(${n})">${n}</button>`;
  h+=`<button class="page-btn" onclick="irPaginaAcomp(${_paginaAcomp+1})" ${_paginaAcomp===pags?'disabled':''}>›</button><span class="page-info">${(_paginaAcomp-1)*8+1}-${Math.min(_paginaAcomp*8,total)} de ${total}</span>`;box.innerHTML=h;
}

function renderAcomp() {
  markAllActiveFilters();
  const tb = document.getElementById('tbody-acomp'); if (!tb) return;
  const analista = document.getElementById('filtro-analista-acomp')?.value || 'todos';
  const status = document.getElementById('filtro-status-acomp')?.value || 'todos';
  const empresa = document.getElementById('filtro-empresa-acomp')?.value || 'todos';
  const tipoFiltro = document.getElementById('filtro-tipo-acomp')?.value || 'todos';
  const busca = (document.getElementById('search-acomp')?.value || '').toLowerCase();
  const agora = new Date();

  let rows = (DB.acomp||[]).filter(r => {
    if (analista !== 'todos' && r.analista !== analista) return false;
    if (status !== 'todos' && r.status !== status) return false;
    if (empresa !== 'todos' && r.empresa !== empresa) return false;
    if (tipoFiltro !== 'todos' && r.tipo !== tipoFiltro) return false;
    if (busca && !r.orgao?.toLowerCase().includes(busca) && !r.observacao?.toLowerCase().includes(busca)) return false;
    return true;
  }).sort(_compararAcomp);

  const totalRowsAcomp=rows.length;
  const pagsAcomp=Math.max(1,Math.ceil(totalRowsAcomp/_itensPorPaginaAcomp));
  _paginaAcomp=Math.max(1,Math.min(_paginaAcomp,pagsAcomp));
  rows=rows.slice((_paginaAcomp-1)*_itensPorPaginaAcomp,_paginaAcomp*_itensPorPaginaAcomp);

  _atualizarIndicadorOrdenacaoAcomp();

  if (!rows.length) {
    tb.innerHTML = '<tr><td colspan="9"><div class="empty-state"><div class="icon">👁️</div><p>Nenhum acompanhamento</p></div></td></tr>';
    const el = document.getElementById('sum-acomp'); if(el) el.innerHTML='';
    return;
  }

  const btnStyle = 'padding:5px 9px;font-size:15px;border-radius:8px;';
  tb.innerHTML = rows.map((r, idx) => {
    const ret = r.retorno ? new Date(r.retorno) : null;
    const vencido = ret && ret < agora;
    const hoje = ret && ret.toDateString() === agora.toDateString();
    const retStr = ret ? `<span style="font-size:11px;font-weight:700;color:${vencido?'var(--danger)':hoje?'var(--warning)':'var(--text-secondary)'};">${vencido?'🔴 ':''}${ret.toLocaleDateString('pt-BR')} ${ret.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>` : '—';
    const statusColors = {pendente:'var(--warning)',recurso:'var(--accent)',perdida:'var(--danger)'};
    const statusLabels = {pendente:'⏳ Pendente',recurso:'⚖️ Recurso',perdida:'❌ Perdida'};
    const zebraTd = vencido ? 'background:rgba(239,68,68,0.05);' : (idx % 2 === 1 ? 'background:var(--bg-surface-soft);' : 'background:var(--bg-surface);');
    return `<tr style="cursor:pointer;height:34px;" onclick="verAcomp('${r.id}')">
      <td style="font-size:11px;${zebraTd}">${r.data ? new Date(r.data+'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
      <td style="${zebraTd}padding:5px 8px;"><div style="display:flex;align-items:center;gap:6px;font-weight:600;font-size:12px;min-width:0;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.orgao||'—'}</span>${r.estado ? `<span class="estado-badge" style="font-size:9px;flex:0 0 auto;">${r.estado}</span>` : ''}${r.link ? `<a href="${r.link}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="Abrir pagina de acompanhamento no sistema" style="color:var(--accent);text-decoration:none;flex:0 0 auto;">🔗</a>` : ''}</div></td>
      <td style="${zebraTd}"><span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:700;background:${r.empresa==='Hamate'?'#7c3aed20':'var(--accent)20'};color:${r.empresa==='Hamate'?'#7c3aed':'var(--accent)'};">${r.empresa||'—'}</span></td>
      <td style="${zebraTd}padding:5px 8px;"><div style="display:flex;align-items:center;gap:6px;white-space:nowrap;"><span style="font-size:11px;font-weight:600;color:var(--text-secondary);">${r.tipo||'—'}</span>${r.processo ? `<span style="font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);">${r.processo}</span>` : ''}</div></td>
      <td style="${zebraTd}"><span class="badge ${_badgeClass(r.analista)}" style="font-size:10px;">${r.analista||'—'}</span></td>
      <td style="font-size:11px;${zebraTd}">${r.sistema||'—'}</td>
      <td style="${zebraTd}"><span style="font-size:11px;font-weight:600;color:${statusColors[r.status]||'var(--text-secondary)'};">${statusLabels[r.status]||r.status}</span></td>
      <td style="${zebraTd}padding:5px 8px;cursor:pointer;" onclick="event.stopPropagation();editarRetornoAcompInline('${r.id}',this)" title="Clique para editar a data e a hora de retorno">${retStr}</td>
      <td style="text-align:center;${zebraTd}" onclick="event.stopPropagation()"><button onclick="delAcomp('${r.id}')" class="btn btn-ghost btn-sm" style="padding:4px 8px;font-size:15px;color:var(--text-tertiary);" title="Excluir" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-tertiary)'">🗑</button></td>
    </tr>`;
  }).join('');
  renderPaginacaoAcomp(totalRowsAcomp);

  const pendentes = (DB.acomp||[]).filter(r=>r.status==='pendente').length;
  const recursos = (DB.acomp||[]).filter(r=>r.status==='recurso').length;
  const vencidos = (DB.acomp||[]).filter(r=>r.retorno && new Date(r.retorno)<agora).length;
  const el = document.getElementById('sum-acomp');
  if (el) el.innerHTML =
    `<div class="card"><div class="card-label">Total</div><div class="card-value cv-blue">${(DB.acomp||[]).length}</div></div>` +
    `<div class="card"><div class="card-label">Pendentes</div><div class="card-value cv-yellow">${pendentes}</div></div>` +
    `<div class="card"><div class="card-label">Em Recurso</div><div class="card-value cv-blue">${recursos}</div></div>` +
    (vencidos ? `<div class="card" style="border-left:3px solid var(--danger);"><div class="card-label"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Retorno Vencido</div><div class="card-value" style="color:var(--danger);">${vencidos}</div></div>` : '');
}

function verAcomp(id) {
  const r = (DB.acomp||[]).find(x=>x.id===id); if(!r) return;
  const ret = r.retorno ? new Date(r.retorno) : null;
  const agora = new Date();
  const vencido = ret && ret < agora;
  const hoje = ret && ret.toDateString() === agora.toDateString();
  const statusLabels = {pendente:'⏳ Pendente',recurso:'⚖️ Em Recurso',perdida:'❌ Perdida'};
  const statusColors = {pendente:'var(--warning)',recurso:'var(--accent)',perdida:'var(--danger)'};

  g('popup-ac-title').textContent = r.orgao || 'Acompanhamento';
  g('popup-ac-sub').textContent = (r.estado ? r.estado + ' · ' : '') + (r.sistema || '') + (r.processo ? ' · ' + r.processo : '');

  const retStr = ret ? ret.toLocaleDateString('pt-BR') + ' ' + ret.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : '—';
  const retColor = vencido ? 'var(--danger)' : hoje ? 'var(--warning)' : 'var(--text-primary)';

  g('popup-ac-body').innerHTML = `
    <div class="detail-section">INFORMAÇÕES GERAIS</div>
    <div class="detail-grid">
      <div class="detail-field">
        <div class="detail-field-label">Data do Contrato</div>
        <div class="detail-field-value">${r.data ? new Date(r.data+'T12:00').toLocaleDateString('pt-BR') : '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Órgão</div>
        <div class="detail-field-value">${r.orgao || '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">UF</div>
        <div class="detail-field-value">${r.estado || '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Sistema</div>
        <div class="detail-field-value">${r.sistema || '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Analista</div>
        <div class="detail-field-value">${r.analista || '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Empresa</div>
        <div class="detail-field-value"><span style="padding:2px 8px;border-radius:10px;font-weight:700;background:${r.empresa==='Hamate'?'#7c3aed20':'var(--accent-muted)'};color:${r.empresa==='Hamate'?'#7c3aed':'var(--accent)'};">${r.empresa || '—'}</span></div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Tipo de Processo</div>
        <div class="detail-field-value">${r.tipo || '—'}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Nº do Processo</div>
        <div class="detail-field-value">${r.processo || '—'}</div>
      </div>
    </div>
    <div class="detail-section">STATUS E RETORNO</div>
    <div class="detail-grid">
      <div class="detail-field">
        <div class="detail-field-label">Status</div>
        <div class="detail-field-value"><span style="color:${statusColors[r.status]||'var(--text-primary)'};font-weight:700;">${statusLabels[r.status]||r.status||'—'}</span></div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Data/Hora de Retorno</div>
        <div class="detail-field-value"><span style="color:${retColor};font-weight:700;">${vencido?'🔴 VENCIDO · ':''}${retStr}</span></div>
      </div>
    </div>
    ${r.link ? '<div class="detail-section">LINK DO SISTEMA</div><div style="margin-bottom:10px;"><a href="'+r.link+'" target="_blank" style="color:var(--accent);font-size:12px;word-break:break-all;">'+r.link+'</a></div>' : ''}
    ${r.observacao ? '<div class="detail-section">OBSERVAÇÃO</div><div style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:var(--bg-surface-soft);padding:10px 14px;border-radius:var(--radius-md);white-space:pre-wrap;">'+r.observacao+'</div>' : ''}
    ${renderComentarios('acomp', id)}
  `;

  const editBtn = g('popup-ac-edit-btn');
  if (editBtn) editBtn.onclick = function() { fecharPopup('acomp'); editAcomp(id); };
  const convBtn = g('popup-ac-conv-btn');
  if (convBtn) convBtn.onclick = function() { fecharPopup('acomp'); converterEmDisputa(id); };

  g('popup-acomp').classList.add('open');
}

function _doCriarDisputaDeAcomp(r) {
  clearD();
  _acompConvertendoId = r.id; // guarda para remover após salvar
  document.getElementById('d-data').value = r.data||'';
  document.getElementById('d-orgao').value = r.orgao||'';
  document.getElementById('d-estado').value = r.estado||'';
  document.getElementById('d-sistema').value = r.sistema||'';
  document.getElementById('d-analista').value = r.analista||'';
  document.getElementById('ttl-disputas').textContent = 'Novo Contrato (de Acompanhamento)';
  document.getElementById('modal-disputas').classList.add('open');
}

function converterEmDisputa(id) {
  const r = (DB.acomp||[]).find(x=>x.id===id); if(!r) return;
  _confirmarAcao({icon:'🏆', titulo:'Converter em Contrato', msg:`Converter o acompanhamento <strong>${r.orgao}</strong> em Contrato?<br><br>Ele será criado na aba de Disputas com status ativo.`, btnLabel:'🏆 Converter', btnClass:'btn-primary', onConfirm: () => { _doCriarDisputaDeAcomp(r); }});
}

// ========== NOTIFICAÇÕES DE RETORNO ==========
function iniciarNotificacoes() {
  // Pede permissão para notificações do browser
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  // Checa a cada 30 segundos
  if (_notifTimer) clearInterval(_notifTimer);
  _notifTimer = setInterval(checarRetornos, 30000);
  checarRetornos(); // checa imediatamente
}

function checarRetornos() {
  const agora = new Date();
  (DB.acomp||[]).forEach(r => {
    if (!r.retorno) return;
    if (r.status !== 'pendente' && r.status !== 'recurso') return;
    const ret = parseRetorno(r.retorno);
    if (!ret) return;
    const diff = ret - agora; // ms até o retorno

    // ── Popup + som + notificação browser: no horário exato (janela: 90s antes até 30s depois) ──
    const chavePopup = 'popup|' + r.id + '|' + r.retorno;
    if (!_notifShown.has(chavePopup) && diff <= 90000 && diff > -30000) {
      _notifShown.add(chavePopup);
      dispararNotificacao(r);
    }
  });
}

function dispararNotificacao(r) {
  const titulo = `⏰ Retorno: ${r.orgao}`;
  const corpo = `${r.analista} · ${r.sistema}\n${r.observacao||''}`;

  // 1. Popup central grande
  mostrarPopupAlerta(r);

  // 2. Notificação do browser
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(titulo, { body: corpo, tag: r.id });
    n.onclick = () => { window.focus(); switchTab('acompanhamentos', document.querySelector('[onclick*="acompanhamentos"]')); renderAcomp(); };
  }

  // 3. E-mail já disparado pelo checarRetornos (2min antes) — não duplicar aqui

  // 4. Som em loop até o usuário fechar (gerenciamento global)
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    let _tmOut = null;
    const alarmeRef = { ctx, clearT: () => { clearTimeout(_tmOut); _tmOut = null; } };
    function tocarCiclo() {
      if (!ctx || ctx.state === 'closed') return;
      [659, 784, 659, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i*0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.2 + 0.35);
        osc.start(ctx.currentTime + i*0.2);
        osc.stop(ctx.currentTime + i*0.2 + 0.35);
      });
      _tmOut = setTimeout(tocarCiclo, 1500);
    }
    tocarCiclo();
    window._alarmeAtivos.push(alarmeRef);
    // Para automaticamente após 1 minuto
    setTimeout(() => window._pararTodosAlarmes?.(), 60000);
  } catch(e) {}

  updateBadges();
}


function mostrarPopupAlerta(r) {
  const old = document.getElementById('notif-popup');
  if (old) old.remove();

  const ret = r.retorno ? new Date(r.retorno).toLocaleString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';

  // Overlay escuro de fundo
  const overlay = document.createElement('div');
  overlay.id = 'notif-popup';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;animation:fadeInOverlay 0.25s ease;';

  overlay.innerHTML = `
    <div style="background:var(--bg-surface);border:3px solid var(--warning);border-radius:24px;padding:36px 40px;max-width:480px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,0.5);animation:scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);position:relative;text-align:center;">
      <div style="font-size:64px;margin-bottom:8px;animation:bellShake 0.6s ease 0.3s;">⏰</div>
      <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:var(--warning);text-transform:uppercase;margin-bottom:12px;">Lembrete de Retorno</div>
      <div style="font-size:22px;font-weight:800;color:var(--text-primary);margin-bottom:8px;line-height:1.3;">${r.orgao}</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:6px;">👤 ${r.analista} &nbsp;·&nbsp; 💻 ${r.sistema}</div>
      <div style="font-size:18px;font-weight:700;color:var(--warning);margin:16px 0;padding:12px 20px;background:rgba(245,158,11,0.1);border-radius:12px;border:1px solid rgba(245,158,11,0.3);">📅 ${ret}</div>
      ${r.observacao ? `<div style="font-size:13px;color:var(--text-secondary);background:var(--bg-surface-soft);border-radius:10px;padding:12px 16px;margin-bottom:16px;text-align:left;">💬 ${r.observacao}</div>` : ''}
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px;">
        ${r.link ? `<a href="${r.link}" target="_blank" onclick="window._pararTodosAlarmes();document.getElementById('notif-popup')?.remove();" style="text-decoration:none;background:var(--accent);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;">🔗 Abrir Sistema</a>` : ''}
        <button onclick="window._pararTodosAlarmes();switchTab('acompanhamentos',document.querySelector('[onclick*=acompanhamentos]'));renderAcomp();document.getElementById('notif-popup').remove();" style="background:var(--bg-surface-soft);color:var(--text-primary);border:1px solid var(--border-light);border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;">📋 Ver Acompanhamentos</button>
        <button onclick="window._pararTodosAlarmes();document.getElementById('notif-popup').remove();" style="background:none;color:var(--text-tertiary);border:1px solid var(--border-light);border-radius:10px;padding:12px 20px;font-size:14px;cursor:pointer;">✕ Fechar</button>
      </div>
    </div>`;

  // Fechar clicando fora do card
  overlay.addEventListener('click', e => { if (e.target === overlay) { window._pararTodosAlarmes(); overlay.remove(); } });
  document.body.appendChild(overlay);
  // Auto-fecha após 60 segundos
  setTimeout(() => { if (overlay.parentNode) { window._pararTodosAlarmes(); overlay.remove(); } }, 60000);
}



function editarRetornoAcompInline(id,celula){const r=(DB.acomp||[]).find(x=>x.id===id);if(!r||celula.querySelector('input'))return;celula.innerHTML='';const i=document.createElement('input');i.type='datetime-local';i.value=r.retorno||'';i.className='fc';i.style.cssText='min-width:185px;padding:5px 7px;font-size:11px;';let fim=false;const salvar=()=>{if(fim)return;fim=true;salvarRetornoAcompInline(id,i.value);};i.onclick=e=>e.stopPropagation();i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();salvar();}else if(e.key==='Escape'){fim=true;renderAcomp();}};i.onblur=salvar;celula.appendChild(i);i.focus();if(i.showPicker)try{i.showPicker();}catch(e){}}
function salvarRetornoAcompInline(id,v){const n=(_fullDB.acomp||[]).findIndex(x=>x.id===id);if(n<0){toast('Acompanhamento nao encontrado.','error');return renderAcomp();}if((_fullDB.acomp[n].retorno||'')===v)return renderAcomp();_fullDB.acomp[n].retorno=v||'';save('acomp',_fullDB.acomp);renderActive();toast(v?'Data de retorno atualizada!':'Data de retorno removida!','success');}
