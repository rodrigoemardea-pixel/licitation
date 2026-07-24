// Localizacao no projeto: api/_lib/mlToken.js
// Recupera o access_token valido do Firestore e, se estiver perto de expirar,
// renova automaticamente usando o refresh_token.
// Retorna sempre um access_token utilizavel.

const { db } = require('./firebase');

const DOC_REF = () => db.collection('ml_tokens').doc('hamate');

// Margem de seguranca: renova se faltar menos de 5 minutos para expirar.
const MARGEM_MS = 5 * 60 * 1000;

async function getAccessToken() {
  const snap = await DOC_REF().get();

  if (!snap.exists) {
    throw new Error(
      'Tokens do Mercado Livre nao encontrados no Firestore. Refaca a autorizacao em /api/ml/login.'
    );
  }

  const data = snap.data();

  // Ainda valido? devolve direto.
  if (data.expires_at && Date.now() < data.expires_at - MARGEM_MS) {
    return data.access_token;
  }

  // Precisa renovar.
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    refresh_token: data.refresh_token,
  });

  const resp = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: params.toString(),
  });

  const novo = await resp.json();

  if (!resp.ok || !novo.access_token) {
    throw new Error(
      'Falha ao renovar o token do Mercado Livre: ' + JSON.stringify(novo)
    );
  }

  // Atualiza o Firestore com os novos tokens.
  const atualizado = {
    access_token: novo.access_token,
    // O ML devolve um novo refresh_token a cada renovacao; se nao vier, mantem o antigo.
    refresh_token: novo.refresh_token || data.refresh_token,
    expires_at: Date.now() + novo.expires_in * 1000,
    updated_at: Date.now(),
  };
  if (novo.user_id !== undefined) atualizado.user_id = novo.user_id;
  if (novo.scope !== undefined) atualizado.scope = novo.scope;

  await DOC_REF().set(atualizado, { merge: true });

  return novo.access_token;
}

module.exports = { getAccessToken };
