// LicitationBiznis: camada visual isolada do modal de compra (#modal-compra).
// O JS 08 continua sendo a fonte de tudo: abrirCompra, selecionarCompraLote, calcCompra, togCompra
// e saveCompra. Os campos sao apenas reposicionados em secoes, com os mesmos ids e eventos.
// Os blocos criados depois por outros modulos sao adotados quando aparecem:
//   08 (status da entrega), 24 (Mercado Livre), 25 (marca e modelo para NF) e 26 (subtitulos, ocultados).
// Tambem corrige uma falha do 08: depois de abrir a compra de um empenho sem itens, o seletor de itens
// era apagado e a proxima abertura de compra gerava erro. O modulo recria o seletor antes de abrir.
(function () {
  'use strict';

  const P = '#modal-compra.cp2';
  const css = `
${P} .modal{max-width:960px!important;width:96%}
${P} .modal-header{align-items:flex-start;gap:16px;padding:18px 22px 14px}
${P} .cp2-headtext{min-width:0}
${P} #ttl-compra{text-transform:none;font-size:18px!important;font-weight:700;letter-spacing:-.25px}
${P} .cp2-sub{margin:4px 0 0;font-size:12.5px;line-height:1.5;color:#687586;overflow-wrap:anywhere}
${P} .cp2-sub:empty{display:none}
${P} .cp2-tabs{display:flex;gap:4px;padding:0 18px;flex:0 0 auto;background:#fff;border-bottom:1px solid var(--surface-border,#e3e8e5);overflow-x:auto}
${P}:not(.cp2-item) .cp2-tabs{display:none}
${P} .cp2-tab{display:flex;align-items:center;gap:8px;padding:11px 12px;border:0;border-bottom:2px solid transparent;background:none;color:#5f6d68;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;min-height:44px}
${P} .cp2-tab:hover{color:var(--text-primary,#17231e)}
${P} .cp2-tab i{font-style:normal;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;background:#edf1ef;color:#34413b}
${P} .cp2-tab[aria-current="true"]{color:#2d6a4f;border-bottom-color:#2d6a4f}
${P} .cp2-tab[aria-current="true"] i{background:#2d6a4f;color:#fff}
${P} .modal-body{padding:18px 22px;background:var(--bg-app,#f6f8f9)}
${P} .cp2-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px;min-width:0}
${P} .cp2-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
${P} .cp2-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
${P} .cp2-head p{margin:2px 0 0;font-size:12px;color:#5f6d68;line-height:1.4}
${P} .cp2-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
${P} .cp2-ico svg,${P} .cp2-calc svg,${P} .cp2-foot-hint svg{display:block;flex:0 0 auto}
${P} .cp2-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
${P} .cp2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
${P} .cp2-grid .fg{min-width:0;grid-column:auto}
${P} .cp2-grid .fg.full,${P} .cp2-grid .cp2-wide{grid-column:1/-1}
${P} .fl,${P} #c-logistica-entrega label{text-transform:none!important;letter-spacing:0!important;font-size:12px!important;font-weight:600!important;color:#566158!important;display:flex;align-items:center;gap:8px;margin-bottom:4px}
${P} #c-saldo-info{font-size:11.5px!important;color:#245b43!important;font-weight:650!important}
${P} #compra-lote-selector-wrap>.fsec{display:none}
${P} .compra-lote-select{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin:0}
${P} .compra-lote-btn{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 40px 12px 14px;border:1px solid var(--surface-border,#e3e8e5);border-radius:10px;background:#fff;text-align:left;min-height:76px}
${P} .compra-lote-btn>div:first-child{font-size:13px!important;font-weight:650!important;color:var(--text-primary,#17231e);line-height:1.35;overflow-wrap:anywhere}
${P} .compra-lote-btn>div:nth-child(2){font-size:12px!important;color:#5f6d68!important}
${P} .compra-lote-btn>div:nth-child(3){display:inline-flex;margin-top:2px;padding:2px 9px;border-radius:99px;background:#e6f2ec;color:#245b43!important;font-size:11.5px!important;font-weight:650!important}
${P} .compra-lote-btn.sem-saldo>div:nth-child(3){background:#edf1ef;color:#5f6d68!important}
${P} .compra-lote-btn:hover:not(.sem-saldo){border-color:#2d6a4f}
${P} .compra-lote-btn.selected{border:2px solid #2d6a4f;background:#edf6f1;padding:11px 39px 11px 13px}
${P} .compra-lote-btn.selected::after{content:"";position:absolute;top:10px;right:10px;width:20px;height:20px;border-radius:50%;background:#2d6a4f url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 12l4 4 8-8'/%3E%3C/svg%3E") center/12px no-repeat}
${P} .cp2-summary{display:none;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr);gap:0;margin-top:14px;border:1px solid var(--surface-border,#e3e8e5);border-radius:10px;background:#f7f9f8}
${P}.cp2-item .cp2-summary{display:grid}
${P} .cp2-summary .fg{padding:10px 14px;min-width:0}
${P} .cp2-summary .fg+.fg{border-left:1px solid var(--surface-border,#e3e8e5)}
${P} .cp2-summary .fc{min-height:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;font-size:14px!important;font-weight:700!important;color:var(--text-primary,#17231e)!important;text-transform:none!important;cursor:default;overflow:hidden;text-overflow:ellipsis}
${P} #compra-campos>.form-grid:not(#c-nf-box){display:none!important}
${P} .lb-purchase-heading{display:none!important}
${P} #c-ml-box{margin:14px 0 0!important;padding:12px 14px!important;border:1px solid var(--surface-border,#e3e8e5)!important;border-radius:10px!important;background:#f7f9f8!important}
${P} #c-ml-box>div:first-of-type>span:first-child{text-transform:none!important;font-size:12.5px!important;color:var(--text-primary,#17231e)!important;font-weight:650!important}
${P} #c-ml-box #c-ml-status{font-size:12px!important;color:#5f6d68!important}
${P} #c-nf-box{display:none!important}
${P} .cp2-calc{display:inline-flex!important;align-items:center;gap:6px;margin-left:auto;padding:3px 9px!important;border:1px solid var(--border-medium,#ccd5d0)!important;border-radius:7px!important;background:#fff!important;color:#2d6a4f!important;font:inherit!important;font-size:11.5px!important;font-weight:650!important;cursor:pointer}
${P} .cp2-calc:hover{background:#edf6f1!important}
${P} .cp2-calc svg{width:13px!important;height:13px!important;max-width:13px!important;max-height:13px!important}
${P} #c-custo-calc-painel>div{border-radius:10px!important;background:#f7f9f8!important;border-color:var(--surface-border,#e3e8e5)!important}
${P} .cp2-results{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
${P} .cp2-results .fg{padding:12px 14px;border:1px solid var(--surface-border,#e3e8e5);border-radius:10px;background:#f7f9f8;min-width:0}
${P} .cp2-results .fl{justify-content:space-between}
${P} .cp2-results .fc-auto,${P} .cp2-results #c-pct-lucro{min-height:0!important;padding:2px 0!important;border:0!important;background:transparent!important;box-shadow:none!important;font-family:var(--font-sans)!important;font-size:20px!important;font-weight:700!important;color:#2d6a4f!important;font-variant-numeric:tabular-nums}
${P} .cp2-results #c-pct-lucro{color:#34413b!important}
${P} .cp2-results .fc-manual{font-family:var(--font-sans)!important;font-size:14px!important}
${P} .cp2-results .mtg{margin-left:auto;font-size:11px!important;padding:2px 9px 2px 7px!important;text-transform:none!important}
${P} .cp2-caption{margin-top:4px;font-size:11px;line-height:1.4;color:#5f6d68}
${P} .cp2-results .fg>div[style*="font-size:9px"]{display:none}
${P} #c-logistica-entrega{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:0!important;padding:0!important;border:0!important;background:transparent!important}
${P} #c-logistica-entrega .form-group{min-width:0}
${P} #c-logistica-entrega label{display:block}
${P} .cp2-count{margin-left:auto;font-size:11px;color:#5f6d68;font-weight:500;font-variant-numeric:tabular-nums}
${P} .modal-footer{align-items:center;justify-content:flex-end;gap:10px}
${P} .cp2-foot-hint{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0;font-size:12px;line-height:1.4;color:#5f6d68}
${P} .cp2-foot-hint svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
${P} .modal-footer .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none!important}
${P} .modal-close{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;border-radius:8px!important}
${P} button:focus-visible,${P} select:focus-visible,${P} input:focus-visible,${P} textarea:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:860px){${P} .cp2-grid,${P} .cp2-results{grid-template-columns:repeat(2,minmax(0,1fr))}${P} .cp2-results .fg:last-child{grid-column:1/-1}}
@media(max-width:600px){${P} .cp2-grid,${P} .cp2-results{grid-template-columns:minmax(0,1fr)}${P} .cp2-summary{grid-template-columns:minmax(0,1fr)}${P} .cp2-summary .fg+.fg{border-left:0;border-top:1px solid var(--surface-border,#e3e8e5)}${P} .modal-body{padding:12px}${P} .cp2-card{padding:14px}${P} .modal-footer{flex-wrap:wrap}${P} .cp2-foot-hint{flex:1 1 100%;margin-right:0}${P} .cp2-tab{padding:10px 8px;gap:6px}}
`;

  const $ = (id) => document.getElementById(id);
  const paths = {
    box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
    cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6 M10 20h.01 M18 20h.01',
    coins: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    truck: 'M3 6h11v10H3z M14 10h4l3 3v3h-7 M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    bank: 'M3 10l9-6 9 6 M5 10v8 M10 10v8 M14 10v8 M19 10v8 M3 20h18',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    calc: 'M5 3h14v18H5z M8 7h8 M8 11h.01 M12 11h.01 M16 11h.01 M8 15h.01 M12 15h.01 M16 15h.01',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5 M12 8h.01'
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
      window.__cpErro = label + ': ' + (err && err.message ? err.message : err);
      if (window.console) console.warn('[compra-modal] ' + label + ':', err);
      return false;
    }
  }

  const fgOf = (id) => { const e = $(id); return e ? e.closest('.fg') : null; };

  /* Troca so o primeiro texto do rotulo, preservando o que vier depois (saldo, botao Auto/Manual, Calcular). */
  function relabel(id, text) {
    const fg = fgOf(id);
    const label = fg && fg.querySelector('label.fl');
    if (!label) return;
    const input = $(id);
    if (input && !label.htmlFor) label.htmlFor = id;
    const span = label.querySelector(':scope > span:not([id])');
    const target = span || label;
    const node = [...target.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (node) node.textContent = text + ' ';
    else target.insertBefore(document.createTextNode(text + ' '), target.firstChild);
  }

  function card(id, title, icon, sub) {
    const s = el('section', 'cp2-card');
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    const head = el('div', 'cp2-head');
    const ic = el('span', 'cp2-ico');
    ic.innerHTML = svg(icon, 16);
    const txt = el('div');
    const h = el('h3', '', title);
    h.id = id + '-t';
    txt.appendChild(h);
    if (sub) txt.appendChild(el('p', '', sub));
    head.append(ic, txt);
    s.appendChild(head);
    return s;
  }

  let overlay, body, campos, sections = [], nav, grid2, cardEntrega;

  function adopt() {
    /* Status da entrega (08). */
    const log = $('c-logistica-entrega');
    if (log && cardEntrega && log.parentNode !== cardEntrega) {
      log.removeAttribute('style');
      cardEntrega.appendChild(log);
    }
    /* Marca e modelo para NF (25): os campos entram na grade de dados da compra. */
    const marca = fgOf('c-nf-marca'), modelo = fgOf('c-nf-modelo');
    if (marca && grid2 && marca.parentNode !== grid2) {
      relabel('c-nf-marca', 'Marca (para NF)');
      relabel('c-nf-modelo', 'Modelo (para NF)');
      const link = fgOf('c-link');
      grid2.insertBefore(marca, link);
      if (modelo) grid2.insertBefore(modelo, link);
    }
    /* Integracao Mercado Livre (24). */
    const ml = $('c-ml-box');
    const cardCompra = $('cp2-sec-compra');
    if (ml && cardCompra && ml.parentNode !== cardCompra) {
      const t = ml.querySelector(':scope > div > span');
      if (t && /Integracao/i.test(t.textContent)) t.textContent = 'Integração Mercado Livre';
      cardCompra.appendChild(ml);
    }
  }

  function syncState() {
    const visible = campos && campos.style.display !== 'none';
    overlay.classList.toggle('cp2-item', !!visible);
    const save = overlay.querySelector('.modal-footer .btn-primary');
    if (save) {
      save.disabled = !visible;
      save.title = visible ? '' : 'Selecione um item para registrar a compra';
    }
    const t = $('ttl-compra');
    if (t && /^(NOVA|EDITAR) COMPRA$/.test(t.textContent.trim())) {
      t.textContent = /^EDITAR/.test(t.textContent.trim()) ? 'Editar compra' : 'Nova compra';
    }
    const c = $('c-obs'), n = $('cp2-obs-count');
    if (c && n) n.textContent = c.value.length + '/' + (c.maxLength > 0 ? c.maxLength : 200);
    markTabs();
  }

  function subtitle() {
    const sub = $('cp2-sub');
    if (!sub) return;
    let text = '';
    try {
      /* compraEmpenhoId e DB sao variaveis globais do sistema, acessadas pelo nome (nao por window). */
      // eslint-disable-next-line no-undef
      const emp = DB.empenhos.find((x) => x.id === compraEmpenhoId);
      if (emp) text = ['Empenho #' + (emp.num || '—'), emp.orgao || ''].filter(Boolean).join(' · ');
    } catch (e) { text = ''; }
    sub.textContent = text;
  }

  function currentIndex() {
    const top = body.getBoundingClientRect().top;
    let idx = 0;
    sections.forEach((s, i) => { if (s[1].getBoundingClientRect().top - top <= 80) idx = i; });
    if (body.scrollHeight > body.clientHeight + 1 && body.scrollTop + body.clientHeight >= body.scrollHeight - 2) idx = sections.length - 1;
    return idx;
  }

  function markTabs() {
    if (!nav) return;
    const idx = currentIndex();
    nav.querySelectorAll('.cp2-tab').forEach((t, i) => {
      if (i === idx) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  function build() {
    overlay = $('modal-compra');
    const modal = overlay && overlay.querySelector('.modal');
    body = modal && modal.querySelector('.modal-body');
    campos = $('compra-campos');
    const selWrap = $('compra-lote-selector-wrap');
    const head = modal && modal.querySelector('.modal-header');
    const foot = modal && modal.querySelector('.modal-footer');
    const title = $('ttl-compra');
    const grid = campos && campos.querySelector(':scope > .form-grid');
    if (!modal || !body || !campos || !selWrap || !head || !foot || !title || !grid) throw new Error('estrutura inesperada do modal de compra');
    if (overlay.dataset.cp2Ready) return;
    overlay.dataset.cp2Ready = '1';
    overlay.classList.add('cp2');

    const style = document.createElement('style');
    style.id = 'lb-compra-modal-moderno';
    style.textContent = css;
    document.head.appendChild(style);

    /* Cabecalho. */
    const ht = el('div', 'cp2-headtext');
    head.insertBefore(ht, title);
    ht.appendChild(title);
    const sub = el('p', 'cp2-sub');
    sub.id = 'cp2-sub';
    ht.appendChild(sub);

    /* 1. Item do empenho: os cartoes continuam sendo gerados pelo 08 dentro de #compra-lote-selector-wrap. */
    const s1 = card('cp2-sec-item', 'Item do empenho', 'box', 'Selecione o item que será comprado.');
    body.insertBefore(s1, selWrap);
    s1.appendChild(selWrap);
    const summary = el('div', 'cp2-summary');
    [['c-lote-desc', 'Item selecionado'], ['c-qtd-empenho', 'Qtd. do empenho'], ['c-vem-item', 'Valor do item no empenho (R$)']].forEach(([id, t]) => {
      const fg = fgOf(id);
      if (!fg) return;
      relabel(id, t);
      fg.classList.remove('half');
      summary.appendChild(fg);
    });
    s1.appendChild(summary);

    /* Secoes de 2 a 6, dentro de #compra-campos (aparecem com a escolha do item, como hoje). */
    const holder = el('div', 'cp2-sections');
    campos.insertBefore(holder, grid);

    const s2 = card('cp2-sec-compra', 'Dados da compra', 'cart');
    grid2 = el('div', 'cp2-grid');
    [['c-qtd', 'Quantidade comprada'], ['c-dcompra', 'Data da compra'], ['c-plataforma', 'Plataforma'], ['c-link', 'Link da compra']].forEach(([id, t]) => {
      const fg = fgOf(id);
      if (!fg) return;
      relabel(id, t);
      grid2.appendChild(fg);
    });
    const plat = $('c-plataforma');
    if (plat && /MERCADO LIVRE/.test(plat.placeholder)) plat.placeholder = 'Mercado Livre, Shopee...';
    s2.appendChild(grid2);

    const s3 = card('cp2-sec-valores', 'Valores', 'coins', 'O total, o lucro e o valor a receber são calculados pelo sistema.');
    const grid3 = el('div', 'cp2-grid');
    [['c-vunit', 'Valor unitário da compra (R$)'], ['c-vtotal-compra', 'Valor total da compra (R$)']].forEach(([id, t]) => {
      const fg = fgOf(id);
      if (!fg) return;
      relabel(id, t);
      grid3.appendChild(fg);
    });
    const custoFg = fgOf('c-custo');
    if (custoFg) {
      relabel('c-custo', 'Custo (R$)');
      const btn = custoFg.querySelector('label.fl button');
      if (btn) {
        btn.removeAttribute('style');
        btn.className = 'cp2-calc';
        btn.dataset.lbIconified = '1';
        btn.innerHTML = svg('calc', 13);
        btn.appendChild(document.createTextNode('Calcular custo'));
      }
      grid3.appendChild(custoFg);
    }
    const painel = $('c-custo-calc-painel');
    if (painel) {
      painel.classList.add('cp2-wide');
      const lead = painel.querySelector('span');
      if (lead && /^[^\p{L}]+/u.test(lead.textContent)) lead.textContent = lead.textContent.replace(/^[^\p{L}]+/u, '');
      grid3.appendChild(painel);
    }
    s3.appendChild(grid3);
    const results = el('div', 'cp2-results');
    const captions = {
      'c-luc-a': 'Valor do empenho proporcional − compra − custo',
      'c-pct-lucro': 'Lucro ÷ valor total da compra',
      'c-rec-a': 'Valor do empenho proporcional − custo'
    };
    [['c-luc-a', 'Lucro'], ['c-pct-lucro', '% de lucro'], ['c-rec-a', 'Valor total a receber']].forEach(([id, t]) => {
      const fg = fgOf(id);
      if (!fg) return;
      relabel(id, t);
      fg.appendChild(el('div', 'cp2-caption', captions[id]));
      results.appendChild(fg);
    });
    s3.appendChild(results);

    cardEntrega = card('cp2-sec-entrega', 'Entrega', 'truck', 'A data prevista aparece para "Aguardando envio" e "Em trânsito"; a de recebimento, para "Recebida".');

    const s5 = card('cp2-sec-pag', 'Pagamento', 'bank');
    const grid5 = el('div', 'cp2-grid');
    [['c-dpag', 'Data de pagamento'], ['c-recebido', 'Valor recebido (R$)']].forEach(([id, t]) => {
      const fg = fgOf(id);
      if (!fg) return;
      relabel(id, t);
      grid5.appendChild(fg);
    });
    s5.appendChild(grid5);

    const s6 = card('cp2-sec-obs', 'Observação', 'note');
    const obsFg = fgOf('c-obs');
    if (obsFg) {
      relabel('c-obs', 'Informações adicionais');
      const lab = obsFg.querySelector('label.fl');
      const cnt = el('span', 'cp2-count');
      cnt.id = 'cp2-obs-count';
      if (lab) lab.appendChild(cnt);
      const ta = $('c-obs');
      if (ta && /OBSERVA/.test(ta.placeholder)) ta.placeholder = 'Observações...';
      s6.appendChild(obsFg);
    }

    holder.append(s2, s3, cardEntrega, s5, s6);

    /* Qualquer campo que ainda esteja na grade original vai para uma secao propria, para nao se perder. */
    const leftovers = [...grid.children].filter((n) => !n.classList.contains('fsec') && !n.classList.contains('lb-purchase-heading'));
    if (leftovers.length) {
      const s7 = card('cp2-sec-outros', 'Outros dados', 'note');
      const g7 = el('div', 'cp2-grid');
      leftovers.forEach((n) => g7.appendChild(n));
      s7.appendChild(g7);
      holder.appendChild(s7);
    }

    /* Abas de atalho. */
    sections = [['Item', s1], ['Compra', s2], ['Valores', s3], ['Entrega', cardEntrega], ['Pagamento', s5]];
    nav = el('nav', 'cp2-tabs');
    nav.setAttribute('aria-label', 'Seções da compra');
    sections.forEach(([text, target], i) => {
      const b = el('button', 'cp2-tab');
      b.type = 'button';
      const n = el('i', '', String(i + 1));
      b.append(n, document.createTextNode(text));
      b.addEventListener('click', () => {
        const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const delta = target.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
        body.scrollTo({ top: body.scrollTop + delta, behavior: calm ? 'auto' : 'smooth' });
      });
      nav.appendChild(b);
    });
    head.insertAdjacentElement('afterend', nav);
    body.addEventListener('scroll', () => safe('abas', markTabs), { passive: true });

    /* Rodape. */
    const hint = el('div', 'cp2-foot-hint');
    hint.innerHTML = svg('info', 15);
    hint.appendChild(el('span', '', 'Total, lucro e valor a receber são atualizados automaticamente.'));
    foot.insertBefore(hint, foot.firstChild);
    const save = foot.querySelector('.btn-primary');
    if (save && /Salvar Compra/.test(save.textContent)) save.textContent = 'Salvar compra';

    /* Observadores: blocos injetados depois, visibilidade dos campos, titulo e abertura. */
    adopt();
    new MutationObserver(() => safe('adocao', adopt)).observe(campos, { childList: true });
    new MutationObserver(() => safe('estado', syncState)).observe(campos, { attributes: true, attributeFilter: ['style'] });
    new MutationObserver(() => safe('titulo', syncState)).observe(title, { childList: true, characterData: true, subtree: true });
    new MutationObserver((records) => {
      const was = (v) => (' ' + (v || '') + ' ').indexOf(' open ') >= 0;
      if (overlay.classList.contains('open') && records.some((r) => !was(r.oldValue))) {
        body.scrollTop = 0;
        safe('subtitulo', subtitle);
        safe('abertura', () => { adopt(); syncState(); });
      }
    }).observe(overlay, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    const ta = $('c-obs');
    if (ta) ta.addEventListener('input', () => safe('contador', syncState));
    syncState();
  }

  /* Correcao: o 08 substitui o conteudo de #compra-lote-selector-wrap quando o empenho nao tem itens,
     apagando #compra-lote-selector. A proxima abertura falharia; o seletor e recriado antes. */
  function guardSelector() {
    const orig = window.abrirCompra;
    if (typeof orig !== 'function' || orig.__cp2) return;
    const wrapped = function () {
      const wrap = $('compra-lote-selector-wrap');
      if (wrap && !$('compra-lote-selector')) {
        wrap.replaceChildren();
        const head = el('div', 'fsec', 'Selecione o Item/Lote');
        const box = el('div', 'compra-lote-select');
        box.id = 'compra-lote-selector';
        wrap.append(head, box);
      }
      return orig.apply(this, arguments);
    };
    wrapped.__cp2 = true;
    Object.keys(orig).forEach((k) => { try { wrapped[k] = orig[k]; } catch (e) { /* propriedades de outros modulos */ } });
    window.abrirCompra = wrapped;
  }

  function init() {
    if (!safe('estrutura', build)) {
      const o = $('modal-compra');
      if (o) o.classList.remove('cp2', 'cp2-item');
      return;
    }
    guardSelector();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
