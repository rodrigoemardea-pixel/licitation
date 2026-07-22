// ========== LISTA DE TAREFAS DO EMPENHO (estilo Outlook / To-Do) ==========
// Adiciona no detalhe do empenho uma lista de tarefas textuais livres.
// - Digite e adicione tarefas
// - Clique na tarefa para marcar/desmarcar como concluída (tachada)
// - Exclua tarefas
// As tarefas ficam salvas em emp.tarefas[] e são persistidas via save('empenhos').
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
  function toastSafe(msg, type){
    if (typeof window.toast === 'function') { window.toast(msg, type); return; }
  }

  // ID do empenho atualmente aberto no popup
  let _empenhoAtual = null;

  // ---------- Estilos ----------
  function injetarEstilos(){
    if (document.getElementById('lb-tarefas-empenho-style')) return;
    const st = document.createElement('style');
    st.id = 'lb-tarefas-empenho-style';
    st.textContent = `
      .lb-tarefas-box{
        margin:12px 0;padding:12px 14px;border:1px solid var(--border-light);
        border-radius:12px;background:var(--bg-surface-soft);
      }
      .lb-tarefas-head{
        display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;
      }
      .lb-tarefas-titulo{
        font-size:11px;font-weight:800;letter-spacing:.4px;color:var(--text-tertiary);
        text-transform:uppercase;display:flex;align-items:center;gap:6px;
      }
      .lb-tarefas-contador{
        font-size:10px;font-weight:700;color:var(--text-tertiary);
        background:var(--bg-surface);border:1px solid var(--border-light);
        padding:2px 8px;border-radius:20px;
      }
      .lb-tarefas-form{display:flex;gap:8px;margin-bottom:10px;}
      .lb-tarefas-input{
        flex:1;font-size:13px;padding:8px 10px;border:1px solid var(--border-light);
        border-radius:8px;background:var(--bg-surface);color:var(--text-primary);outline:none;
      }
      .lb-tarefas-input:focus{border-color:var(--accent,#2d6a4f);}
      .lb-tarefas-add{
        border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;
        background:var(--accent,#2d6a4f);color:#fff;cursor:pointer;white-space:nowrap;
      }
      .lb-tarefas-add:hover{filter:brightness(1.08);}
      .lb-tarefas-lista{display:flex;flex-direction:column;gap:6px;}
      .lb-tarefa-item{
        display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;
        background:var(--bg-surface);border:1px solid var(--border-light);
        transition:background .15s;
      }
      .lb-tarefa-item:hover{background:var(--bg-surface-soft);}
      .lb-tarefa-check{
        width:18px;height:18px;min-width:18px;border-radius:5px;
        border:2px solid var(--border);display:flex;align-items:center;justify-content:center;
        cursor:pointer;font-size:12px;color:#fff;background:transparent;transition:all .15s;
      }
      .lb-tarefa-item.feita .lb-tarefa-check{
        background:var(--success,#22c55e);border-color:var(--success,#22c55e);
      }
      .lb-tarefa-texto{
        flex:1;font-size:13px;color:var(--text-primary);cursor:pointer;
        word-break:break-word;line-height:1.35;
      }
      .lb-tarefa-item.feita .lb-tarefa-texto{
        text-decoration:line-through;color:var(--text-tertiary);
      }
      .lb-tarefa-del{
        border:none;background:none;color:var(--text-tertiary);cursor:pointer;
        font-size:15px;line-height:1;padding:2px 4px;border-radius:6px;opacity:.6;
      }
      .lb-tarefa-del:hover{color:var(--danger,#ef4444);opacity:1;background:rgba(239,68,68,0.1);}
      .lb-tarefas-vazio{
        font-size:12px;color:var(--text-tertiary);text-align:center;padding:10px 0;
      }
    `;
    document.head.appendChild(st);
  }

  // ---------- Operações ----------
  function _getEmpenho(id){
    return _bancoEmpenhos().find(e => e.id === id) || null;
  }

  function adicionarTarefa(empenhoId){
    const input = document.getElementById('lb-tarefa-nova-' + empenhoId);
    if (!input) return;
    const texto = (input.value || '').trim();
    if (!texto) { input.focus(); return; }

    const emp = _getEmpenho(empenhoId);
    if (!emp) return;
    if (!Array.isArray(emp.tarefas)) emp.tarefas = [];
    emp.tarefas.push({ id:_uid(), texto: texto, feita:false, criadaEm: new Date().toISOString() });

    _salvar(_bancoEmpenhos());
    input.value = '';
    renderTarefas(empenhoId);
    input.focus();
  }

  function alternarTarefa(empenhoId, tarefaId){
    const emp = _getEmpenho(empenhoId);
    if (!emp || !Array.isArray(emp.tarefas)) return;
    const t = emp.tarefas.find(x => x.id === tarefaId);
    if (!t) return;
    t.feita = !t.feita;
    _salvar(_bancoEmpenhos());
    renderTarefas(empenhoId);
  }

  function excluirTarefa(empenhoId, tarefaId){
    const emp = _getEmpenho(empenhoId);
    if (!emp || !Array.isArray(emp.tarefas)) return;
    emp.tarefas = emp.tarefas.filter(x => x.id !== tarefaId);
    _salvar(_bancoEmpenhos());
    renderTarefas(empenhoId);
  }

  // ---------- Render ----------
  function renderTarefas(empenhoId){
    const lista = document.getElementById('lb-tarefas-lista-' + empenhoId);
    const contador = document.getElementById('lb-tarefas-contador-' + empenhoId);
    if (!lista) return;

    const emp = _getEmpenho(empenhoId);
    const tarefas = (emp && Array.isArray(emp.tarefas)) ? emp.tarefas : [];

    if (!tarefas.length) {
      lista.innerHTML = '<div class="lb-tarefas-vazio">Nenhuma tarefa. Adicione a primeira acima.</div>';
    } else {
      lista.innerHTML = tarefas.map(t => `
        <div class="lb-tarefa-item${t.feita ? ' feita' : ''}">
          <div class="lb-tarefa-check" title="Marcar como concluída"
               onclick="lbTarefaAlternar('${empenhoId}','${t.id}')">${t.feita ? '✓' : ''}</div>
          <div class="lb-tarefa-texto"
               onclick="lbTarefaAlternar('${empenhoId}','${t.id}')">${escHTML(t.texto)}</div>
          <button class="lb-tarefa-del" title="Excluir tarefa"
                  onclick="lbTarefaExcluir('${empenhoId}','${t.id}')">🗑</button>
        </div>
      `).join('');
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
    // Evita duplicar
    if (body.querySelector('.lb-tarefas-box')) {
      renderTarefas(empenhoId);
      return;
    }

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
        <button class="lb-tarefas-add" onclick="lbTarefaAdicionar('${empenhoId}')">Adicionar</button>
      </div>
      <div class="lb-tarefas-lista" id="lb-tarefas-lista-${empenhoId}"></div>
    `;
    // Insere ao final do corpo do popup
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
      _empenhoAtual = id;
      setTimeout(() => montarBloco(id), 0);
      setTimeout(() => montarBloco(id), 90);
      setTimeout(() => montarBloco(id), 260);
      return r;
    };
    wrapped._lbTarefasWrapped = true;
    window.abrirPopupEmpenho = wrapped;
    return true;
  }

  function init(){
    injetarEstilos();

    // Handlers globais usados pelos onclick inline
    window.lbTarefaAdicionar = adicionarTarefa;
    window.lbTarefaAlternar  = alternarTarefa;
    window.lbTarefaExcluir   = excluirTarefa;

    if (!wrapAbrirPopup()){
      let tentativas = 0;
      const t = setInterval(() => {
        tentativas++;
        if (wrapAbrirPopup() || tentativas > 25) clearInterval(t);
      }, 200);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();