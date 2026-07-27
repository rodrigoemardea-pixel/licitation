// Localizacao no projeto: api/cron/atualizar-entregas.js
// Roda pelo agendador externo (cron-job.org) de hora em hora, 8h-21h Brasilia.
// Le dados/principal, encontra as compras VINCULADAS ao ML (campo mlShipmentId),
// consulta o Mercado Livre e atualiza statusEntrega, dataPrevistaRecebimento e
// dataRecebimentoMercadoria direto na compra. Registra mudancas para o sininho.
//
// PROTEGIDO por CRON_SECRET: exige ?token=SEU_SECRET ou header Authorization.

const { getAccessToken } = require('../_lib/mlToken');
const { db } = require('../_lib/firebase');

function mapStatusEntrega(status) {
  if (status === 'delivered') return 'recebida';
  if (status === 'shipped') return 'em_transito';
  if (status === 'pending' || status === 'handling' || status === 'ready_to_ship') return 'aguardando_envio';
  if (status === 'not_delivered' || status === 'cancelled') return 'nao_recebida';
  return 'aguardando_envio';
}

module.exports = async function handler(req, res) {
  try {
    // Protecao: exige um token secreto no header ou query.
    const CRON_SECRET = process.env.CRON_SECRET;
    if (CRON_SECRET) {
      const auth = (req.headers && req.headers.authorization) || '';
      const q = req.query && req.query.token;
      if (auth !== ('Bearer ' + CRON_SECRET) && q !== CRON_SECRET) {
        res.status(401).json({ erro: 'nao autorizado' });
        return;
      }
    }

    const accessToken = await getAccessToken();
    const headers = { Authorization: 'Bearer ' + accessToken, 'x-format-new': 'true' };

    const docRef = db.collection('dados').doc('principal');
    const snap = await docRef.get();
    if (!snap.exists) { res.status(200).json({ ok: true, msg: 'sem dados' }); return; }

    const data = snap.data();
    const empenhos = Array.isArray(data.empenhos) ? data.empenhos : [];

    let verificados = 0;
    let atualizados = 0;
    const mudancas = [];
    const erros = [];

    for (const emp of empenhos) {
      if (!Array.isArray(emp.compras)) continue;
      for (const c of emp.compras) {
        if (!c.mlShipmentId) continue;
        if (c.statusEntrega === 'recebida') continue;
        verificados++;

        try {
          const rShip = await fetch(
            'https://api.mercadolibre.com/shipments/' + encodeURIComponent(c.mlShipmentId),
            { headers }
          );
          const s = await rShip.json();
          if (!rShip.ok) { erros.push({ emp: emp.id, compra: c.id, detalhe: s }); continue; }

          let previsao = null;
          try {
            const rLead = await fetch(
              'https://api.mercadolibre.com/shipments/' + encodeURIComponent(c.mlShipmentId) + '/lead_time',
              { headers }
            );
            if (rLead.ok) {
              const lt = await rLead.json();
              const raw =
                (lt.estimated_delivery_time && lt.estimated_delivery_time.date) ||
                (lt.estimated_delivery_limit && lt.estimated_delivery_limit.date) || null;
              if (raw) previsao = String(raw).slice(0, 10);
            }
          } catch (e) { /* segue sem previsao */ }

          const statusAntigo = c.statusEntrega || 'sem_status';
          const novoStatus = mapStatusEntrega(s.status);
          let mudou = false;

          if (novoStatus !== c.statusEntrega) { c.statusEntrega = novoStatus; mudou = true; }

          if ((novoStatus === 'em_transito' || novoStatus === 'aguardando_envio') &&
              previsao && c.dataPrevistaRecebimento !== previsao) {
            c.dataPrevistaRecebimento = previsao; mudou = true;
          }

          if (novoStatus === 'recebida') {
            const dataRec = s.last_updated
              ? String(s.last_updated).slice(0, 10)
              : new Date().toISOString().slice(0, 10);
            if (c.dataRecebimentoMercadoria !== dataRec) { c.dataRecebimentoMercadoria = dataRec; mudou = true; }
          }

          c.mlLastSync = Date.now();
          if (mudou) {
            atualizados++;
            c.mlUltimaMudanca = { de: statusAntigo, para: novoStatus, em: Date.now() };
            mudancas.push({ empId: emp.id, empNum: emp.num || null, compraId: c.id, de: statusAntigo, para: novoStatus });
          }
        } catch (e) {
          erros.push({ emp: emp.id, compra: c.id, detalhe: String(e) });
        }
      }
    }

    if (atualizados > 0) {
      await docRef.set({ empenhos: empenhos }, { merge: true });
    }

    res.status(200).json({ ok: true, verificados, atualizados, mudancas, erros });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};
