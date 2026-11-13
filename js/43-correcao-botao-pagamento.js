/* Ajuste visual: carregar depois do modulo 42. Nao altera dados. */
(function(){
'use strict';
if(document.getElementById('lb-pagamento-button-fix'))return;
const style=document.createElement('style');
style.id='lb-pagamento-button-fix';
style.textContent=`
#popup-empenho.em2 .em2-buys .em2-act .btn[data-lb-pi]{
 width:auto!important;min-width:100px!important;max-width:none!important;
 flex:0 0 auto!important;height:32px!important;min-height:32px!important;
 padding:0 10px!important;display:inline-flex!important;align-items:center!important;
 justify-content:center!important;font-size:12px!important;line-height:1.2!important;
 white-space:nowrap!important;box-sizing:border-box!important;
}
#popup-empenho.em2 .em2-buys .em2-act{flex-wrap:wrap!important;min-width:100px;white-space:normal!important}
#popup-empenho.em2 .em2-buys tbody tr:not(.lb-pi-row)>td:last-child{min-width:120px!important;white-space:normal!important}
`;
document.head.appendChild(style);
})();
