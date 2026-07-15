
// ==================== CONFIGURAÇÕES ====================
// Gerenciamento global de alarmes (suporta múltiplos alarmes simultâneos)
window._alarmeAtivos = [];
window._pararTodosAlarmes = function() {
  (window._alarmeAtivos || []).forEach(a => {
    try { a.clearT(); } catch(e) {}
    try { if (a.ctx && a.ctx.state !== 'closed') a.ctx.close(); } catch(e) {}
  });
  window._alarmeAtivos = [];
};
// Compatibilidade: _pararAlarme aponta para _pararTodosAlarmes
window._pararAlarme = () => window._pararTodosAlarmes();

const KEYS={disputas:'lic_ent_d',empenhos:'lic_ent_e'};
// ===== PERSISTÊNCIA FIREBASE FIRESTORE =====
let _ignorarProximoSnapshot = false;
let _salvarTimeout = null;

// Remove undefined/NaN de objetos antes de enviar ao Firestore
function sanitizeText(value) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\bon\w+\s*=/gi, '');
}
function escapeHTML(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function sanitizeForFirestore(obj) {
  return JSON.parse(JSON.stringify(obj, (key, val) => {
    if (val === undefined) return null;
    if (typeof val === 'number' && isNaN(val)) return 0;
    if (typeof val === 'string' && !/url|link|senha|password/i.test(key)) return sanitizeText(val);
    return val;
  }));
}
function registrarAuditoria(entidade, entidadeId, acao, antes, depois) {
  // Registro local de apoio. Não cria coleções, não exige regras novas
  // e não altera a configuração atual do Firestore.
  try {
    const chave = 'lb-auditoria-local';
    const eventos = JSON.parse(localStorage.getItem(chave) || '[]');
    eventos.push({
      entidade, entidadeId, acao,
      usuarioEmail: fbAuth.currentUser?.email || '',
      dataHora: new Date().toISOString()
    });
    localStorage.setItem(chave, JSON.stringify(eventos.slice(-300)));
  } catch (e) {
    console.warn('Auditoria local não registrada:', e);
  }
  return Promise.resolve();
}

const save = (k, v) => {
  if (!fbAuth.currentUser) return;
  // _fullDB é SEMPRE a fonte completa (todos os analistas).
  // Toda escrita já foi feita em _fullDB antes de chamar save().
  // Basta gravar _fullDB[k] no Firestore diretamente.
  _ignorarProximoSnapshot = true;
  clearTimeout(_salvarTimeout);
  _salvarTimeout = setTimeout(() => { _ignorarProximoSnapshot = false; }, 3000);

  const vToSave = (k in _fullDB) ? _fullDB[k] : v;
  const vClean = sanitizeForFirestore(vToSave);
  _bumpDbVersion();
  fbDB.collection('dados').doc('principal').set(
    { [k]: vClean },
    { merge: true }
  ).catch(e => {
    console.error('Erro ao salvar no Firebase:', e);
    _ignorarProximoSnapshot = false;
  });
};

// ===== USUÁRIO LOGADO =====
let usuarioLogado = null;

// ===== CONFIGURAÇÕES DE PERMISSÃO =====
// ▶ ADMINISTRADORES: colocar aqui os e-mails que podem ver TODOS os dados.
const ADMIN_EMAILS = new Set([
  'rodrigoemardea@gmail.com',  // Admin geral
]);
// Nomes que o admin pode atribuir (ele gerencia, nao opera)
const ADMIN_ANALISTAS_PERMITIDOS = ['Márdea', 'Rodrigo'];

// ▶ MAPEAMENTO e-mail → nome do analista (EXATAMENTE igual ao cadastrado nos registros).
const EMAIL_TO_ANALISTA = {
  'mardea@hamate.com':   'Márdea',
  'rodrigo@hamate.com':  'Rodrigo',
  // ✅ Mapeamento ativo
};

let isAdmin = false;
let analistaDoUsuario = null;

function fazerLogin() {
  const email = (document.getElementById('login-email')?.value || '').trim();
  const senha = (document.getElementById('login-senha')?.value || '');
  const erroEl = document.getElementById('login-erro');
  const btnEl  = document.getElementById('login-btn');
  if (!email || !senha) { if(erroEl) erroEl.textContent = 'Preencha e-mail e senha.'; return; }
  if(erroEl) erroEl.textContent = '';
  if(btnEl) { btnEl.textContent = 'Entrando...'; btnEl.disabled = true; }
  fbAuth.signInWithEmailAndPassword(email, senha)
    .catch(err => {
      if(erroEl) erroEl.textContent = 'E-mail ou senha incorretos.';
      if(btnEl) { btnEl.textContent = 'Entrar →'; btnEl.disabled = false; }
    });
}

function fazerLogout() {
  fbAuth.signOut();
}

// ===== CONTROLE DE PERMISSÕES =====
// Popula todos os selects de filtro de analista com os nomes reais existentes nos dados.
// Chamada sempre que _fullDB é atualizado (onSnapshot).
function atualizarFiltrosAnalista() {
  // Coleta nomes únicos de todos os arrays que têm campo analista
  const nomes = new Set();
  (_fullDB.disputas || []).forEach(r => r.analista && nomes.add(r.analista));
  (_fullDB.empenhos || []).forEach(r => r.analista && nomes.add(r.analista));
  (_fullDB.acomp    || []).forEach(r => r.analista && nomes.add(r.analista));
  const sorted = [...nomes].sort();

  // IDs dos selects que precisam de opções dinâmicas
  const filterIds = [
    'filtro-analista-disputas',
    'filtro-analista-empenhos',
    'filtro-analista-acomp',
    'filtro-analista-finalizadas',
    'filtro-analista-emp-fin',
    'dash-filtro-analista',
    'tarefa-input-resp',
  ];

  filterIds.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    const isTarefa = id === 'tarefa-input-resp';
    // Mantém só a primeira opção fixa ("Todos" ou "Qualquer um")
    while (sel.options.length > 1) sel.remove(1);
    sorted.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
    // Restaura seleção anterior se ainda válida
    if (current && [...sel.options].some(o => o.value === current)) {
      sel.value = current;
    }
  });

  // Atualiza selects de criacao/edicao (d-analista, ac-analista, e-analista)
  // Admin: mostra apenas analistas permitidos (exclui o proprio admin)
  const formIds = ['d-analista', 'ac-analista'];
  const nomesFormFinal = isAdmin ? [...new Set(ADMIN_ANALISTAS_PERMITIDOS)].sort() : sorted;
  formIds.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    nomesFormFinal.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      sel.appendChild(opt);
    });
    if (current && [...sel.options].some(o => o.value === current)) sel.value = current;
  });
  // Atualiza e-analista (empenho) com mesma logica
  const eAnSel2 = document.getElementById('e-analista');
  if (eAnSel2) {
    const curE = eAnSel2.value;
    while (eAnSel2.options.length > 1) eAnSel2.remove(1);
    nomesFormFinal.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      eAnSel2.appendChild(opt);
    });
    if (curE && [...eAnSel2.options].some(o => o.value === curE)) eAnSel2.value = curE;
  }
}

function aplicarPermissoes() {
  const selectIds = [
    'filtro-analista',
    'filtro-analista-disputas',
    'filtro-analista-empenhos',
    'filtro-analista-acomp',
    'dash-filtro-analista',
  ];
  const badgeEl = g('user-role-badge');

  if (!isAdmin) {
    // — Usuário comum: oculta / bloqueia todos os filtros de analista —
    selectIds.forEach(id => {
      const el = g(id);
      if (!el) return;
      // Força o valor e desabilita para que o usuário não possa mudar
      el.value    = analistaDoUsuario;
      el.disabled = true;
      el.title    = 'Você só pode visualizar seus próprios dados';
      el.style.opacity = '0.6';
      el.style.cursor  = 'not-allowed';
      // Esconde também o filter-group pai para ficar mais limpo
      const fg = el.closest('.filter-group');
      if (fg) fg.style.display = 'none';
    });
    // Oculta campo analista no form de empenho (não-admin sempre usa o próprio nome)
    const fgEAn = g('fg-e-analista');
    if (fgEAn) fgEAn.style.display = 'none';
    // Oculta filtros de analista nas telas de finalizados (não faz sentido para analista comum)
    const fgEmpFin = g('fg-analista-emp-fin');
    const fgFin    = g('fg-analista-finalizadas');
    if (fgEmpFin) fgEmpFin.style.display = 'none';
    if (fgFin)    fgFin.style.display    = 'none';
    // Garante variáveis globais também bloqueadas
    filtroAnalista         = analistaDoUsuario;
    filtroAnalistaDisputas = analistaDoUsuario;
    filtroAnalistaEmpenhos = analistaDoUsuario;
    // Badge no header
    if (badgeEl) {
      badgeEl.textContent = '🔒 ' + analistaDoUsuario;
      badgeEl.title = 'Você está visualizando apenas seus próprios registros';
      badgeEl.style.background = 'var(--info-soft)';
      badgeEl.style.color      = 'var(--accent)';
      badgeEl.style.border     = '1px solid var(--accent)';
    }
  } else {
    // — Administrador: garante que tudo está habilitado —
    selectIds.forEach(id => {
      const el = g(id);
      if (!el) return;
      el.disabled      = false;
      el.title         = '';
      el.style.opacity = '';
      el.style.cursor  = '';
      const fg = el.closest('.filter-group');
      if (fg) fg.style.display = '';
    });
    // Restaura campo analista no form de empenho para admin
    const fgEAnA = g('fg-e-analista');
    if (fgEAnA) fgEAnA.style.display = '';
    // Restaura filtros de analista em finalizadas para admin
    const fgEmpFinA = g('fg-analista-emp-fin');
    const fgFinA    = g('fg-analista-finalizadas');
    if (fgEmpFinA) fgEmpFinA.style.display = '';
    if (fgFinA)    fgFinA.style.display    = '';
    if (badgeEl) {
      badgeEl.textContent = '👑 Admin';
      badgeEl.title       = 'Administrador — acesso total a todos os dados';
      badgeEl.style.background = 'var(--purple-soft)';
      badgeEl.style.color      = 'var(--purple)';
      badgeEl.style.border     = '1px solid var(--purple)';
    }
  }
}

// Quando o estado de autenticação muda (login/logout)
fbAuth.onAuthStateChanged(user => {
  if (user) {
    // Usuário logou — esconde tela de login, carrega dados
    document.getElementById('login-screen').classList.remove('open');
    const email = user.email;
    const nome = email.split('@')[0];
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);
    document.getElementById('user-nome').textContent = nomeFormatado;
    document.getElementById('user-avatar').textContent = nomeFormatado.charAt(0).toUpperCase();
    const sidebarNomeEl = document.getElementById('sidebar-user-nome');
    const sidebarAvatarEl = document.getElementById('sidebar-user-avatar');
    if (sidebarNomeEl) sidebarNomeEl.textContent = nomeFormatado;
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = nomeFormatado.charAt(0).toUpperCase();
    usuarioLogado = nomeFormatado;
    // Permissões: verifica se é admin ou usuário comum
    isAdmin = ADMIN_EMAILS.has(user.email);
    // Usa o nome do mapeamento (com acentos corretos).
    // Fallback: se o e-mail não está no mapa e não é admin, avisa o usuário.
    if (isAdmin) {
      analistaDoUsuario = EMAIL_TO_ANALISTA[user.email] || nomeFormatado;
    } else if (EMAIL_TO_ANALISTA[user.email]) {
      analistaDoUsuario = EMAIL_TO_ANALISTA[user.email];
    } else {
      // E-mail não mapeado e não é admin: exibe aviso claro
      analistaDoUsuario = nomeFormatado;
      console.warn(`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> E-mail "${user.email}" não encontrado em EMAIL_TO_ANALISTA. ` +
        `Adicione uma entrada como: '${user.email}': 'Nome Com Acento'`);
      setTimeout(() => toast(
        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Seu e-mail não está configurado no sistema. Contate o administrador.`, 'error'
      ), 1500);
    }
    // Admins veem tudo; usuários comuns só veem seus próprios registros
    filtroAnalista = isAdmin ? 'todos' : analistaDoUsuario;
    // Carrega dados do Firestore em tempo real
    fbDB.collection('dados').doc('principal').onSnapshot(doc => {
      // Ignora snapshots disparados pela própria gravação local
      if (_ignorarProximoSnapshot) {
        _ignorarProximoSnapshot = false;
        return;
      }
      if (doc.exists) {
        const data = doc.data();
        // Popula _fullDB com todos os dados. Os getters de DB filtram automaticamente.
        _fullDB.disputas    = data.disputas    || [];
        _fullDB.empenhos    = data.empenhos    || [];
        _fullDB.acomp       = data.acomp       || [];
        _fullDB.comentarios = data.comentarios || [];
        _fullDB.tarefas     = data.tarefas     || [];
      } else {
        _fullDB.disputas = []; _fullDB.empenhos = []; _fullDB.acomp = [];
        _fullDB.comentarios = []; _fullDB.tarefas = [];
      }
      _bumpDbVersion();
      atualizarFiltrosAnalista();
      aplicarPermissoes();
      // Inicia notificações na primeira carga
      if (!_notifTimer) {
        // Primeira carga: render completo + abre painel
        reconciliarFinalizacoes();
        renderAll();
        iniciarNotificacoes();
        setTimeout(mostrarResumoDiario, 1200);
        // Vai para painel na primeira carga
        const btnPainel = document.getElementById('tab-btn-painel');
        if (btnPainel) {
          _activeTab = 'painel';
          document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
          document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
          btnPainel.classList.add('active');
          const pane = document.getElementById('tab-painel');
          if (pane) pane.classList.add('active');
          atualizarPainel();
        }
      } else {
        // Snapshots subsequentes: só renderiza a aba ativa atual
        reconciliarFinalizacoes();
        renderActive();
      }
    }, err => {
      console.error('Erro ao ouvir Firestore:', err);
      toast('Erro ao carregar dados do servidor.', 'error');
    });
  } else {
    // Usuário saiu — mostra tela de login
    usuarioLogado = null;
    isAdmin = false;
    analistaDoUsuario = null;
    filtroAnalista = 'todos';
    _fullDB.disputas = []; _fullDB.empenhos = []; _fullDB.acomp = [];
    _fullDB.comentarios = []; _fullDB.tarefas = [];
    if (_notifTimer) { clearInterval(_notifTimer); _notifTimer = null; }
    _notifShown = new Set();
    document.getElementById('login-screen').classList.add('open');
    const emailEl = document.getElementById('login-email');
    const senhaEl = document.getElementById('login-senha');
    if(emailEl) emailEl.value = '';
    if(senhaEl) senhaEl.value = '';
    const sidebarNomeEl = document.getElementById('sidebar-user-nome');
    const sidebarAvatarEl = document.getElementById('sidebar-user-avatar');
    if (sidebarNomeEl) sidebarNomeEl.textContent = '—';
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = '?';
    const btn = document.getElementById('login-btn');
    if(btn) { btn.textContent = 'Entrar →'; btn.disabled = false; }
  }
});

// Atribui uma classe de badge consistente por nome de analista
const _badgeColors = {};
const _badgePalette = ['bp','bb','bg','bv','bo'];
function _badgeClass(nome) {
  if (!nome) return 'bb';
  if (!_badgeColors[nome]) {
    const usados = Object.keys(_badgeColors).length;
    _badgeColors[nome] = _badgePalette[usados % _badgePalette.length];
  }
  return _badgeColors[nome];
}

// ===== HELPER: garante que a opção do analista existe no select e a seleciona =====
function setAnalistaSelect(selectId, nome) {
  const sel = document.getElementById(selectId);
  if (!sel || !nome) return;
  // Se for input (hidden ou text), apenas seta o valor diretamente
  if (sel.tagName !== 'SELECT') { sel.value = nome; return; }
  // Se for select, garante que a opção existe antes de selecionar
  const jaExiste = [...sel.options].some(o => o.value === nome || o.text === nome);
  if (!jaExiste) {
    const opt = document.createElement('option');
    opt.value = nome;
    opt.textContent = nome;
    sel.appendChild(opt);
  }
  sel.value = nome;
}

