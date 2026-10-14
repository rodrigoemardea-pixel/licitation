// LicitationBiznis: camada visual isolada do relatorio "Entregas pendentes" (#modal-rel-entregas).
// O modulo 21-relatorio-entregas.js continua montando a tela, filtrando, salvando e exportando.
// Este modulo so ajusta a apresentacao depois de cada renderizacao, observando o modal:
//  - cabecalho, filtros e rodape no padrao das demais telas;
//  - resumo em cartoes (os contadores sao lidos do resumo original, que fica oculto);
//  - datas em dd/mm/aaaa, selo "Atrasada" e linha atrasada marcada sem pintar a linha inteira.
// Nenhum dado e recalculado. O modal e criado sob demanda pelo 21, por isso o modulo aguarda o elemento.
(function () {
  'use strict';

  const P = '#modal-rel-entregas.re2';
  const css = `
${P} .modal{border-radius:16px!important;overflow:hidden!important;max-height:94vh!important;width:min(98vw,1640px)!important;max-width:min(98vw,1640px)!important}
${P} .modal-head{padding:18px 22px 14px!important;border-bottom:1px solid var(--surface-border,#e3e8e5);gap:16px;align-items:flex-start!important;flex:0 0 auto}
${P} .modal-head .modal-title{font-size:18px!important;font-weight:700!important;letter-spacing:-.25px;color:var(--text-primary,#17231e)}
${P} .modal-head .modal-title+div{font-size:12.5px!important;color:#687586!important;margin-top:4px!important;line-height:1.5}
${P} .modal-head>.btn{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;padding:0!important;display:inline-grid!important;place-items:center;border:1px solid var(--border-medium,#ccd5d0)!important;border-radius:8px!important;background:#fff!important;color:#34413b!important;flex:0 0 36px}
${P} .modal-head>.btn .lb-ui-icon{margin:0!important}
${P} .modal-body{padding:16px 22px!important;gap:14px!important;background:var(--bg-app,#f6f8f9)}
${P} .re2-filters{display:flex!important;flex-wrap:wrap;align-items:flex-end;gap:12px!important;padding:14px!important;border:1px solid var(--surface-border,#e3e8e5)!important;border-radius:12px!important;background:#fff!important}
${P} .re2-filters>.form-group{flex:1 1 180px;min-width:0;margin:0!important}
${P} .re2-filters>.form-group>label{display:block;font-size:12px!important;font-weight:600;color:#566158;margin-bottom:4px}
${P} .re2-filters .fc{min-height:40px;text-transform:none!important}
${P} .re2-filters>.form-group.re2-check{flex:0 0 auto;display:flex!important;align-items:flex-end}
${P} .re2-filters>.form-group.re2-check>label{display:inline-flex!important;align-items:center;gap:8px;min-height:40px;margin:0;padding:0 12px;border:1px solid var(--border-medium,#ccd5d0);border-radius:8px;background:#fff;font-size:12.5px!important;font-weight:600!important;color:#34413b;cursor:pointer;white-space:nowrap}
${P} .re2-filters>.form-group.re2-check>label:has(input:checked){border-color:#b32929;background:#f9e8e8;color:#a42b25}
${P} .re2-clear{flex:0 0 auto;min-height:40px;padding:0 14px;border:1px solid var(--border-medium,#ccd5d0);border-radius:8px;background:#fff;color:#34413b;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
${P} .re2-clear:hover{background:var(--bg-surface-hover,#f4f7f5)}
${P} #rep-ent-resumo{display:none!important}
${P} .re2-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) minmax(max-content,1.2fr);gap:12px;flex:0 0 auto}
${P} .re2-kpi{display:flex;align-items:center;gap:12px;min-width:0;padding:12px 14px;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;background:#fff;font:inherit;text-align:left;color:inherit}
${P} button.re2-kpi{cursor:pointer}
${P} button.re2-kpi:hover{border-color:#2d6a4f}
${P} .re2-kpi[aria-pressed="true"]{border:2px solid #2d6a4f;background:#edf6f1;padding:11px 13px}
${P} .re2-kicon{width:36px;height:36px;flex:0 0 36px;border-radius:10px;display:grid;place-items:center;background:#edf1ef;color:#34413b}
${P} .re2-kicon svg,${P} .re2-chip svg{display:block;flex:0 0 auto}
${P} .re2-kicon svg{width:18px!important;height:18px!important;max-width:18px!important;max-height:18px!important}
${P} .re2-kmain{min-width:0}
${P} .re2-klabel{font-size:12px;color:#5f6d68;line-height:1.35}
${P} .re2-kvalue{font-size:clamp(15px,1.3vw,20px);font-weight:700;line-height:1.2;color:#34413b;font-variant-numeric:tabular-nums;white-space:nowrap}
${P} .re2-t-green .re2-kicon{background:#e6f2ec;color:#2d6a4f}
${P} .re2-t-green .re2-kvalue{color:#2d6a4f}
${P} .re2-t-amber .re2-kicon{background:#fbefdb;color:#8a5200}
${P} .re2-t-red .re2-kicon{background:#f9e8e8;color:#b32929}
${P} .re2-t-red .re2-kvalue{color:#b32929}
${P} .re2-note{margin:-6px 0 0;font-size:11.5px;color:#5f6d68;flex:0 0 auto}
${P} .re2-table{border:1px solid var(--surface-border,#e3e8e5)!important;border-radius:12px!important;background:#fff;min-height:200px}
${P} .re2-table table{font-size:12.5px!important;min-width:1180px}
${P} .re2-table thead{background:#f7f9f8!important}
${P} .re2-table th{padding:10px!important;height:auto;background:#f7f9f8!important;color:#5f6d68!important;font-size:11.5px!important;font-weight:650;letter-spacing:0!important;text-transform:none!important;white-space:nowrap;border-bottom:1px solid var(--surface-border,#e3e8e5)!important;border-left:0!important;cursor:default}
${P} .re2-table td{padding:8px 10px!important;height:auto;font-size:12.5px!important;line-height:1.4;color:var(--text-secondary,#455468);border-bottom:1px solid #e8ecea!important;border-left:0!important;font-family:var(--font-sans)!important;font-variant-numeric:tabular-nums;vertical-align:middle}
${P} .re2-table tbody tr:hover>td{background:#f3f7f5!important}
${P} .re2-table td:nth-child(1),${P} .re2-table td:nth-child(3){white-space:normal;min-width:180px;overflow-wrap:anywhere;color:var(--text-primary,#17231e);font-weight:500}
${P} .re2-table th:nth-child(4),${P} .re2-table td:nth-child(4),${P} .re2-table th:nth-child(5),${P} .re2-table td:nth-child(5),${P} .re2-table th:nth-child(7),${P} .re2-table td:nth-child(7){text-align:right}
${P} .re2-table td:nth-child(2),${P} .re2-table td:nth-child(5),${P} .re2-table td:nth-child(6),${P} .re2-table td:nth-child(9){white-space:nowrap}
${P} .re2-table tr.re2-late>td{background:#fff!important}
${P} .re2-table tr.re2-late>td:first-child{box-shadow:inset 3px 0 0 #b32929}
${P} .re2-table tr.re2-late:hover>td{background:#fbf3f3!important}
${P} .re2-table select.fc{min-width:158px!important}
${P} .re2-table select.fc,${P} .re2-table input.fc{min-height:34px!important;height:34px;font-size:12.5px!important;padding:4px 8px!important;border-radius:8px!important;text-transform:none!important}
${P} .re2-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:11.5px;font-weight:650;white-space:nowrap}
${P} .re2-chip svg{width:12px!important;height:12px!important;max-width:12px!important;max-height:12px!important}
${P} .re2-chip.re2-red{background:#f9e8e8;color:#a42b25}
${P} .re2-muted{color:#5f6d68}
${P} .modal-actions{padding:14px 22px!important;border-top:1px solid var(--surface-border,#e3e8e5);background:#fff;flex:0 0 auto;align-items:center;gap:10px!important;flex-wrap:wrap}
${P} .re2-foot-hint{margin-right:auto;font-size:12px;color:#5f6d68;line-height:1.4;min-width:0}
${P} .modal-actions .btn-primary{background:var(--accent,#2d6a4f)!important;box-shadow:none!important}
${P} button:focus-visible,${P} select:focus-visible,${P} input:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:1280px){${P} .re2-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:700px){${P} .re2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}${P} .re2-kpis>.re2-kpi:last-child{grid-column:1/-1}${P} .modal-body{padding:12px!important}${P} .modal-head{padding:14px!important}${P} .modal-actions{padding:12px 14px!important}${P} .re2-foot-hint{flex:1 1 100%;margin-right:0}${P} .re2-filters>.form-group{flex:1 1 100%}${P} .re2-clear{flex:1 1 auto}}
`;

  const paths = {
    list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
    truck: 'M3 6h11v10H3z M14 10h4l3 3v3h-7 M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    x: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9 9l6 6 M15 9l-6 6',
    alert: 'M12 3l10 18H2z M12 9v5 M12 17h.01',
    money: 'M12 2v20 M18 6c-3-4-12-3-12 2s12 3 12 8-9 6-12 2'
  };
  const svg = (name, size) =>
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' +
    paths[name] + '"/></svg>';
  const $ = (id) => document.getElementById(id);

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function safe(label, fn) {
    try { fn(); return true; } catch (err) {
      window.__reErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[entregas-pendentes] ' + label + ':', err);
      return false;
    }
  }

  const brDate = (s) => {
    const m = String(s || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : null;
  };

  /* Filtros chamam a renderizacao publica do 21 (window.renderRelEntregas), como os onchange originais. */
  function rerender() { if (typeof window.renderRelEntregas === 'function') window.renderRelEntregas(); }

  const KPIS = [
    { key: 'Total', label: 'Total', icon: 'list', tone: 'neutral', status: '' },
    { key: 'Aguardando envio', label: 'Aguardando envio', icon: 'box', tone: 'amber', status: 'aguardando_envio' },
    { key: 'Em trânsito', label: 'Em trânsito', icon: 'truck', tone: 'neutral', status: 'em_transito' },
    { key: 'Não recebida', label: 'Não recebida', icon: 'x', tone: 'neutral', status: 'nao_recebida' },
    { key: 'Atrasadas', label: 'Atrasadas', icon: 'alert', tone: 'red', late: true },
    { key: 'Valor total', label: 'Valor total', icon: 'money', tone: 'green' }
  ];

  function readSummary(resumo) {
    const out = {};
    [...resumo.querySelectorAll('span')].forEach((s) => {
      const t = s.textContent.trim();
      const i = t.indexOf(':');
      if (i > 0) out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    });
    return out;
  }

  function renderKpis() {
    const resumo = $('rep-ent-resumo'), box = $('re2-kpis');
    if (!resumo || !box) return;
    const data = readSummary(resumo);
    const status = ($('rep-ent-status') || {}).value || '';
    const lateOn = !!($('rep-ent-atrasadas') || {}).checked;
    box.replaceChildren();
    KPIS.forEach((k) => {
      const value = data[k.key] != null ? data[k.key] : '—';
      const clickable = k.status !== undefined || k.late;
      const c = el(clickable ? 'button' : 'div', 're2-kpi');
      let tone = k.tone;
      if (k.late && value !== '0' && value !== '—') tone = 'red';
      else if (k.late) tone = 'neutral';
      c.classList.add('re2-t-' + tone);
      if (clickable) {
        c.type = 'button';
        const pressed = k.late ? lateOn : (status === k.status);
        c.setAttribute('aria-pressed', String(pressed));
        c.title = k.late ? 'Mostrar apenas compras atrasadas' : (k.status ? 'Filtrar por ' + k.label.toLowerCase() : 'Mostrar todos os pendentes');
        c.addEventListener('click', () => {
          if (k.late) { const cb = $('rep-ent-atrasadas'); if (cb) cb.checked = !cb.checked; }
          else { const s = $('rep-ent-status'); if (s) s.value = k.status; }
          rerender();
        });
      }
      const ic = el('span', 're2-kicon');
      ic.innerHTML = svg(k.icon, 18);
      const main = el('span', 're2-kmain');
      main.append(el('span', 're2-klabel', k.label), el('span', 're2-kvalue', value));
      main.querySelectorAll('span').forEach((s) => { s.style.display = 'block'; });
      c.append(ic, main);
      box.appendChild(c);
    });
  }

  function decorateRows() {
    const tb = $('rep-ent-tbody');
    if (!tb) return;
    [...tb.rows].forEach((tr) => {
      if (tr.dataset.re2 || tr.cells.length < 12) return;
      tr.dataset.re2 = '1';
      const c = tr.cells;
      if (/239,\s*68,\s*68/.test(tr.getAttribute('style') || '')) { tr.classList.add('re2-late'); tr.style.removeProperty('background'); }
      c[1].style.removeProperty('font-family');
      c[4].style.removeProperty('font-family');
      const dc = brDate(c[5].textContent);
      if (dc) c[5].textContent = dc;
      const prevSpan = c[8].querySelector('span');
      const raw = (prevSpan ? prevSpan.textContent : c[8].textContent).replace(/[^\d-]/g, '');
      const dp = brDate(raw);
      if (tr.classList.contains('re2-late') && dp) {
        const chip = el('span', 're2-chip re2-red');
        chip.innerHTML = svg('alert', 12);
        chip.appendChild(document.createTextNode('Atrasada · ' + dp));
        c[8].replaceChildren(chip);
      } else if (dp) {
        c[8].textContent = dp;
      } else {
        c[8].replaceChildren(el('span', 're2-muted', '—'));
      }
    });
  }

  function syncFilters() {
    const status = ($('rep-ent-status') || {}).value || '';
    document.querySelectorAll('#re2-kpis button.re2-kpi').forEach((b, i) => {
      const k = KPIS[i];
      if (!k) return;
      b.setAttribute('aria-pressed', String(k.late ? !!($('rep-ent-atrasadas') || {}).checked : status === k.status));
    });
  }

  function build(overlay) {
    if (overlay.dataset.re2Ready) return;
    const modal = overlay.querySelector('.modal');
    const head = modal && modal.querySelector('.modal-head');
    const body = modal && modal.querySelector('.modal-body');
    const actions = modal && modal.querySelector('.modal-actions');
    const filters = body && body.firstElementChild;
    const resumo = $('rep-ent-resumo');
    const tbody = $('rep-ent-tbody');
    if (!modal || !head || !body || !actions || !filters || !resumo || !tbody) throw new Error('estrutura inesperada do relatorio de entregas');
    overlay.dataset.re2Ready = '1';
    overlay.classList.add('re2');

    if (!$('lb-entregas-pendentes-moderno')) {
      const style = document.createElement('style');
      style.id = 'lb-entregas-pendentes-moderno';
      style.textContent = css;
      document.head.appendChild(style);
    }

    const close = head.querySelector(':scope > .btn');
    if (close) { close.setAttribute('aria-label', 'Fechar'); close.title = 'Fechar'; }
    const sub = head.querySelector('.modal-title + div');
    if (sub) sub.textContent = 'Compras sem confirmação de recebimento em empenhos ativos. Altere o status e a data de recebimento direto na tabela.';

    /* Filtros. */
    filters.classList.add('re2-filters');
    filters.querySelectorAll(':scope > .form-group').forEach((fg) => {
      const control = fg.querySelector('select, input:not([type=checkbox])');
      const label = fg.querySelector(':scope > label');
      if (control && label && !label.htmlFor) label.htmlFor = control.id;
      if (fg.querySelector('input[type=checkbox]')) fg.classList.add('re2-check');
    });
    const fixLabel = (id, text) => { const l = filters.querySelector('label[for="' + id + '"]'); if (l) l.textContent = text; };
    fixLabel('rep-ent-orgao', 'Órgão');
    fixLabel('rep-ent-analista', 'Analista');
    const po = $('rep-ent-orgao'); if (po) po.placeholder = 'Filtrar por órgão...';
    const pa = $('rep-ent-analista'); if (pa) pa.placeholder = 'Filtrar por analista...';
    const clear = el('button', 're2-clear', 'Limpar filtros');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      ['rep-ent-status', 'rep-ent-empresa', 'rep-ent-orgao', 'rep-ent-analista'].forEach((id) => { const e = $(id); if (e) e.value = ''; });
      const cb = $('rep-ent-atrasadas'); if (cb) cb.checked = false;
      rerender();
    });
    filters.appendChild(clear);

    /* Resumo em cartoes, logo abaixo dos filtros. */
    const kpis = el('div', 're2-kpis');
    kpis.id = 're2-kpis';
    kpis.setAttribute('role', 'group');
    kpis.setAttribute('aria-label', 'Resumo das entregas pendentes');
    resumo.insertAdjacentElement('afterend', kpis);
    const note = el('p', 're2-note', 'Contagens e valor dos resultados filtrados. Clique em um cartão para filtrar por status ou por atraso.');
    kpis.insertAdjacentElement('afterend', note);

    /* Tabela: cabecalhos em caixa normal. */
    const table = tbody.closest('table');
    table.parentElement.classList.add('re2-table');
    const names = ['Órgão', 'Nº empenho', 'Item', 'Qtd.', 'Vl. total', 'Data da compra', 'Dias', 'Status', 'Previsão de entrega', 'Data de recebimento', 'Plataforma', 'Analista'];
    [...table.tHead.rows[0].cells].forEach((th, i) => { if (names[i]) th.textContent = names[i]; });

    /* Rodape. */
    const hint = el('div', 're2-foot-hint', 'Alterar o status ou a data de recebimento salva a compra na hora.');
    actions.insertBefore(hint, actions.firstChild);

    /* O 21 reescreve o resumo e as linhas a cada renderizacao (inclusive pelas chamadas internas, que nao
       passam por window.renderRelEntregas). Os observadores reaplicam a apresentacao. */
    new MutationObserver(() => safe('resumo', renderKpis)).observe(resumo, { childList: true });
    new MutationObserver(() => safe('linhas', decorateRows)).observe(tbody, { childList: true });
    filters.addEventListener('change', () => safe('filtros', syncFilters));
    renderKpis();
    decorateRows();
  }

  function attach() {
    const o = $('modal-rel-entregas');
    if (o && !o.dataset.re2Ready) {
      if (!safe('estrutura', () => build(o))) o.classList.remove('re2');
    }
    return !!o;
  }

  function init() {
    if (attach()) return;
    const obs = new MutationObserver(() => { if (attach()) obs.disconnect(); });
    obs.observe(document.body, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
