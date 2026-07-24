// Localizacao no projeto: api/ml/shipment.js
// Consulta o status de um envio + tenta obter as datas estimadas (lead_time).
// Uso: https://licitation.vercel.app/api/ml/shipment?id=SHIPMENT_ID

const { getAccessToken } = require('../_lib/mlToken');

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
    const headers = { Authorization: 'Bearer ' + accessToken, 'x-format-new': 'true' };

    // 1) Detalhe do envio
    const rShip = await fetch(
      'https://api.mercadolibre.com/shipments/' + encodeURIComponent(shipmentId),
      { headers }
    );
    const ship = await rShip.json();
    if (!rShip.ok) {
      res.status(rShip.status).json({ erro: 'Falha ao consultar envio', detalhe: ship });
      return;
    }

    // 2) Prazo estimado (lead_time) - pode nao existir para todos os envios.
    let leadTime = null;
    try {
      const rLead = await fetch(
        'https://api.mercadolibre.com/shipments/' + encodeURIComponent(shipmentId) + '/lead_time',
        { headers }
      );
      if (rLead.ok) leadTime = await rLead.json();
    } catch (e) { /* ignora se nao existir */ }

    // Retorna tudo cru para inspecionarmos os campos de data disponiveis.
    res.status(200).json({
      resumo: {
        id: ship.id,
        order_id: ship.order_id,
        status: ship.status,
        status_pt: STATUS_PT[ship.status] || ship.status,
        substatus: ship.substatus || null,
        tracking_number: ship.tracking_number || null,
        last_updated: ship.last_updated || null,
        date_created: ship.date_created || null,
      },
      lead_time_bruto: leadTime,     // aqui devem aparecer as datas estimadas, se existirem
      status_history_bruto: ship.status_history || null, // data real de entrega, se vier
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};
