// Localizacao no projeto: api/ml/entregas.js
// Lista as entregas VINCULADAS (colecao entregas_ml), com o status ja atualizado
// pelo cron. E isso que a tela de "entregas acompanhadas" consome.
// Uso: https://licitation.vercel.app/api/ml/entregas

const { db } = require('../_lib/firebase');

module.exports = async function handler(req, res) {
  try {
    const snap = await db.collection('entregas_ml').get();

    const entregas = snap.docs.map(function (d) {
      const x = d.data();
      return {
        order_id: x.order_id,
        shipment_id: x.shipment_id || null,
        titulo: x.titulo || null,
        referencia: x.referencia || null,
        status: x.status || null,
        status_pt: x.status_pt || null,
        substatus: x.substatus || null,
        tracking_number: x.tracking_number || null,
        last_updated_ml: x.last_updated_ml || null,
        atualizado_em: x.atualizado_em || null,
      };
    });

    res.status(200).json({ total: entregas.length, entregas: entregas });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};