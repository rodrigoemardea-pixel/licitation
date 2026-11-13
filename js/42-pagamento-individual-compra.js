/* Carregar por ultimo, depois do modulo 41. Pagamento individual sem autosave. */
(function(){
'use strict';
if(window.__lbPagamentoIndividual)return;
window.__lbPagamentoIndividual=true;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const findEmp=id=>DB.empenhos.find(e=>e.id===id);
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
function btn(text,fn,cls){const b=el('button',cls||'btn btn-ghost btn-sm',text);b.type='button';b.addEventListener('click',e=>{e.stopPropagation();fn();});return b;}
function validDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return Number.isFinite(d.getTime())&&d.getFullYear()===+s.slice(0,4)&&d.getMonth()+1===+s.slice(5,7)&&d.getDate()===+s.slice(8,10);}
function editor(empId,compraId,tr,toggle){
 const emp=findEmp(empId),c=emp&&(emp.compras||[]).find(x=>String(x.id)===compraId);if(!c)return;
 const snapshot=JSON.stringify(c);
 const detail=el('tr','lb-pi-row'),td=el('td');td.colSpan=tr.cells.length;detail.appendChild(td);
 const box=el('div','lb-pi-box');td.appendChild(box);
 const date=el('input'),amount=el('input');date.type='date';amount.type='number';amount.min='0';amount.step='0.01';
 const uid='lb-pi-'+(++editor.seq);date.id=uid+'-date';amount.id=uid+'-amount';
 const existing=!!c.dpag||(c.recebido!=null&&c.recebido!==''&&Number(c.recebido)!==0);
 const rec=Number(c.recManual!=null?c.recManual:c.rec);
 date.value=existing?(c.dpag||''):today();
 amount.value=existing?(c.recebido==null?'':String(c.recebido)):(Number.isFinite(rec)&&rec>=0?rec.toFixed(2):'');
 function field(input,label){const wrap=el('div','lb-pi-field'),l=el('label','',label);l.htmlFor=input.id;wrap.append(l,input);return wrap;}
 const error=el('div','lb-pi-error');error.setAttribute('role','alert');
 const note=el('div','lb-pi-note','Os dados desta compra so serao alterados ao clicar em Salvar.');
 function close(){detail.remove();toggle.setAttribute('aria-expanded','false');toggle.focus();}
 function fail(s){error.textContent=s;}
 const saveButton=btn('Salvar',()=>{
  error.textContent='';
  if(!fbAuth.currentUser){fail('Sua sessao terminou. Entre novamente antes de salvar.');return;}
  const current=findEmp(empId),buy=current&&(current.compras||[]).find(x=>String(x.id)===compraId);
  if(!buy||JSON.stringify(buy)!==snapshot){fail('Esta compra foi alterada. Cancele e abra o pagamento novamente.');return;}
  const d=date.value,v=amount.value;
  if(date.validity.badInput||amount.validity.badInput){fail('Revise a data e o valor informados.');return;}
  let n=0;
  if(d||v!==''){
   if(!d||v===''){fail('Preencha data e valor, ou deixe ambos vazios para remover o pagamento.');return;}
   n=Number(v);
   if(!validDate(d)||!Number.isFinite(n)||n<0||!amount.validity.valid){fail('Informe uma data valida e um valor nao negativo, com ate duas casas decimais.');return;}
  }
  saveButton.disabled=true;
  buy.dpag=d;buy.recebido=Math.round(n*100)/100;
  if(empenhoEstaPago(current)){if(!current.finalizado){current.finalizado=true;current.dataFinalizacao=current.dataFinalizacao||today();}}
  else{current.finalizado=false;current.dataFinalizacao=null;}
  if(current.disputaId)verificarAutoFinalizarDisputa(current.disputaId);
  close();save('empenhos',DB.empenhos);renderActive();
  toast('Pagamento atualizado. Sincronizacao solicitada.','info');
  window.abrirPopupEmpenho(empId);
 },'btn btn-primary btn-sm');
 box.append(field(date,'Data do pagamento'),field(amount,'Valor recebido (R$)'),saveButton,btn('Cancelar',close),btn('Limpar',()=>{date.value='';amount.value='';error.textContent='';}),note,error);
 detail.addEventListener('click',e=>e.stopPropagation());
 detail.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();}});
 tr.after(detail);toggle.setAttribute('aria-expanded','true');date.focus();
}
editor.seq=0;
function decorate(id){
 const popup=document.getElementById('popup-empenho');if(!popup)return;
 popup.querySelectorAll('tbody input[data-cid]').forEach(chk=>{
  const tr=chk.closest('tr');if(!tr||tr.querySelector('[data-lb-pi]'))return;
  const cell=tr.cells[tr.cells.length-1],wrap=cell.querySelector('.em2-act')||cell;
  const b=btn('Pagamento',()=>{
   if(tr.nextElementSibling&&tr.nextElementSibling.classList.contains('lb-pi-row')){tr.nextElementSibling.remove();b.setAttribute('aria-expanded','false');return;}
   editor(id,chk.getAttribute('data-cid'),tr,b);
  });
  b.dataset.lbPi='1';b.setAttribute('aria-expanded','false');b.title='Informar pagamento desta compra';wrap.appendChild(b);
 });
}
function init(){
 const original=window.abrirPopupEmpenho;if(typeof original!=='function'){console.warn('[pagamento-individual] Carregue depois dos demais scripts.');return;}
 const style=el('style');style.textContent=`
#popup-empenho .lb-pi-box{display:flex;flex-wrap:wrap;align-items:end;gap:10px;padding:14px;background:var(--bg-surface,#f4f8f5);color:var(--text-primary,#182d21);border:1px solid var(--surface-border,#c9dacf);border-radius:8px;white-space:normal}
#popup-empenho .lb-pi-field{flex:1 1 160px;max-width:260px;min-width:0}
#popup-empenho .lb-pi-field label{display:block;font-size:12px;margin-bottom:5px;font-weight:600}
#popup-empenho .lb-pi-field input{box-sizing:border-box;width:100%;min-width:0;min-height:38px;padding:8px;border:1px solid #9fb6a8;border-radius:6px;background:var(--bg-surface,#fff);color:inherit;font:inherit}
#popup-empenho .lb-pi-note,#popup-empenho .lb-pi-error{flex:1 1 100%;font-size:12px}
#popup-empenho .lb-pi-error{color:#b32929}
#popup-empenho .lb-pi-box :focus-visible{outline:2px solid #2d6a4f;outline-offset:2px}
@media(prefers-color-scheme:dark){#popup-empenho .lb-pi-box{background:var(--bg-surface,#202a24);color:var(--text-primary,#eef5ef)}#popup-empenho .lb-pi-field input{background:var(--bg-surface,#202a24)}#popup-empenho .lb-pi-error{color:#ffaaaa}}
`;
 document.head.appendChild(style);
 window.abrirPopupEmpenho=function(id){const result=original.apply(this,arguments);decorate(id);return result;};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
