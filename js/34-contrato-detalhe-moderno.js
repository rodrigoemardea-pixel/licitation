// LicitationBiznis: camada visual isolada do popup de detalhes do contrato (#popup-disputa).
// abrirPopupDisputa() continua sendo a funcao original: ela monta o popup e calcula todos os valores.
// Este modulo apenas reorganiza o resultado em secoes, lendo os valores ja calculados (nenhuma formula
// e repetida aqui). Se a estrutura gerada for diferente da esperada, o popup original e mantido.
(function () {
  'use strict';

  const css = `
#popup-disputa.dd-modern .detail-popup-header{align-items:flex-start;gap:16px;margin-bottom:10px}
#popup-disputa.dd-modern .detail-popup-title{font-size:18px!important;font-weight:700;letter-spacing:-.25px;line-height:1.3;overflow-wrap:anywhere}
#popup-disputa.dd-modern .detail-popup-sub{margin-top:4px;font-size:12.5px;line-height:1.5;color:#687586}
#popup-disputa.dd-modern .dd-tabs{display:flex;gap:4px;margin:0 0 12px;border-bottom:1px solid var(--surface-border,#e3e8e5);overflow-x:auto;flex:0 0 auto}
#popup-disputa.dd-modern .dd-tabs:empty{display:none}
#popup-disputa.dd-modern .dd-tab{display:flex;align-items:center;gap:8px;padding:10px 12px;border:0;border-bottom:2px solid transparent;background:none;color:#5f6d68;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;min-height:44px}
#popup-disputa.dd-modern .dd-tab:hover{color:var(--text-primary,#17231e)}
#popup-disputa.dd-modern .dd-tab svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important;display:block;flex:0 0 16px}
#popup-disputa.dd-modern .dd-tab[aria-current="true"]{color:#2d6a4f;border-bottom-color:#2d6a4f}
#popup-disputa.dd-modern #popup-d-body{background:var(--bg-app,#f6f8f9);border-radius:12px;padding:14px!important}
#popup-disputa.dd-modern .dd-sections{min-width:0}
#popup-disputa.dd-modern .dd-top{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:14px;margin-bottom:14px}
#popup-disputa.dd-modern .dd-top.dd-single{grid-template-columns:minmax(0,1fr)}
#popup-disputa.dd-modern .dd-top>.dd-card{margin-bottom:0}
#popup-disputa.dd-modern .dd-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px;min-width:0}
#popup-disputa.dd-modern .dd-head{display:flex;align-items:center;gap:10px;margin-bottom:14px;min-height:30px}
#popup-disputa.dd-modern .dd-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
#popup-disputa.dd-modern .dd-count{font-weight:500;color:#5f6d68;font-variant-numeric:tabular-nums}
#popup-disputa.dd-modern .dd-head .dd-tools{margin-left:auto;display:flex;gap:8px;align-items:center}
#popup-disputa.dd-modern .dd-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
#popup-disputa.dd-modern .dd-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important;display:block}
#popup-disputa.dd-modern .dd-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:12px 18px}
#popup-disputa.dd-modern .dd-field{min-width:0}
#popup-disputa.dd-modern .dd-field dt{margin:0 0 3px;font-size:12px;font-weight:500;color:#5f6d68}
#popup-disputa.dd-modern .dd-field dd{margin:0;font-size:13.5px;font-weight:600;line-height:1.35;color:var(--text-primary,#17231e);overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
#popup-disputa.dd-modern .dd-pill{display:inline-flex;align-items:center;gap:6px;align-self:end;padding:6px 11px;border-radius:99px;background:#e6f2ec;color:#245b43;font-size:12px;font-weight:650;white-space:nowrap}
#popup-disputa.dd-modern .dd-pill svg{width:14px!important;height:14px!important;max-width:14px!important;max-height:14px!important;display:block;flex:0 0 14px}
#popup-disputa.dd-modern .dd-pill.dd-warn{background:#fbefdb;color:#7d4d00}
#popup-disputa.dd-modern .dd-pill.dd-late{background:#f9e8e8;color:#a42b25}
#popup-disputa.dd-modern .dd-vig{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:flex-end}
#popup-disputa.dd-modern .dd-vig .dd-fields{flex:1 1 220px;grid-template-columns:repeat(2,minmax(110px,1fr))}
#popup-disputa.dd-modern .dd-kpis{display:grid;gap:12px;margin-bottom:12px}
#popup-disputa.dd-modern .dd-kpis.dd-k3{grid-template-columns:repeat(3,minmax(0,1fr))}
#popup-disputa.dd-modern .dd-kpis.dd-k4{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:14px}
#popup-disputa.dd-modern .dd-kpi{display:flex;align-items:center;gap:14px;min-width:0;padding:16px 18px;background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px}
#popup-disputa.dd-modern .dd-k4 .dd-kpi{padding:13px 15px;gap:12px}
#popup-disputa.dd-modern .dd-kicon{width:42px;height:42px;flex:0 0 42px;border-radius:12px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
#popup-disputa.dd-modern .dd-k4 .dd-kicon{width:36px;height:36px;flex-basis:36px;border-radius:10px}
#popup-disputa.dd-modern .dd-kicon svg{width:22px!important;height:22px!important;max-width:22px!important;max-height:22px!important;display:block}
#popup-disputa.dd-modern .dd-k4 .dd-kicon svg{width:18px!important;height:18px!important;max-width:18px!important;max-height:18px!important}
#popup-disputa.dd-modern .dd-kmain{min-width:0}
#popup-disputa.dd-modern .dd-klabel{font-size:12px;color:#5f6d68;line-height:1.4}
#popup-disputa.dd-modern .dd-kvalue{margin:3px 0;font-size:clamp(20px,1.8vw,26px);font-weight:700;line-height:1.2;letter-spacing:-.4px;color:#2d6a4f;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
#popup-disputa.dd-modern .dd-k4 .dd-kvalue{font-size:clamp(17px,1.4vw,20px)}
#popup-disputa.dd-modern .dd-ksub{font-size:11px;line-height:1.4;color:#5f6d68}
#popup-disputa.dd-modern .dd-t-neutral .dd-kvalue{color:#34413b}
#popup-disputa.dd-modern .dd-t-neutral .dd-kicon{background:#edf1ef;color:#34413b}
#popup-disputa.dd-modern .dd-t-amber .dd-kvalue{color:#8a5200}
#popup-disputa.dd-modern .dd-t-amber .dd-kicon{background:#fbefdb;color:#8a5200}
#popup-disputa.dd-modern .dd-t-red .dd-kvalue{color:#b32929}
#popup-disputa.dd-modern .dd-t-red .dd-kicon{background:#f9e8e8;color:#b32929}
#popup-disputa.dd-modern .dd-scroll{overflow-x:auto;max-width:100%}
#popup-disputa.dd-modern .dd-scroll table{width:100%;min-width:820px;border-collapse:collapse;table-layout:auto}
#popup-disputa.dd-modern .dd-scroll th{padding:10px!important;height:auto;background:#f7f9f8!important;color:#5f6d68!important;font-size:11.5px;font-weight:650;line-height:1.3;letter-spacing:0!important;text-transform:none;text-align:left;white-space:nowrap;cursor:default;border-bottom:1px solid var(--surface-border,#e3e8e5);border-left:0!important}
#popup-disputa.dd-modern .dd-scroll td{padding:10px!important;height:auto;font-size:12.5px;line-height:1.4!important;vertical-align:middle;color:var(--text-secondary,#455468);border-bottom:1px solid #e8ecea!important;border-left:0!important}
#popup-disputa.dd-modern .dd-scroll td.mono,#popup-disputa.dd-modern .dd-scroll td.money{font-family:var(--font-sans)!important;font-size:12.5px!important;font-variant-numeric:tabular-nums}
#popup-disputa.dd-modern .dd-items td:first-child{white-space:normal;min-width:220px;overflow-wrap:anywhere}
#popup-disputa.dd-modern .dd-items td:first-child strong{font-weight:600;color:var(--text-primary,#17231e)}
#popup-disputa.dd-modern .dd-items th:nth-child(n+2):nth-child(-n+6),#popup-disputa.dd-modern .dd-items td:nth-child(n+2):nth-child(-n+6){text-align:right}
#popup-disputa.dd-modern .dd-items td.saldo-ok,#popup-disputa.dd-modern .dd-items td.saldo-parcial{font-weight:700;color:var(--text-primary,#17231e)}
#popup-disputa.dd-modern .dd-items td.saldo-parcial{color:#8a5200}
#popup-disputa.dd-modern .dd-items td.saldo-zero{font-weight:650;color:#245b43}
#popup-disputa.dd-modern .dd-items tr[onclick]{cursor:pointer}
#popup-disputa.dd-modern .dd-prog{display:flex;align-items:center;gap:8px;min-width:140px}
#popup-disputa.dd-modern .dd-prog .progress-bar-wrap{flex:1 1 auto;min-width:60px;height:8px}
#popup-disputa.dd-modern .dd-pct{flex:0 0 38px;text-align:right;font-size:12px;font-weight:600;color:#34413b;font-variant-numeric:tabular-nums}
#popup-disputa.dd-modern .dd-act{white-space:nowrap;text-align:right}
#popup-disputa.dd-modern .dd-empenhar{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:6px 12px;border:0;border-radius:8px;background:var(--accent,#2d6a4f);color:#fff;font:inherit;font-size:12px;font-weight:650;cursor:pointer;white-space:nowrap}
#popup-disputa.dd-modern .dd-empenhar:hover{background:var(--accent-hover,#245b43)}
#popup-disputa.dd-modern .dd-empenhar svg{width:14px!important;height:14px!important;max-width:14px!important;max-height:14px!important;display:block;flex:0 0 14px}
#popup-disputa.dd-modern .dd-none{color:#5f6d68}
#popup-disputa.dd-modern .dd-buys th:nth-child(n+5):nth-child(-n+9),#popup-disputa.dd-modern .dd-buys td:nth-child(n+5):nth-child(-n+9){text-align:right}
#popup-disputa.dd-modern .dd-buys th.lb-th-check{width:34px}
#popup-disputa.dd-modern .dd-buys td:nth-child(3){white-space:normal;min-width:180px;overflow-wrap:anywhere}
#popup-disputa.dd-modern .dd-buys a{color:var(--accent,#2d6a4f);font-weight:600;text-decoration:none}
#popup-disputa.dd-modern .dd-buys a:hover{text-decoration:underline}
#popup-disputa.dd-modern .dd-tools .lb-btn-export{margin:0}
#popup-disputa.dd-modern .dd-obs-text{font-size:13px;font-weight:400;line-height:1.5;color:var(--text-primary,#17231e);overflow-wrap:anywhere;margin:0}
#popup-disputa.dd-modern .dd-related .lb-related-list{display:flex;flex-wrap:wrap;gap:8px}
#popup-disputa.dd-modern [id^="coment-list-"]{max-height:220px;margin-bottom:10px!important}
#popup-disputa.dd-modern [id^="coment-list-"]>div[style*="text-tertiary"]:only-child{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 8px!important;font-size:12.5px!important;color:#5f6d68!important;text-align:center}
#popup-disputa.dd-modern [id^="coment-list-"]>div[style*="text-tertiary"]:only-child::before{content:"";width:28px;height:28px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6d68' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'/%3E%3C/svg%3E") center/contain no-repeat}
#popup-disputa.dd-modern input[id^="coment-input-"]{text-transform:none!important}
#popup-disputa.dd-modern .detail-actions{align-items:center;gap:10px;padding-top:14px}
#popup-disputa.dd-modern #popup-d-del-btn{order:-1;margin-right:auto;display:inline-flex;align-items:center;gap:6px}
#popup-disputa.dd-modern #popup-d-del-btn[style*="display: none"]{display:none}
#popup-disputa.dd-modern #popup-d-del-btn svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important;display:block;flex:0 0 15px}
#popup-disputa.dd-modern #popup-d-edit-btn{background:#fff!important;color:var(--text-primary,#17231e)!important;border:1px solid var(--border-medium,#ccd5d0)!important;box-shadow:none!important}
#popup-disputa.dd-modern #popup-d-edit-btn:hover{background:var(--bg-surface-hover,#f4f7f5)!important;transform:none!important}
#popup-disputa.dd-modern #popup-d-new-emp-btn{background:var(--accent,#2d6a4f)!important;color:#fff!important;box-shadow:none!important;transform:none!important}
#popup-disputa.dd-modern #popup-d-new-emp-btn:hover{background:var(--accent-hover,#245b43)!important}
#popup-disputa.dd-modern button:focus-visible,#popup-disputa.dd-modern a:focus-visible,#popup-disputa.dd-modern input:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:1100px){#popup-disputa.dd-modern .dd-kpis.dd-k4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){#popup-disputa.dd-modern .dd-top{grid-template-columns:minmax(0,1fr)}}
@media(max-width:700px){#popup-disputa.dd-modern .dd-kpis.dd-k3{grid-template-columns:minmax(0,1fr)}#popup-disputa.dd-modern #popup-d-body{padding:10px!important}#popup-disputa.dd-modern .dd-card{padding:14px}#popup-disputa.dd-modern .detail-actions{flex-wrap:wrap}#popup-disputa.dd-modern #popup-d-del-btn{flex:1 1 100%;margin-right:0;justify-content:center}}
@media(max-width:560px){#popup-disputa.dd-modern .dd-head{flex-wrap:wrap}#popup-disputa.dd-modern .dd-head .dd-tools{margin-left:0;flex:1 1 100%}#popup-disputa.dd-modern .dd-tools .lb-btn-export{width:100%;justify-content:center}#popup-disputa.dd-modern .dd-tab{padding:10px 9px;gap:6px}}
@media(max-width:460px){#popup-disputa.dd-modern .dd-kpis.dd-k4{grid-template-columns:minmax(0,1fr)}#popup-disputa.dd-modern .dd-tab svg{display:none}}
`;

  const $ = (id) => document.getElementById(id);
  const paths = {
    building: 'M3 20h18M5 20V7l7-4v17M19 20V10l-7-3M8 9h1M8 12h1M8 15h1M15 12h1M15 15h1',
    file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    alert: 'M12 3l10 18H2z M12 9v5 M12 17h.01',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
    money: 'M12 2v20 M18 6c-3-4-12-3-12 2s12 3 12 8-9 6-12 2',
    chart: 'M4 20V10 M10 20V4 M16 20v-8 M21 20H2',
    trend: 'M3 17l6-6 4 4 8-8 M15 7h6v6',
    cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6 M10 20h.01 M18 20h.01',
    coins: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    pie: 'M12 3a9 9 0 1 0 9 9h-9z M15 3.5A9 9 0 0 1 20.5 9H15z',
    hourglass: 'M6 3h12 M6 21h12 M7 3v4l5 5-5 5v4 M17 3v4l-5 5 5 5v4',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    plus: 'M12 5v14 M5 12h14',
    trash: 'M4 7h16 M9 7V4h6v3 M7 7l1 14h8l1-14 M10 11v6 M14 11v6'
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
      window.__ddErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[contrato-detalhe] ' + label + ':', err);
      return false;
    }
  }

  let nav = null;
  let sections = [];

  function card(id, title, icon, cls) {
    const s = el('section', 'dd-card' + (cls ? ' ' + cls : ''));
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    const head = el('div', 'dd-head');
    const ic = el('span', 'dd-ico');
    ic.innerHTML = svg(icon, 16);
    const h = el('h3', '', title);
    h.id = id + '-t';
    head.append(ic, h);
    s.appendChild(head);
    return s;
  }

  function field(label, value) {
    const f = el('div', 'dd-field');
    f.append(el('dt', '', label), el('dd', '', value || '—'));
    return f;
  }

  function fieldsList(pairs) {
    const dl = el('dl', 'dd-fields');
    dl.style.margin = '0';
    pairs.forEach((p) => dl.appendChild(field(p[0], p[1])));
    return dl;
  }

  function kpi(label, value, sub, icon, tone) {
    const a = el('article', 'dd-kpi dd-t-' + tone);
    const ic = el('span', 'dd-kicon');
    ic.innerHTML = svg(icon, 22);
    const main = el('div', 'dd-kmain');
    main.append(el('div', 'dd-klabel', label), el('div', 'dd-kvalue', value || 'R$ 0,00'), el('div', 'dd-ksub', sub));
    a.append(ic, main);
    return a;
  }

  const isNeg = (t) => /-/.test(t || '');
  const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');

  function humanizeDeadline(t) {
    const s = t.toLowerCase().replace(/(\d+)d\b/, (m, n) => n + (n === '1' ? ' dia' : ' dias'));
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function countComments(list) {
    return [...list.children].filter((c) => !/Nenhum coment/i.test(c.textContent)).length;
  }

  function build() {
    const body = $('popup-d-body');
    if (!body || body.querySelector('.dd-sections')) return true;
    const grids = [...body.querySelectorAll(':scope > .detail-grid-3')];
    const fin = [...body.querySelectorAll(':scope > .lb-fin-grid .lb-fin-card')];
    const mainVals = grids[0] ? [...grids[0].querySelectorAll('.detail-field-value')] : [];
    if (mainVals.length < 6 || fin.length < 4) throw new Error('estrutura inesperada: ' + mainVals.length + ' campos e ' + fin.length + ' cartoes financeiros');
    const txt = (e) => (e ? e.textContent.trim() : '');
    const finVal = (i) => txt(fin[i].querySelector('.lb-fin-value'));
    const dash = (v) => (v && v !== '—' ? v : '');

    /* Cabecalho: o subtitulo original e "processo · sistema · data". So recebe rotulos quando tem exatamente tres partes. */
    const sub = $('popup-d-sub');
    if (sub) {
      const parts = sub.textContent.split(' · ').map((x) => x.trim());
      if (parts.length === 3) {
        const out = [];
        if (dash(parts[0])) out.push('Processo ' + parts[0]);
        if (dash(parts[1])) out.push(parts[1]);
        if (dash(parts[2])) out.push('Data ' + parts[2]);
        sub.textContent = out.join(' · ');
      }
    }

    /* Identificacao: lida do HTML que a funcao original ja escreveu ("UF · TIPO · RP x" e separado aqui). */
    const triple = txt(mainVals[2]).split(' · ').map((x) => x.trim());
    const rpRaw = (triple.length > 2 ? triple[triple.length - 1] : '').replace(/^RP\s*/i, '');
    const ident = card('dd-sec-ident', 'Identificação', 'building');
    ident.appendChild(fieldsList([
      ['Empresa', dash(txt(mainVals[0]))], ['Analista', dash(txt(mainVals[1]))], ['UF', dash(triple[0])],
      ['Tipo', dash(triple.length > 2 ? triple.slice(1, -1).join(' · ').trim() : '')], ['RP', rpRaw && rpRaw !== '—' ? titleCase(rpRaw) : '']
    ]));

    /* Vigencia: datas e selo de prazo vem do HTML gerado pela funcao original. */
    let vigencia = null;
    const vig = grids[1];
    if (vig) {
      let dtContrato = '', vencimento = '', badge = '', tone = '';
      vig.querySelectorAll('.detail-field').forEach((f) => {
        const lab = txt(f.querySelector('.detail-field-label')).toUpperCase();
        const v = f.querySelector('.detail-field-value');
        if (!v) return;
        if (lab.indexOf('DT') === 0) dtContrato = txt(v);
        else if (lab.indexOf('VENCIMENTO') === 0) {
          const first = v.firstChild && v.firstChild.nodeType === 3 ? v.firstChild.textContent : v.textContent;
          vencimento = first.trim();
          const b = v.querySelector('span');
          badge = b ? b.textContent.replace(/^[^\p{L}]+/u, '').trim() : '';
          const color = v.style.color || '';
          tone = /danger/.test(color) ? 'late' : /warning/.test(color) ? 'warn' : '';
        }
      });
      if (dtContrato || vencimento) {
        vigencia = card('dd-sec-vig', 'Vigência', 'clock');
        const wrap = el('div', 'dd-vig');
        const pairs = [];
        if (dtContrato) pairs.push(['Data do contrato', dtContrato]);
        if (vencimento) pairs.push(['Vencimento', vencimento]);
        wrap.appendChild(fieldsList(pairs));
        if (badge) {
          const pill = el('span', 'dd-pill' + (tone ? ' dd-' + tone : ''));
          pill.innerHTML = svg(tone ? 'alert' : 'clock', 14);
          pill.appendChild(document.createTextNode(humanizeDeadline(badge)));
          wrap.appendChild(pill);
        }
        vigencia.appendChild(wrap);
      }
    }
    const top = el('div', 'dd-top' + (vigencia ? '' : ' dd-single'));
    top.id = 'dd-sec-resumo';
    top.appendChild(ident);
    if (vigencia) top.appendChild(vigencia);

    /* Indicadores: os mesmos sete valores do popup original. */
    const lp = txt(mainVals[4]), lr = txt(mainVals[5]), lt = finVal(2);
    const row1 = el('div', 'dd-kpis dd-k3');
    row1.setAttribute('role', 'group');
    row1.setAttribute('aria-label', 'Resumo financeiro do contrato');
    row1.append(
      kpi('Valor do contrato', txt(mainVals[3]), 'Soma dos itens', 'money', 'green'),
      kpi('Lucro previsto', lp, 'Previsto nos itens', 'chart', isNeg(lp) ? 'red' : 'green'),
      kpi('Lucro realizado', lr, 'Compras com data de pagamento', 'trend', isNeg(lr) ? 'red' : 'green')
    );
    const row2 = el('div', 'dd-kpis dd-k4');
    row2.setAttribute('role', 'group');
    row2.setAttribute('aria-label', 'Totais das compras do contrato');
    row2.append(
      kpi('Total de compras', finVal(0), 'Soma das compras registradas', 'cart', 'neutral'),
      kpi('Total de custos', finVal(1), 'Custos das compras', 'coins', 'neutral'),
      kpi('Lucro total', lt, 'Lucro de todas as compras', 'pie', (fin[2].querySelector('.lb-c-danger') || isNeg(lt)) ? 'red' : 'green'),
      kpi('A receber', finVal(3), 'Compras sem data de pagamento', 'hourglass', 'amber')
    );

    const holder = el('div', 'dd-sections');
    holder.append(top, row1, row2);

    /* Observacao. */
    const obsField = body.querySelector(':scope > .detail-field.lb-mb12');
    if (obsField) {
      const obs = card('dd-sec-obs', 'Observação', 'note', 'dd-obs');
      obs.appendChild(el('p', 'dd-obs-text', txt(obsField.querySelector('.detail-field-value'))));
      holder.appendChild(obs);
    }

    /* Empenhos vinculados: os botoes originais sao movidos, com seus eventos. */
    const related = body.querySelector(':scope > .lb-related-empenhos');
    if (related) {
      const rc = card('dd-sec-emp', 'Empenhos deste contrato', 'file', 'dd-related');
      const list = related.querySelector('.lb-related-list');
      if (list) rc.appendChild(list);
      holder.appendChild(rc);
    }

    /* Tabelas: a de compras e identificada pelo checkbox de selecao; a outra e a de itens. */
    const buyChk = body.querySelector('table input[id^="chk-all-disp-"]');
    const buysTable = buyChk ? buyChk.closest('table') : null;
    const itemsTable = [...body.querySelectorAll(':scope > table.lotes-status-table')].find((t) => t !== buysTable) || null;
    const emptyNote = body.querySelector(':scope > .lb-empty-note');

    const items = card('dd-sec-itens', 'Itens e lotes', 'box');
    if (itemsTable) {
      itemsTable.classList.add('dd-items');
      const headRow = itemsTable.tHead && itemsTable.tHead.rows[0];
      if (headRow) headRow.appendChild(el('th', '', 'Ações'));
      [...itemsTable.tBodies[0].rows].forEach((tr) => {
        const c = tr.cells;
        const tag = tr.querySelector('.lb-tag-empenhar');
        if (tag) {
          const prev = tag.previousSibling;
          tag.remove();
          if (prev && prev.nodeType === 3 && !prev.textContent.trim()) prev.remove();
        }
        if (tr.style && tr.style.background) tr.style.removeProperty('background');
        if (c[5] && /COMPLETO/i.test(c[5].textContent)) c[5].textContent = 'Completo';
        if (c[6]) {
          const fill = c[6].querySelector('.progress-bar-fill');
          const wrapBar = c[6].querySelector('.progress-bar-wrap');
          if (fill && wrapBar) {
            const pct = fill.style.width || '0%';
            const box = el('div', 'dd-prog');
            box.appendChild(wrapBar);
            box.appendChild(el('span', 'dd-pct', pct));
            c[6].replaceChildren(box);
          }
        }
        const act = tr.insertCell();
        act.className = 'dd-act';
        if (tag) {
          const name = txt(c[0].querySelector('strong')) || 'item';
          const b = el('button', 'dd-empenhar');
          b.type = 'button';
          b.setAttribute('aria-label', 'Criar empenho para o item ' + name);
          b.innerHTML = svg('plus', 14);
          b.appendChild(document.createTextNode('Empenhar'));
          act.appendChild(b);
        } else {
          act.appendChild(el('span', 'dd-none', '—'));
        }
      });
      const sc = el('div', 'dd-scroll');
      itemsTable.parentNode.insertBefore(sc, itemsTable);
      sc.appendChild(itemsTable);
      items.appendChild(sc);
    } else if (emptyNote) {
      items.appendChild(emptyNote);
    }
    holder.appendChild(items);

    /* Compras do contrato. */
    let buys = null;
    if (buysTable) {
      const n = buysTable.tBodies[0] ? buysTable.tBodies[0].rows.length : 0;
      buys = card('dd-sec-compras', 'Compras do contrato', 'cart');
      buys.querySelector('h3').append(' ', el('span', 'dd-count', '(' + n + ')'));
      const exp = body.querySelector('.lb-btn-export');
      if (exp) {
        const tools = el('div', 'dd-tools');
        tools.appendChild(exp);
        buys.querySelector('.dd-head').appendChild(tools);
      }
      buysTable.classList.add('dd-buys');
      [...(buysTable.tBodies[0] ? buysTable.tBodies[0].rows : [])].forEach((tr) => {
        const lucro = tr.cells[7];
        if (lucro && /-/.test(lucro.textContent)) { lucro.classList.remove('lb-c-success'); lucro.classList.add('lb-c-danger'); }
      });
      buysTable.querySelectorAll('a[href]').forEach((a) => {
        const t = a.textContent.replace(/^[^\p{L}]+/u, '').trim();
        a.textContent = t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Abrir';
        a.removeAttribute('style');
      });
      const sc = el('div', 'dd-scroll');
      buysTable.parentNode.insertBefore(sc, buysTable);
      sc.appendChild(buysTable);
      buys.appendChild(sc);
      holder.appendChild(buys);
    }

    /* Comentarios: lista e campo originais, com a contagem mantida em dia. */
    const list = body.querySelector('[id^="coment-list-"]');
    let coment = null;
    if (list) {
      coment = card('dd-sec-coment', 'Comentários', 'chat');
      const count = el('span', 'dd-count', '(' + countComments(list) + ')');
      coment.querySelector('h3').append(' ', count);
      const inputRow = list.nextElementSibling;
      coment.appendChild(list);
      if (inputRow) coment.appendChild(inputRow);
      if (window.MutationObserver) {
        new MutationObserver(() => { count.textContent = '(' + countComments(list) + ')'; }).observe(list, { childList: true });
      }
      holder.appendChild(coment);
    }

    body.replaceChildren(holder);
    body.scrollTop = 0;

    sections = [['Resumo', 'file', top], ['Itens e lotes', 'box', items]];
    if (buys) sections.push(['Compras', 'cart', buys]);
    if (coment) sections.push(['Comentários', 'chat', coment]);
    renderTabs();
    return true;
  }

  function currentIndex(body) {
    const top = body.getBoundingClientRect().top;
    let idx = 0;
    sections.forEach((s, i) => { if (s[2].getBoundingClientRect().top - top <= 80) idx = i; });
    if (body.scrollHeight > body.clientHeight + 1 && body.scrollTop + body.clientHeight >= body.scrollHeight - 2) idx = sections.length - 1;
    return idx;
  }

  function markTabs() {
    const body = $('popup-d-body');
    if (!nav || !body || !sections.length) return;
    const idx = Math.min(currentIndex(body), sections.length - 1);
    nav.querySelectorAll('.dd-tab').forEach((t, i) => {
      if (i === idx) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  function renderTabs() {
    if (!nav) return;
    nav.replaceChildren();
    sections.forEach(([text, icon, target]) => {
      const b = el('button', 'dd-tab');
      b.type = 'button';
      b.innerHTML = svg(icon, 16);
      b.appendChild(document.createTextNode(text));
      b.addEventListener('click', () => {
        const body = $('popup-d-body');
        const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (body.scrollHeight > body.clientHeight + 1) {
          const delta = target.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
          body.scrollTo({ top: body.scrollTop + delta, behavior: calm ? 'auto' : 'smooth' });
        } else {
          target.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' });
        }
      });
      nav.appendChild(b);
    });
    markTabs();
  }

  function init() {
    const overlay = $('popup-disputa');
    const popup = overlay && overlay.querySelector('.detail-popup');
    const header = popup && popup.querySelector('.detail-popup-header');
    const body = $('popup-d-body');
    if (!popup || !header || !body || overlay.dataset.ddReady || typeof window.abrirPopupDisputa !== 'function') return;
    overlay.dataset.ddReady = '1';
    overlay.classList.add('dd-modern');

    const style = document.createElement('style');
    style.id = 'lb-contrato-detalhe-moderno';
    style.textContent = css;
    document.head.appendChild(style);

    nav = el('nav', 'dd-tabs');
    nav.setAttribute('aria-label', 'Seções do contrato');
    header.insertAdjacentElement('afterend', nav);
    body.addEventListener('scroll', () => safe('abas', markTabs), { passive: true });

    /* Rodape: a regra de exibicao dos botoes continua em abrirPopupDisputa(). */
    const del = $('popup-d-del-btn');
    if (del && !del.querySelector('svg')) {
      del.textContent = 'Excluir contrato';
      del.insertAdjacentHTML('afterbegin', svg('trash', 15));
    }

    const original = window.abrirPopupDisputa;
    window.abrirPopupDisputa = function () {
      overlay.classList.add('dd-modern');
      window.__ddErro = '';
      const result = original.apply(this, arguments);
      if (!safe('estrutura', build)) {
        /* Estrutura inesperada ou erro: devolve o popup original completo, sem nenhum estilo desta camada.
           O motivo fica em window.__ddErro e no console. */
        overlay.classList.remove('dd-modern');
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
