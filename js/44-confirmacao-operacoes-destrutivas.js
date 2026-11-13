/* LicitationBiznis - confirmacao central de operacoes destrutivas.
 * Carregar como ULTIMO script, depois do modulo 43.
 * Atua antes da mutacao dos dados e nao altera formulas ou persistencia.
 */
(function () {
  'use strict';
  if (window.__lbProtecaoDestrutiva) return;
  window.__lbProtecaoDestrutiva = true;

  let dialog, titleEl, messageEl, detailsEl, cancelBtn, confirmBtn, resolver, opener;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function createDialog() {
    if (dialog) return;
    const style = document.createElement('style');
    style.id = 'lb-protecao-destrutiva-style';
    style.textContent = `
#lb-confirm-delete{box-sizing:border-box;width:calc(100% - 28px);max-width:520px;padding:0;border:1px solid var(--surface-border,#d9e0dc);border-radius:14px;background:var(--bg-surface,#fff);color:var(--text-primary,#17231e);font-family:var(--font-sans,Arial,sans-serif);box-shadow:0 24px 70px rgba(0,0,0,.28)}
#lb-confirm-delete::backdrop{background:rgba(12,20,16,.62);backdrop-filter:blur(2px)}
#lb-confirm-delete .lbcd-head{display:flex;gap:12px;align-items:flex-start;padding:20px 22px 14px}
#lb-confirm-delete .lbcd-icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border-radius:50%;background:#fbe9e9;color:#b32929;font-size:21px;font-weight:700}
#lb-confirm-delete h2{margin:1px 0 4px;font-size:18px;line-height:1.3}
#lb-confirm-delete .lbcd-warning{font-size:12px;color:var(--text-secondary,#5f6d68)}
#lb-confirm-delete .lbcd-body{padding:0 22px 20px;font-size:14px;line-height:1.55}
#lb-confirm-delete .lbcd-details{margin-top:12px;padding:11px 12px;border:1px solid #efcece;border-radius:8px;background:#fff7f7;color:#713232;font-size:12.5px;overflow-wrap:anywhere}
#lb-confirm-delete .lbcd-details:empty{display:none}
#lb-confirm-delete .lbcd-actions{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid var(--surface-border,#d9e0dc);background:var(--bg-surface-soft,#f7f9f8);border-radius:0 0 14px 14px}
#lb-confirm-delete button{min-height:40px;padding:8px 14px;border-radius:8px;font:inherit;font-weight:650;cursor:pointer}
#lb-confirm-delete .lbcd-cancel{border:1px solid var(--border-medium,#c8d2cc);background:var(--bg-surface,#fff);color:var(--text-primary,#17231e)}
#lb-confirm-delete .lbcd-confirm{border:1px solid #a91f1f;background:#b32929;color:#fff}
#lb-confirm-delete button:focus-visible{outline:3px solid #2d6a4f;outline-offset:2px}
@media(max-width:480px){#lb-confirm-delete .lbcd-actions{flex-direction:column-reverse}#lb-confirm-delete button{width:100%}}
@media(prefers-color-scheme:dark){#lb-confirm-delete{background:var(--bg-surface,#202a24);color:var(--text-primary,#edf4ef)}#lb-confirm-delete .lbcd-actions{background:var(--bg-surface-soft,#18211c)}#lb-confirm-delete .lbcd-details{background:#321f1f;color:#ffd6d6;border-color:#704040}#lb-confirm-delete .lbcd-cancel{background:#202a24;color:#edf4ef}}
`;
    document.head.appendChild(style);
    dialog = document.createElement('dialog');
    dialog.id = 'lb-confirm-delete';
    dialog.setAttribute('aria-labelledby', 'lbcd-title');
    dialog.setAttribute('aria-describedby', 'lbcd-message');
    dialog.innerHTML = `<div class="lbcd-head"><span class="lbcd-icon" aria-hidden="true">!</span><div><h2 id="lbcd-title"></h2><div class="lbcd-warning">A alteração será gravada no banco de dados e não poderá ser desfeita pelo sistema.</div></div></div><div class="lbcd-body"><div id="lbcd-message"></div><div class="lbcd-details"></div></div><div class="lbcd-actions"><button type="button" class="lbcd-cancel">Cancelar</button><button type="button" class="lbcd-confirm">Excluir definitivamente</button></div>`;
    document.body.appendChild(dialog);
    titleEl = dialog.querySelector('#lbcd-title');
    messageEl = dialog.querySelector('#lbcd-message');
    detailsEl = dialog.querySelector('.lbcd-details');
    cancelBtn = dialog.querySelector('.lbcd-cancel');
    confirmBtn = dialog.querySelector('.lbcd-confirm');
    cancelBtn.addEventListener('click', () => finish(false));
    confirmBtn.addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', e => { e.preventDefault(); finish(false); });
    dialog.addEventListener('click', e => { if (e.target === dialog) finish(false); });
  }

  function finish(ok) {
    if (!dialog || !dialog.open) return;
    dialog.close();
    const done = resolver;
    resolver = null;
    if (opener && opener.isConnected) opener.focus();
    if (done) done(ok);
  }

  function ask(options) {
    createDialog();
    if (dialog.open) finish(false);
    opener = document.activeElement;
    titleEl.textContent = options.title || 'Confirmar exclusão';
    messageEl.textContent = options.message || 'Deseja continuar?';
    detailsEl.innerHTML = options.details || '';
    confirmBtn.textContent = options.confirmLabel || 'Excluir definitivamente';
    return new Promise(resolve => {
      resolver = resolve;
      dialog.showModal();
      requestAnimationFrame(() => cancelBtn.focus());
    });
  }

  function empById(id) { return (window.DB && DB.empenhos || []).find(e => String(e.id) === String(id)); }
  function wrap(name, describe) {
    const original = window[name];
    if (typeof original !== 'function' || original.__lbProtected) return false;
    const wrapped = function () {
      const args = Array.from(arguments), ctx = this, info = describe.apply(ctx, args);
      if (!info) return original.apply(ctx, args);
      ask(info).then(ok => { if (ok) original.apply(ctx, args); });
    };
    wrapped.__lbProtected = true;
    wrapped.__lbOriginal = original;
    window[name] = wrapped;
    return true;
  }

  function install() {
    wrap('delCompra', function (empenhoId, compraId) {
      const emp = empById(empenhoId);
      const compra = emp && (emp.compras || []).find(c => String(c.id) === String(compraId));
      const item = emp && (emp.itens || []).find(i => compra && i.id === compra.itemId);
      return {
        title: 'Excluir compra?',
        message: 'A compra será removida definitivamente do empenho ' + (emp && emp.num ? emp.num : '') + '.',
        details: '<strong>Compra:</strong> ' + esc(item && item.descrição || compra && compra.loteDesc || 'sem descrição') + '<br><strong>Quantidade:</strong> ' + esc(compra && compra.qtd || 0) + '<br><strong>Valor:</strong> ' + esc(typeof fmt === 'function' ? fmt(compra && compra.vtotal || 0) : compra && compra.vtotal || 0),
        confirmLabel: 'Excluir compra'
      };
    });

    wrap('delComentário', function (comentId) {
      const c = (window.DB && DB.comentários || []).find(x => String(x.id) === String(comentId));
      return { title:'Excluir comentário?', message:'O comentário será removido definitivamente.', details:c ? '<strong>Texto:</strong> ' + esc(c.texto) : '', confirmLabel:'Excluir comentário' };
    });

    wrap('lbTarefaExcluir', function (empenhoId, tarefaId) {
      const emp = empById(empenhoId), t = emp && (emp.tarefas || []).find(x => String(x.id) === String(tarefaId));
      return { title:'Excluir tarefa?', message:'A tarefa será removida do empenho ' + (emp && emp.num || '') + '.', details:t ? '<strong>Tarefa:</strong> ' + esc(t.texto) : '', confirmLabel:'Excluir tarefa' };
    });

    wrap('delEmpenhoDisputa', function (id) {
      const emp = empById(id), count = emp && (emp.compras || []).length || 0;
      return { title:'Excluir empenho?', message:'O empenho e seus dados vinculados serao removidos definitivamente.', details:'<strong>Empenho:</strong> ' + esc(emp && emp.num || id) + '<br><strong>Órgão:</strong> ' + esc(emp && emp.orgao || '') + (count ? '<br><strong>Compras que também serao excluidas:</strong> ' + count : ''), confirmLabel:'Excluir empenho' };
    });

    wrap('importarBackup', function () {
      return { title:'Substituir dados pelo backup?', message:'A importação substituirá contratos e empenhos atuais pelos dados contidos no arquivo selecionado.', details:'Antes de continuar, exporte um backup do estado atual. Registros criados depois do arquivo importado poderão ser perdidos.', confirmLabel:'Importar e substituir' };
    });

    wrap('salvarRetornoAcompInline', function (id, value) {
      const r = (window.DB && DB.acomp || []).find(x => String(x.id) === String(id));
      if (value || !r || !r.retorno) return null;
      return { title:'Remover data de retorno?', message:'A data e a hora de retorno deste acompanhamento serão apagadas.', details:'<strong>Órgão:</strong> ' + esc(r.orgao || '') + '<br><strong>Retorno atual:</strong> ' + esc(r.retorno), confirmLabel:'Remover data' };
    });

    // As funcoes abaixo ja possuem confirmacao propria e nao recebem segunda janela:
    // delRow, deletarSelecionados, delAcomp, mudanca para status perdida e reaberturas.
  }

  function observeLateDefinitions() {
    let attempts = 0;
    const timer = setInterval(() => {
      install();
      attempts++;
      if (attempts >= 20) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { install(); observeLateDefinitions(); });
  else { install(); observeLateDefinitions(); }
})();
