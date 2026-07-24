// Localizacao no projeto: api/ml/callback.js
// Recebe o "code" enviado pelo Mercado Livre apos a autorizacao,
// troca por access_token / refresh_token e salva no Firestore.

const { db } = require('../_lib/firebase');

module.exports = async function handler(req, res) {
  const code = req.query && req.query.code;

  if (!code) {
    res.status(400).send('Codigo de autorizacao nao recebido do Mercado Livre.');
    return;
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.ML_REDIRECT_URI,
    });

    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      res.status(400).json({ erro: 'Falha ao obter token', detalhe: data });
      return;
    }

    // Salva os tokens no Firestore (colecao ml_tokens, documento "hamate").
    await db.collection('ml_tokens').doc('hamate').set({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user_id,
      scope: data.scope || null,
      expires_at: Date.now() + data.expires_in * 1000,
      updated_at: Date.now(),
    });

    res
      .status(200)
      .send(
        'Autorizacao concluida com sucesso. Os tokens foram salvos no Firestore. ' +
        'Voce ja pode fechar esta janela.'
      );
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno', detalhe: String(err) });
  }
};
