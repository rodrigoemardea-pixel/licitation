// LicitationBiznis: camada visual isolada do formulario de acompanhamento (#modal-acomp), novo e edicao.
// 07 (openModal) e 12 (clearAcomp, editAcomp, saveAcomp) continuam responsaveis por tudo. Os campos sao
// apenas reposicionados em cartoes, com os mesmos ids. Nenhum valor e lido ou gravado por este modulo.
(function () {
  'use strict';

  const P = '#modal-acomp.na2';
  const css = `
${P} .modal{max-width:900px!important;width:96%}
${P} .modal-header{align-items:flex-start;gap:16px;padding:18px 22px 14px}
${P} #ttl-acomp{text-transform:none;font-size:18px!important;font-weight:700;letter-spacing:-.25px}
${P} .na2-sub{margin:4px 0 0;font-size:12.5px;line-height:1.5;color:#687586}
${P} .modal-close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;border-radius:8px!important}
${P} .modal-body{padding:18px 22px;background:var(--bg-app,#f6f8f9)}
${P} .na2-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px;min-width:0}
${P} .na2-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
${P} .na2-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
${P} .na2-head p{margin:2px 0 0;font-size:12px;color:#5f6d68;line-height:1.4}
${P} .na2-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
${P} .na2-ico svg,${P} .na2-foot-hint svg{display:block;flex:0 0 auto}
${P} .na2-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
${P} .na2-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}
${P} .na2-grid .fg{min-width:0;grid-column:auto!important}
${P} .na2-grid .na2-w2{grid-column:span 2!important}
${P} .na2-grid .na2-w3{grid-column:span 3!important}
${P} .na2-grid .na2-w4{grid-column:1/-1!important}
${P} .fl{text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:600!important;color:#566158!important;margin-bottom:4px;display:flex!important;align-items:center;justify-content:flex-start!important;gap:4px}
${P} .na2-req{color:#a42b25;font-weight:700}
${P} .na2-help{margin-top:5px;font-size:11.5px;color:#5f6d68;line-height:1.4}
${P} .na2-count{margin-left:auto;font-size:11px;color:#5f6d68;font-weight:500;font-variant-numeric:tabular-nums}
${P} .modal-footer{align-items:center;justify-content:flex-end;gap:10px}
${P} .na2-foot-hint{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0;font-size:12px;line-height:1.4;color:#5f6d68}
${P} .na2-foot-hint svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} button:focus-visible,${P} select:focus-visible,${P} input:focus-visible,${P} textarea:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:760px){${P} .na2-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}${P} .na2-grid .na2-w3{grid-column:1/-1!important}}
@media(max-width:520px){${P} .na2-grid{grid-template-columns:minmax(0,1fr)!important}${P} .na2-grid .na2-w2{grid-column:1/-1!important}${P} .modal-body{padding:12px}${P} .na2-card{padding:14px}${P} .modal-footer{flex-wrap:wrap}${P} .na2-foot-hint{flex:1 1 100%;margin-right:0}}
`;

  const paths = {
    building: 'M3 20h18M5 20V7l7-4v17M19 20V10l-7-3M8 9h1M8 12h1M8 15h1M15 12h1M15 15h1',
    file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5 M12 8h.01'
  };
  const svg = (n, s) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + paths[n] + '"/></svg>';
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const fgOf = (id) => { const e = $(id); return e ? e.closest('.fg') : null; };

  function safe(label, fn) {
    try { fn(); return true; } catch (err) {
      window.__naErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[acompanhamento-modal] ' + label + ':', err);
      return false;
    }
  }

  /* Rotulo novo, sem emoji, ligado ao campo. */
  function relabel(id, text) {
    const fg = fgOf(id);
    const label = fg && fg.querySelector('label.fl');
    if (!label) return;
    label.htmlFor = id;
    label.textContent = text;
  }

  function card(id, title, icon, sub) {
    const s = el('section', 'na2-card');
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    const h = el('div', 'na2-head');
    const i = el('span', 'na2-ico');
    i.innerHTML = svg(icon, 16);
    const tx = el('div');
    const t = el('h3', '', title);
    t.id = id + '-t';
    tx.appendChild(t);
    if (sub) tx.appendChild(el('p', '', sub));
    h.append(i, tx);
    s.appendChild(h);
    return s;
  }

  function grid(items) {
    const g = el('div', 'na2-grid');
    items.forEach(([id, text, w]) => {
      const fg = fgOf(id);
      if (!fg) return;
      relabel(id, text);
      fg.classList.remove('full', 'half');
      if (w) fg.classList.add('na2-' + w);
      g.appendChild(fg);
    });
    return g;
  }

  function sync() {
    const t = $('ttl-acomp');
    if (t) {
      const v = t.textContent.trim();
      if (v === 'Novo Acompanhamento') t.textContent = 'Novo acompanhamento';
      else if (v === 'Editar Acompanhamento') t.textContent = 'Editar acompanhamento';
    }
    const sub = $('na2-sub');
    if (sub) {
      const editing = /Editar/.test((t && t.textContent) || '');
      const org = ($('ac-orgao') || {}).value || '';
      sub.textContent = editing && org ? org : 'Cadastre a licitação que será acompanhada até virar contrato.';
    }
    const c = $('ac-observacao'), n = $('na2-obs-count');
    if (c && n) n.textContent = c.value.length + '/' + (c.maxLength > 0 ? c.maxLength : 300);
  }

  function build() {
    const overlay = $('modal-acomp');
    const modal = overlay && overlay.querySelector('.modal');
    const body = modal && modal.querySelector('.modal-body');
    const formGrid = body && body.querySelector(':scope > .form-grid');
    const head = modal && modal.querySelector('.modal-header');
    const foot = modal && modal.querySelector('.modal-footer');
    const title = $('ttl-acomp');
    if (!formGrid || !head || !foot || !title || !$('ac-orgao') || !$('ac-retorno')) throw new Error('estrutura inesperada do formulario de acompanhamento');
    if (overlay.dataset.na2Ready) return;
    overlay.dataset.na2Ready = '1';
    overlay.classList.add('na2');
    const style = el('style'); style.id = 'lb-acomp-modal-moderno'; style.textContent = css; document.head.appendChild(style);

    const ht = el('div');
    head.insertBefore(ht, title);
    ht.appendChild(title);
    const sub = el('p', 'na2-sub'); sub.id = 'na2-sub'; ht.appendChild(sub);

    /* Os cartoes entram na pagina antes de receber os campos: assim os campos nunca ficam fora do
       documento, nem mesmo se algo falhar no meio da montagem. */
    const holder = el('div', 'na2-sections');
    body.insertBefore(holder, formGrid);

    /* 1. Orgao e empresa. */
    const s1 = card('na2-sec-orgao', 'Órgão e empresa', 'building');
    holder.appendChild(s1);
    s1.appendChild(grid([['ac-orgao', 'Órgão', 'w3'], ['ac-estado', 'UF'], ['ac-empresa', 'Empresa'], ['ac-analista', 'Analista'], ['ac-data', 'Data do contrato', 'w2']]));
    const orgLab = s1.querySelector('label[for="ac-orgao"]');
    if (orgLab) { const r = el('span', 'na2-req', '*'); r.setAttribute('aria-hidden', 'true'); orgLab.appendChild(r); }
    $('ac-orgao').setAttribute('aria-required', 'true');

    /* 2. Processo. */
    const s2 = card('na2-sec-proc', 'Processo', 'file');
    holder.appendChild(s2);
    s2.appendChild(grid([['ac-tipo', 'Tipo de processo'], ['ac-processo', 'Nº do processo'], ['ac-sistema', 'Sistema', 'w2'], ['ac-link', 'Link do sistema', 'w4']]));
    const pr = $('ac-processo'); if (pr && /^Ex: /.test(pr.placeholder)) pr.placeholder = 'Ex.: 001/2026';

    /* 3. Acompanhamento. */
    const s3 = card('na2-sec-acomp', 'Acompanhamento', 'clock', 'O lembrete de retorno é exibido no horário informado.');
    holder.appendChild(s3);
    s3.appendChild(grid([['ac-status', 'Status', 'w2'], ['ac-retorno', 'Data e hora de retorno', 'w2']]));

    /* 4. Observacao. */
    const s4 = card('na2-sec-obs', 'Observação', 'note');
    holder.appendChild(s4);
    const fgO = fgOf('ac-observacao');
    if (fgO) {
      relabel('ac-observacao', 'Situação atual');
      const cnt = el('span', 'na2-count'); cnt.id = 'na2-obs-count';
      fgO.querySelector('label.fl').appendChild(cnt);
      const o = $('ac-observacao'); if (o && /SITUA/i.test(o.placeholder)) o.placeholder = 'Situação atual, motivo do recurso...';
      fgO.classList.remove('full');
      s4.appendChild(fgO);
    }

    if (!formGrid.querySelector('input,select,textarea')) formGrid.style.display = 'none';

    const hint = el('div', 'na2-foot-hint');
    hint.innerHTML = svg('info', 15);
    hint.appendChild(el('span', '', 'Campo obrigatório: órgão.'));
    foot.insertBefore(hint, foot.firstChild);
    const save = foot.querySelector('.btn-primary');
    if (save && save.textContent.trim() === 'Salvar') save.textContent = 'Salvar acompanhamento';

    new MutationObserver(() => safe('titulo', sync)).observe(title, { childList: true, characterData: true, subtree: true });
    new MutationObserver((rs) => {
      const was = (v) => (' ' + (v || '') + ' ').indexOf(' open ') >= 0;
      if (overlay.classList.contains('open') && rs.some((r) => !was(r.oldValue))) {
        body.scrollTop = 0;
        safe('abertura', sync);
      }
    }).observe(overlay, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    const o = $('ac-observacao'); if (o) o.addEventListener('input', () => safe('contador', sync));
    sync();
  }

  function init() {
    if (!safe('estrutura', build)) { const o = $('modal-acomp'); if (o) o.classList.remove('na2'); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
