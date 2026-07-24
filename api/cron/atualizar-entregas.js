// Localizacao no projeto: api/cron/atualizar-entregas.js
// Roda 1x por dia (16h Brasilia). Atualiza status, previsao de entrega e data de recebimento
// das compras vinculadas ao Mercado Livre (colecao entregas_ml).

const { getAccessToken } = require('../_lib/mlToken');
const { db } = require('../_lib/firebase');

// Mapeia o status do ML para o status de entrega do seu sistema.
function mapStatusEntrega(status) {
  if (status === 'delivered') return 'recebida';
  if (status === 'shipped') return 'em transito';
  if (status === 'pending' || status === 'handling' || status === 'ready_to_ship') return 'aguardando envio';
  if (status === 'not_delivered' || status === 'cancelled') return 'nao recebida';
  return 'aguardando envio';
}

module.exports = async function handler(req, res) {
  try {
    const accessToken = await getAccessToken();
    const headers = { Authorization: 'Bearer ' + accessToken, 'x-format-new': 'true' };

    const snap = await db.collection('entregas_ml').get();

    let atualizados = 0;
    let ignorados = 0;
    const mudancas = []; // usado para gerar notificacoes no sininho
    const erros = [];

    for (const doc of snap.docs) {
      const item = doc.data();

      if (!item.shipment_id) { ignorados++; continue; }
      if (item.status === 'delivered') { ignorados++; continue; }

      try {
        // 1) status do envio
        const rShip = await fetch(
          'https://api.mercadolibre.com/shipments/' + encodeURIComponent(item.shipment_id),
          { headers }
        );
        const s = await rShip.json();
        if (!rShip.ok) { erros.push({ id: doc.id, detalhe: s }); continue; }

        // 2) previsao de entrega (lead_time)
        let previsaoEntrega = null;
        try {
          const rLead = await fetch(
            'https://api.mercadolibre.com/shipments/' + encodeURIComponent(item.shipment_id) + '/lead_time',
            { headers }
          );
          if (rLead.ok) {
            const lt = await rLead.json();
            previsaoEntrega =
              (lt.estimated_delivery_time && lt.estimated_delivery_time.date) ||
              (lt.estimated_delivery_limit && lt.estimated_delivery_limit.date) ||
              null;
          }
        } catch (e) { /* segue sem previsao */ }

        const statusEntrega = mapStatusEntrega(s.status);
        const statusAntigo = item.status_entrega || null;

        const novo = {
          status: s.status || null,
          status_entrega: statusEntrega,
          substatus: s.substatus || null,
          tracking_number: s.tracking_number || null,
          previsao_entrega: previsaoEntrega,
          data_recebimento: s.status === 'delivered' ? (s.last_updated || null) : null,
          last_updated_ml: s.last_updated || null,
          atualizado_em: Date.now(),
        };

        await doc.ref.set(novo, { merge: true });
        atualizados++;

        // registra mudanca de status para o sininho
        if (statusAntigo && statusAntigo !== statusEntrega) {
          mudancas.push({
            order_id: item.order_id,
            titulo: item.titulo || null,
            referencia: item.referencia || null,
            de: statusAntigo,
            para: statusEntrega,
          });
        }
      } catch (e) {
        erros.push({ id: doc.id, detalhe: String(e) });
      }
    }

    // grava as mudancas numa colecao que o sininho pode ler
    for (const m of mudancas) {
      await db.collection('notificacoes_entregas').add({
        tipo: 'mudanca_status_entrega',
        order_id: m.order_id,
        titulo: m.titulo,
        referencia: m.referencia,
        mensagem: 'Entrega "' + (m.titulo || m.order_id) + '" mudou para: ' + m.para,
        lida: false,
        criado_em: Date.now(),
      });
    }

    res.status(200).json({
      ok: true,
      atualizados,
      ignorados,
      notificacoes_geradas: mudancas.length,
      erros,
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};
