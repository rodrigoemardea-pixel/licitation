// ========== DESTAQUE VISUAL DAS COMPRAS NO DETALHE DO EMPENHO ==========
// Aplica fundo levemente esverdeado nas linhas de compras já recebidas
// e levemente avermelhado nas que ainda não foram recebidas.
// Módulo autônomo: não altera código existente, só faz wrap de
// abrirPopupEmpenho (mesmo padrão do 17-security-productivity-checklists.js).
(function(){
  'use strict';

  const CLS_RECEBIDA = 'lb-compra-recebida';
  const CLS_PENDENTE = 'lb-compra-pendente';

  // ---------- Acesso ao banco ----------
  function _tryGet(fn){ try { return fn(); } catch(e){ return undefined; } }
  function _bancoEmpenhos(){
    let arr;
    arr = _tryGet(() => DB.empenhos);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => _fullDB.empenhos); if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window.DB && window.DB.empenhos);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window._fullDB && window._fullDB.empenhos); if (Array.isArray(arr) && arr.length) return arr;
    return [];
  }

  // ---------- Estilos ----------
  function injetarEstilos(){
    if (document.getElementById('lb-highlight-compras-style')) return;
    const st = document.createElement('style');
    st.id = 'lb-highlight-compras-style';
    st.textContent = `
      .${CLS_RECEBIDA}{
        background-color: rgba(34,197,94,0.12) !important;
        transition: background-color .2s;
      }
      .${CLS_RECEBIDA}:hover{
        background-color: rgba(34,197,94,0.20) !important;
      }
      .${CLS_PENDENTE}{
        background-color: rgba(239,68,68,0.10) !important;
        transition: background-color .2s;
      }
      .${CLS_PENDENTE}:hover{
        background-color: rgba(239,68,68,0.18) !important;
      }
      /* Garante que células de tabela herdem a cor */
      tr.${CLS_RECEBIDA} > td,
      tr.${CLS_RECEBIDA} > th { background-color: transparent !important; }
      tr.${CLS_PENDENTE} > td,
      tr.${CLS_PENDENTE} > th { background-color: transparent !important; }
    `;
    document.head.appendChild(st);
  }

  // ---------- Detecção da linha de cada compra ----------
  // Estratégia: para cada compra do empenho, procura no popup elementos
  // que contenham identificadores únicos daquela compra (id, plataforma,
  // valor, data). Sobe até o container mais próximo que se pareça com
  // uma linha (tr, card, div com data-compra-id etc.) e aplica a classe.
  function _acharContainerLinha(el, root){
    let cur = el;
    let hops = 0;
    while (cur && cur !== root && hops < 8){
      const tag = cur.tagName;
      // Preferência: <tr>, elementos com data-compra-id, ou class contendo 'compra' ou 'card'
      if (tag === 'TR') return cur;
      if (cur.hasAttribute && cur.hasAttribute('data-compra-id')) return cur;
      const cls = (cur.className || '') + '';
      if (/compra-row|compra-item|compra-card|compra-linha/i.test(cls)) return cur;
      cur = cur.parentElement;
      hops++;
    }
    // Fallback: retorna o próprio elemento
    return el;
  }

  function _valorUnicoDaCompra(c){
    // Prefere o id
    if (c.id) return { tipo:'id', valor: String(c.id) };
    // Depois, combinação de dcompra + vtotal
    if (c.dcompra && c.vtotal) return { tipo:'ddv', valor: c.dcompra + '|' + Number(c.vtotal).toFixed(2) };
    return null;
  }

  function aplicarDestaques(empenhoId){
    const body = document.getElementById('popup-e-body');
    if (!body) return;

    const empenhos = _bancoEmpenhos();
    const emp = empenhos.find(e => e.id === empenhoId);
    if (!emp || !Array.isArray(emp.compras) || !emp.compras.length) return;

    // Remove classes anteriores (evita duplicação em rerender)
    body.querySelectorAll('.' + CLS_RECEBIDA + ', .' + CLS_PENDENTE).forEach(el => {
      el.classList.remove(CLS_RECEBIDA, CLS_PENDENTE);
    });

    emp.compras.forEach(c => {
      const status = c.statusEntrega || 'sem_status';
      const cls = status === 'recebida' ? CLS_RECEBIDA : CLS_PENDENTE;

      // 1ª tentativa: elementos com data-compra-id
      let alvos = body.querySelectorAll('[data-compra-id="' + c.id + '"]');

      // 2ª tentativa: procurar por handlers onclick que referenciem o id da compra
      // (padrão: onclick="editCompra('empId','compId')" ou similar)
      if (!alvos.length && c.id) {
        const escapedId = c.id.replace(/'/g, "\\'");
        const seletores = [
          `[onclick*="'${escapedId}'"]`,
          `[onclick*="\\"${escapedId}\\""]`,
          `[data-id="${c.id}"]`
        ];
        for (const sel of seletores){
          try {
            const matches = body.querySelectorAll(sel);
            if (matches.length){ alvos = matches; break; }
          } catch(e){}
        }
      }

      // 3ª tentativa: fallback por texto (data da compra + plataforma)
      if (!alvos.length && c.dcompra) {
        const todosTr = body.querySelectorAll('tr, .compra-item, .compra-card, .compra-row');
        const alvosArr = [];
        todosTr.forEach(el => {
          const txt = el.textContent || '';
          if (txt.includes(c.dcompra) && (!c.plataforma || txt.toUpperCase().includes(String(c.plataforma).toUpperCase()))){
            alvosArr.push(el);
          }
        });
        alvos = alvosArr;
      }

      // Aplica classe no container-linha de cada alvo encontrado
      alvos.forEach(el => {
        const linha = _acharContainerLinha(el, body);
        if (linha && linha !== body) linha.classList.add(cls);
      });
    });
  }

  // ---------- Wrap do abrirPopupEmpenho ----------
  function wrapAbrirPopup(){
    const original = window.abrirPopupEmpenho;
    if (typeof original !== 'function') return false;
    if (original._lbHighlightWrapped) return true;

    const wrapped = function(id){
      const r = original.apply(this, arguments);
      // Aplica após o body ser preenchido; usa dois disparos para cobrir
      // renderizações assíncronas de módulos que se pendurem no mesmo evento
      // (checklist, related empenhos etc.)
      setTimeout(() => aplicarDestaques(id), 0);
      setTimeout(() => aplicarDestaques(id), 80);
      setTimeout(() => aplicarDestaques(id), 250);
      return r;
    };
    wrapped._lbHighlightWrapped = true;
    window.abrirPopupEmpenho = wrapped;
    return true;
  }

  function init(){
    injetarEstilos();
    if (!wrapAbrirPopup()){
      // Se abrirPopupEmpenho ainda não estiver definida (ordem de scripts),
      // tenta de novo em breve.
      let tentativas = 0;
      const t = setInterval(() => {
        tentativas++;
        if (wrapAbrirPopup() || tentativas > 20) clearInterval(t);
      }, 200);
    }

    // Observa mudanças em popup-e-body para reaplicar quando outros módulos
    // sobrepuserem o conteúdo (ex.: comentários inline, checklist).
    const observarBody = () => {
      const body = document.getElementById('popup-e-body');
      if (!body) return;
      if (body._lbHighlightObserved) return;
      body._lbHighlightObserved = true;
      let ultimoId = null;
      // Captura o id atual a partir do subtítulo se possível
      const captarId = () => {
        // Tenta descobrir o id do empenho aberto a partir de um botão editar ou similar
        const btnEdit = document.getElementById('popup-e-edit-btn');
        if (btnEdit && btnEdit.onclick){
          const src = btnEdit.onclick.toString();
          const m = src.match(/['"]([^'"]{6,})['"]/);
          if (m) return m[1];
        }
        return ultimoId;
      };
      const obs = new MutationObserver(() => {
        const id = captarId();
        if (id){
          ultimoId = id;
          aplicarDestaques(id);
        }
      });
      obs.observe(body, { childList:true, subtree:true });
    };
    // Observa periodicamente até o popup existir
    let n = 0;
    const it = setInterval(() => {
      observarBody();
      n++;
      if (document.getElementById('popup-e-body') || n > 20) clearInterval(it);
    }, 300);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
