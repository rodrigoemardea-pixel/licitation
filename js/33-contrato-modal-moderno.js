// LicitationBiznis: camada visual isolada do cadastro e da edicao de contrato (#modal-disputas).
// Os campos, os ids, os eventos e os calculos existentes sao preservados: os elementos sao apenas
// reposicionados em secoes. saveD(), clearD(), editD() e renderLotes() continuam sendo os originais.
(function () {
  'use strict';

  const css = `
#modal-disputas.dc-modern .modal{max-width:1040px!important;width:96%}
#modal-disputas.dc-modern .modal-header{align-items:flex-start;gap:16px;padding:18px 22px 14px}
#modal-disputas.dc-modern .dc-head{min-width:0}
#modal-disputas.dc-modern .dc-sub{margin:4px 0 0;font-size:12.5px;line-height:1.5;color:#687586}
#modal-disputas.dc-modern .dc-tabs{display:flex;gap:4px;padding:0 18px;flex:0 0 auto;background:#fff;border-bottom:1px solid var(--surface-border,#e3e8e5);overflow-x:auto}
#modal-disputas.dc-modern .dc-tab{display:flex;align-items:center;gap:8px;padding:11px 12px;border:0;border-bottom:2px solid transparent;background:none;color:#5f6d68;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;min-height:44px}
#modal-disputas.dc-modern .dc-tab:hover{color:var(--text-primary,#17231e)}
#modal-disputas.dc-modern .dc-tab i{font-style:normal;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;background:#edf1ef;color:#34413b}
#modal-disputas.dc-modern .dc-tab[aria-current="true"]{color:#2d6a4f;border-bottom-color:#2d6a4f}
#modal-disputas.dc-modern .dc-tab[aria-current="true"] i{background:#2d6a4f;color:#fff}
#modal-disputas.dc-modern .modal-body{padding:18px 22px;background:var(--bg-app,#f6f8f9)}
#modal-disputas.dc-modern .dc-card{background:#fff;border:1px solid var(--surface-border,#e3e8e5);border-radius:12px;padding:16px 18px;margin-bottom:14px}
#modal-disputas.dc-modern .dc-card-head{display:flex;align-items:center;gap:10px;margin-bottom:14px}
#modal-disputas.dc-modern .dc-card-head h3{margin:0;font-size:14px;font-weight:650;letter-spacing:-.15px;text-transform:none;color:var(--text-primary,#17231e)}
#modal-disputas.dc-modern .dc-ico{width:30px;height:30px;flex:0 0 30px;border-radius:8px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
#modal-disputas.dc-modern .dc-ico svg,#modal-disputas.dc-modern .dc-total-ico svg,#modal-disputas.dc-modern .dc-chip svg,#modal-disputas.dc-modern .dc-foot-hint svg{display:block;flex:0 0 auto}
#modal-disputas.dc-modern .dc-ico svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
#modal-disputas.dc-modern .dc-req{margin-left:2px;padding:2px 9px;border-radius:99px;background:#f9e8e8;color:#a42b25;font-size:11px;font-weight:600}
#modal-disputas.dc-modern .dc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
#modal-disputas.dc-modern .dc-grid .fg{min-width:0}
#modal-disputas.dc-modern .fl{text-transform:none;letter-spacing:0;font-size:12px;font-weight:600;color:#566158}
#modal-disputas.dc-modern .dc-chip{grid-column:span 2;align-self:end;display:flex;align-items:center;gap:10px;min-height:40px;padding:8px 12px;border-radius:8px;background:#edf6f1;color:#245b43;font-size:12px;line-height:1.4}
#modal-disputas.dc-modern .dc-chip svg{width:16px!important;height:16px!important;max-width:16px!important;max-height:16px!important}
#modal-disputas.dc-modern .dc-scroll{overflow-x:auto;max-width:100%}
#modal-disputas.dc-modern .dc-min{min-width:800px}
#modal-disputas.dc-modern .dc-min>div:first-child{padding-bottom:8px!important;border-bottom:1px solid var(--surface-border,#e3e8e5)}
#modal-disputas.dc-modern .dc-min>div:first-child span{font-size:10px!important;text-transform:none!important;letter-spacing:0!important;white-space:nowrap}
#modal-disputas.dc-modern .dc-items>.fsec{display:none}
#modal-disputas.dc-modern #lotes-totais{display:none!important}
#modal-disputas.dc-modern .dc-totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
#modal-disputas.dc-modern .dc-total{display:flex;align-items:center;gap:12px;min-width:0;padding:12px 14px;border:1px solid var(--surface-border,#e3e8e5);border-radius:10px;background:var(--bg-surface-soft,#f7f9f8)}
#modal-disputas.dc-modern .dc-total-ico{width:40px;height:40px;flex:0 0 40px;border-radius:10px;display:grid;place-items:center;background:#e6f2ec;color:#2d6a4f}
#modal-disputas.dc-modern .dc-total-ico svg{width:20px!important;height:20px!important;max-width:20px!important;max-height:20px!important}
#modal-disputas.dc-modern .dc-total-main{min-width:0}
#modal-disputas.dc-modern .dc-total-label{font-size:12px;color:#5f6d68}
#modal-disputas.dc-modern .dc-total-value{font-size:20px;font-weight:700;line-height:1.25;color:#2d6a4f;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
#modal-disputas.dc-modern .dc-total-sub{font-size:11px;color:#5f6d68;line-height:1.4}
#modal-disputas.dc-modern .dc-count{font-weight:500;color:#5f6d68;font-variant-numeric:tabular-nums}
#modal-disputas.dc-modern .modal-footer{align-items:center;justify-content:flex-end;gap:10px}
#modal-disputas.dc-modern .dc-foot-hint{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0;font-size:12px;line-height:1.4;color:#5f6d68}
#modal-disputas.dc-modern .dc-foot-hint svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}
#modal-disputas.dc-modern button:focus-visible,#modal-disputas.dc-modern select:focus-visible,#modal-disputas.dc-modern input:focus-visible,#modal-disputas.dc-modern textarea:focus-visible{outline:2px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:900px){#modal-disputas.dc-modern .dc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#modal-disputas.dc-modern .dc-chip{grid-column:1/-1}}
@media(min-width:701px) and (max-width:900px){#modal-disputas.dc-modern .dc-total-ico{display:none}}
@media(max-width:700px){#modal-disputas.dc-modern .dc-totals{grid-template-columns:minmax(0,1fr)}#modal-disputas.dc-modern .modal-body{padding:14px}#modal-disputas.dc-modern .modal-header{padding:14px}#modal-disputas.dc-modern .dc-tabs{padding:0 8px}#modal-disputas.dc-modern .modal-footer{flex-wrap:wrap}#modal-disputas.dc-modern .dc-foot-hint{flex:1 1 100%;margin-right:0}}
@media(max-width:560px){#modal-disputas.dc-modern .dc-grid{grid-template-columns:minmax(0,1fr)}#modal-disputas.dc-modern .dc-card{padding:14px}#modal-disputas.dc-modern .dc-tab{padding:10px 8px;gap:6px;font-size:12px}#modal-disputas.dc-modern .dc-tabs{gap:0}}
`;

  const $ = (id) => document.getElementById(id);
  const paths = {
    building: 'M3 20h18M5 20V7l7-4v17M19 20V10l-7-3M8 9h1M8 12h1M8 15h1M15 12h1M15 15h1',
    file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4z M3 7l9 4 9-4 M12 11v10',
    note: 'M5 4h14v16H5z M9 9h6 M9 13h6 M9 17h3',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2',
    chart: 'M4 20V10 M10 20V4 M16 20v-8 M21 20H2',
    money: 'M12 2v20 M18 6c-3-4-12-3-12 2s12 3 12 8-9 6-12 2',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 11v5 M12 8h.01'
  };
  const svg = (name, size) =>
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' +
    paths[name] + '"/></svg>';

  function safe(label, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[contrato-modal] ' + label + ':', err); }
  }

  let sections = [];

  function fieldOf(id) {
    const el = $(id);
    return el ? el.closest('.fg') : null;
  }

  function card(id, title, icon, badge) {
    const s = document.createElement('section');
    s.className = 'dc-card';
    s.id = id;
    s.setAttribute('aria-labelledby', id + '-t');
    /* div, e nao header: o app.css posiciona qualquer <header> como a barra fixa do topo da pagina. */
    const head = document.createElement('div');
    head.className = 'dc-card-head';
    const ic = document.createElement('span');
    ic.className = 'dc-ico';
    ic.innerHTML = svg(icon, 16);
    const h = document.createElement('h3');
    h.id = id + '-t';
    h.textContent = title;
    head.append(ic, h);
    if (badge) {
      const b = document.createElement('span');
      b.className = 'dc-req';
      b.textContent = badge;
      head.appendChild(b);
    }
    s.appendChild(head);
    return s;
  }

  function bindLabels(root) {
    root.querySelectorAll('.fg').forEach((fg) => {
      const label = fg.querySelector('label.fl');
      const control = fg.querySelector('input:not([type=hidden]), select, textarea');
      if (label && control && control.id && !label.htmlFor) label.htmlFor = control.id;
    });
  }

  function totalsCard(icon, label, sub, id) {
    const a = document.createElement('article');
    a.className = 'dc-total';
    a.innerHTML = '<span class="dc-total-ico">' + svg(icon, 20) + '</span><div class="dc-total-main"><div class="dc-total-label"></div><div class="dc-total-value" id="' + id + '"></div><div class="dc-total-sub"></div></div>';
    a.querySelector('.dc-total-label').textContent = label;
    a.querySelector('.dc-total-sub').textContent = sub;
    return a;
  }

  /* Os tres totais espelham os elementos que o sistema ja calcula (lt-count, lt-total, lt-luc-prev).
     Nenhuma formula e repetida aqui. Sem itens, o bloco original fica oculto e os cartoes exibem zero. */
  function mirror() {
    const box = $('lotes-totais');
    if (!box || !$('dc-v-count')) return;
    const hasItems = typeof lotesTemp !== 'undefined' && Array.isArray(lotesTemp) && lotesTemp.length > 0;
    const shown = hasItems || box.style.display !== 'none';
    const read = (id, zero) => (shown && $(id) && $(id).textContent.trim()) || zero;
    $('dc-v-count').textContent = read('lt-count', '0');
    $('dc-v-total').textContent = read('lt-total', 'R$ 0,00');
    $('dc-v-luc').textContent = read('lt-luc-prev', 'R$ 0,00');
  }

  function counter() {
    const t = $('d-observacao'), c = $('dc-count');
    if (!t || !c) return;
    c.textContent = t.value.length + '/' + (t.maxLength > 0 ? t.maxLength : 200);
  }

  function currentSection(body) {
    const top = body.getBoundingClientRect().top;
    let idx = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top - top <= 80) idx = i; });
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) idx = sections.length - 1;
    return idx;
  }

  function markTabs() {
    const body = document.querySelector('#modal-disputas .modal-body');
    if (!body || !sections.length) return;
    const tabs = document.querySelectorAll('#modal-disputas .dc-tab');
    const idx = Math.min(currentSection(body), tabs.length - 1);
    tabs.forEach((t, i) => {
      if (i === idx) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  function refresh() {
    mirror();
    counter();
    markTabs();
  }

  function build() {
    const overlay = $('modal-disputas');
    if (!overlay || overlay.dataset.dcReady) return;
    const modal = overlay.querySelector('.modal');
    const body = modal && modal.querySelector('.modal-body');
    const grid = body && body.querySelector('.form-grid');
    const head = modal && modal.querySelector('.modal-header');
    const foot = modal && modal.querySelector('.modal-footer');
    const title = $('ttl-disputas');
    const lotes = $('lotes-container');
    if (!modal || !body || !grid || !head || !foot || !title || !lotes) return;
    overlay.dataset.dcReady = '1';
    overlay.classList.add('dc-modern');

    const style = document.createElement('style');
    style.id = 'lb-contrato-modal-moderno';
    style.textContent = css;
    document.head.appendChild(style);

    /* Cabecalho: o titulo (#ttl-disputas) continua sendo escrito pelo sistema. */
    const wrap = document.createElement('div');
    wrap.className = 'dc-head';
    head.insertBefore(wrap, title);
    wrap.appendChild(title);
    const sub = document.createElement('p');
    sub.className = 'dc-sub';
    sub.textContent = 'Preencha os dados do contrato e informe ao menos um item.';
    wrap.appendChild(sub);

    /* Secao 1: identificacao. */
    const ident = card('dc-sec-ident', 'Identificação', 'building');
    const identGrid = document.createElement('div');
    identGrid.className = 'dc-grid';
    ['d-data', 'd-orgao', 'd-estado', 'd-empresa', 'd-tipo', 'd-rp', 'd-processo', 'd-sistema', 'd-analista'].forEach((id) => {
      const fg = fieldOf(id);
      if (fg) identGrid.appendChild(fg);
    });
    ident.appendChild(identGrid);
    const proc = $('d-processo');
    if (proc && !proc.placeholder) proc.placeholder = 'Ex.: 001/2026';

    /* Secao 2: contrato e vencimento (a regra de calculo continua em calcVencimentoContrato). */
    const contrato = card('dc-sec-contrato', 'Contrato', 'file');
    const cGrid = document.createElement('div');
    cGrid.className = 'dc-grid';
    const cData = fieldOf('d-contrato-data'), cVenc = fieldOf('d-contrato-vencimento');
    if (cData) cGrid.appendChild(cData);
    if (cVenc) {
      const lbl = cVenc.querySelector('label.fl');
      if (lbl) lbl.textContent = 'Vencimento';
      cGrid.appendChild(cVenc);
    }
    const chip = document.createElement('div');
    chip.className = 'dc-chip';
    chip.innerHTML = svg('clock', 16) + '<span></span>';
    chip.querySelector('span').textContent = 'Se o vencimento ficar em branco, é preenchido com 1 ano após a data do contrato. O campo pode ser alterado.';
    cGrid.appendChild(chip);
    contrato.appendChild(cGrid);

    /* Secao 3: itens e lotes. O bloco original e movido por inteiro. */
    const itemsBlock = lotes.closest('.full');
    const items = card('dc-sec-itens', 'Itens e lotes', 'box', 'obrigatório');
    if (itemsBlock) {
      itemsBlock.classList.add('dc-items');
      const header = lotes.previousElementSibling;
      const scroll = document.createElement('div');
      scroll.className = 'dc-scroll';
      const min = document.createElement('div');
      min.className = 'dc-min';
      lotes.parentNode.insertBefore(scroll, header || lotes);
      scroll.appendChild(min);
      if (header) min.appendChild(header);
      min.appendChild(lotes);
      items.appendChild(itemsBlock);
    }
    const totals = document.createElement('div');
    totals.className = 'dc-totals';
    totals.setAttribute('role', 'group');
    totals.setAttribute('aria-label', 'Resumo dos itens');
    totals.append(
      totalsCard('box', 'Itens', 'Itens cadastrados neste contrato', 'dc-v-count'),
      totalsCard('money', 'Valor do contrato', 'Soma de quantidade x valor unitário', 'dc-v-total'),
      totalsCard('chart', 'Lucro previsto', 'Calculado a partir dos itens', 'dc-v-luc')
    );
    items.appendChild(totals);

    /* Secao 4: observacao com contador (o limite vem do proprio maxlength do campo). */
    const obs = card('dc-sec-obs', 'Observação', 'note');
    const obsFg = fieldOf('d-observacao');
    if (obsFg) {
      const lbl = obsFg.querySelector('label.fl');
      if (lbl) {
        lbl.textContent = 'Informações adicionais';
        const c = document.createElement('span');
        c.className = 'dc-count';
        c.id = 'dc-count';
        c.setAttribute('aria-live', 'off');
        lbl.appendChild(c);
      }
      obs.appendChild(obsFg);
    }

    sections = [ident, contrato, items, obs];
    const holder = document.createElement('div');
    holder.className = 'dc-sections';
    sections.forEach((s) => holder.appendChild(s));
    body.insertBefore(holder, grid);
    bindLabels(holder);

    /* Navegacao entre secoes: atalhos de rolagem, o formulario continua em uma unica tela. */
    const nav = document.createElement('nav');
    nav.className = 'dc-tabs';
    nav.setAttribute('aria-label', 'Seções do formulário');
    [['Identificação', ident], ['Contrato', contrato], ['Itens e lotes', items]].forEach(([text, target], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dc-tab';
      const n = document.createElement('i');
      n.textContent = String(i + 1);
      b.append(n, document.createTextNode(text));
      b.addEventListener('click', () => {
        const delta = target.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
        const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        body.scrollTo({ top: body.scrollTop + delta, behavior: calm ? 'auto' : 'smooth' });
        const first = target.querySelector('input:not([type=hidden]), select, textarea, button.btn');
        if (first) first.focus({ preventScroll: true });
      });
      nav.appendChild(b);
    });
    head.insertAdjacentElement('afterend', nav);
    body.addEventListener('scroll', () => safe('abas', markTabs), { passive: true });

    /* Rodape: o requisito citado e o que saveD() realmente verifica. */
    const hint = document.createElement('div');
    hint.className = 'dc-foot-hint';
    hint.innerHTML = svg('info', 15) + '<span></span>';
    hint.querySelector('span').textContent = 'Obrigatório: ao menos um item com descrição e valor unitário.';
    foot.insertBefore(hint, foot.firstChild);
    const save = foot.querySelector('.btn-primary');
    if (save) save.textContent = 'Salvar contrato';

    /* Ao abrir, o formulario volta ao topo. O reset em clearD/editD nao basta, pois nesse momento o modal ainda esta oculto. */
    if (window.MutationObserver) {
      const hadOpen = (v) => (' ' + (v || '') + ' ').indexOf(' open ') >= 0;
      new MutationObserver((records) => {
        if (overlay.classList.contains('open') && records.some((r) => !hadOpen(r.oldValue))) {
          body.scrollTop = 0;
          safe('abertura', refresh);
        }
      }).observe(overlay, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
    }

    const ta = $('d-observacao');
    if (ta) ta.addEventListener('input', () => safe('contador', counter));
    const box = $('lotes-totais');
    if (box && window.MutationObserver) {
      new MutationObserver(() => safe('totais', mirror)).observe(box, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style'] });
    }
    refresh();
  }

  function hook(name) {
    const original = window[name];
    if (typeof original !== 'function' || original.__dc) return;
    const wrapped = function () {
      const result = original.apply(this, arguments);
      if (name === 'clearD' || name === 'editD') {
        const body = document.querySelector('#modal-disputas .modal-body');
        if (body) body.scrollTop = 0;
      }
      safe('atualizacao', refresh);
      return result;
    };
    wrapped.__dc = true;
    window[name] = wrapped;
  }

  function init() {
    safe('estrutura', build);
    ['clearD', 'editD', 'renderLotes'].forEach(hook);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
