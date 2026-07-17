/* LICITATIONBIZNIS v4.1: filtros, visualizacoes, colunas, cards e checklist */
(function(){
 'use strict';
 const KVIEW='lb-saved-views-v1', KCOL='lb-columns-v1';
 const checklistModel={
  disputas:['Proposta registrada','Contrato assinado','Empenho recebido','Compra realizada','Entrega comprovada','Pagamento recebido'],
  empenhos:['Itens conferidos','Compra cadastrada','Nota fiscal emitida','Produto entregue','Atesto recebido','Pagamento identificado']
 };
 function abrirAba(nome){const b=document.querySelector(`.tab-btn[data-tab="${nome}"]`)||[...document.querySelectorAll('.tab-btn')].find(x=>(x.getAttribute('onclick')||'').includes(`'${nome}'`));if(b) switchTab(nome,b);}
 window.abrirAba=abrirAba;
 function tagTabs(){document.querySelectorAll('.tab-btn').forEach(b=>{const m=(b.getAttribute('onclick')||'').match(/switchTab\('([^']+)'/);if(m)b.dataset.tab=m[1];});}
 function addAdvancedFilters(){
  [['disputas','Mais filtros'],['empenhos','Mais filtros']].forEach(([tab,label])=>{const tb=document.querySelector(`#tab-${tab} .toolbar`);if(!tb||tb.querySelector('.lb-more-filters'))return;const groups=[...tb.querySelectorAll('.filter-group')];if(groups.length<4)return;const extra=groups.slice(2);const panel=document.createElement('div');panel.className='lb-advanced-panel';panel.hidden=true;extra.forEach(x=>panel.appendChild(x));const btn=document.createElement('button');btn.className='btn btn-ghost btn-sm lb-more-filters';btn.type='button';btn.textContent=label;btn.onclick=()=>{panel.hidden=!panel.hidden;btn.setAttribute('aria-expanded',String(!panel.hidden));};tb.append(btn,panel);});
 }
 function savedViews(){
  document.querySelectorAll('.tab-pane').forEach(p=>{const tb=p.querySelector('.toolbar');if(!tb||tb.querySelector('.lb-view-save'))return;const tab=p.id.replace('tab-','');const save=document.createElement('button');save.className='btn btn-ghost btn-sm lb-view-save';save.textContent='Salvar visão';save.onclick=()=>{const nome=prompt('Nome da visualização:');if(!nome)return;const controls={};tb.querySelectorAll('select,input[type="text"]').forEach(c=>{if(c.id)controls[c.id]=c.value;});const all=JSON.parse(localStorage.getItem(KVIEW)||'{}');(all[tab]||(all[tab]=[])).push({nome,controls});localStorage.setItem(KVIEW,JSON.stringify(all));toast('Visualização salva','success');renderViews(tb,tab);};const sel=document.createElement('select');sel.className='fc lb-view-select';sel.style.width='auto';sel.innerHTML='<option value="">Visualizações</option>';sel.onchange=()=>{const all=JSON.parse(localStorage.getItem(KVIEW)||'{}');const v=(all[tab]||[])[+sel.value];if(!v)return;Object.entries(v.controls).forEach(([id,val])=>{const c=document.getElementById(id);if(c){c.value=val;c.dispatchEvent(new Event(c.tagName==='INPUT'?'input':'change',{bubbles:true}));}});};tb.append(sel,save);renderViews(tb,tab);});
 }
 function renderViews(tb,tab){const sel=tb.querySelector('.lb-view-select');if(!sel)return;const vs=(JSON.parse(localStorage.getItem(KVIEW)||'{}')[tab]||[]);sel.innerHTML='<option value="">Visualizações</option>'+vs.map((v,i)=>`<option value="${i}">${escapeHTML(v.nome)}</option>`).join('');}
 function columnChooser(){document.querySelectorAll('.tab-pane table').forEach((table,ti)=>{const pane=table.closest('.tab-pane'),tb=pane?.querySelector('.toolbar');if(!tb||tb.querySelector(`[data-col-table="${ti}"]`))return;const headers=[...table.querySelectorAll('thead th')];if(headers.length<3)return;const btn=document.createElement('button');btn.className='btn btn-ghost btn-sm';btn.dataset.colTable=ti;btn.textContent='Colunas';btn.onclick=()=>{let box=document.getElementById('lb-column-popover');if(box)box.remove();box=document.createElement('div');box.id='lb-column-popover';box.className='lb-column-popover';headers.forEach((h,i)=>{const lab=document.createElement('label');lab.innerHTML=`<input type="checkbox" ${h.hidden?'':'checked'}> ${escapeHTML(h.textContent.trim()||'Ações')}`;lab.querySelector('input').onchange=e=>{h.hidden=!e.target.checked;table.querySelectorAll(`tr > *:nth-child(${i+1})`).forEach(c=>c.hidden=!e.target.checked);};box.append(lab);});document.body.append(box);const r=btn.getBoundingClientRect();box.style.left=Math.max(8,r.right-box.offsetWidth)+'px';box.style.top=(r.bottom+6)+'px';};tb.append(btn);});}
 function checklistHTML(tipo,id,model){const done=new Set(model.checklist||[]);return `<section class="lb-checklist"><h3>Checklist de execução</h3>${checklistModel[tipo].map((x,i)=>`<label><input type="checkbox" data-check="${i}" ${done.has(i)?'checked':''}> ${escapeHTML(x)}</label>`).join('')}<div class="lb-check-progress"><span style="width:${Math.round(done.size/checklistModel[tipo].length*100)}%"></span></div></section>`;}
 function bindChecklist(tipo,id,root){root.querySelectorAll('.lb-checklist input').forEach(c=>c.onchange=()=>{const r=_fullDB[tipo].find(x=>x.id===id);if(!r)return;r.checklist=[...root.querySelectorAll('.lb-checklist input:checked')].map(x=>+x.dataset.check);save(tipo,_fullDB[tipo]);registrarAuditoria(tipo,id,'checklist',null,r.checklist);const bar=root.querySelector('.lb-check-progress span');bar.style.width=Math.round(r.checklist.length/checklistModel[tipo].length*100)+'%';});}
 function wrapPopups(){if(window.abrirPopupDisputa){const od=window.abrirPopupDisputa;window.abrirPopupDisputa=function(id){od(id);const body=document.getElementById('popup-d-body'),r=_fullDB.disputas.find(x=>x.id===id);if(body&&r&&!body.querySelector('.lb-checklist')){body.insertAdjacentHTML('afterbegin',checklistHTML('disputas',id,r));bindChecklist('disputas',id,body);}};}if(window.abrirPopupEmpenho){const oe=window.abrirPopupEmpenho;window.abrirPopupEmpenho=function(id){oe(id);const body=document.getElementById('popup-e-body'),r=_fullDB.empenhos.find(x=>x.id===id);if(body&&r&&!body.querySelector('.lb-checklist')){body.insertAdjacentHTML('afterbegin',checklistHTML('empenhos',id,r));bindChecklist('empenhos',id,body);}};}}
 function clickableCards(){document.addEventListener('click',e=>{const c=e.target.closest('.summary-row .card');if(!c)return;const pane=c.closest('.tab-pane');if(pane?.id==='tab-empenhos'&&/A Receber|Lucro Empenhado/i.test(c.textContent)){const s=document.getElementById('filtro-compras-empenhos');if(s){s.value='com-compras';filtrarEmpenhos();}}});}
 function init(){tagTabs();addAdvancedFilters();savedViews();columnChooser();wrapPopups();clickableCards();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


/* LB_SAFE_UI_ENHANCEMENTS_20260717 */
(function(){
 'use strict';
 var LIMIT=10, pages={acompanhamentos:1,finalizadas:1,'emp-finalizados':1};
 function styles(){
  if(document.getElementById('lb-safe-ui-style'))return;
  var el=document.createElement('style');el.id='lb-safe-ui-style';
  el.textContent=`
   #tab-acompanhamentos tbody td,#tab-disputas tbody td,#tab-finalizadas tbody td,#tab-emp-finalizados tbody td{padding-top:5px!important;padding-bottom:5px!important;line-height:1.15!important}
   #tab-acompanhamentos tbody td>div:first-child,#tab-disputas tbody td>div:first-child,#tab-finalizadas tbody td>div:first-child{display:inline!important}
   #tab-acompanhamentos .estado-badge,#tab-disputas .estado-badge,#tab-finalizadas .estado-badge{display:inline-flex!important;margin-left:6px!important;vertical-align:middle!important}
   .lb-related-empenhos{margin:0 0 12px;padding:10px 12px;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-surface-soft)}
   .lb-related-title{font-size:10px;font-weight:700;color:var(--text-tertiary);margin-bottom:7px}.lb-related-list{display:flex;flex-wrap:wrap;gap:6px}
  `;document.head.appendChild(el);
 }
 function pager(tab,tbodyId){
  var tb=document.getElementById(tbodyId);if(!tb)return;
  var rows=[].slice.call(tb.querySelectorAll(':scope > tr'));
  var id='pagination-'+tab, box=document.getElementById(id);
  if(!box){box=document.createElement('div');box.id=id;box.className='pagination';var pane=tb.closest('.tab-pane');if(pane)pane.appendChild(box);}
  if(!rows.length||(rows.length===1&&rows[0].querySelector('.empty-state'))){box.style.display='none';return;}
  var total=Math.ceil(rows.length/LIMIT)||1;if(pages[tab]>total)pages[tab]=1;
  var cur=pages[tab],start=(cur-1)*LIMIT;
  rows.forEach(function(row,i){row.style.display=i>=start&&i<start+LIMIT?'':'none';});
  if(total<=1){box.style.display='none';return;}
  box.style.display='flex';var html='<button class="page-btn" data-p="'+(cur-1)+'" '+(cur===1?'disabled':'')+'>‹</button>';
  for(var n=1;n<=total;n++)html+='<button class="page-btn '+(n===cur?'active':'')+'" data-p="'+n+'">'+n+'</button>';
  html+='<button class="page-btn" data-p="'+(cur+1)+'" '+(cur===total?'disabled':'')+'>›</button><span class="page-info">'+(start+1)+'-'+Math.min(start+LIMIT,rows.length)+' de '+rows.length+'</span>';
  box.innerHTML=html;box.querySelectorAll('[data-p]').forEach(function(btn){btn.onclick=function(){pages[tab]=Math.max(1,Math.min(total,+btn.dataset.p||1));pager(tab,tbodyId);};});
 }
 function wrapRender(name,tab,tbody){var original=window[name];if(typeof original!=='function')return;window[name]=function(){var result=original.apply(this,arguments);pager(tab,tbody);return result;};}
 function addRelated(id){
  var body=document.getElementById('popup-e-body');if(!body||body.querySelector('.lb-related-empenhos'))return;
  var current=DB.empenhos.find(function(e){return e.id===id;});if(!current||!current.disputaId)return;
  var related=DB.empenhos.filter(function(e){return e.disputaId===current.disputaId&&e.id!==id;});if(!related.length)return;
  var section=document.createElement('section');section.className='lb-related-empenhos';
  var title=document.createElement('div');title.className='lb-related-title';title.textContent='OUTROS EMPENHOS DESTE CONTRATO';section.appendChild(title);
  var list=document.createElement('div');list.className='lb-related-list';
  related.forEach(function(e){var b=document.createElement('button');b.type='button';b.className='btn btn-ghost btn-sm';b.textContent='#'+(e.num||'SEM NÚMERO')+(e.finalizado?' · FINALIZADO':'');b.onclick=function(){abrirPopupEmpenho(e.id);};list.appendChild(b);});
  section.appendChild(list);var fields=[].slice.call(body.querySelectorAll('.detail-field')),contract=fields.find(function(x){return /CONTRATO VINCULADO/i.test(x.textContent||'');});
  if(contract&&contract.nextSibling)body.insertBefore(section,contract.nextSibling);else body.insertBefore(section,body.firstChild);
 }
 function wrapPopup(){var original=window.abrirPopupEmpenho;if(typeof original!=='function')return;window.abrirPopupEmpenho=function(id){original.apply(this,arguments);addRelated(id);};}
 function init(){styles();wrapRender('renderAcomp','acompanhamentos','tbody-acomp');wrapRender('renderFinalizadas','finalizadas','tbody-finalizadas');wrapRender('renderEmpFinalizados','emp-finalizados','tbody-emp-finalizados');wrapPopup();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
