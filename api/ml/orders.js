// Localizacao no projeto: api/ml/orders.js
// Lista as compras recentes da conta Mercado Livre autorizada (perspectiva de comprador).
// Uso: https://licitation.vercel.app/api/ml/orders
//
// Retorna um array enxuto para o front exibir e permitir o VINCULO manual
// de cada compra do ML a um registro do LicitationBiznis.
// A integracao e OPCIONAL: compras de outros sites continuam sendo informadas manualmente.

const { getAccessToken } = require('../_lib/mlToken');
const { db } = require('../_lib/firebase');

const STATUS_PT = {
  pending: 'Pendente',
  handling: 'Em preparacao',
  ready_to_ship: 'Pronto para envio',
  shipped: 'Enviado / a caminho',
  delivered: 'Entregue',
  not_delivered: 'Nao entregue',
  cancelled: 'Cancelado',
};

module.exports = async function handler(req, res) {
  try {
    const accessToken = await getAccessToken();

    // Descobre o user_id da conta autorizada.
    const tokenSnap = await db.collection('ml_tokens').doc('hamate').get();
    const userId = tokenSnap.exists ? tokenSnap.data().user_id : null;

    if (!userId) {
      res.status(400).json({
        erro: 'user_id nao encontrado no Firestore. Refaca a autorizacao em /api/ml/login.',
      });
      return;
    }

    // Busca as compras da conta (role de comprador).
    const url =
      'https://api.mercadolibre.com/orders/search?buyer=' +
      encodeURIComponent(userId) +
      '&sort=date_desc&limit=50';

    const resp = await fetch(url, {
      headers: { Authorization: 'Bearer ' + accessToken },
    });

    const data = await resp.json();

    if (!resp.ok) {
      res.status(resp.status).json({ erro: 'Falha ao listar compras', detalhe: data });
      return;
    }

    const compras = (data.results || []).map(function (order) {
      const primeiroItem =
        order.order_items && order.order_items[0] && order.order_items[0].item
          ? order.order_items[0].item.title
          : null;

      return {
        order_id: order.id,
        shipment_id: order.shipping ? order.shipping.id : null,
        titulo: primeiroItem,
        quantidade_itens: (order.order_items || []).length,
        total: order.total_amount,
        moeda: order.currency_id,
        data_compra: order.date_created,
        status_pedido: order.status,
        status_pedido_pt: STATUS_PT[order.status] || order.status,
        vendedor: order.seller ? order.seller.nickname : null,
      };
    });

    res.status(200).json({ total: compras.length, compras: compras });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};