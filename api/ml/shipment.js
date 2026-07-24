// Localizacao no projeto: api/ml/shipment.js
// Consulta o status de um envio no Mercado Livre.
// Uso: https://licitation.vercel.app/api/ml/shipment?id=SHIPMENT_ID
//
// Retorna um JSON resumido com o status e dados uteis para a tela de entregas.

const { getAccessToken } = require('../_lib/mlToken');

// Traducao dos status/substatus mais comuns para exibir na tela.
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
  const shipmentId = req.query && req.query.id;

  if (!shipmentId) {
    res.status(400).json({ erro: 'Informe o parametro id (shipment id).' });
    return;
  }

  try {
    const accessToken = await getAccessToken();

    const resp = await fetch(
      'https://api.mercadolibre.com/shipments/' + encodeURIComponent(shipmentId),
      {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'x-format-new': 'true',
        },
      }
    );

    const data = await resp.json();

    if (!resp.ok) {
      res.status(resp.status).json({ erro: 'Falha ao consultar envio', detalhe: data });
      return;
    }

    // Monta uma resposta enxuta para o front consumir.
    const resumo = {
      id: data.id,
      order_id: data.order_id,
      status: data.status,
      status_pt: STATUS_PT[data.status] || data.status,
      substatus: data.substatus || null,
      tracking_number: data.tracking_number || null,
      tracking_method: data.tracking_method || null,
      last_updated: data.last_updated || null,
      date_created: data.date_created || null,
    };

    res.status(200).json(resumo);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};
