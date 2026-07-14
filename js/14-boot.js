// ========== BOOT =====
// Com Firebase, o boot é feito pelo onAuthStateChanged acima.
// Apenas inicializa o app com dados vazios (serão carregados após login).
// Alt shortcuts removidos

// ========== SEÇÕES COLAPSÁVEIS NOS MODAIS ==========
// ========== MENU DO USUÁRIO ==========
// toggleUserMenu removido
function boot() {
  // Show loading skeletons while Firebase connects
  ['tbody-disputas','tbody-empenhos','tbody-finalizadas','tbody-emp-finalizados'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = Array(4).fill(0).map(() =>
        `<tr class="skeleton-row">${Array(8).fill('<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>').join('')}</tr>`
      ).join('');
    }
  });
  inicializarApp({ disputas: [], empenhos: [], initialized: true });
}

boot();

