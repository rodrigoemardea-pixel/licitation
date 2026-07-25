// ========== INTEGRACAO MERCADO LIVRE (OPCAO A) - LICITATIONBIZNIS ==========
// Modulo autonomo. Nao altera regras de negocio; apenas:
//  1) Injeta um bloco "Integracao Mercado Livre" no modal de compra.
//  2) Permite buscar/vincular uma compra do ML (consumindo /api/ml/orders e
//     /api/ml/shipment) e preenche automaticamente status de entrega, datas,
//     plataforma e link.
//  3) Persiste mlShipmentId / mlOrderId na compra (wrap de saveCompra).
//  4) Adiciona ao sininho um alerta sempre que o cron mudar o status (usa o
//     campo mlUltimaMudanca gravado por api/cron/atualizar-entregas.js).
// A integracao e OPCIONAL: compras de outros sites seguem manuais.
(function () {
  'use strict';
  var API = ''; // mesmo dominio (licitation.vercel.app)
  var _ordersCache = null;

  function _banco() {
    try { if (Array.isArray(DB.empenhos)) return DB.empenhos; } catch (e) {}
    try { if (Array.isArray(_fullDB.empenhos)) return _fullDB.empenhos; } catch (e) {}
    return [];
  }
  function _findEmp(id) { return (_banco() || []).find(function (e) { return e.id === id; }); }
  function _toast(m, t) { if (typeof toast === 'function') { try { toast(m, t); } catch (e) {} } }

    // Coleta todos os order_id do ML ja vinculados em qualquer compra de qualquer empenho.
  // Aceita opcionalmente um order_id a ignorar (o da compra que esta sendo editada agora).
  function _vinculadosSet(ignorarOrderId) {
    var set = new Set();
    (_banco() || []).forEach(function (e) {
      (e.compras || []).forEach(function (c) {
        if (c.mlOrderId && String(c.mlOrderId) !== String(ignorarOrderId || '')) {
          set.add(String(c.mlOrderId));
        }
      });
    });
    return set;
  }

  var STATUS_ML_PT = {
    pending: 'Pendente', handling: 'Em preparacao', ready_to_ship: 'Pronto para envio',
    shipped: 'A caminho', delivered: 'Entregue', not_delivered: 'Nao entregue', cancelled: 'Cancelado'
  };
  function mapStatusEntrega(s) {
    if (s === 'delivered') return 'recebida';
    if (s === 'shipped') return 'em_transito';
    if (s === 'pending' || s === 'handling' || s === 'ready_to_ship') return 'aguardando_envio';
    if (s === 'not_delivered' || s === 'cancelled') return 'nao_recebida';
    return 'aguardando_envio';
  }

  // ---------- UI dentro do modal de compra ----------
  function garantirUI() {
    var campos = document.getElementById('compra-campos');
    if (!campos || document.getElementById('c-ml-box')) return;
    var box = document.createElement('div');
    box.id = 'c-ml-box';
    box.style.cssText = 'margin:4px 0 10px;padding:10px 12px;border:1px dashed #2d6a4f;border-radius:10px;background:rgba(45,106,79,0.05);';
    box.innerHTML =
      '<input type="hidden" id="c-ml-shipment"><input type="hidden" id="c-ml-order">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;font-weight:800;color:#2d6a4f;text-transform:uppercase;">Integracao Mercado Livre</span>' +
        '<button type="button" id="c-ml-btn" class="btn btn-ghost btn-sm" onclick="lbMlAbrirBusca()">Buscar compra no ML</button>' +
        '<span id="c-ml-status" style="font-size:11px;color:var(--text-tertiary);"></span>' +
        '<button type="button" id="c-ml-unlink" class="btn btn-ghost btn-sm" style="display:none;color:#ef4444;" onclick="lbMlDesvincular()">Desvincular</button>' +
      '</div>' +
      '<div id="c-ml-lista-wrap" style="display:none;margin-top:8px;">' +
        '<input type="text" id="c-ml-busca" class="fc" placeholder="Filtrar por produto ou vendedor..." oninput="lbMlFiltrar()" style="margin-bottom:6px;">' +
        '<div id="c-ml-lista" style="max-height:220px;overflow:auto;border:1px solid var(--border-light);border-radius:8px;"></div>' +
      '</div>';
    campos.insertBefore(box, campos.firstChild);
  }

  function refletirVinculo() {
    var shp = (document.getElementById('c-ml-shipment') || {}).value || '';
    var st = document.getElementById('c-ml-status');
    var un = document.getElementById('c-ml-unlink');
    if (shp) {
      if (st) st.textContent = 'Vinculado ao envio ' + shp + ' - atualiza sozinho 1x/dia (16h).';
      if (un) un.style.display = '';
    } else {
      if (st) st.textContent = 'Nenhuma compra vinculada (opcional).';
      if (un) un.style.display = 'none';
    }
  }

  function renderLista(arr) {
    var lista = document.getElementById('c-ml-lista');
    if (!lista) return;
    // Remove compras ja vinculadas a algum empenho (evita duplicidade).
    // Preserva o vinculo da propria compra em edicao, se houver.
      var atual = (document.getElementById('c-ml-order') || {}).value || '';
    var vinculados = _vinculadosSet(atual);
    arr = (arr || []).filter(function (c) {
      if (vinculados.has(String(c.order_id))) return false;      // ja vinculada
      if (c.entregue === true) return false;                     // entregue (flag do endpoint)
      if (c.envio_status === 'delivered') return false;          // entregue (status ML)
      if (c.status_pedido === 'cancelled' || c.envio_status === 'cancelled') return false;
      return true;
    });
    if (!arr.length) { lista.innerHTML = '<div style="padding:12px;color:var(--text-tertiary);font-size:12px;">Nenhuma compra disponivel para vincular (as demais ja foram vinculadas ou entregues).</div>'; return; }

    lista.innerHTML = arr.map(function (c) {
      var sub = (c.vendedor || '') + (c.total ? ' - R$ ' + Number(c.total).toFixed(2) : '') + (c.shipment_id ? ' - envio ' + c.shipment_id : ' - sem envio');
      return '<div onclick="lbMlSelecionar(\'' + (c.shipment_id || '') + '\',\'' + c.order_id + '\')" ' +
        'style="padding:8px 10px;border-bottom:1px solid var(--border-light);cursor:pointer;font-size:12px;" ' +
        'onmouseover="this.style.background=\'var(--bg-surface-soft)\'" onmouseout="this.style.background=\'\'">' +
        '<div style="font-weight:600;">' + (c.titulo || '-') + '</div>' +
        '<div style="font-size:11px;color:var(--text-tertiary);">' + sub + '</div></div>';
    }).join('');
  }

  function abrirBusca() {
    var wrap = document.getElementById('c-ml-lista-wrap');
    var lista = document.getElementById('c-ml-lista');
    if (!wrap || !lista) return;
    wrap.style.display = (wrap.style.display === 'none') ? 'block' : 'none';
    if (wrap.style.display === 'none') return;
    lista.innerHTML = '<div style="padding:12px;color:var(--text-tertiary);font-size:12px;">Carregando compras do Mercado Livre...</div>';
    if (_ordersCache) { renderLista(_ordersCache); return; }
    fetch(API + '/api/ml/orders').then(function (r) { return r.json(); }).then(function (j) {
      _ordersCache = j.compras || [];
      renderLista(_ordersCache);
    }).catch(function (e) {
      lista.innerHTML = '<div style="padding:12px;color:#ef4444;font-size:12px;">Erro ao carregar: ' + e + '</div>';
    });
  }

  function filtrar() {
    var q = ((document.getElementById('c-ml-busca') || {}).value || '').toLowerCase();
    renderLista((_ordersCache || []).filter(function (c) {
      return (c.titulo || '').toLowerCase().indexOf(q) >= 0 || (c.vendedor || '').toLowerCase().indexOf(q) >= 0;
    }));
  }

    function selecionar(shipmentId, orderId) {
    var wrap = document.getElementById('c-ml-lista-wrap'); if (wrap) wrap.style.display = 'none';
    var sEl = document.getElementById('c-ml-shipment'); if (sEl) sEl.value = shipmentId || '';
    var oEl = document.getElementById('c-ml-order'); if (oEl) oEl.value = orderId || '';
    // Plataforma e link: so preenche se estiverem em branco.
    var plat = document.getElementById('c-plataforma'); if (plat && !plat.value) plat.value = 'MERCADO LIVRE';
    var link = document.getElementById('c-link'); if (link && !link.value && orderId) link.value = 'https://www.mercadolivre.com.br/vendas/' + orderId + '/detalhe';
    // Qtd, valor unitario e data da compra: so preenche se o campo estiver vazio.
    var compraML = (_ordersCache || []).find(function (x) { return String(x.order_id) === String(orderId); });
    if (compraML) {
      var dcomp = document.getElementById('c-dcompra');
      if (dcomp && !dcomp.value && compraML.data_compra) dcomp.value = String(compraML.data_compra).slice(0, 10);
      var vunitEl = document.getElementById('c-vunit');
      if (vunitEl && !vunitEl.value && compraML.vunit != null) vunitEl.value = Number(compraML.vunit).toFixed(2);
      var qtdEl = document.getElementById('c-qtd');
      if (qtdEl && !qtdEl.value && compraML.quantidade) {
        var maxQ = parseInt(qtdEl.max, 10);
        qtdEl.value = (maxQ && compraML.quantidade > maxQ) ? maxQ : compraML.quantidade;
      }
      if (typeof calcCompra === 'function') { try { calcCompra(); } catch (e) {} }
    }
    refletirVinculo();
        // Preenche automaticamente qtd, valor unitario e data da compra com os dados do ML.
    var compraML = (_ordersCache || []).find(function (x) { return String(x.order_id) === String(orderId); });
    if (compraML) {
      var dcomp = document.getElementById('c-dcompra');
      if (dcomp && compraML.data_compra) dcomp.value = String(compraML.data_compra).slice(0, 10);
      var vunitEl = document.getElementById('c-vunit');
      if (vunitEl && compraML.vunit != null) vunitEl.value = Number(compraML.vunit).toFixed(2);
      var qtdEl = document.getElementById('c-qtd');
      if (qtdEl && compraML.quantidade) {
        var maxQ = parseInt(qtdEl.max, 10);
        qtdEl.value = (maxQ && compraML.quantidade > maxQ) ? maxQ : compraML.quantidade;
      }
      if (typeof calcCompra === 'function') { try { calcCompra(); } catch (e) {} }
    }
    var stEl = document.getElementById('c-ml-status');
    if (!shipmentId) { _toast('Compra sem envio rastreavel no ML.', 'info'); return; }
    if (stEl) stEl.textContent = 'Consultando status do envio...';
    fetch(API + '/api/ml/shipment?id=' + encodeURIComponent(shipmentId)).then(function (r) { return r.json(); }).then(function (j) {
      var resumo = j.resumo || j;
      var mlStatus = resumo.status;
      var novoStatus = mapStatusEntrega(mlStatus);
      var selStatus = document.getElementById('c-status-entrega');
      if (selStatus) selStatus.value = novoStatus;

      var previsao = null;
      var lt = j.lead_time_bruto;
      if (lt) {
        previsao = (lt.estimated_delivery_time && lt.estimated_delivery_time.date) ||
                   (lt.estimated_delivery_limit && lt.estimated_delivery_limit.date) || null;
        if (previsao) previsao = String(previsao).slice(0, 10);
      }
      if (typeof atualizarCamposStatusEntrega === 'function') { try { atualizarCamposStatusEntrega(); } catch (e) {} }

      var prevEl = document.getElementById('c-data-prevista-recebimento');
      if (prevEl && previsao && (novoStatus === 'em_transito' || novoStatus === 'aguardando_envio')) prevEl.value = previsao;
      if (novoStatus === 'recebida') {
        var recEl = document.getElementById('c-data-recebimento-mercadoria');
        if (recEl && resumo.last_updated) recEl.value = String(resumo.last_updated).slice(0, 10);
      }
      if (stEl) stEl.textContent = 'Vinculado - status ML: ' + (STATUS_ML_PT[mlStatus] || mlStatus) + (previsao ? ' - previsao ' + previsao : '');
      refletirVinculo();
      _toast('Compra vinculada ao Mercado Livre', 'success');
    }).catch(function () {
      if (stEl) stEl.textContent = 'Vinculado (nao foi possivel consultar o status agora).';
    });
  }

  function desvincular() {
    var s = document.getElementById('c-ml-shipment'); if (s) s.value = '';
    var o = document.getElementById('c-ml-order'); if (o) o.value = '';
    refletirVinculo();
    _toast('Vinculo removido.', 'info');
  }

  // ---------- Wrappers de funcoes do 08-compras.js ----------
  function wrapAbrir() {
    var orig = window.abrirCompra;
    if (typeof orig !== 'function') return false;
    if (orig._lbMlWrapped) return true;
    window.abrirCompra = function () {
      var r = orig.apply(this, arguments);
      setTimeout(function () {
        garantirUI();
        var s = document.getElementById('c-ml-shipment'); if (s) s.value = '';
        var o = document.getElementById('c-ml-order'); if (o) o.value = '';
        var w = document.getElementById('c-ml-lista-wrap'); if (w) w.style.display = 'none';
        refletirVinculo();
      }, 0);
      return r;
    };
    window.abrirCompra._lbMlWrapped = true;
    return true;
  }

  function wrapSelecionarLote() {
    var orig = window.selecionarCompraLote;
    if (typeof orig !== 'function') return false;
    if (orig._lbMlWrapped) return true;
    window.selecionarCompraLote = function (empenhoId, itemId, dadosExist) {
      var r = orig.apply(this, arguments);
      setTimeout(function () {
        garantirUI();
        var s = document.getElementById('c-ml-shipment');
        var o = document.getElementById('c-ml-order');
        if (s) s.value = (dadosExist && dadosExist.mlShipmentId) || '';
        if (o) o.value = (dadosExist && dadosExist.mlOrderId) || '';
        refletirVinculo();
      }, 0);
      return r;
    };
    window.selecionarCompraLote._lbMlWrapped = true;
    return true;
  }

  function wrapSave() {
    var orig = window.saveCompra;
    if (typeof orig !== 'function') return false;
    if (orig._lbMlWrapped) return true;
    window.saveCompra = function () {
      var shipmentId = (document.getElementById('c-ml-shipment') || {}).value || '';
      var orderId = (document.getElementById('c-ml-order') || {}).value || '';
      var empId, editId;
      try { empId = compraEmpenhoId; } catch (e) {}
      try { editId = compraEditId; } catch (e) {}
      var emp = _findEmp(empId);
      var before = (emp && emp.compras) ? emp.compras.map(function (c) { return c.id; }) : [];
      var r = orig.apply(this, arguments);
      try {
        var emp2 = _findEmp(empId);
        if (emp2 && emp2.compras) {
          var target = null;
          if (editId) target = emp2.compras.find(function (c) { return c.id === editId; });
          if (!target) target = emp2.compras.find(function (c) { return before.indexOf(c.id) === -1; });
          if (!target) target = emp2.compras[emp2.compras.length - 1];
          if (target) {
            if (shipmentId) { target.mlShipmentId = shipmentId; target.mlOrderId = orderId; }
            else { delete target.mlShipmentId; delete target.mlOrderId; delete target.mlUltimaMudanca; delete target.mlLastSync; }
            if (typeof save === 'function') save('empenhos', _banco());
          }
        }
      } catch (e) { console.error('ML link persist error', e); }
      return r;
    };
    window.saveCompra._lbMlWrapped = true;
    return true;
  }

  // ---------- Sininho: alerta de mudanca de status (48h) ----------
  function wrapNotif() {
    var orig = window.atualizarNotificacoes;
    if (typeof orig !== 'function') return false;
    if (orig._lbMlStatusWrapped) return true;
    var JANELA = 48 * 3600 * 1000;
    var PT = { aguardando_envio: 'Aguardando envio', em_transito: 'Em transito', recebida: 'Recebida', nao_recebida: 'Nao recebida' };
    window.atualizarNotificacoes = function () {
      var base = orig.apply(this, arguments) || [];
      var extras = [];
      var dismissed = (window._notifDismissed instanceof Set) ? window._notifDismissed : null;
      (_banco() || []).forEach(function (e) {
        if (e.finalizado) return;
        (e.compras || []).forEach(function (c) {
          var m = c.mlUltimaMudanca;
          if (!m || !m.em) return;
          if (Date.now() - m.em > JANELA) return;
          var chave = 'ml-status-' + e.id + '-' + c.id + '-' + m.em;
          if (dismissed && dismissed.has(chave)) return;
          extras.push({
            chave: chave, icon: '\uD83D\uDCE6',
            msg: 'Entrega atualizada: ' + (c.plataforma || 'ML') + ' - Empenho #' + (e.num || '-') + ' - ' + (e.orgao || '') + ' -> ' + (PT[m.para] || m.para),
            onclick: "lbMlAbrirEmpenho('" + e.id + "')"
          });
        });
      });
      if (!extras.length) return base;
      var combinado = extras.concat(base);
      var list = document.getElementById('notif-list');
      if (list) {
        list.innerHTML = combinado.map(function (a) {
          return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;margin-bottom:6px;background:var(--bg-surface-soft);border:1px solid var(--border-light);border-radius:10px;font-size:12px;">' +
            '<span style="font-size:16px;line-height:1;flex-shrink:0;">' + a.icon + '</span>' +
            '<span style="flex:1;cursor:pointer;color:var(--text-primary);line-height:1.4;" onclick="' + a.onclick + '">' + a.msg + '</span>' +
            '<button onclick="event.stopPropagation();dispensarNotificacao(\'' + a.chave + '\')" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);font-size:12px;padding:0 2px;flex-shrink:0;" title="Dispensar">\u2715</button>' +
          '</div>';
        }).join('');
      }
      if (typeof window._atualizarBadgeNotificacoes === 'function') { try { window._atualizarBadgeNotificacoes(combinado); } catch (e) {} }
      return combinado;
    };
    window.atualizarNotificacoes._lbMlStatusWrapped = true;
    return true;
  }

  function abrirEmpenho(id) {
    var p = document.getElementById('notif-panel'); if (p) p.style.display = 'none';
    if (typeof window.abrirPopupEmpenho === 'function') { try { window.abrirPopupEmpenho(id); } catch (e) {} }
  }

  function init() {
    window.lbMlAbrirBusca = abrirBusca;
    window.lbMlFiltrar = filtrar;
    window.lbMlSelecionar = selecionar;
    window.lbMlDesvincular = desvincular;
    window.lbMlAbrirEmpenho = abrirEmpenho;

    var n = 0;
    var it = setInterval(function () {
      n++;
      var a = wrapAbrir(), b = wrapSelecionarLote(), c = wrapSave();
      if ((a && b && c) || n > 50) clearInterval(it);
    }, 200);

    var m = 0;
    var it2 = setInterval(function () {
      m++;
      if (wrapNotif() || m > 80) clearInterval(it2);
    }, 300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
