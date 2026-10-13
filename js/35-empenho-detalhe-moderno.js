// LicitationBiznis: camada visual isolada do popup de detalhes do empenho (#popup-empenho).
// abrirPopupEmpenho() (JS 05) continua montando o popup e calculando os valores. Este modulo
// reorganiza o resultado em secoes, lendo os valores do HTML gerado. Nao usa DB.
// Convive com os modulos que injetam conteudo depois da abertura:
//   22 (destaque das linhas de compra), 23 (tarefas), 25 (botao da nota fiscal) e 21 (cantos).
// Os elementos injetados permanecem dentro de #popup-e-body, para que esses modulos nao os recriem.
// Tambem padroniza o botao de fechar e a dica de redimensionamento nos popups de empenho e de contrato.
(function () {
  'use strict';

  const P = '#popup-empenho.em2';
  const css = `
#popup-empenho .detail-close,#popup-disputa .detail-close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;display:inline-grid!important;place-items:center;padding:0!important;border:1px solid var(--border-medium,#ccd5d0)!important;border-radius:8px!important;background:#fff!important;color:#34413b!important;font-size:15px!important;line-height:1!important;flex:0 0 36px}
#popup-empenho .detail-close:hover,#popup-disputa .detail-close:hover{background:var(--bg-surface-hover,#f4f7f5)!important;color:var(--text-primary,#17231e)!important}
#popup-empenho .detail-close .lb-ui-icon,#popup-disputa .detail-close .lb-ui-icon{margin:0!important}
#popup-empenho .lb-resize-indicador,#popup-disputa .lb-resize-indicador{display:none!important}
${P} .detail-popup-header{align-items:flex-start;gap:14px;margin-bottom:10px}
${P} .detail-popup-header>div:first-child{min-width:0;flex:1}
${P} .em2-titlerow{display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px}
${P} .detail-popup-title{font-size:18px!important;font-weight:700;letter-spacing:-.25px;line-height:1.3}
${P} .detail-popup-sub{margin-top:4px;font-size:12.5px;line-height:1.5;color:#687586}
${P} .em2-head-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
${P} .em2-nf{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:7px 12px;border:1px solid var(--border-medium,#ccd5d0);border-radius:8px;background:#fff;color:var(--text-primary,#17231e);font:inherit;font-size:12.5px;font-weight:650;cursor:pointer;white-space:nowrap}
${P} .em2-nf:hover{background:var(--bg-surface-hover,#f4f7f5)}
${P} [id^="nf-bar-"]{display:none!important}
${P} .em2-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:650;white-space:nowrap}
${P} .em2-pill svg,${P} .em2-tab svg,${P} .em2-ico svg,${P} .em2-kicon svg,${P} .em2-nf svg,${P} .em2-note svg,${P} .em2-foot-btn svg,${P} .em2-chip svg{display:block;flex:0 0 auto}
${P} .em2-pill svg{width:14px!important;height:14px!important;max-width:14px!important;max-height:14px!important}
${P} .em2-pill.em2-warn{background:#fbefdb;color:#7d4d00}
${P} .em2-pill.em2-late{background:#f9e8e8;color:#a42b25}
${P} .em2-pill.em2-ok{background:#e6f2ec;color:#245b43}
${P} .em2-pill.em2-neutral{background:#edf1ef;color:#34413b}
${P} .em2-tabs{display:flex;gap:4px;margin:0 0 12px;border-bottom:1px solid var(--surface-border,#e3e8e5);overflow-x:auto;flex:0 0 auto}
${P} .em2-tabs:empty{display:none}
${P} .em2-tab{display:flex;align-items:center;gap:8px;padding:10px 12px;border:0;border-bottom:2px solid transparent;background:none;color:#5f6d68;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;min-height:44px}
${P} .em2-tab:hover{color:var(--text-primary,#17231e)}
${P} .em2-tab svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
${P} .em2-tab[aria-current="true"]{color:#2d6a4f;border-bottom-color:#2d6a4f}
${P} #popup-e-body{background:var(--bg-app,#f6f8f9);border-radius:12px;padding:14px!important}
${P} .em2-sections{min-width:0}
${P} .em2-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px;min-width:0}
${P} .em2-head{display:flex;align-items:center;gap:10px;margin-bottom:14px;min-height:30px}
${P} .em2-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
${P} .em2-head .em2-tools{margin-left:auto;display:flex;gap:8px;align-items:center}
${P} .em2-count{font-weight:500;color:#5f6d68;font-variant-numeric:tabular-nums}
${P} .em2-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
${P} .em2-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
${P} .em2-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
${P} .em2-kpi{display:flex;align-items:center;gap:14px;min-width:0;padding:16px 18px;background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px}
${P} .em2-kicon{width:42px;height:42px;flex:0 0 42px;border-radius:12px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
${P} .em2-kicon svg{width:22px!important;height:22px!important;max-width:22px!important;max-height:22px!important}
${P} .em2-kmain{min-width:0}
${P} .em2-klabel{font-size:12px;color:#5f6d68;line-height:1.4}
${P} .em2-kvalue{margin:3px 0;font-size:clamp(19px,1.7vw,24px);font-weight:700;line-height:1.2;letter-spacing:-.4px;color:#2d6a4f;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
${P} .em2-ksub{font-size:11px;line-height:1.4;color:#5f6d68}
${P} .em2-t-neutral .em2-kvalue{color:#34413b}
${P} .em2-t-neutral .em2-kicon{background:#edf1ef;color:#34413b}
${P} .em2-t-amber .em2-kvalue{color:#8a5200}
${P} .em2-t-amber .em2-kicon{background:#fbefdb;color:#8a5200}
${P} .em2-t-red .em2-kvalue{color:#b32929}
${P} .em2-t-red .em2-kicon{background:#f9e8e8;color:#b32929}
${P} .em2-scroll{overflow-x:auto;max-width:100%}
${P} .em2-scroll table{width:100%;border-collapse:collapse;table-layout:auto}
${P} .em2-items{min-width:620px}
${P} .em2-buys{min-width:1000px}
${P} .em2-scroll th{padding:10px!important;height:auto;background:#f7f9f8!important;color:#5f6d68!important;font-size:11.5px;font-weight:650;line-height:1.3;letter-spacing:0!important;text-transform:none;text-align:left;white-space:nowrap;cursor:default;border-bottom:1px solid var(--surface-border,#e3e8e5);border-left:0!important}
${P} .em2-scroll td{padding:9px 10px!important;height:auto;font-size:12.5px;line-height:1.4!important;vertical-align:middle;color:var(--text-secondary,#455468);border-bottom:1px solid #e8ecea!important;border-left:0!important}
${P} .em2-scroll td.mono{font-family:var(--font-sans)!important;font-size:12.5px!important;font-variant-numeric:tabular-nums}
${P} .em2-items td:first-child,${P} .em2-buys td:nth-child(2){white-space:normal;min-width:200px;overflow-wrap:anywhere;font-weight:600;color:var(--text-primary,#17231e)}
${P} .em2-items td:first-child strong{font-weight:600;color:var(--text-primary,#17231e)}
${P} .em2-items th:nth-child(n+2):nth-child(-n+5),${P} .em2-items td:nth-child(n+2):nth-child(-n+5){text-align:right}
${P} .em2-buys th:nth-child(n+5):nth-child(-n+9),${P} .em2-buys td:nth-child(n+5):nth-child(-n+9){text-align:right}
${P} .em2-buys tfoot td:nth-child(n+2):nth-child(-n+5){text-align:right!important}
${P} .em2-buys tfoot td:first-child{text-align:right!important;color:#5f6d68!important}
${P} .em2-buys tfoot td{background:#f4f7f5!important;font-weight:700;color:var(--text-primary,#17231e)!important;border-top:1px solid #d8e0dc!important;font-family:var(--font-sans)!important;font-variant-numeric:tabular-nums}
${P} .em2-buys tfoot td.lb-c-success{color:#16a34a!important}
${P} .em2-buys tr.lb-compra-recebida{background-color:rgba(34,197,94,.08)!important}
${P} .em2-buys tr.lb-compra-pendente{background-color:transparent!important}
${P} .em2-buys tr.lb-compra-pendente:hover,${P} .em2-buys tr.lb-compra-recebida:hover{background-color:#f3f7f5!important}
${P} .em2-buys th.lb-th-check{width:34px}
${P} .em2-buys a{color:var(--accent,#2d6a4f);font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:4px}
${P} .em2-buys a svg{width:13px!important;height:13px!important;max-width:13px!important;max-height:13px!important;display:block}
${P} .em2-buys .em2-act{display:flex;gap:6px;align-items:center;justify-content:flex-start;white-space:nowrap}
${P} .em2-buys .em2-act .btn{width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;padding:0!important;display:inline-grid!important;place-items:center;border:1px solid var(--border-medium,#ccd5d0)!important;border-radius:8px!important;background:#fff!important;color:#34413b!important;font-size:14px!important;box-shadow:none!important}
${P} .em2-buys .em2-act .btn:hover{background:var(--bg-surface-hover,#f4f7f5)!important}
${P} .em2-buys .em2-act .btn.btn-danger{color:#b32929!important;border-color:#efc9c9!important}
${P} .em2-buys .em2-act .btn.btn-danger:hover{background:#f9e8e8!important}
${P} .em2-buys .em2-act .btn .lb-ui-icon{margin:0!important}
${P} .em2-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:99px;font-size:11.5px;font-weight:650;white-space:nowrap}
${P} .em2-chip svg{width:12px!important;height:12px!important;max-width:12px!important;max-height:12px!important}
${P} .em2-chip.em2-ok{background:#e6f2ec;color:#245b43}
${P} .em2-chip.em2-warn{background:#fbefdb;color:#7d4d00}
${P} .em2-chip.em2-neutral{background:#edf1ef;color:#34413b}
${P} .em2-note{display:flex;align-items:center;gap:8px;margin-top:12px;padding:9px 12px;border-radius:8px;background:#edf6f1;color:#245b43;font-size:12.5px;font-weight:600}
${P} .em2-note svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} .em2-obs{font-size:13px;line-height:1.5;color:var(--text-primary,#17231e);overflow-wrap:anywhere;margin:0}
${P} .em2-related .lb-related-list{display:flex;flex-wrap:wrap;gap:8px}
${P} .em2-bottom{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
${P} .em2-bottom>.em2-card{margin-bottom:0}
${P} .em2-bottom.em2-single{grid-template-columns:minmax(0,1fr)}
${P} [id^="coment-list-"]{max-height:220px;margin-bottom:10px!important}
${P} [id^="coment-list-"]>div[style*="text-tertiary"]:only-child{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px!important;font-size:12.5px!important;color:#5f6d68!important;text-align:center}
${P} [id^="coment-list-"]>div[style*="text-tertiary"]:only-child::before{content:"";width:26px;height:26px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6d68' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'/%3E%3C/svg%3E") center/contain no-repeat}
${P} input[id^="coment-input-"]{text-transform:none!important;min-width:0}
${P} .em2-tasks .lb-tarefas-box{margin:0!important;padding:0!important;border:0!important;background:transparent!important}
${P} .em2-tasks .lb-tarefas-head{display:none!important}
${P} .em2-tasks .lb-tarefas-input{min-width:0;flex:1 1 140px}
${P} .em2-tasks .lb-tarefas-form{gap:8px}
${P} .em2-tasks .lb-tarefas-input,${P} .em2-tasks .lb-tarefas-data{min-height:40px}
${P} .em2-tasks .lb-tarefas-add{min-height:40px}
${P} .em2-tasks .em2-taskcount{margin-left:auto;font-size:11px;font-weight:700;color:#5f6d68;background:#f7f9f8;border:1px solid var(--surface-border,#e3e8e5);padding:2px 9px;border-radius:99px;font-variant-numeric:tabular-nums}
${P} .detail-actions{align-items:center;gap:10px;padding-top:14px}
${P} #popup-e-del-btn{order:-1;margin-right:auto;display:inline-flex;align-items:center;gap:6px}
${P} #popup-e-del-btn svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important;display:block}
${P} #popup-e-edit-btn{background:#fff!important;color:var(--text-primary,#17231e)!important;border:1px solid var(--border-medium,#ccd5d0)!important;box-shadow:none!important;transform:none!important}
${P} #popup-e-edit-btn:hover{background:var(--bg-surface-hover,#f4f7f5)!important}
${P} .em2-foot-btn{display:inline-flex!important;align-items:center;gap:7px;width:auto!important;min-height:40px;background:var(--accent,#2d6a4f)!important;color:#fff!important;border:0!important;box-shadow:none!important;transform:none!important;font-size:12.5px!important;padding:8px 14px!important}
${P} .em2-foot-btn:hover{background:var(--accent-hover,#245b43)!important}
${P} .em2-foot-btn svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} button:focus-visible,${P} a:focus-visible,${P} input:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:1100px){${P} .em2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){${P} .em2-bottom{grid-template-columns:minmax(0,1fr)}}
@media(max-width:700px){${P} #popup-e-body{padding:10px!important}${P} .em2-card{padding:14px}${P} .detail-actions{flex-wrap:wrap}${P} #popup-e-del-btn{flex:1 1 100%;margin-right:0;justify-content:center}${P} .detail-popup-header{flex-wrap:wrap}${P} .em2-head-actions{order:3;flex:1 1 100%}${P} .em2-nf{flex:1;justify-content:center}}
@media(max-width:560px){${P} .em2-head{flex-wrap:wrap}${P} .em2-head .em2-tools{margin-left:0;flex:1 1 100%}${P} .em2-head .em2-tools .btn{width:100%;justify-content:center}${P} .em2-tab{padding:10px 9px;gap:6px}}
@media(max-width:460px){${P} .em2-kpis{grid-template-columns:minmax(0,1fr)}${P} .em2-tab svg{display:none}}
`;

  const $ = (id) => document.getElementById(id);
  const paths = {
    money: 'M12 2v20 M18 6c-3-4-12-3-12 2s12 3 12 8-9 6-12 2',
    coins: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    trend: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    check: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 12l3 3 5-6',
    alert: 'M12 3l10 18H2z M12 9v5 M12 17h.01',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
    cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6 M10 20h.01 M18 20h.01',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
    task: 'M9 4h6v3H9z M7 5H5v16h14V5h-2 M8.5 13l2 2 4-4',
    file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    plus: 'M12 5v14 M5 12h14',
    trash: 'M4 7h16 M9 7V4h6v3 M7 7l1 14h8l1-14 M10 11v6 M14 11v6',
    ext: 'M14 4h6v6 M20 4l-9 9 M10 5H4v15h15v-6',
    doc: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 13h6 M9 17h4'
  };
  const svg = (name, size) =>
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' +
    paths[name] + '"/></svg>';

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function safe(label, fn) {
    try { fn(); return true; } catch (err) {
      window.__emErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[empenho-detalhe] ' + label + ':', err);
      return false;
    }
  }

  let overlay = null, nav = null, sections = [], observer = null, current = null;

  function card(id, title, icon, cls) {
    const s = el('section', 'em2-card' + (cls ? ' ' + cls : ''));
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    const head = el('div', 'em2-head');
    const ic = el('span', 'em2-ico');
    ic.innerHTML = svg(icon, 16);
    const h = el('h3', '', title);
    h.id = id + '-t';
    head.append(ic, h);
    s.appendChild(head);
    return s;
  }

  function kpi(label, value, sub, icon, tone) {
    const a = el('article', 'em2-kpi em2-t-' + tone);
    const ic = el('span', 'em2-kicon');
    ic.innerHTML = svg(icon, 22);
    const main = el('div', 'em2-kmain');
    main.append(el('div', 'em2-klabel', label), el('div', 'em2-kvalue', value), el('div', 'em2-ksub', sub));
    a.append(ic, main);
    return a;
  }

  function chip(text, tone, icon) {
    const c = el('span', 'em2-chip em2-' + tone);
    if (icon) c.innerHTML = svg(icon, 12);
    c.appendChild(document.createTextNode(text));
    return c;
  }

  const txt = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const clean = (s) => (s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
  const isNeg = (t) => /-/.test(t || '');

  function countComments(list) {
    return [...list.children].filter((c) => !/Nenhum coment/i.test(c.textContent)).length;
  }

  function clearPrevious() {
    document.querySelectorAll('#popup-empenho .em2-pill, #popup-empenho .em2-head-actions, #popup-empenho .em2-foot-btn').forEach((n) => n.remove());
    const titleRow = document.querySelector('#popup-empenho .em2-titlerow');
    if (titleRow) {
      const t = $('popup-e-title');
      titleRow.parentNode.insertBefore(t, titleRow);
      titleRow.remove();
    }
  }

  /* Status e dias: lidos dos campos STATUS e DIAS SEM PAG. gerados pela funcao original. */
  function statusPill(statusText, diasText) {
    const pago = /PAGO/i.test(statusText) && !/PENDENTE/i.test(statusText);
    const m = (diasText || '').match(/(\d+)\s*DIAS/i);
    let label, tone, icon;
    if (pago) { label = 'Pago'; tone = 'ok'; icon = 'check'; }
    else if (m) {
      const d = +m[1];
      label = 'Pendente · ' + d + (d === 1 ? ' dia' : ' dias') + ' sem pagamento';
      tone = d >= 60 ? 'late' : 'warn'; icon = d >= 60 ? 'alert' : 'clock';
    } else {
      const extra = clean(diasText);
      label = 'Pendente' + (extra && extra !== '—' ? ' · ' + extra.charAt(0).toUpperCase() + extra.slice(1).toLowerCase() : '');
      tone = 'warn'; icon = 'clock';
    }
    const p = el('span', 'em2-pill em2-' + tone);
    p.innerHTML = svg(icon, 14);
    p.appendChild(document.createTextNode(label));
    return p;
  }

  function build() {
    const body = $('popup-e-body');
    if (!body || body.querySelector(':scope > .em2-sections')) return;
    const grid3 = body.querySelector(':scope > .detail-grid-3');
    const grid2 = body.querySelector(':scope > .detail-grid');
    const f3 = grid3 ? [...grid3.querySelectorAll('.detail-field-value')] : [];
    const f2 = grid2 ? [...grid2.querySelectorAll('.detail-field-value')] : [];
    if (f3.length < 2 || f2.length < 4) throw new Error('estrutura inesperada: ' + f3.length + ' e ' + f2.length + ' campos');

    clearPrevious();
    const analista = txt(f3[0]);
    const statusTxt = txt(f3[1]);
    const valEmp = txt(f2[0]);
    const impostosEl = f2[1].cloneNode(true);
    const semCompras = !!impostosEl.querySelector('span');
    impostosEl.querySelectorAll('span').forEach((s) => s.remove());
    const impostos = txt(impostosEl);
    const lucroReal = txt(f2[2]);
    const dias = txt(f2[3]);

    /* Cabecalho: selo de status ao lado do titulo. */
    const title = $('popup-e-title');
    const row = el('div', 'em2-titlerow');
    title.parentNode.insertBefore(row, title);
    row.append(title, statusPill(statusTxt, dias));
    const header = title.closest('.detail-popup-header');
    const actions = el('div', 'em2-head-actions');
    header.insertBefore(actions, header.querySelector('.detail-close'));

    /* Indicadores. */
    const m = dias.match(/(\d+)\s*DIAS/i);
    const diasValor = m ? m[1] + (m[1] === '1' ? ' dia' : ' dias') : (/PAGO/i.test(dias) ? 'Pago' : (clean(dias) || '—'));
    const diasTone = m ? (+m[1] >= 60 ? 'red' : 'amber') : (/PAGO/i.test(dias) ? 'green' : 'neutral');
    const kpis = el('div', 'em2-kpis');
    kpis.id = 'em2-sec-resumo';
    kpis.setAttribute('role', 'group');
    kpis.setAttribute('aria-label', 'Resumo do empenho');
    kpis.append(
      kpi('Valor do empenho', valEmp, 'Soma dos itens do empenho', 'money', 'green'),
      kpi('Impostos', impostos, semCompras ? 'Sem compras registradas' : 'Soma dos custos das compras', 'coins', 'neutral'),
      kpi('Lucro realizado', lucroReal, 'Compras com data de pagamento', 'trend', isNeg(lucroReal) ? 'red' : 'green'),
      kpi('Dias sem pagamento', diasValor, 'Analista: ' + (analista || '—'), 'clock', diasTone)
    );
    const holder = el('div', 'em2-sections');
    holder.appendChild(kpis);

    /* Outros empenhos do mesmo contrato. */
    const related = body.querySelector(':scope > .lb-related-empenhos');
    if (related) {
      const rc = card('em2-sec-rel', 'Outros empenhos deste contrato', 'file', 'em2-related');
      const list = related.querySelector('.lb-related-list');
      if (list) rc.appendChild(list);
      holder.appendChild(rc);
    }

    /* Tabelas: a de compras e identificada pelo checkbox "selecionar todas". */
    const buyChk = body.querySelector('table input[id^="chk-all-compras-"]');
    const buysTable = buyChk ? buyChk.closest('table') : null;
    const itemsTable = [...body.querySelectorAll(':scope > table.lotes-status-table')].find((t) => t !== buysTable) || null;

    const items = card('em2-sec-itens', 'Itens do empenho', 'box');
    if (itemsTable) {
      itemsTable.classList.add('em2-items');
      const head = itemsTable.tHead && itemsTable.tHead.rows[0];
      if (head && head.cells[5]) head.cells[5].textContent = 'Pagamento';
      [...itemsTable.tBodies[0].rows].forEach((tr) => {
        const c = tr.cells[5];
        if (!c) return;
        const pago = !!c.querySelector('.status-pago');
        c.replaceChildren(pago ? chip('Pago', 'ok', 'check') : chip('Pendente', 'warn', 'clock'));
      });
      const sc = el('div', 'em2-scroll');
      sc.appendChild(itemsTable);
      items.appendChild(sc);
    } else {
      items.appendChild(el('p', 'lb-empty-note', 'Nenhum item vinculado.'));
    }
    holder.appendChild(items);

    /* Botao "Nova compra" original: ativo vai para o rodape; inativo vira aviso nos itens. */
    const newBuyWrap = [...body.querySelectorAll(':scope > .lb-mt12')].find((d) => d.querySelector('button'));
    if (newBuyWrap) {
      const b = newBuyWrap.querySelector('button');
      const disabled = /pointer-events:\s*none/.test(b.getAttribute('style') || '') || /COMPLETAMENTE/i.test(b.textContent);
      if (disabled) {
        const n = el('div', 'em2-note');
        n.innerHTML = svg('check', 15);
        n.appendChild(document.createTextNode('Todos os itens já foram comprados'));
        items.appendChild(n);
      } else {
        b.classList.remove('btn-sm', 'btn-ghost');
        b.classList.add('em2-foot-btn');
        b.removeAttribute('style');
        b.textContent = 'Nova compra';
        b.insertAdjacentHTML('afterbegin', svg('plus', 15));
        b.dataset.em2 = '1';
        const foot = overlay.querySelector('.detail-actions');
        foot.appendChild(b);
      }
      newBuyWrap.remove();
    }

    /* Compras. */
    let buys = null;
    if (buysTable) {
      const n = buysTable.tBodies[0] ? buysTable.tBodies[0].rows.length : 0;
      buys = card('em2-sec-compras', 'Compras', 'cart');
      buys.querySelector('h3').append(' ', el('span', 'em2-count', '(' + n + ')'));
      const exp = body.querySelector('.lb-btn-export');
      if (exp) {
        const tools = el('div', 'em2-tools');
        tools.appendChild(exp);
        buys.querySelector('.em2-head').appendChild(tools);
      }
      buysTable.classList.add('em2-buys');
      const hr = buysTable.tHead && buysTable.tHead.rows[0];
      if (hr) {
        const names = ['', 'Item', 'Plataforma', 'Data da compra', 'Qtd.', 'Vl. compra', 'Custo', 'Lucro', 'A receber', 'Pagamento', 'Data do pag.', 'Ações'];
        [...hr.cells].forEach((th, i) => { if (i > 0 && names[i]) th.textContent = names[i]; });
      }
      [...buysTable.tBodies[0].rows].forEach((tr) => {
        const c = tr.cells;
        if (c.length < 12) return;
        const link = c[2].querySelector('a[href]');
        if (link) { link.textContent = ''; link.setAttribute('aria-label', 'Abrir link da compra'); link.title = link.getAttribute('href'); link.innerHTML = svg('ext', 13); link.removeAttribute('style'); }
        [1, 2].forEach((i) => { c[i].style.removeProperty('font-size'); c[i].style.removeProperty('font-weight'); });
        const lucro = c[7];
        if (isNeg(lucro.textContent)) { lucro.classList.remove('lb-c-success'); lucro.classList.add('lb-c-danger'); }
        const pagoSpan = c[9].querySelector('.status-pago');
        c[9].replaceChildren(pagoSpan ? chip(clean(pagoSpan.textContent), 'ok', 'check') : chip('Não pago', 'neutral'));
        const wrap = el('div', 'em2-act');
        while (c[11].firstChild) wrap.appendChild(c[11].firstChild);
        wrap.querySelectorAll('button').forEach((b) => {
          b.removeAttribute('style');
          const t = (b.getAttribute('title') || '').toLowerCase();
          if (!b.getAttribute('aria-label') && t) b.setAttribute('aria-label', /compra/.test(t) ? b.getAttribute('title') : b.getAttribute('title') + ' compra');
        });
        c[11].appendChild(wrap);
      });
      const sc = el('div', 'em2-scroll');
      sc.appendChild(buysTable);
      buys.appendChild(sc);
      holder.appendChild(buys);
    } else {
      buys = card('em2-sec-compras', 'Compras', 'cart');
      buys.querySelector('h3').append(' ', el('span', 'em2-count', '(0)'));
      const empty = [...body.querySelectorAll(':scope > .lb-empty-note')].pop();
      buys.appendChild(empty || el('p', 'lb-empty-note', 'Nenhuma compra cadastrada.'));
      holder.appendChild(buys);
    }

    /* Observacao. */
    const obsField = [...body.querySelectorAll(':scope > .detail-field')].find((f) => /OBSERVA/i.test(txt(f.querySelector('.detail-field-label'))));
    if (obsField) {
      const oc = card('em2-sec-obs', 'Observação', 'note');
      oc.appendChild(el('p', 'em2-obs', txt(obsField.querySelector('.detail-field-value'))));
      holder.appendChild(oc);
    }

    /* Comentarios e tarefas lado a lado. */
    const bottom = el('div', 'em2-bottom em2-single');
    const list = body.querySelector('[id^="coment-list-"]');
    let coment = null;
    if (list) {
      coment = card('em2-sec-coment', 'Comentários', 'chat');
      const count = el('span', 'em2-count', '(' + countComments(list) + ')');
      coment.querySelector('h3').append(' ', count);
      const inputRow = list.nextElementSibling;
      coment.appendChild(list);
      if (inputRow) coment.appendChild(inputRow);
      new MutationObserver(() => { count.textContent = '(' + countComments(list) + ')'; }).observe(list, { childList: true });
      bottom.appendChild(coment);
    }
    const tasks = card('em2-sec-tarefas', 'Tarefas do empenho', 'task', 'em2-tasks');
    tasks.hidden = true;
    bottom.appendChild(tasks);
    holder.appendChild(bottom);

    /* Elementos injetados por outros modulos antes desta reorganizacao. */
    const nfBar = body.querySelector(':scope > [id^="nf-bar-"]');
    const taskBox = body.querySelector(':scope > .lb-tarefas-box');

    body.replaceChildren(holder);
    if (nfBar) adoptNf(nfBar);
    if (taskBox) adoptTasks(taskBox);
    body.scrollTop = 0;

    sections = [['Resumo', 'file', kpis], ['Itens', 'box', items], ['Compras', 'cart', buys]];
    if (coment) sections.push(['Comentários', 'chat', coment]);
    renderTabs();
  }

  /* Botao da nota fiscal (25): a barra continua dentro do corpo, oculta; o cabecalho recebe um atalho. */
  function adoptNf(bar) {
    const body = $('popup-e-body');
    const holder = body.querySelector(':scope > .em2-sections');
    const actions = overlay.querySelector('.em2-head-actions');
    if (!holder || !actions) return;
    if (bar.parentNode !== holder) holder.insertBefore(bar, holder.firstChild);
    if (actions.querySelector('.em2-nf')) return;
    const orig = bar.querySelector('button');
    if (!orig) return;
    const b = el('button', 'em2-nf');
    b.type = 'button';
    b.innerHTML = svg('doc', 15);
    b.appendChild(document.createTextNode('Dados p/ nota fiscal (PDF)'));
    b.addEventListener('click', () => orig.click());
    actions.appendChild(b);
  }

  /* Bloco de tarefas (23): movido para o cartao, sem sair do corpo. */
  function adoptTasks(box) {
    const tasks = $('em2-sec-tarefas');
    if (!tasks) return;
    if (box.parentNode !== tasks) tasks.appendChild(box);
    tasks.hidden = false;
    const bottom = tasks.parentNode;
    bottom.classList.toggle('em2-single', !$('em2-sec-coment'));
    const counter = box.querySelector('.lb-tarefas-contador');
    const head = tasks.querySelector('.em2-head');
    let mirror = head.querySelector('.em2-taskcount');
    if (!mirror) { mirror = el('span', 'em2-taskcount'); head.appendChild(mirror); }
    const sync = () => { mirror.textContent = counter ? counter.textContent : ''; };
    sync();
    if (counter && !counter.dataset.em2) {
      counter.dataset.em2 = '1';
      new MutationObserver(sync).observe(counter, { childList: true, characterData: true, subtree: true });
    }
    if (!sections.some((s) => s[2] === tasks)) {
      sections.push(['Tarefas', 'task', tasks]);
      renderTabs();
    }
  }

  function watchInjections() {
    const body = $('popup-e-body');
    observer = new MutationObserver(() => {
      if (!overlay.classList.contains('em2')) return;
      if (!body.querySelector(':scope > .em2-sections')) return;
      [...body.children].forEach((ch) => {
        if (ch.classList.contains('em2-sections')) return;
        if (/^nf-bar-/.test(ch.id)) safe('nota fiscal', () => adoptNf(ch));
        else if (ch.classList.contains('lb-tarefas-box')) safe('tarefas', () => adoptTasks(ch));
      });
    });
    observer.observe(body, { childList: true });
  }

  function currentIndex(body) {
    const top = body.getBoundingClientRect().top;
    let idx = 0;
    sections.forEach((s, i) => { if (s[2].getBoundingClientRect().top - top <= 80) idx = i; });
    if (body.scrollHeight > body.clientHeight + 1 && body.scrollTop + body.clientHeight >= body.scrollHeight - 2) idx = sections.length - 1;
    return idx;
  }

  function markTabs() {
    const body = $('popup-e-body');
    if (!nav || !body || !sections.length) return;
    const idx = Math.min(currentIndex(body), sections.length - 1);
    nav.querySelectorAll('.em2-tab').forEach((t, i) => {
      if (i === idx) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  function renderTabs() {
    if (!nav) return;
    nav.replaceChildren();
    sections.forEach(([text, icon, target]) => {
      const b = el('button', 'em2-tab');
      b.type = 'button';
      b.innerHTML = svg(icon, 16);
      b.appendChild(document.createTextNode(text));
      b.addEventListener('click', () => {
        const body = $('popup-e-body');
        const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const delta = target.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
        body.scrollTo({ top: body.scrollTop + delta, behavior: calm ? 'auto' : 'smooth' });
      });
      nav.appendChild(b);
    });
    markTabs();
  }

  function init() {
    overlay = $('popup-empenho');
    const popup = overlay && overlay.querySelector('.detail-popup');
    const header = popup && popup.querySelector('.detail-popup-header');
    const body = $('popup-e-body');
    if (!popup || !header || !body || overlay.dataset.em2Ready || typeof window.abrirPopupEmpenho !== 'function') return;
    overlay.dataset.em2Ready = '1';

    const style = document.createElement('style');
    style.id = 'lb-empenho-detalhe-moderno';
    style.textContent = css;
    document.head.appendChild(style);

    nav = el('nav', 'em2-tabs');
    nav.setAttribute('aria-label', 'Seções do empenho');
    header.insertAdjacentElement('afterend', nav);
    body.addEventListener('scroll', () => safe('abas', markTabs), { passive: true });
    watchInjections();

    const del = $('popup-e-del-btn');
    if (del && !del.querySelector('svg')) {
      del.textContent = 'Excluir empenho';
      del.insertAdjacentHTML('afterbegin', svg('trash', 15));
    }
    const edit = $('popup-e-edit-btn');
    if (edit) edit.removeAttribute('data-lb-primary-action');

    const original = window.abrirPopupEmpenho;
    window.abrirPopupEmpenho = function () {
      overlay.classList.add('em2');
      window.__emErro = '';
      current = arguments[0];
      const result = original.apply(this, arguments);
      if (!safe('estrutura', build)) {
        /* Estrutura inesperada: devolve o popup original completo, sem nenhum estilo desta camada. */
        overlay.classList.remove('em2');
        clearPrevious();
        sections = [];
        renderTabs();
        original.apply(this, arguments);
      }
      return result;
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
