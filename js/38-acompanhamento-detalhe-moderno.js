// LicitationBiznis: camada visual isolada do popup de detalhes do acompanhamento (#popup-acomp).
// verAcomp() (JS 12) continua montando o popup. Este modulo reorganiza o resultado em cartoes,
// lendo os valores do HTML gerado. O status do acompanhamento nao aparece no HTML original;
// ele e lido de DB.acomp pelo nome da variavel global (nao por window) e omitido se indisponivel.
(function () {
  'use strict';

  const P = '#popup-acomp.ac2';
  const css = `
#popup-acomp .detail-close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;display:inline-grid!important;place-items:center;padding:0!important;border:1px solid var(--border-medium,#ccd5d0)!important;border-radius:8px!important;background:#fff!important;color:#34413b!important;font-size:15px!important;line-height:1!important;flex:0 0 36px}
#popup-acomp .detail-close:hover{background:var(--bg-surface-hover,#f4f7f5)!important}
#popup-acomp .detail-close .lb-ui-icon{margin:0!important}
#popup-acomp .lb-resize-indicador{display:none!important}
${P} .detail-popup{max-width:980px}
${P} .detail-popup-header{align-items:flex-start;gap:14px;margin-bottom:12px}
${P} .detail-popup-header>div:first-child{min-width:0;flex:1}
${P} .ac2-titlerow{display:flex;align-items:center;flex-wrap:wrap;gap:8px 12px}
${P} .detail-popup-title{font-size:18px!important;font-weight:700;letter-spacing:-.25px;line-height:1.3;overflow-wrap:anywhere}
${P} .detail-popup-sub{margin-top:4px;font-size:12.5px;line-height:1.5;color:#687586}
${P} .detail-popup-sub:empty{display:none}
${P} .ac2-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:650;white-space:nowrap}
${P} .ac2-pill svg,${P} .ac2-ico svg,${P} .ac2-btn svg,${P} #popup-ac-conv-btn svg,${P} #popup-ac-edit-btn svg{display:block;flex:0 0 auto}
${P} .ac2-pill svg{width:14px!important;height:14px!important;max-width:14px!important;max-height:14px!important}
${P} .ac2-late{background:#f9e8e8;color:#a42b25}
${P} .ac2-today{background:#fbefdb;color:#7d4d00}
${P} .ac2-ok{background:#e6f2ec;color:#245b43}
${P} .ac2-neutral{background:#edf1ef;color:#34413b}
${P} #popup-ac-body{background:var(--bg-app,#f6f8f9);border-radius:12px;padding:14px!important}
${P} .ac2-top{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;margin-bottom:14px}
${P} .ac2-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px;min-width:0}
${P} .ac2-top>.ac2-card{margin-bottom:0}
${P} .ac2-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
${P} .ac2-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
${P} .ac2-count{font-weight:500;color:#5f6d68}
${P} .ac2-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
${P} .ac2-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
${P} .ac2-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 18px;margin:0}
${P} .ac2-fields dt{margin:0 0 3px;font-size:12px;font-weight:500;color:#5f6d68}
${P} .ac2-fields dd{margin:0;font-size:13.5px;font-weight:600;color:var(--text-primary,#17231e);overflow-wrap:anywhere}
${P} .ac2-when{font-size:20px;font-weight:700;line-height:1.25;color:var(--text-primary,#17231e);font-variant-numeric:tabular-nums}
${P} .ac2-when.ac2-c-late{color:#b32929}
${P} .ac2-when.ac2-c-today{color:#8a5200}
${P} .ac2-rel{margin-top:4px;font-size:12.5px;color:#5f6d68}
${P} .ac2-rel.ac2-c-late{color:#a42b25;font-weight:600}
${P} .ac2-link{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
${P} .ac2-url{flex:1 1 260px;min-width:0;padding:9px 12px;border:1px solid var(--surface-border,#e3e8e5);border-radius:8px;background:#f7f9f8;font-size:12.5px;color:#34413b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
${P} .ac2-btn{display:inline-flex;align-items:center;gap:6px;min-height:38px;padding:7px 12px;border:1px solid var(--border-medium,#ccd5d0);border-radius:8px;background:#fff;color:var(--text-primary,#17231e);font:inherit;font-size:12.5px;font-weight:650;cursor:pointer;text-decoration:none;white-space:nowrap}
${P} .ac2-btn:hover{background:var(--bg-surface-hover,#f4f7f5)}
${P} .ac2-btn svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} .ac2-obs{margin:0;font-size:13px;line-height:1.55;color:var(--text-primary,#17231e);white-space:pre-wrap;overflow-wrap:anywhere}
${P} [id^="coment-list-"]{max-height:220px;margin-bottom:10px!important}
${P} [id^="coment-list-"]>div[style*="text-tertiary"]:only-child{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px!important;font-size:12.5px!important;color:#5f6d68!important;text-align:center}
${P} [id^="coment-list-"]>div[style*="text-tertiary"]:only-child::before{content:"";width:26px;height:26px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235f6d68' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'/%3E%3C/svg%3E") center/contain no-repeat}
${P} input[id^="coment-input-"]{text-transform:none!important;min-width:0}
${P} .detail-actions{align-items:center;gap:10px;padding-top:14px}
${P} #popup-ac-edit-btn{display:inline-flex;align-items:center;gap:7px;background:#fff!important;color:var(--text-primary,#17231e)!important;border:1px solid var(--border-medium,#ccd5d0)!important;box-shadow:none!important;transform:none!important}
${P} #popup-ac-edit-btn:hover{background:var(--bg-surface-hover,#f4f7f5)!important}
${P} #popup-ac-conv-btn{display:inline-flex;align-items:center;gap:7px;background:var(--accent,#2d6a4f)!important;color:#fff!important;border:0!important;box-shadow:none!important;transform:none!important}
${P} #popup-ac-conv-btn:hover{background:var(--accent-hover,#245b43)!important}
${P} #popup-ac-edit-btn svg,${P} #popup-ac-conv-btn svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} button:focus-visible,${P} a:focus-visible,${P} input:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:760px){${P} .ac2-top{grid-template-columns:minmax(0,1fr)}${P} #popup-ac-body{padding:10px!important}${P} .ac2-card{padding:14px}${P} .detail-actions{flex-wrap:wrap}${P} .detail-actions .btn{flex:1 1 auto;justify-content:center}}
@media(max-width:420px){${P} .ac2-fields{grid-template-columns:minmax(0,1fr)}}
`;

  const paths = {
    building: 'M3 20h18M5 20V7l7-4v17M19 20V10l-7-3M8 9h1M8 12h1M8 15h1M15 12h1M15 15h1',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    alert: 'M12 3l10 18H2z M12 9v5 M12 17h.01',
    link: 'M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1 M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1',
    ext: 'M14 4h6v6 M20 4l-9 9 M10 5H4v15h15v-6',
    copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
    check: 'M5 12l4 4 10-10',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
    edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z',
    arrow: 'M5 12h14 M13 6l6 6-6 6'
  };
  const svg = (n, s) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + paths[n] + '"/></svg>';
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const txt = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');

  function safe(label, fn) {
    try { fn(); return true; } catch (err) {
      window.__acErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[acompanhamento-detalhe] ' + label + ':', err);
      return false;
    }
  }

  function card(id, title, icon) {
    const s = el('section', 'ac2-card');
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    const h = el('div', 'ac2-head');
    const i = el('span', 'ac2-ico');
    i.innerHTML = svg(icon, 16);
    const t = el('h3', '', title);
    t.id = id + '-t';
    h.append(i, t);
    s.appendChild(h);
    return s;
  }

  /* Status: nao esta no HTML original. Leitura opcional de DB pelo nome global. */
  function statusOf(id) {
    try {
      // eslint-disable-next-line no-undef
      const r = (DB.acomp || []).find((x) => x.id === id);
      return r ? ({ pendente: 'Pendente', recurso: 'Em recurso', perdida: 'Perdida' }[r.status] || r.status || '') : '';
    } catch (e) { return ''; }
  }

  function parseWhen(s) {
    const m = String(s).match(/(\d{2})\/(\d{2})\/(\d{4})\D+(\d{2}):(\d{2})/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]) : null;
  }

  function relative(d, late) {
    const ms = Math.abs(Date.now() - d.getTime());
    const days = Math.floor(ms / 864e5), hours = Math.floor(ms / 36e5);
    const part = days >= 1 ? days + (days === 1 ? ' dia' : ' dias') : hours >= 1 ? hours + (hours === 1 ? ' hora' : ' horas') : 'menos de 1 hora';
    return late ? 'Vencido há ' + part : 'Faltam ' + part;
  }

  function copyText(text, btn) {
    const done = () => { btn.innerHTML = svg('check', 15); btn.appendChild(document.createTextNode('Copiado')); setTimeout(() => { btn.innerHTML = svg('copy', 15); btn.appendChild(document.createTextNode('Copiar')); }, 1600); };
    const fallback = () => {
      const t = el('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* sem permissao */ }
      t.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  function clearPrevious() {
    document.querySelectorAll('#popup-acomp .ac2-pill').forEach((n) => n.remove());
    const row = document.querySelector('#popup-acomp .ac2-titlerow');
    if (row) { const t = $('popup-ac-title'); row.parentNode.insertBefore(t, row); row.remove(); }
  }

  function build(id) {
    const body = $('popup-ac-body');
    const grid = body.querySelector(':scope > .detail-grid-3');
    const f3 = grid ? [...grid.querySelectorAll('.detail-field-value')] : [];
    const fields = [...body.querySelectorAll(':scope > .detail-field')];
    const byLabel = (re) => fields.find((f) => re.test(txt(f.querySelector('.detail-field-label'))));
    const fRet = byLabel(/RETORNO/i);
    if (f3.length < 3 || !fRet) throw new Error('estrutura inesperada: ' + f3.length + ' campos e retorno ' + !!fRet);
    clearPrevious();

    /* Cabecalho: "ORGAO / UF" e "tipo processo" vem do verAcomp. */
    const title = $('popup-ac-title'), sub = $('popup-ac-sub');
    const tt = txt(title), mUF = tt.match(/^(.*) \/ ([A-Z]{2})$/);
    const uf = mUF ? mUF[2] : '';
    if (mUF) title.textContent = mUF[1];
    const subRaw = txt(sub) === '—' ? '' : txt(sub);
    const ms = subRaw.match(/^(Pregão Eletrônico|Dispensa)\s*(.*)$/i);
    const parts = ms ? [ms[1], ms[2] ? 'Processo ' + ms[2] : ''] : [subRaw];
    if (uf) parts.push(uf);
    sub.textContent = parts.filter(Boolean).join(' · ');

    /* Retorno. */
    const vEl = fRet.querySelector('.detail-field-value');
    const vTxt = txt(vEl);
    const late = /VENCIDO/i.test(vTxt);
    const when = parseWhen(vTxt);
    const today = !late && /warning/.test(vEl.getAttribute('style') || '');
    const row = el('div', 'ac2-titlerow');
    title.parentNode.insertBefore(row, title);
    row.appendChild(title);
    if (when) {
      const pill = el('span', 'ac2-pill ' + (late ? 'ac2-late' : today ? 'ac2-today' : 'ac2-ok'));
      pill.innerHTML = svg(late ? 'alert' : 'clock', 14);
      const hh = when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      pill.appendChild(document.createTextNode((late ? 'Retorno vencido · ' : today ? 'Retorno hoje · ' : 'Retorno · ') + when.toLocaleDateString('pt-BR') + ' ' + hh));
      row.appendChild(pill);
    }

    /* Identificacao. */
    const ident = card('ac2-sec-ident', 'Identificação', 'building');
    const dl = el('dl', 'ac2-fields');
    const st = statusOf(id);
    [['Analista', txt(f3[0])], ['Empresa', txt(f3[2])], ['Sistema', txt(f3[1])]].concat(st ? [['Status', st]] : []).forEach(([k, v]) => {
      const w = el('div'); w.append(el('dt', '', k), el('dd', '', v || '—')); dl.appendChild(w);
    });
    ident.appendChild(dl);

    const ret = card('ac2-sec-ret', 'Retorno', 'clock');
    if (when) {
      const tone = late ? ' ac2-c-late' : today ? ' ac2-c-today' : '';
      ret.appendChild(el('div', 'ac2-when' + tone, when.toLocaleDateString('pt-BR') + ' às ' + when.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })));
      ret.appendChild(el('div', 'ac2-rel' + tone, today && !late ? 'Hoje · ' + relative(when, false).toLowerCase() : relative(when, late)));
    } else {
      ret.appendChild(el('div', 'ac2-rel', 'Sem data de retorno cadastrada.'));
    }
    const top = el('div', 'ac2-top');
    top.append(ident, ret);
    const holder = el('div', 'ac2-sections');
    holder.appendChild(top);

    /* Link: o <a> original e mantido (mesmo href, target e rel), agora como botao "Abrir". */
    const fLink = byLabel(/LINK/i);
    const a = fLink && fLink.querySelector('a[href]');
    if (a) {
      const lc = card('ac2-sec-link', 'Link do sistema', 'link');
      const box = el('div', 'ac2-link');
      const url = el('div', 'ac2-url', a.getAttribute('href'));
      url.title = a.getAttribute('href');
      a.className = 'ac2-btn'; a.removeAttribute('style'); a.innerHTML = svg('ext', 15); a.appendChild(document.createTextNode('Abrir'));
      a.setAttribute('aria-label', 'Abrir link do sistema em nova aba');
      const cp = el('button', 'ac2-btn'); cp.type = 'button'; cp.innerHTML = svg('copy', 15); cp.appendChild(document.createTextNode('Copiar'));
      cp.setAttribute('aria-label', 'Copiar link do sistema');
      cp.addEventListener('click', () => copyText(url.textContent, cp));
      box.append(url, a, cp);
      lc.appendChild(box);
      holder.appendChild(lc);
    }

    const fObs = byLabel(/OBSERVA/i);
    if (fObs) {
      const oc = card('ac2-sec-obs', 'Observação', 'note');
      oc.appendChild(el('p', 'ac2-obs', fObs.querySelector('.detail-field-value').textContent.trim()));
      holder.appendChild(oc);
    }

    const list = body.querySelector('[id^="coment-list-"]');
    if (list) {
      const cc = card('ac2-sec-coment', 'Comentários', 'chat');
      const count = el('span', 'ac2-count', '');
      const sync = () => { count.textContent = '(' + [...list.children].filter((c) => !/Nenhum coment/i.test(c.textContent)).length + ')'; };
      cc.querySelector('h3').append(' ', count);
      const input = list.nextElementSibling;
      cc.appendChild(list);
      if (input) cc.appendChild(input);
      sync();
      new MutationObserver(sync).observe(list, { childList: true });
      holder.appendChild(cc);
    }

    body.replaceChildren(holder);
    body.scrollTop = 0;
  }

  function init() {
    const overlay = $('popup-acomp');
    const body = $('popup-ac-body');
    if (!overlay || !body || overlay.dataset.ac2Ready || typeof window.verAcomp !== 'function') return;
    overlay.dataset.ac2Ready = '1';
    const style = el('style'); style.id = 'lb-acomp-detalhe-moderno'; style.textContent = css; document.head.appendChild(style);

    const edit = $('popup-ac-edit-btn'), conv = $('popup-ac-conv-btn');
    if (edit) { edit.textContent = 'Editar'; edit.insertAdjacentHTML('afterbegin', svg('edit', 15)); }
    if (conv) { conv.textContent = 'Converter em contrato'; conv.insertAdjacentHTML('afterbegin', svg('arrow', 15)); }

    const original = window.verAcomp;
    window.verAcomp = function (id) {
      overlay.classList.add('ac2');
      window.__acErro = '';
      const r = original.apply(this, arguments);
      if (!safe('estrutura', () => build(id))) {
        overlay.classList.remove('ac2');
        clearPrevious();
        original.apply(this, arguments);
      }
      return r;
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
