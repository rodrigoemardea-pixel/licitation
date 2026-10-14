// LicitationBiznis: camada visual isolada do formulario de empenho (#modal-empenhos), novo e edicao.
// 05/06/07 continuam responsaveis por tudo: populateDisputaSelect, onDisputaSelecionada, toggleLoteCard,
// atualizarVemTotal, saveE, editE e clearE. Os campos sao apenas reposicionados, com os mesmos ids.
// O campo de CNPJ do modulo 25 e adotado quando aparece. Os cartoes de item sao recriados pelo 05 a cada
// troca de contrato; o visual deles e feito so por CSS, sem alterar o HTML gerado.
(function () {
  'use strict';

  const P = '#modal-empenhos.ne2';
  const css = `
${P} .modal{max-width:900px!important;width:96%}
${P} .modal-header{align-items:flex-start;gap:16px;padding:18px 22px 14px}
${P} #ttl-empenhos{text-transform:none;font-size:18px!important;font-weight:700;letter-spacing:-.25px}
${P} .ne2-sub{margin:4px 0 0;font-size:12.5px;line-height:1.5;color:#687586}
${P} .modal-close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;border-radius:8px!important}
${P} .modal-body{padding:18px 22px;background:var(--bg-app,#f6f8f9)}
${P} .ne2-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px;min-width:0}
${P} .ne2-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
${P} .ne2-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
${P} .ne2-head p{margin:2px 0 0;font-size:12px;color:#5f6d68;line-height:1.4}
${P} .ne2-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
${P} .ne2-ico svg,${P} .ne2-foot-hint svg{display:block;flex:0 0 auto}
${P} .ne2-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
${P} .ne2-req{margin-left:auto;padding:2px 9px;border-radius:99px;background:#f9e8e8;color:#a42b25;font-size:11px;font-weight:600;white-space:nowrap}
${P} .ne2-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
${P} .ne2-grid .fg{min-width:0;grid-column:auto!important}
${P} .fl{text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:600!important;color:#566158!important;margin-bottom:4px}
${P} .fl>span{display:none}
${P} #e-disputa-id{font-size:13px!important}
${P} .ne2-help{margin-top:6px;font-size:11.5px!important;color:#5f6d68!important;line-height:1.4}
${P} #lote-selector-wrap{margin-top:16px;padding-top:14px;border-top:1px solid var(--surface-border,#e3e8e5)}
${P} #lote-selector-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
${P} .lote-selector-card{position:relative;padding:12px 14px!important;border:1px solid var(--surface-border,#e3e8e5)!important;border-radius:10px!important;background:#fff!important;cursor:pointer;min-width:0}
${P} .lote-selector-card:hover:not(.sem-saldo){border-color:#2d6a4f!important}
${P} .lote-selector-card.selected{border:2px solid #2d6a4f!important;background:#edf6f1!important;padding:11px 13px!important}
${P} .lote-selector-card.sem-saldo{opacity:.6;cursor:not-allowed}
${P} .lote-selector-card>div:first-child>div>div:first-child{font-size:13px!important;font-weight:650!important;color:var(--text-primary,#17231e);overflow-wrap:anywhere}
${P} .lote-selector-card>div:first-child>div>div:nth-child(2){font-size:12px!important;color:#5f6d68!important;line-height:1.45}
${P} .lote-selector-card input[type=checkbox]{width:16px;height:16px;accent-color:#2d6a4f}
${P} .lote-saldo-badge{font-size:11.5px!important;font-weight:650!important;padding:2px 9px!important;border-radius:99px!important}
${P} .lote-saldo-ok{background:#e6f2ec!important;color:#245b43!important}
${P} .lote-saldo-zero{background:#edf1ef!important;color:#5f6d68!important}
${P} .lote-qtd-input-wrap{margin-top:8px;padding-top:8px;border-top:1px dashed #cfe0d7;align-items:center;gap:8px}
${P} .lote-qtd-input-wrap label{font-size:12px!important;font-weight:600;color:#566158}
${P} .lote-qtd-input-wrap input{width:90px!important;min-height:34px;text-align:right}
${P} [id^="lval-"]{margin-left:auto;font-size:13px!important;color:#2d6a4f!important;font-variant-numeric:tabular-nums}
${P} #lote-aviso{margin-top:10px!important;padding:8px 12px;border-radius:8px;background:#f9e8e8;color:#a42b25!important;font-size:12px!important;font-weight:600;text-transform:none}
${P} #lote-valor-total-wrap{margin-top:12px!important;padding:12px 14px!important;border:1px solid #cfe0d7;border-radius:10px!important;background:#edf6f1!important;justify-content:space-between;align-items:center;gap:12px}
${P} #lote-valor-total-wrap[style*="block"]{display:flex!important}
${P} #lote-valor-total-wrap>span{font-size:12.5px!important;color:#245b43!important;font-weight:600;text-transform:none}
${P} #lote-valor-total-calc{font-size:20px!important;color:#2d6a4f!important;font-variant-numeric:tabular-nums;white-space:nowrap}
${P} .ne2-count{margin-left:auto;font-size:11px;color:#5f6d68;font-weight:500;font-variant-numeric:tabular-nums}
${P} .modal-footer{align-items:center;justify-content:flex-end;gap:10px}
${P} .ne2-foot-hint{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0;font-size:12px;line-height:1.4;color:#5f6d68}
${P} .ne2-foot-hint svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} button:focus-visible,${P} select:focus-visible,${P} input:focus-visible,${P} textarea:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:600px){${P} .ne2-grid{grid-template-columns:minmax(0,1fr)!important}${P} .modal-body{padding:12px}${P} .ne2-card{padding:14px}${P} .modal-footer{flex-wrap:wrap}${P} .ne2-foot-hint{flex:1 1 100%;margin-right:0}${P} #lote-valor-total-wrap{flex-wrap:wrap}}
`;

  const paths = {
    file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5 M12 8h.01'
  };
  const svg = (n, s) => '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + paths[n] + '"/></svg>';
  const $ = (id) => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const fgOf = (id) => { const e = $(id); return e ? e.closest('.fg') : null; };

  function safe(label, fn) {
    try { fn(); return true; } catch (err) {
      window.__neErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[empenho-modal] ' + label + ':', err);
      return false;
    }
  }

  /* Troca o texto do rotulo sem mexer nos elementos internos que outros modulos possam ter colocado. */
  function relabel(id, text) {
    const fg = fgOf(id);
    const label = fg && fg.querySelector('label.fl');
    if (!label) return;
    if (!label.htmlFor) label.htmlFor = id;
    const node = [...label.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (node) node.textContent = text + ' ';
    else label.insertBefore(document.createTextNode(text + ' '), label.firstChild);
  }

  function card(id, title, icon, sub, req) {
    const s = el('section', 'ne2-card');
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    const h = el('div', 'ne2-head');
    const i = el('span', 'ne2-ico');
    i.innerHTML = svg(icon, 16);
    const tx = el('div');
    const t = el('h3', '', title);
    t.id = id + '-t';
    tx.appendChild(t);
    if (sub) tx.appendChild(el('p', '', sub));
    h.append(i, tx);
    if (req) h.appendChild(el('span', 'ne2-req', req));
    s.appendChild(h);
    return s;
  }

  let overlay, gridIdent;

  function adoptCnpj() {
    const fg = fgOf('e-cnpj');
    if (fg) relabel('e-cnpj', 'CNPJ do destinatário (para NF)');
    if (fg && gridIdent && fg.parentNode !== gridIdent) gridIdent.insertBefore(fg, fgOf('e-data'));
    if ($('e-num')) {
      relabel('e-num', 'Nº da ordem de fornecimento');
      const n = $('e-num');
      if (/^No da/i.test(n.placeholder || '')) n.placeholder = 'Nº da ordem de fornecimento';
    }
  }

  function sync() {
    const t = $('ttl-empenhos');
    if (t) {
      const v = t.textContent.trim();
      if (v === 'EDITAR EMPENHO') t.textContent = 'Editar empenho';
      else if (v === 'Novo Empenho') t.textContent = 'Novo empenho';
    }
    const c = $('e-observacao'), n = $('ne2-obs-count');
    if (c && n) n.textContent = c.value.length + '/' + (c.maxLength > 0 ? c.maxLength : 200);
    const sel = $('e-disputa-id'), sub = $('ne2-sub');
    if (sel && sub) {
      const o = sel.options[sel.selectedIndex];
      sub.textContent = o && o.value ? o.textContent.split(' · ')[0] : 'Selecione o contrato e os itens a empenhar.';
    }
  }

  function build() {
    overlay = $('modal-empenhos');
    const modal = overlay && overlay.querySelector('.modal');
    const body = modal && modal.querySelector('.modal-body');
    const grid = body && body.querySelector(':scope > .form-grid');
    const head = modal && modal.querySelector('.modal-header');
    const foot = modal && modal.querySelector('.modal-footer');
    const title = $('ttl-empenhos');
    if (!grid || !head || !foot || !title || !$('e-disputa-id') || !$('lote-selector-wrap')) throw new Error('estrutura inesperada do formulario de empenho');
    if (overlay.dataset.ne2Ready) return;
    overlay.dataset.ne2Ready = '1';
    overlay.classList.add('ne2');
    const style = el('style'); style.id = 'lb-empenho-modal-moderno'; style.textContent = css; document.head.appendChild(style);

    const ht = el('div');
    head.insertBefore(ht, title);
    ht.appendChild(title);
    const sub = el('p', 'ne2-sub'); sub.id = 'ne2-sub'; ht.appendChild(sub);

    /* 1. Identificacao. */
    const s1 = card('ne2-sec-ident', 'Identificação', 'file');
    /* Tambem recebe a classe form-grid: o 25 procura '#modal-empenhos .form-grid' para inserir o CNPJ
       ao lado do campo da ordem de fornecimento; esta grade vem primeiro no corpo e e a encontrada. */
    gridIdent = el('div', 'ne2-grid form-grid');
    [['e-num', 'Nº da ordem de fornecimento'], ['e-data', 'Data do empenho'], ['e-analista', 'Analista']].forEach(([id, t]) => {
      const fg = fgOf(id); if (!fg) return; relabel(id, t); gridIdent.appendChild(fg);
    });
    s1.appendChild(gridIdent);

    /* 2. Contrato e itens. */
    const s2 = card('ne2-sec-itens', 'Contrato e itens', 'box', 'Apenas contratos com saldo de itens a empenhar são listados.', 'Obrigatório');
    const fgD = fgOf('e-disputa-id');
    relabel('e-disputa-id', 'Órgão / contrato');
    const help = fgD.querySelector(':scope > div');
    if (help) { help.removeAttribute('style'); help.className = 'ne2-help'; help.textContent = 'Ao escolher o contrato, os itens com saldo aparecem abaixo e o analista do contrato é preenchido.'; }
    s2.appendChild(fgD);
    const wrap = $('lote-selector-wrap');
    const lab = wrap.querySelector(':scope > label.fl');
    if (lab) lab.textContent = 'Itens do empenho (selecione um ou mais)';
    s2.appendChild(wrap);
    /* O bloco ja foi movido para o cartao, que ainda nao esta na pagina: busca a partir dele. */
    const tv = wrap.querySelector('#lote-valor-total-wrap');
    if (tv) { const sp = tv.querySelector('span'); if (sp) sp.textContent = 'Valor total do empenho (calculado)'; }
    const av = wrap.querySelector('#lote-aviso');
    if (av) { const svgEl = av.querySelector('svg'); av.textContent = 'Selecione pelo menos um item para continuar.'; if (svgEl) av.prepend(svgEl); }

    /* 3. Observacao. */
    const s3 = card('ne2-sec-obs', 'Observação', 'note');
    const fgO = fgOf('e-observacao');
    if (fgO) {
      relabel('e-observacao', 'Informações adicionais');
      const l = fgO.querySelector('label.fl');
      const cnt = el('span', 'ne2-count'); cnt.id = 'ne2-obs-count';
      cnt.style.display = 'inline';
      if (l) { l.style.display = 'flex'; l.appendChild(cnt); }
      const o = $('e-observacao'); if (o && /Informa/i.test(o.placeholder)) o.placeholder = 'Informações adicionais...';
      s3.appendChild(fgO);
    }

    /* Os campos ocultos continuam na grade original, que fica no corpo apenas com eles. */
    body.insertBefore(s3, grid);
    body.insertBefore(s2, s3);
    body.insertBefore(s1, s2);
    grid.style.display = 'none';

    const hint = el('div', 'ne2-foot-hint');
    hint.innerHTML = svg('info', 15);
    hint.appendChild(el('span', '', 'O valor do empenho é a soma dos itens selecionados.'));
    foot.insertBefore(hint, foot.firstChild);
    const save = foot.querySelector('.btn-primary');
    if (save && save.textContent.trim() === 'Salvar') save.textContent = 'Salvar empenho';

    adoptCnpj();
    new MutationObserver(() => safe('cnpj', adoptCnpj)).observe(grid, { childList: true });
    new MutationObserver(() => safe('cnpj', adoptCnpj)).observe(gridIdent, { childList: true });
    new MutationObserver(() => safe('titulo', sync)).observe(title, { childList: true, characterData: true, subtree: true });
    new MutationObserver((rs) => {
      const was = (v) => (' ' + (v || '') + ' ').indexOf(' open ') >= 0;
      if (overlay.classList.contains('open') && rs.some((r) => !was(r.oldValue))) {
        body.scrollTop = 0;
        safe('abertura', () => { adoptCnpj(); sync(); });
        setTimeout(() => safe('abertura', () => { adoptCnpj(); sync(); }), 80);
      }
    }).observe(overlay, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    $('e-disputa-id').addEventListener('change', () => safe('contrato', sync));
    const o = $('e-observacao'); if (o) o.addEventListener('input', () => safe('contador', sync));
    sync();
  }

  function init() {
    if (!safe('estrutura', build)) { const o = $('modal-empenhos'); if (o) o.classList.remove('ne2'); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
