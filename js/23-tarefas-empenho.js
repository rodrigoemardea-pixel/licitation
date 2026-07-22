// ========== LISTA DE TAREFAS DO EMPENHO (estilo Outlook / To-Do) ==========
// - Tarefas textuais livres com data (prazo) opcional
// - Clique na tarefa para marcar/desmarcar como concluída (tachada)
// - Editar tarefas ainda não concluídas (texto e data)
// - Arrastar para reordenar
// - Excluir tarefas
// - Notificação das tarefas pendentes que vencem HOJE (navegador + painel interno)
// Persistência em emp.tarefas[] via save('empenhos').
// Módulo autônomo: faz wrap de abrirPopupEmpenho, sem alterar código existente.
(function(){
  'use strict';

  // ---------- Acesso ao banco ----------
  function _tryGet(fn){ try { return fn(); } catch(e){ return undefined; } }
  function _bancoEmpenhos(){
    let arr;
    arr = _tryGet(() => DB.empenhos);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => _fullDB.empenhos); if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window.DB && window.DB.empenhos);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window._fullDB && window._fullDB.empenhos); if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => DB.empenhos);      if (Array.isArray(arr)) return arr;
    arr = _tryGet(() => _fullDB.empenhos); if (Array.isArray(arr)) return arr;
    return [];
  }
  function _salvar(empenhos){
    if (typeof save === 'function') { try { save('empenhos', empenhos); return; } catch(e){ console.error(e); } }
    if (typeof window.save === 'function') { try { window.save('empenhos', empenhos); } catch(e){ console.error(e); } }
  }
  function _uid(){
    if (typeof uid === 'function') { try { return uid(); } catch(e){} }
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }
  function escHTML(v){
    return String(v ?? '').replace(/[&<>"']/g, ch =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function escAttr(v){ return escHTML(v).replace(/`/g,'&#96;'); }
  function hojeISO(){
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0,10);
  }
  function fmtDataBR(iso){
    if (!iso) return '';
    const p = iso.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
  }

  // ---------- Estilos ----------
  function injetarEstilos(){
    if (document.getElementById('lb-tarefas-empenho-style')) return;
    const st = document.createElement('style');
    st.id = 'lb-tarefas-empenho-style';
    st.textContent = `
      .lb-tarefas-box{margin:12px 0;padding:12px 14px;border:1px solid var(--border-light);border-radius:12px;background:var(--bg-surface-soft);}
      .lb-tarefas-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
      .lb-tarefas-titulo{font-size:11px;font-weight:800;letter-spacing:.4px;color:var(--text-tertiary);text-transform:uppercase;display:flex;align-items:center;gap:6px;}
      .lb-tarefas-contador{font-size:10px;font-weight:700;color:var(--text-tertiary);background:var(--bg-surface);border:1px solid var(--border-light);padding:2px 8px;border-radius:20px;}
      .lb-tarefas-form{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
      .lb-tarefas-input{flex:1;min-width:160px;font-size:13px;padding:8px 10px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-surface);color:var(--text-primary);outline:none;}
      .lb-tarefas-input:focus{border-color:var(--accent,#2d6a4f);}
      .lb-tarefas-data{font-size:13px;padding:8px 10px;border:1px solid var(--border-light);border-radius:8px;background:var(--bg-surface);color:var(--text-primary);outline:none;}
      .lb-tarefas-add{border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;background:var(--accent,#2d6a4f);color:#fff;cursor:pointer;white-space:nowrap;}
      .lb-tarefas-add:hover{filter:brightness(1.08);}
      .lb-tarefas-lista{display:flex;flex-direction:column;gap:6px;}
      .lb-tarefa-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border-light);transition:background .15s,opacity .15s;}
      .lb-tarefa-item:hover{background:var(--bg-surface-soft);}
      .lb-tarefa-item.lb-dragging{opacity:.5;border-style:dashed;}
      .lb-tarefa-item.lb-drag-over{border-color:var(--accent,#2d6a4f);box-shadow:0 0 0 2px var(--accent,#2d6a4f) inset;}
      .lb-tarefa-grip{cursor:grab;color:var(--text-tertiary);font-size:14px;line-height:1;user-select:none;opacity:.5;padding:0 2px;}
      .lb-tarefa-grip:hover{opacity:1;}
      .lb-tarefa-grip:active{cursor:grabbing;}
      .lb-tarefa-check{width:18px;height:18px;min-width:18px;border-radius:5px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;color:#fff;background:transparent;transition:all .15s;}
      .lb-tarefa-item.feita .lb-tarefa-check{background:var(--success,#22c55e);border-color:var(--success,#22c55e);}
      .lb-tarefa-corpo{flex:1;display:flex;flex-direction:column;gap:2px;cursor:pointer;min-width:0;}
      .lb-tarefa-texto{font-size:13px;color:var(--text-primary);word-break:break-word;line-height:1.35;}
      .lb-tarefa-item.feita .lb-tarefa-texto{text-decoration:line-through;color:var(--text-tertiary);}
      .lb-tarefa-data{font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:4px;color:var(--text-tertiary);}
      .lb-tarefa-data.hoje{color:#b45309;}
      .lb-tarefa-data.atrasada{color:#ef4444;}
      .lb-tarefa-acoes{display:flex;gap:2px;}
      .lb-tarefa-btn{border:none;background:none;color:var(--text-tertiary);cursor:pointer;font-size:14px;line-height:1;padding:3px 5px;border-radius:6px;opacity:.6;}
      .lb-tarefa-btn:hover{opacity:1;background:var(--bg-surface-soft);}
      .lb-tarefa-btn.del:hover{color:var(--danger,#ef4444);background:rgba(239,68,68,0.1);}
      .lb-tarefa-btn.edit:hover{color:var(--accent,#2d6a4f);}
      .lb-tarefas-vazio{font-size:12px;color:var(--text-tertiary);text-align:center;padding:10px 0;}
      .lb-tarefa-edit-wrap{flex:1;display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
      .lb-tarefa-edit-texto{flex:1;min-width:140px;font-size:13px;padding:6px 8px;border:1px solid var(--accent,#2d6a4f);border-radius:6px;background:var(--bg-surface);color:var(--text-primary);outline:none;}
      .lb-tarefa-edit-data{font-size:12px;padding:6px 8px;border:1px solid var(--border-light);border-radius:6px;background:var(--bg-surface);color:var(--text-primary);}
      .lb-notif-tarefas{position:fixed;right:18px;bottom:18px;width:360px;max-width:92vw;max-height:70vh;background:var(--bg-surface,#fff);border:1px solid var(--border-light);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.22);z-index:99999;display:flex;flex-direction:column;overflow:hidden;font-family:inherit;}
      .lb-notif-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#b45309;color:#fff;}
      .lb-notif-head b{font-size:13px;}
      .lb-notif-close{border:none;background:none;color:#fff;font-size:16px;cursor:pointer;opacity:.9;}
      .lb-notif-close:hover{opacity:1;}
      .lb-notif-body{padding:8px;overflow:auto;display:flex;flex-direction:column;gap:6px;}
      .lb-notif-item{display:flex;flex-direction:column;gap:2px;padding:9px 10px;border:1px solid var(--border-light);border-radius:9px;cursor:pointer;transition:background .15s;}
      .lb-notif-item:hover{background:var(--bg-surface-soft);}
      .lb-notif-item .t{font-size:13px;font-weight:600;color:var(--text-primary);}
      .lb-notif-item .m{font-size:11px;color:var(--text-tertiary);}
      .lb-notif-item.atrasada{border-color:#ef4444;}
      .lb-notif-item.atrasada .prazo{color:#ef4444;font-weight:700;}
      .lb-notif-foot{padding:8px 12px;border-top:1px solid var(--border-light);font-size:10px;color:var(--text-tertiary);text-align:center;}
    `;
    document.head.appendChild(st);
  }

  // ---------- Operações ----------
  function _getEmpenho(id){ return _bancoEmpenhos().find(e => e.id === id) || null; }
  const _editando = {};

  function adicionarTarefa(empenhoId){
    const input = document.getElementById('lb-tarefa-nova-' + empenhoId);
    const inputData = document.getElementById('lb-tarefa-data-' + empenhoId);
    if (!input) return;
    const texto = (input.value || '').trim();
    if (!texto) { input.focus(); return; }
    const data = inputData ? (inputData.value || '') : '';
    const emp = _getEmpenho(empenhoId);
    if (!emp) return;
    if (!Array.isArray(emp.tarefas)) emp.tarefas = [];
    emp.tarefas.push({ id:_uid(), texto, data, feita:false, criadaEm: new Date().toISOString() });
    _salvar(_bancoEmpenhos());
    input.value = '';
    if (inputData) inputData.value = '';
    renderTarefas(empenhoId);
    input.focus();
  }

  function alternarTarefa(empenhoId, tarefaId){
    if (_editando[empenhoId] === tarefaId) return;
    const emp = _getEmpenho(empenhoId);
    if (!emp || !Array.isArray(emp.tarefas)) return;
    const t = emp.tarefas.find(x => x.id === tarefaId);
    if (!t) return;
    t.feita = !t.feita;
    if (_editando[empenhoId] === tarefaId) delete _editando[empenhoId];
    _salvar(_bancoEmpenhos());
    renderTarefas(empenhoId);
  }

  function excluirTarefa(empenhoId, tarefaId){
    const emp = _getEmpenho(empenhoId);
    if (!emp || !Array.isArray(emp.tarefas)) return;
    emp.tarefas = emp.tarefas.filter(x => x.id !== tarefaId);
    if (_editando[empenhoId] === tarefaId) delete _editando[empenhoId];
    _salvar(_bancoEmpenhos());
    renderTarefas(empenhoId);
  }

  function iniciarEdicao(empenhoId, tarefaId){
    const emp = _getEmpenho(empenhoId);
    const t = emp && (emp.tarefas||[]).find(x => x.id === tarefaId);
    if (!t || t.feita) return;
    _editando[empenhoId] = tarefaId;
    renderTarefas(empenhoId);
    setTimeout(() => {
      const inp = document.getElementById('lb-edit-texto-' + tarefaId);
      if (inp) { inp.focus(); inp.select(); }
    }, 0);
  }
  function salvarEdicao(empenhoId, tarefaId){
    const emp = _getEmpenho(empenhoId);
    const t = emp && (emp.tarefas||[]).find(x => x.id === tarefaId);
    if (!t) return;
    const inpTexto = document.getElementById('lb-edit-texto-' + tarefaId);
    const inpData  = document.getElementById('lb-edit-data-' + tarefaId);
    const novoTexto = inpTexto ? inpTexto.value.trim() : t.texto;
    if (!novoTexto) { if (inpTexto) inpTexto.focus(); return; }
    t.texto = novoTexto;
    t.data  = inpData ? (inpData.value || '') : t.data;
    delete _editando[empenhoId];
    _salvar(_bancoEmpenhos());
    renderTarefas(empenhoId);
  }
  function cancelarEdicao(empenhoId){
    delete _editando[empenhoId];
    renderTarefas(empenhoId);
  }

  // ---------- Reordenação (drag & drop) ----------
  let _drag = null;
  function _reordenar(empenhoId, origemId, destinoId){
    if (origemId === destinoId) return;
    const emp = _getEmpenho(empenhoId);
    if (!emp || !Array.isArray(emp.tarefas)) return;
    const arr = emp.tarefas;
    const io = arr.findIndex(t => t.id === origemId);
    const id2 = arr.findIndex(t => t.id === destinoId);
    if (io === -1 || id2 === -1) return;
    const [mov] = arr.splice(io, 1);
    arr.splice(id2, 0, mov);
    _salvar(_bancoEmpenhos());
    renderTarefas(empenhoId);
  }
  function _bindDragEvents(empenhoId){
    const lista = document.getElementById('lb-tarefas-lista-' + empenhoId);
    if (!lista) return;
    lista.querySelectorAll('.lb-tarefa-item[draggable="true"]').forEach(item => {
      item.addEventListener('dragstart', e => {
        _drag = { empenhoId, tarefaId: item.dataset.tid };
        item.classList.add('lb-dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', item.dataset.tid); } catch(err){}
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('lb-dragging');
        lista.querySelectorAll('.lb-drag-over').forEach(el => el.classList.remove('lb-drag-over'));
        _drag = null;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (_drag && _drag.empenhoId === empenhoId) item.classList.add('lb-drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('lb-drag-over'));
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('lb-drag-over');
        if (_drag && _drag.empenhoId === empenhoId) {
          _reordenar(empenhoId, _drag.tarefaId, item.dataset.tid);
        }
      });
    });
  }

  // ---------- Render da lista ----------
  function renderTarefas(empenhoId){
    const lista = document.getElementById('lb-tarefas-lista-' + empenhoId);
    const contador = document.getElementById('lb-tarefas-contador-' + empenhoId);
    if (!lista) return;
    const emp = _getEmpenho(empenhoId);
    const tarefas = (emp && Array.isArray(emp.tarefas)) ? emp.tarefas : [];
    const hoje = hojeISO();
    const editId = _editando[empenhoId];

    if (!tarefas.length) {
      lista.innerHTML = '<div class="lb-tarefas-vazio">Nenhuma tarefa. Adicione a primeira acima.</div>';
    } else {
      lista.innerHTML = tarefas.map(t => {
        if (editId === t.id && !t.feita) {
          return `
          <div class="lb-tarefa-item" data-tid="${t.id}">
            <span class="lb-tarefa-grip" title="Arraste para reordenar">⋮⋮</span>
            <div class="lb-tarefa-edit-wrap">
              <input type="text" class="lb-tarefa-edit-texto" id="lb-edit-texto-${t.id}"
                     value="${escAttr(t.texto)}"
                     onkeydown="if(event.key==='Enter'){event.preventDefault();lbTarefaSalvarEdicao('${empenhoId}','${t.id}');}if(event.key==='Escape'){lbTarefaCancelarEdicao('${empenhoId}');}">
              <input type="date" class="lb-tarefa-edit-data" id="lb-edit-data-${t.id}" value="${t.data||''}">
              <button class="lb-tarefa-btn" title="Salvar" onclick="lbTarefaSalvarEdicao('${empenhoId}','${t.id}')">💾</button>
              <button class="lb-tarefa-btn" title="Cancelar" onclick="lbTarefaCancelarEdicao('${empenhoId}')">✕</button>
            </div>
          </div>`;
        }
        let dataHTML = '';
        if (t.data) {
          let cls = '';
          if (!t.feita && t.data < hoje) cls = 'atrasada';
          else if (!t.feita && t.data === hoje) cls = 'hoje';
          const rot = (cls === 'atrasada') ? '⚠ atrasada · ' : (cls === 'hoje' ? '⏰ hoje · ' : '📅 ');
          dataHTML = `<span class="lb-tarefa-data ${cls}">${rot}${fmtDataBR(t.data)}</span>`;
        }
        const btnEditar = t.feita ? '' :
          `<button class="lb-tarefa-btn edit" title="Editar" onclick="event.stopPropagation();lbTarefaEditar('${empenhoId}','${t.id}')">✏️</button>`;
        return `
        <div class="lb-tarefa-item${t.feita ? ' feita' : ''}" data-tid="${t.id}" draggable="true">
          <span class="lb-tarefa-grip" title="Arraste para reordenar">⋮⋮</span>
          <div class="lb-tarefa-check" title="Marcar como concluída"
               onclick="lbTarefaAlternar('${empenhoId}','${t.id}')">${t.feita ? '✓' : ''}</div>
          <div class="lb-tarefa-corpo" onclick="lbTarefaAlternar('${empenhoId}','${t.id}')">
            <span class="lb-tarefa-texto">${escHTML(t.texto)}</span>
            ${dataHTML}
          </div>
          <div class="lb-tarefa-acoes">
            ${btnEditar}
            <button class="lb-tarefa-btn del" title="Excluir" onclick="event.stopPropagation();lbTarefaExcluir('${empenhoId}','${t.id}')">🗑</button>
          </div>
        </div>`;
      }).join('');
      _bindDragEvents(empenhoId);
    }
    if (contador) {
      const feitas = tarefas.filter(t => t.feita).length;
      contador.textContent = feitas + '/' + tarefas.length;
    }
  }

  // ---------- Injeção no popup ----------
  function montarBloco(empenhoId){
    const body = document.getElementById('popup-e-body');
    if (!body) return;
    if (body.querySelector('.lb-tarefas-box')) { renderTarefas(empenhoId); return; }
    const box = document.createElement('section');
    box.className = 'lb-tarefas-box';
    box.innerHTML = `
      <div class="lb-tarefas-head">
        <div class="lb-tarefas-titulo">📋 Tarefas do empenho</div>
        <span class="lb-tarefas-contador" id="lb-tarefas-contador-${empenhoId}">0/0</span>
      </div>
      <div class="lb-tarefas-form">
        <input type="text" class="lb-tarefas-input" id="lb-tarefa-nova-${empenhoId}"
               placeholder="Nova tarefa..." autocomplete="off"
               onkeydown="if(event.key==='Enter'){event.preventDefault();lbTarefaAdicionar('${empenhoId}');}">
        <input type="date" class="lb-tarefas-data" id="lb-tarefa-data-${empenhoId}" title="Prazo (opcional)">
        <button class="lb-tarefas-add" onclick="lbTarefaAdicionar('${empenhoId}')">Adicionar</button>
      </div>
      <div class="lb-tarefas-lista" id="lb-tarefas-lista-${empenhoId}"></div>
    `;
    body.appendChild(box);
    renderTarefas(empenhoId);
  }

  // ---------- Wrap do abrirPopupEmpenho ----------
  function wrapAbrirPopup(){
    const original = window.abrirPopupEmpenho;
    if (typeof original !== 'function') return false;
    if (original._lbTarefasWrapped) return true;
    const wrapped = function(id){
      const r = original.apply(this, arguments);
      setTimeout(() => montarBloco(id), 0);
      setTimeout(() => montarBloco(id), 90);
      setTimeout(() => montarBloco(id), 260);
      return r;
    };
    wrapped._lbTarefasWrapped = true;
    window.abrirPopupEmpenho = wrapped;
    return true;
  }

  // ---------- Notificações ----------
  function coletarTarefasDoDia(){
    const hoje = hojeISO();
    const itens = [];
    _bancoEmpenhos().forEach(e => {
      if (e.finalizado) return;
      (e.tarefas || []).forEach(t => {
        if (t.feita || !t.data) return;
        if (t.data <= hoje) {
          itens.push({
            empenhoId: e.id, orgao: e.orgao || '', numEmpenho: e.num || '',
            texto: t.texto, data: t.data, atrasada: t.data < hoje
          });
        }
      });
    });
    itens.sort((a,b) => {
      if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
      return (a.data||'').localeCompare(b.data||'');
    });
    return itens;
  }
  function _notificarNavegador(itens){
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => { if (p === 'granted') _dispararNativa(itens); });
      } else if (Notification.permission === 'granted') {
        _dispararNativa(itens);
      }
    } catch(e){}
  }
  function _dispararNativa(itens){
    if (!itens.length) return;
    const hoje = itens.filter(i => !i.atrasada).length;
    const atras = itens.filter(i => i.atrasada).length;
    let corpo = '';
    if (hoje)  corpo += `${hoje} tarefa(s) para hoje`;
    if (atras) corpo += (corpo?' · ':'') + `${atras} atrasada(s)`;
    try {
      const n = new Notification('Tarefas de empenhos', {
        body: corpo + '. Clique para ver.',
        icon: 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>")
      });
      n.onclick = function(){ window.focus(); abrirPainelNotif(); n.close(); };
    } catch(e){}
  }
  function abrirPainelNotif(){
    const itens = coletarTarefasDoDia();
    let painel = document.getElementById('lb-notif-tarefas');
    if (painel) painel.remove();
    if (!itens.length) return;
    painel = document.createElement('div');
    painel.className = 'lb-notif-tarefas';
    painel.id = 'lb-notif-tarefas';
    const hoje = itens.filter(i => !i.atrasada).length;
    const atras = itens.filter(i => i.atrasada).length;
    let resumo = [];
    if (hoje)  resumo.push(`${hoje} para hoje`);
    if (atras) resumo.push(`${atras} atrasada(s)`);
    painel.innerHTML = `
      <div class="lb-notif-head">
        <b>📋 Tarefas pendentes (${resumo.join(' · ')})</b>
        <button class="lb-notif-close" onclick="lbFecharPainelNotif()">✕</button>
      </div>
      <div class="lb-notif-body">
        ${itens.map(i => `
          <div class="lb-notif-item${i.atrasada?' atrasada':''}" onclick="lbAbrirEmpenhoTarefa('${i.empenhoId}')">
            <span class="t">${escHTML(i.texto)}</span>
            <span class="m">
              ${escHTML(i.orgao)}${i.numEmpenho?(' · #'+escHTML(i.numEmpenho)):''}
              · <span class="prazo">${i.atrasada?'⚠ atrasada ':'⏰ '}${fmtDataBR(i.data)}</span>
            </span>
          </div>
        `).join('')}
      </div>
      <div class="lb-notif-foot">Clique em uma tarefa para abrir o empenho</div>
    `;
    document.body.appendChild(painel);
  }
  function fecharPainelNotif(){
    const p = document.getElementById('lb-notif-tarefas');
    if (p) p.remove();
  }
  function abrirEmpenhoTarefa(empenhoId){
    fecharPainelNotif();
    if (typeof abrirPopupEmpenho === 'function') { try { abrirPopupEmpenho(empenhoId); } catch(e){} }
  }

  let _jaNotificou = false;
  function verificarTarefasDoDia(force){
    const itens = coletarTarefasDoDia();
    if (!itens.length) return;
    if (!force && _jaNotificou) return;
    _jaNotificou = true;
    _notificarNavegador(itens);
    abrirPainelNotif();
  }

  function init(){
    injetarEstilos();
    window.lbTarefaAdicionar     = adicionarTarefa;
    window.lbTarefaAlternar      = alternarTarefa;
    window.lbTarefaExcluir       = excluirTarefa;
    window.lbTarefaEditar        = iniciarEdicao;
    window.lbTarefaSalvarEdicao  = salvarEdicao;
    window.lbTarefaCancelarEdicao= cancelarEdicao;
    window.lbFecharPainelNotif   = fecharPainelNotif;
    window.lbAbrirEmpenhoTarefa  = abrirEmpenhoTarefa;
    window.lbVerificarTarefasDia = () => verificarTarefasDoDia(true);

    if (!wrapAbrirPopup()){
      let tentativas = 0;
      const t = setInterval(() => {
        tentativas++;
        if (wrapAbrirPopup() || tentativas > 25) clearInterval(t);
      }, 200);
    }
    let n = 0;
    const it = setInterval(() => {
      n++;
      const temDados = _bancoEmpenhos().length > 0;
      if (temDados) { verificarTarefasDoDia(false); clearInterval(it); }
      if (n > 30) clearInterval(it);
    }, 1000);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();