/* LICITATIONBIZNIS - ETAPA 5: ICONES E ACABAMENTO VISUAL
   Atua somente em textos visiveis da interface. IDs, eventos e valores permanecem intactos.

   O simbolo de copiar (U+2398) e deliberadamente deixado de fora do mapa:
   aquele botao alterna para "check" e volta via textContent, o que apagaria o
   SVG e o deixaria permanentemente como caractere. Mantido como esta. */
(function(){
  'use strict';

  const paths = {
    building:'<path d="M3 20h18M5 20V7l7-4v17M19 20V10l-7-3M8 9h1M8 12h1M8 15h1M15 12h1M15 15h1"/>',
    clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    pin:'<path d="m12 17 4-4V7l2-2H6l2 2v6l4 4Zm0 0v5"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    file:'<path d="M6 2h9l4 4v16H6zM14 2v5h5M9 13h6M9 17h6"/>',
    repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/>',
    monitor:'<rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cart:'<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6M10 21h.01M18 21h.01"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    x:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    filter:'<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chevronLeft:'<path d="M15 6l-6 6 6 6"/>',
    chevronRight:'<path d="M9 6l6 6-6 6"/>',
    menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
    calculator:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    save:'<path d="M5 3h11l3 3v15H5zM8 3v6h7V3M8 14h8v7H8z"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    xCircle:'<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>'
  };

  const map = [
    ['🏢','building'],['📋','clipboard'],['👤','user'],['📌','pin'],['🔗','link'],
    ['📅','calendar'],['📄','file'],['🔁','repeat'],['💻','monitor'],['🗺️','map'],
    ['🗺','map'],['⏱️','clock'],['⏱','clock'],['🛒','cart'],['🔔','bell'],
    ['⬇','download'],['✕','x'],['×','x'],['＋','plus'],['+','plus'],
    ['🗑️','trash'],['🗑','trash'],['✏️','edit'],['✏','edit'],['🔽','filter'],['→','arrow'],
    // Complemento: sem estes, parte da interface ficaria com emoji ao lado
    // dos icones vetoriais. Cobre paginacao, calculadora, busca e confirmacoes.
    ['←','arrowLeft'],['‹','chevronLeft'],['›','chevronRight'],
    ['☰','menu'],['🧮','calculator'],['🔍','search'],
    ['💾','save'],['✅','checkCircle'],['✓','check'],['❌','xCircle']
  ];

  // Nome acessivel para os botoes que ficam SOMENTE com o icone.
  // Sem isto, um botao cujo unico conteudo era "x" passa a nao ter nome
  // algum depois da troca, e o leitor de tela anuncia apenas "botao".
  const rotulos = {
    x:'Fechar', xCircle:'Fechar', plus:'Adicionar', trash:'Excluir',
    edit:'Editar', download:'Baixar', bell:'Notificacoes', menu:'Menu',
    search:'Pesquisar', save:'Salvar', calculator:'Calculadora',
    chevronLeft:'Pagina anterior', chevronRight:'Proxima pagina',
    arrowLeft:'Voltar', arrow:'Avancar', check:'Confirmar',
    checkCircle:'Confirmar', filter:'Filtrar', link:'Abrir link',
    cart:'Compras', clock:'Prazo', calendar:'Data', user:'Analista',
    building:'Orgao', clipboard:'Processo', file:'Documento',
    monitor:'Sistema', map:'UF', pin:'Status', repeat:'Registro de precos'
  };

  function nomear(el,name){
    if(el.getAttribute('aria-label') || el.getAttribute('title')) return;
    if((el.textContent||'').trim()) return;
    if(rotulos[name]) el.setAttribute('aria-label',rotulos[name]);
  }

  function icon(name){
    const span=document.createElement('span');
    span.className='lb-ui-icon';
    span.setAttribute('aria-hidden','true');
    span.innerHTML='<svg viewBox="0 0 24 24" focusable="false">'+paths[name]+'</svg>';
    return span;
  }

  function firstTextNode(el){
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP});
    return walker.nextNode();
  }

  function apply(el){
    if(!el || el.nodeType!==1 || el.dataset.lbIconified==='1') return;
    if(el.closest('script,style,textarea,[contenteditable="true"]')) return;
    const node=firstTextNode(el); if(!node) return;
    const raw=node.nodeValue; const trimmed=raw.trimStart();
    for(const [symbol,name] of map){
      if(trimmed.startsWith(symbol)){
        const leading=raw.slice(0,raw.length-trimmed.length);
        node.nodeValue=leading+trimmed.slice(symbol.length).replace(/^\s+/, '');
        node.parentNode.insertBefore(icon(name),node);
        el.dataset.lbIconified='1';
        nomear(el,name);
        return;
      }
    }
  }

  function scan(root){
    const selector='button,.btn,.filter-group label,.nav-item,.tab-btn,.action-dropdown-btn,.modal-close,.detail-close,[role="button"]';
    if(root.matches && root.matches(selector)) apply(root);
    if(root.querySelectorAll) root.querySelectorAll(selector).forEach(apply);
  }

  function start(){
    scan(document);
    const observer=new MutationObserver(list=>list.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) scan(n)})));
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
