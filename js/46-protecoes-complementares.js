/* LicitationBiznis - protecoes complementares.
 * Carregar por ultimo, depois do modulo 45.
 */
(function(){
'use strict';
if(window.__lbProtecoesComplementares)return;
window.__lbProtecoesComplementares=true;
let bypassMl=false,bypassIntegral=false;
function text(v){return String(v==null?'':v);}
function esc(v){return text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function confirmBox(title,message,details,label){
 if(typeof window.confirmar==='function')return new Promise(resolve=>window._confirmarAcao({icon:'!',titulo:title,msg:message+(details?'\n\n'+details:''),btnLabel:label||'Confirmar',btnClass:'btn-danger',onConfirm:()=>resolve(true),onCancel:()=>resolve(false)}));
 return Promise.resolve(window.confirm(message+'\n\n'+details));
}
// Mercado Livre: intercepta antes que ids, plataforma e link sejam limpos.
function protectMl(){
 const original=window.lbMlDesvincular;if(typeof original!=='function'||original.__lbSafe)return;
 function safe(){
  if(bypassMl)return original.apply(this,arguments);
  const order=document.getElementById('c-ml-order')?.value||'',ship=document.getElementById('c-ml-shipment')?.value||'';
  if(!order&&!ship)return original.apply(this,arguments);
  const args=arguments,ctx=this;
  confirmBox('Desvincular compra do Mercado Livre?','Os identificadores da integração, a plataforma e o link da compra serão limpos. A alteração somente será gravada quando a compra for salva.','Pedido: '+(order||'não informado')+(ship?'\nEnvio: '+ship:''),'Desvincular').then(ok=>{if(ok){bypassMl=true;try{original.apply(ctx,args)}finally{bypassMl=false}}});
 }
 safe.__lbSafe=true;safe.__lbOriginal=original;window.lbMlDesvincular=safe;
}
// Pagamento integral: protege limpeza manual de pagamentos existentes no momento de salvar.
document.addEventListener('click',function(e){
 const submit=e.target.closest('#lb-pagamento-lote button.btn-primary');if(!submit||bypassIntegral)return;
 const dlg=document.getElementById('lb-pagamento-lote'),subtitle=dlg?.querySelector('#pl-subtitle')?.textContent||'';
 const num=(subtitle.match(/Empenho\s+([^·]+)/)||[])[1]?.trim();
 const emp=(window.DB&&DB.empenhos||[]).find(x=>text(x.num)===text(num));if(!emp)return;
 const rows=Array.from(dlg.querySelectorAll('.pl-row'));const removed=[];
 rows.forEach((row,i)=>{const c=(emp.compras||[])[i],inputs=row.querySelectorAll('input');const was=!!(c&&(c.dpag||(c.recebido!=null&&c.recebido!==''&&Number(c.recebido)!==0)));if(was&&inputs[0]&&!inputs[0].value&&inputs[1]&&inputs[1].value==='')removed.push(i+1);});
 if(!removed.length)return;
 e.preventDefault();e.stopImmediatePropagation();
 confirmBox('Remover pagamentos registrados?','Os pagamentos das compras indicadas serão apagados ao salvar.','Empenho: '+num+'\nCompras: '+removed.join(', '),'Remover e salvar').then(ok=>{if(ok){bypassIntegral=true;try{submit.click()}finally{bypassIntegral=false}}});
},true);
// Integridade: substitui a exclusão automática por diagnóstico sem mutar ou salvar dados.
function protectIntegrity(){
 const original=window.validarIntegridade;if(typeof original!=='function'||original.__lbSafe)return;
 function diagnostic(sil){
  let problemas=0;const detalhes=[],db=window._fullDB||window.DB||{},dids={},eids={};
  (db.disputas||[]).forEach(d=>dids[d.id]=true);(db.empenhos||[]).forEach(e=>eids[e.id]=true);
  (db.empenhos||[]).forEach(e=>{
   if(e.disputaId&&!dids[e.disputaId]){problemas++;detalhes.push('Empenho '+(e.num||e.id)+': referência de disputa inexistente.');}
   const ids={};(e.itens||[]).forEach(i=>ids[i.id]=true);
   if(Object.keys(ids).length)(e.compras||[]).forEach(c=>{if(c.itemId&&!ids[c.itemId]){problemas++;detalhes.push('Empenho '+(e.num||e.id)+': compra '+(c.id||'sem id')+' sem item correspondente.');}});
  });
  if(!sil){if(typeof toast==='function')toast(problemas?problemas+' problema(s) de integridade encontrado(s). Nenhum dado foi excluído.':'Integridade OK',problemas?'warning':'success');if(problemas)console.warn('[LicitationBiznis] Diagnóstico de integridade, sem correção automática:',detalhes);}
  return{problemas:problemas,corrigidos:0,detalhes:detalhes};
 }
 diagnostic.__lbSafe=true;diagnostic.__lbOriginal=original;window.validarIntegridade=diagnostic;
}
function install(){protectMl();protectIntegrity();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
let n=0,t=setInterval(()=>{install();if(++n>=20)clearInterval(t)},250);
})();
