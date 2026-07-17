// ==========================================================================
// MODULO UNICO DE PAGINACAO - LICITATIONBIZNIS
// Substitui: renderPagination (04), _pagHistorico (11),
// renderPaginacaoAcomp (12) e pager (17).
// Todas as telas passam a usar PAGE_SIZE = 10 e o mesmo layout centralizado.
// ==========================================================================
(function(){
  'use strict';

  window.LB_PAGE_SIZE = 10;
  window.LB_PAGES = window.LB_PAGES || {
    disputas: 1,
    empenhos: 1,
    finalizadas: 1,
    'emp-finalizados': 1,
    acompanhamentos: 1
  };

  // Mapeamento tab -> tbody id (usado quando o chamador nao informa)
  var TBODY_MAP = {
    'disputas': 'tbody-disputas',
    'empenhos': 'tbody-empenhos',
    'finalizadas': 'tbody-finalizadas',
    'emp-finalizados': 'tbody-emp-finalizados',
    'acompanhamentos': 'tbody-acomp'
  };

  function _pag(tab){ return Math.max(1, window.LB_PAGES[tab] || 1); }
  function _setPag(tab, p){ window.LB_PAGES[tab] = Math.max(1, p || 1); }

  // -------------------------------------------------------------------------
  // API 1: fatia uma lista para a pagina atual
  //   const { itens, total, pags, cur } = LB_paginar(lista, 'disputas');
  // -------------------------------------------------------------------------
  window.LB_paginar = function(lista, tab){
    var size = window.LB_PAGE_SIZE;
    var total = lista.length;
    var pags = Math.max(1, Math.ceil(total / size));
    var cur = Math.min(_pag(tab), pags);
    _setPag(tab, cur);
    var start = (cur - 1) * size;
    return {
      itens: lista.slice(start, start + size),
      total: total,
      pags: pags,
      cur: cur,
      start: start,
      size: size
    };
  };

  // -------------------------------------------------------------------------
  // API 2: renderiza a barra de paginacao (layout padrao, centralizada)
  //   LB_renderPag('disputas', totalRegistros, function(p){ renderD(); });
  // -------------------------------------------------------------------------
  window.LB_renderPag = function(tab, total, onChange, tbodyId){
    tbodyId = tbodyId || TBODY_MAP[tab];
    var tb = tbodyId ? document.getElementById(tbodyId) : null;
    if (!tb) return;

    var size = window.LB_PAGE_SIZE;
    var pags = Math.max(1, Math.ceil(total / size));
    var cur = Math.min(_pag(tab), pags);
    _setPag(tab, cur);

    // Container padronizado - sempre logo apos o wrapper da tabela
    var containerId = 'lb-pagination-' + tab;
    var box = document.getElementById(containerId);
    var wrap = tb.closest('.table-wrapper') || tb.closest('.table-wrap');

    if (!box) {
      box = document.createElement('div');
      box.id = containerId;
      box.className = 'lb-pagination pagination';
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(box, wrap.nextSibling);
      } else {
        var pane = tb.closest('.tab-pane');
        if (pane) pane.appendChild(box);
      }
    }

    // Altura minima do wrapper mantem a paginacao sempre na mesma posicao
    if (wrap) wrap.style.minHeight = '330px';

    // Remove qualquer paginacao legada duplicada da mesma tela
    _limparLegado(tab);

    if (pags <= 1 || total === 0) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    box.style.cssText = [
      'display:flex',
      'justify-content:center',
      'align-items:center',
      'gap:6px',
      'width:100%',
      'max-width:none',
      'margin:12px auto 0',
      'padding:10px 0',
      'box-sizing:border-box',
      'float:none',
      'clear:both'
    ].join(';');

    var html = '<button class="page-btn" data-p="' + (cur - 1) + '"' + (cur === 1 ? ' disabled' : '') + '>\u2039</button>';
    for (var n = 1; n <= pags; n++) {
      html += '<button class="page-btn' + (n === cur ? ' active' : '') + '" data-p="' + n + '">' + n + '</button>';
    }
    html += '<button class="page-btn" data-p="' + (cur + 1) + '"' + (cur === pags ? ' disabled' : '') + '>\u203A</button>';
    html += '<span class="page-info">' + ((cur - 1) * size + 1) + '-' + Math.min(cur * size, total) + ' de ' + total + '</span>';
    box.innerHTML = html;

    box.querySelectorAll('[data-p]').forEach(function(btn){
      btn.onclick = function(){
        var p = Math.max(1, Math.min(pags, Number(btn.dataset.p) || 1));
        _setPag(tab, p);
        if (typeof onChange === 'function') onChange(p);
        if (wrap) wrap.scrollTop = 0;
      };
    });
  };

  // Reset explicito de pagina - chamado ao aplicar filtros
  window.LB_resetPag = function(tab){ _setPag(tab, 1); };

  // -------------------------------------------------------------------------
  // Compatibilidade: modulos antigos (05) chamam renderPagination(tab, total).
  // Redirecionamos para a nova API mantendo a sincronia com _page do 04.
  // -------------------------------------------------------------------------
  window.renderPagination = function(tab, total){
    // Sincroniza com _page do 04 se existir
    if (typeof _page !== 'undefined' && _page && (tab in _page)) {
      window.LB_PAGES[tab] = _page[tab] || 1;
    }
    window.LB_renderPag(tab, total, function(p){
      if (typeof _page !== 'undefined' && _page && (tab in _page)) {
        _page[tab] = p;
      }
      if (tab === 'disputas' && typeof renderD === 'function') renderD();
      else if (tab === 'empenhos' && typeof renderE === 'function') renderE();
    });
  };

  // -------------------------------------------------------------------------
  // Remove barras de paginacao antigas para evitar duplicidade visual
  // (renderPagination antiga, _pagHistorico, renderPaginacaoAcomp, pager).
  // -------------------------------------------------------------------------
  function _limparLegado(tab){
    var manter = 'lb-pagination-' + tab;
    var legados = [
      'pagination-' + tab,
      'pagination-' + tab + '-padrao',
      'pagination-acomp-inline'
    ];
    legados.forEach(function(id){
      var el = document.getElementById(id);
      if (el && el.id !== manter) {
        el.style.display = 'none';
        el.innerHTML = '';
      }
    });
  }
})();
