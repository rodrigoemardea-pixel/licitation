const firebaseConfig = {
    apiKey: "AIzaSyDR6IIRzs2NPutCi2S8LTs8HTAq49zI9KE",
    authDomain: "licitationbiznis.firebaseapp.com",
    projectId: "licitationbiznis",
    storageBucket: "licitationbiznis.firebasestorage.app",
    messagingSenderId: "913302404751",
    appId: "1:913302404751:web:edf4925f479d2f811abafa"
  };
  firebase.initializeApp(firebaseConfig);
  const fbAuth = firebase.auth();
  const fbDB  = firebase.firestore();
  const fbStorage = firebase.storage();
  // ✅ MELHORIA 10: Modo offline — persiste dados localmente para uso sem internet
  fbDB.enablePersistence({ synchronizeTabs: true }).catch(err => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência offline: múltiplas abas abertas. Apenas uma aba terá persistência.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistência offline não suportada neste navegador.');
    }
  });
