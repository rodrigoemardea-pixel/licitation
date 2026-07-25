// Localizacao no projeto: api/ml/orders.js
// Lista as compras recentes da conta Mercado Livre autorizada (perspectiva de comprador),
// JA ENRIQUECIDAS com o status de envio, e por padrao EXCLUI as entregues e canceladas.
// Assim, na tela de vinculo so aparecem compras que ainda nao constam como entregues.
//
// Uso normal:                 /api/ml/orders          (esconde entregues/canceladas)
// Para ver todas (debug):     /api/ml/orders?todas=1

const { getAccessToken } = require('../_lib/mlToken');
const { db } = require('../_lib/firebase');

const STATUS_PT = {
  pending: 'Pendente', handling: 'Em preparacao', ready_to_ship: 'Pronto para envio',
  shipped: 'Enviado / a caminho', delivered: 'Entregue', not_delivered: 'Nao entregue', cancelled: 'Cancelado',
};

module.exports = async function handler(req, res) {
  try {
    const accessToken = await getAccessToken();
    const mostrarTodas = req.query && (req.query.todas === '1' || req.query.todas === 'true');

    const tokenSnap = await db.collection('ml_tokens').doc('hamate').get();
    const userId = tokenSnap.exists ? tokenSnap.data().user_id : null;
    if (!userId) {
      res.status(400).json({ erro: 'user_id nao encontrado no Firestore. Refaca a autorizacao em /api/ml/login.' });
      return;
    }

    const url =
      'https://api.mercadolibre.com/orders/search?buyer=' + encodeURIComponent(userId) +
      '&sort=date_desc&limit=50';
    const resp = await fetch(url, { headers: { Authorization: 'Bearer ' + accessToken } });
    const data = await resp.json();
    if (!resp.ok) { res.status(resp.status).json({ erro: 'Falha ao listar compras', detalhe: data }); return; }

       const base = (data.results || []).map(function (order) {
      const oi = (order.order_items && order.order_items[0]) ? order.order_items[0] : {};
      const primeiroItem = (oi.item && oi.item.title) ? oi.item.title : null;
      const qtd = oi.quantity || 1;
      // unit_price ja e o valor unitario; fallback: total / quantidade.
      const vunit = (oi.unit_price != null)
        ? oi.unit_price
        : (order.total_amount && qtd ? order.total_amount / qtd : order.total_amount) || 0;
      return {
        order_id: order.id,
        shipment_id: order.shipping ? order.shipping.id : null,
        titulo: primeiroItem,
        quantidade: qtd,
        vunit: vunit,
        quantidade_itens: (order.order_items || []).length,
        total: order.total_amount,
        moeda: order.currency_id,
        data_compra: order.date_created,
        status_pedido: order.status,
        vendedor: order.seller ? order.seller.nickname : null,
      };
    });

    // Enriquecimento: consulta o status de envio de cada compra em paralelo.
    const shipHeaders = { Authorization: 'Bearer ' + accessToken, 'x-format-new': 'true' };
    await Promise.all(base.map(async function (c) {
      if (!c.shipment_id) { c.envio_status = null; c.entregue = false; return; }
      try {
        const r = await fetch('https://api.mercadolibre.com/shipments/' + encodeURIComponent(c.shipment_id), { headers: shipHeaders });
        if (r.ok) {
          const s = await r.json();
          c.envio_status = s.status || null;
          c.envio_status_pt = STATUS_PT[s.status] || s.status || null;
          c.entregue = s.status === 'delivered';
        } else { c.envio_status = null; c.entregue = false; }
      } catch (e) { c.envio_status = null; c.entregue = false; }
    }));

    let compras = base;
    if (!mostrarTodas) {
      compras = base.filter(function (c) {
        if (c.entregue) return false;                    // ja entregue -> nao aparece
        if (c.status_pedido === 'cancelled') return false; // cancelada -> nao aparece
        if (c.envio_status === 'cancelled') return false;
        return true;
      });
    }

    // status_pedido_pt para compatibilidade com o front atual.
    compras.forEach(function (c) { c.status_pedido_pt = STATUS_PT[c.status_pedido] || c.status_pedido; });

    res.status(200).json({ total: compras.length, ocultas: base.length - compras.length, compras: compras });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};
