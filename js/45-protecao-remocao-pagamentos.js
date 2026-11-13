/* LicitationBiznis - confirmacao para remocao de pagamentos ja gravados.
 * Carregar depois do modulo 44.
 */
(function(){
'use strict';
if(window.__lbProtecaoPagamentos)return;
window.__lbProtecaoPagamentos=true;
const bypass=new WeakSet();
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getEmp(id){return (window.DB&&DB.empenhos||[]).find(e=>String(e.id)===String(id));}
function paid(c){return !!(c&&(c.dpag||(c.recebido!=null&&c.recebido!==''&&Number(c.recebido)!==0)));}
function modal(opts){
 const id='lb-confirm-payment-removal';let d=document.getElementById(id);
 if(!d){
  const st=document.createElement('style');st.textContent=`#${id}{box-sizing:border-box;width:calc(100% - 28px);max-width:500px;padding:0;border:1px solid #e1c7c7;border-radius:14px;background:var(--bg-surface,#fff);color:var(--text-primary,#17231e);font-family:var(--font-sans,Arial,sans-serif);box-shadow:0 24px 70px #0005}#${id}::backdrop{background:#0c1410a6}#${id} .lbpr-body{padding:22px}#${id} h2{margin:0 0 9px;font-size:18px}#${id} p{margin:0;line-height:1.55;font-size:14px}#${id} .lbpr-detail{margin-top:13px;padding:11px;border:1px solid #efcece;border-radius:8px;background:#fff7f7;color:#713232;font-size:12.5px}#${id} .lbpr-actions{display:flex;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid var(--surface-border,#d9e0dc);background:var(--bg-surface-soft,#f7f9f8)}#${id} button{min-height:40px;padding:8px 14px;border-radius:8px;font:inherit;font-weight:650;cursor:pointer}#${id} .lbpr-cancel{border:1px solid #c8d2cc;background:var(--bg-surface,#fff);color:inherit}#${id} .lbpr-ok{border:1px solid #a91f1f;background:#b32929;color:#fff}#${id} button:focus-visible{outline:3px solid #2d6a4f;outline-offset:2px}@media(max-width:480px){#${id} .lbpr-actions{flex-direction:column-reverse}#${id} button{width:100%}}`;
  document.head.appendChild(st);d=document.createElement('dialog');d.id=id;d.innerHTML='<div class="lbpr-body"><h2></h2><p></p><div class="lbpr-detail"></div></div><div class="lbpr-actions"><button type="button" class="lbpr-cancel">Cancelar</button><button type="button" class="lbpr-ok">Remover pagamento</button></div>';document.body.appendChild(d);
 }
 const title=d.querySelector('h2'),msg=d.querySelector('p'),detail=d.querySelector('.lbpr-detail'),cancel=d.querySelector('.lbpr-cancel'),ok=d.querySelector('.lbpr-ok'),opener=document.activeElement;
 title.textContent=opts.title||'Remover pagamento registrado?';msg.textContent=opts.message||'A data do pagamento e o valor recebido serão apagados.';detail.innerHTML=opts.details||'';ok.textContent=opts.label||'Remover pagamento';
 return new Promise(resolve=>{let done=false;function end(v){if(done)return;done=true;d.close();cancel.removeEventListener('click',no);ok.removeEventListener('click',yes);d.removeEventListener('cancel',can);if(opener&&opener.isConnected)opener.focus();resolve(v);}function no(){end(false)}function yes(){end(true)}function can(e){e.preventDefault();end(false)}cancel.addEventListener('click',no);ok.addEventListener('click',yes);d.addEventListener('cancel',can);d.showModal();requestAnimationFrame(()=>cancel.focus());});
}
function individualContext(box){
 const detail=box&&box.closest('tr.lb-pi-row'),main=detail&&detail.previousElementSibling,chk=main&&main.querySelector('input[data-cid]');
 const popup=document.getElementById('popup-empenho'),empId=popup&&popup.querySelector('[data-lb-pagamento-lote]')?.__empId;
 const emp=getEmp(empId),compra=emp&&chk&&(emp.compras||[]).find(c=>String(c.id)===String(chk.dataset.cid));
 return {emp,compra,date:box&&box.querySelector('input[type=date]'),amount:box&&box.querySelector('input[type=number]')};
}
// Protege o botao Limpar do pagamento individual.
document.addEventListener('click',function(e){
 const b=e.target.closest('#popup-empenho .lb-pi-box button');if(!b||b.textContent.trim()!=='Limpar'||bypass.has(b))return;
 const c=individualContext(b.closest('.lb-pi-box'));if(!paid(c.compra))return;
 e.preventDefault();e.stopImmediatePropagation();
 modal({details:'<strong>Empenho:</strong> '+esc(c.emp&&c.emp.num||'')+'<br><strong>Data atual:</strong> '+esc(c.compra.dpag||'')+'<br><strong>Valor recebido:</strong> '+esc(c.compra.recebido||0)}).then(ok=>{if(ok){c.date.value='';c.amount.value='';c.date.dispatchEvent(new Event('input',{bubbles:true}));}});
},true);
// Protege o botao Nao paga do pagamento integral.
document.addEventListener('click',function(e){
 const b=e.target.closest('#lb-pagamento-lote .pl-clear');if(!b||bypass.has(b))return;
 const row=b.closest('.pl-row'),idx=Array.from(row.parentElement.children).indexOf(row),dialog=document.getElementById('lb-pagamento-lote');
 const subtitle=dialog&&dialog.querySelector('#pl-subtitle')?.textContent||'',num=(subtitle.match(/Empenho\s+([^·]+)/)||[])[1]?.trim();
 const emp=(window.DB&&DB.empenhos||[]).find(x=>String(x.num)===String(num)),compra=emp&&(emp.compras||[])[idx];if(!paid(compra))return;
 e.preventDefault();e.stopImmediatePropagation();modal({title:'Marcar esta compra como não paga?',details:'<strong>Empenho:</strong> '+esc(num||'')+'<br><strong>Data atual:</strong> '+esc(compra.dpag||'')+'<br><strong>Valor recebido:</strong> '+esc(compra.recebido||0)}).then(ok=>{if(ok){const inputs=row.querySelectorAll('input');inputs.forEach(i=>i.value='');inputs[0]?.dispatchEvent(new Event('input',{bubbles:true}));}});
},true);
// Protege o Salvamento individual quando os campos de um pagamento existente foram apagados manualmente.
document.addEventListener('click',function(e){
 const b=e.target.closest('#popup-empenho .lb-pi-box .btn-primary');if(!b||bypass.has(b))return;const c=individualContext(b.closest('.lb-pi-box'));if(!paid(c.compra)||c.date.value||c.amount.value!=='')return;
 e.preventDefault();e.stopImmediatePropagation();modal({details:'<strong>Empenho:</strong> '+esc(c.emp&&c.emp.num||'')+'<br><strong>Data atual:</strong> '+esc(c.compra.dpag||'')+'<br><strong>Valor recebido:</strong> '+esc(c.compra.recebido||0)}).then(ok=>{if(ok){bypass.add(b);b.click();queueMicrotask(()=>bypass.delete(b));}});
},true);
})();
