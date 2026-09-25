/* LicitationBiznis: interface operacional. Nao modifica dados nem calculos. */
(function(){
 'use strict';
 function node(tag,cls,text){var e=document.createElement(tag);e.className=cls||'';if(text)e.textContent=text;return e;}
 function toolbar(id){
  var bar=document.querySelector('#'+id+' > .toolbar');if(!bar||bar.dataset.lbOrganized)return;
  var top=node('div','lb-toolbar-top'),acts=node('div','lb-toolbar-actions'),other=node('div','lb-toolbar-other'),filters=node('div','lb-toolbar-filters');
  Array.from(bar.children).forEach(function(item){
   if(item.classList.contains('toolbar-separator')){item.remove();return;}
   if(item.matches('.filter-group,.search-box,.active-filters-badge'))filters.appendChild(item);
   else if(item.matches('.btn-primary')||(id==='tab-acompanhamentos'&&/Abrir Todos/i.test(item.textContent)))acts.appendChild(item);
   else other.appendChild(item);
  });
  top.append(acts,other);bar.append(top,filters);bar.classList.add('lb-toolbar-organized');bar.dataset.lbOrganized='1';
  if(id==='tab-disputas'){
   var groups=Array.from(filters.querySelectorAll(':scope > .filter-group'));if(groups.length>3){
    var extra=node('div','lb-extra-filters'),btn=node('button','btn btn-ghost','Mais filtros');btn.type='button';
    groups.slice(3).forEach(function(g){extra.appendChild(g);});extra.hidden=true;btn.setAttribute('aria-expanded','false');
    function active(){return Array.from(extra.querySelectorAll('select')).some(function(s){return !['todos','todas',''].includes(s.value);});}
    function sync(){if(active())extra.hidden=false;btn.setAttribute('aria-expanded',String(!extra.hidden));btn.textContent=(extra.hidden?'Mais filtros':'Menos filtros')+(active()?' (ativos)':'');}
    btn.addEventListener('click',function(){if(!extra.hidden&&active())return;extra.hidden=!extra.hidden;sync();});extra.addEventListener('change',sync);
    filters.append(btn,extra);setTimeout(sync,0);
   }
  }
 }
 function dateFromText(s){var m=(s||'').match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);if(!m)return null;
  var d=new Date(+m[3],+m[2]-1,+m[1],+(m[4]||23),+(m[5]||59));return d.getFullYear()===+m[3]&&d.getMonth()===+m[2]-1&&d.getDate()===+m[1]?d:null;}
 var overdueOnly=false;
 function paintAcomp(){var tb=document.getElementById('tbody-acomp');if(!tb)return;var count=0;
  Array.from(tb.querySelectorAll(':scope > tr')).forEach(function(tr){if(tr.cells.length<8)return;
   var cell=tr.cells[7],d=dateFromText(cell.textContent),late=!!(d&&d.getTime()<Date.now());
   cell.classList.toggle('lb-overdue-cell',late);if(late&&tr.style.display!=='none')count++;
   tr.hidden=overdueOnly&&!late;
   var type=tr.cells[3];if(type&&!type.dataset.lbSplit&&type.childElementCount===0){
    var m=type.textContent.trim().match(/^(Pregão Eletrônico|Dispensa)(\S.*)$/i);
    if(m){type.textContent=m[1];type.appendChild(node('span','lb-process',m[2]));type.dataset.lbSplit='1';}
   }
  });var hint=document.getElementById('lb-overdue-hint');if(hint)hint.textContent=overdueOnly?count+' vencido(s) na página exibida':'';
 }
 function overdue(){var filters=document.querySelector('#tab-acompanhamentos .lb-toolbar-filters'),tb=document.getElementById('tbody-acomp');if(!filters||!tb)return;
  var btn=node('button','lb-overdue-button','Retornos vencidos'),hint=node('span','lb-overdue-hint');btn.type='button';btn.id='lb-overdue-toggle';hint.id='lb-overdue-hint';btn.setAttribute('aria-pressed','false');
  btn.title='Filtra somente a página exibida';btn.addEventListener('click',function(){overdueOnly=!overdueOnly;btn.setAttribute('aria-pressed',String(overdueOnly));paintAcomp();});
  filters.append(btn,hint);var pending=false;new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;paintAcomp();});}).observe(tb,{childList:true});paintAcomp();
 }
 function details(){['popup-acomp','popup-disputa','popup-empenho'].forEach(function(id){var popup=document.querySelector('#'+id+' > .detail-popup');if(!popup)return;
  var body=popup.querySelector(':scope > [id$="-body"]');if(body)body.classList.add('lb-detail-scroll');});}
 function purchase(){var grid=document.querySelector('#modal-compra #compra-campos > .form-grid');if(!grid)return;
  var labels=[['c-lote-desc','Item e vínculo'],['c-status-entrega','Entrega e identificação'],['c-vunit','Valores da compra'],['c-luc-a','Resultado calculado'],['c-dpag','Pagamento']];
  function add(){labels.forEach(function(pair){var input=document.getElementById(pair[0]),parent=input&&input.closest('.fg');if(!parent||parent.parentElement!==grid||grid.querySelector('[data-lb-section="'+pair[0]+'"]'))return;
   var h=node('div','lb-purchase-heading',pair[1]);h.dataset.lbSection=pair[0];h.setAttribute('role','heading');h.setAttribute('aria-level','3');grid.insertBefore(h,parent);});}
  add();var pending=false;new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;add();});}).observe(grid,{childList:true});
 }
 function init(){toolbar('tab-acompanhamentos');toolbar('tab-disputas');details();purchase();overdue();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
