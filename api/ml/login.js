// Localizacao no projeto: api/ml/login.js
// Redireciona o usuario para a pagina de autorizacao do Mercado Livre.
// Basta acessar https://licitation.vercel.app/api/ml/login para iniciar o fluxo.

module.exports = function handler(req, res) {
  const clientId = process.env.ML_CLIENT_ID;
  const redirectUri = process.env.ML_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res
      .status(500)
      .send('Variaveis ML_CLIENT_ID ou ML_REDIRECT_URI nao configuradas na Vercel.');
    return;
  }

  const url =
    'https://auth.mercadolivre.com.br/authorization' +
    '?response_type=code' +
    '&client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri);

  res.writeHead(302, { Location: url });
  res.end();
};
