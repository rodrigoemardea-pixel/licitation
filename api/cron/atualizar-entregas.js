// Localizacao no projeto: api/cron/atualizar-entregas.js
// Rotina agendada (Cron Job da Vercel, 1x por dia) que atualiza o status
// das entregas VINCULADAS ao Mercado Livre.
//
// Le a colecao "entregas_ml" no Firestore, onde cada documento representa
// uma compra que VOCE vinculou manualmente a um shipment do Mercado Livre.
// Para cada uma com shipment_id, consulta o status e regrava.
//
// Compras de outros sites (sem shipment_id) sao IGNORADAS por esta rotina,
// continuando sob controle manual.

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

    // Busca apenas os vinculos que tem shipment_id e ainda nao foram entregues.
    const snap = await db.collection('entregas_ml').get();

    let atualizados = 0;
    let ignorados = 0;
    const erros = [];

    for (const doc of snap.docs) {
      const item = doc.data();

      // Sem shipment_id => controle manual, nao mexe.
      if (!item.shipment_id) {
        ignorados++;
        continue;
      }

      // Ja entregue => nao precisa consultar de novo.
      if (item.status === 'delivered') {
        ignorados++;
        continue;
      }

      try {
        const resp = await fetch(
          'https://api.mercadolibre.com/shipments/' +
            encodeURIComponent(item.shipment_id),
          {
            headers: {
              Authorization: 'Bearer ' + accessToken,
              'x-format-new': 'true',
            },
          }
        );

        const s = await resp.json();

        if (!resp.ok) {
          erros.push({ id: doc.id, detalhe: s });
          continue;
        }

        await doc.ref.set(
          {
            status: s.status || null,
            status_pt: STATUS_PT[s.status] || s.status || null,
            substatus: s.substatus || null,
            tracking_number: s.tracking_number || null,
            last_updated_ml: s.last_updated || null,
            atualizado_em: Date.now(),
          },
          { merge: true }
        );

        atualizados++;
      } catch (e) {
        erros.push({ id: doc.id, detalhe: String(e) });
      }
    }

    res.status(200).json({
      ok: true,
      atualizados: atualizados,
      ignorados: ignorados,
      erros: erros,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};