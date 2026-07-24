// Localizacao no projeto: api/ml/vincular.js
// Salva (ou remove) o vinculo de uma compra do Mercado Livre para acompanhamento.
// O vinculo e OPCIONAL: so as compras que voce escolher entram na colecao entregas_ml,
// que e lida pelo cron diario. Compras de outros sites continuam no controle manual.
//
// POST  { order_id, shipment_id, titulo, referencia }  -> cria/atualiza o vinculo
// DELETE ?order_id=...                                 -> remove o vinculo

const { db } = require('../_lib/firebase');

module.exports = async function handler(req, res) {
  try {
    // Remocao do vinculo.
    if (req.method === 'DELETE') {
      const orderId = req.query && req.query.order_id;
      if (!orderId) {
        res.status(400).json({ erro: 'Informe order_id para remover.' });
        return;
      }
      await db.collection('entregas_ml').doc(String(orderId)).delete();
      res.status(200).json({ ok: true, removido: orderId });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ erro: 'Use POST para vincular ou DELETE para remover.' });
      return;
    }

    // Body pode vir como objeto (Vercel) ou string.
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const { order_id, shipment_id, titulo, referencia } = body;

    if (!order_id) {
      res.status(400).json({ erro: 'order_id e obrigatorio.' });
      return;
    }

    const doc = {
      order_id: order_id,
      shipment_id: shipment_id || null,
      titulo: titulo || null,
      referencia: referencia || null, // empenho/compra do LicitationBiznis (texto livre)
      status: null,                   // sera preenchido pelo cron
      status_pt: 'Aguardando 1a atualizacao',
      criado_em: Date.now(),
    };

    await db.collection('entregas_ml').doc(String(order_id)).set(doc, { merge: true });

    res.status(200).json({ ok: true, vinculo: doc });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};