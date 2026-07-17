// ==========================================================================
// COMPONENTES REUTILIZAVEIS - LICITATIONBIZNIS
// Helpers puros que retornam HTML string. Nenhum estado, nenhum efeito
// colateral. Todas as regras visuais moram no CSS.
//   lbCard({label, valor, cor, sublinha, onclick, borda})
//   lbBadgeEmpresa(nome)
//   lbBadgeAnalista(nome)
//   lbBadgeUF(uf)
//   lbBadgeStatus(codigo, rotulo)
// ==========================================================================
(function(){
  'use strict';

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  // -------------------------------------------------------------------------
  // CARD DE RESUMO
  //   label:   texto do topo (uppercase pequeno)
  //   valor:   texto grande em destaque
  //   cor:     'accent' | 'success' | 'warning' | 'danger' | 'purple'
  //   sublinha: texto pequeno abaixo do valor (opcional)
  //   onclick: string com onclick (opcional, ja escapado)
  //   borda:   se true, aplica borda esquerda colorida
  // -------------------------------------------------------------------------
  window.lbCard = function(opts){
    opts = opts || {};
    var cor = opts.cor || 'accent';
    var classes = ['card', 'lb-card', 'lb-card--' + cor];
    if (opts.borda) classes.push('lb-card--borda');
    if (opts.onclick) classes.push('lb-card--clicavel');
    var attrs = 'class="' + classes.join(' ') + '"';
    if (opts.id) attrs += ' id="' + esc(opts.id) + '"';
    if (opts.onclick) attrs += ' onclick="' + opts.onclick + '"';
    var html = '<div ' + attrs + '>';
    html += '<div class="card-label">' + esc(opts.label || '') + '</div>';
    html += '<div class="card-value lb-card-value lb-card-value--' + cor + '">' + (opts.valor == null ? '—' : opts.valor) + '</div>';
    if (opts.sublinha) html += '<div class="lb-card-sub">' + opts.sublinha + '</div>';
    html += '</div>';
    return html;
  };

  // -------------------------------------------------------------------------
  // BADGE DE EMPRESA (Hamate / Gadita)
  // -------------------------------------------------------------------------
  window.lbBadgeEmpresa = function(nome){
    if (!nome) return '<span class="lb-badge lb-badge--neutral">—</span>';
    var slug = String(nome).toLowerCase() === 'hamate' ? 'hamate' : 'gadita';
    return '<span class="lb-badge lb-badge--empresa lb-badge--' + slug + '">' + esc(nome) + '</span>';
  };

  // -------------------------------------------------------------------------
  // BADGE DE ANALISTA - usa a paleta ja existente do _badgeClass
  // -------------------------------------------------------------------------
  window.lbBadgeAnalista = function(nome){
    if (!nome) return '<span class="lb-badge lb-badge--neutral">—</span>';
    var cls = (typeof _badgeClass === 'function') ? _badgeClass(nome) : 'bb';
    return '<span class="badge lb-badge lb-badge--analista ' + cls + '">' + esc(nome) + '</span>';
  };

  // -------------------------------------------------------------------------
  // BADGE DE UF
  // -------------------------------------------------------------------------
  window.lbBadgeUF = function(uf){
    if (!uf) return '';
    return '<span class="estado-badge lb-badge lb-badge--uf">' + esc(uf) + '</span>';
  };

  // -------------------------------------------------------------------------
  // BADGE DE STATUS (pago / pendente / atraso)
  //   codigo: 'pago' | 'pendente' | 'atraso-30' | 'atraso-60' | 'atraso-90'
  //   rotulo: texto opcional (se ausente, usa o codigo capitalizado)
  // -------------------------------------------------------------------------
  window.lbBadgeStatus = function(codigo, rotulo){
    codigo = codigo || 'pendente';
    var texto = rotulo || (codigo === 'pago' ? 'PAGO' : codigo === 'pendente' ? 'PENDENTE' : String(codigo).toUpperCase());
    return '<span class="lb-badge lb-badge--status lb-badge--' + esc(codigo) + '">' + esc(texto) + '</span>';
  };
})();
