// Localizacao no projeto: api/_lib/firebase.js
// Inicializa o Firebase Admin usando as variaveis de ambiente da Vercel.
// Reaproveita a mesma instancia entre chamadas para evitar erro de duplicidade.

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // A chave privada vem com \n literais nas variaveis de ambiente;
      // aqui convertemos para quebras de linha reais.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = { db };
