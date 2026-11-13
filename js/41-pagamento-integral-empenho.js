/* LicitationBiznis - pagamento das compras em lote.
 * Carregar depois dos demais scripts, inclusive 35 e 40.
 * Usa DB, save, empenhoEstaPago e verificarAutoFinalizarDisputa existentes.
 * Nao altera rec, recManual, custos, lucro ou dados de entrega.
 */
(function () {
  'use strict';
  if (window.__lbPagamentoLote) return;
  window.__lbPagamentoLote = true;
  let dialog, form, list, error, summary, currentId, rows = [], opener;
  const money = n => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(n);
  const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
  const empById = id => DB.empenhos.find(e => e.id === id);
  const fingerprint = e => JSON.stringify(e.compras || []);
  let originalFingerprint;
  function node(tag, cls, text) { const e = document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }
  function button(text, fn, cls) { const b=node('button',cls||'btn btn-ghost',text); b.type='button'; b.addEventListener('click',fn); return b; }
  function validDate(s) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d=new Date(s+'T12:00:00');
    return Number.isFinite(d.getTime()) && d.getFullYear()===+s.slice(0,4) && d.getMonth()+1===+s.slice(5,7) && d.getDate()===+s.slice(8,10);
  }
  function fail(message, input) { error.textContent=message; if(input)input.focus(); }
  function updateSummary() {
    let count=0,total=0;
    rows.forEach(r=>{ if(r.date.value && r.amount.value!=='' && r.amount.validity.valid){const n=Number(r.amount.value);if(Number.isFinite(n)&&n>=0){count++;total+=n;}} });
    summary.textContent=count+' compra(s) com pagamento preenchido. Total: '+money(total)+'.';
  }
  function close() { dialog.close(); if(opener && opener.isConnected)opener.focus(); }
  function create() {
    if(dialog)return;
    const style=node('style');
    style.textContent=`
#lb-pagamento-lote{box-sizing:border-box;width:calc(100% - 24px);max-width:980px;max-height:90vh;padding:0;border:1px solid var(--surface-border,#dce5df);border-radius:14px;background:var(--bg-surface,#fff);color:var(--text-primary,#17231e);font-family:var(--font-sans,Arial,sans-serif)}
#lb-pagamento-lote::backdrop{background:rgba(15,25,20,.55)}
#lb-pagamento-lote form{margin:0;display:flex;flex-direction:column;max-height:88vh}
#lb-pagamento-lote .pl-head,#lb-pagamento-lote .pl-foot{padding:16px 20px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;flex-shrink:0}
#lb-pagamento-lote .pl-head{border-bottom:1px solid #dce5df;justify-content:space-between}
#lb-pagamento-lote h2{font-size:18px;margin:0}
#lb-pagamento-lote .pl-body{padding:16px 20px;overflow:auto;background:var(--bg-app,#f6f8f9)}
#lb-pagamento-lote p{font-size:13px;line-height:1.5;margin:0 0 14px}
#lb-pagamento-lote .pl-row{display:grid;grid-template-columns:minmax(160px,2fr) minmax(140px,1fr) minmax(130px,1fr) auto;gap:12px;align-items:end;padding:14px;margin-bottom:10px;border:1px solid #dce5df;border-radius:10px;background:var(--bg-surface,#fff)}
#lb-pagamento-lote .pl-title{font-size:13px;font-weight:600;overflow-wrap:anywhere}
#lb-pagamento-lote .pl-detail{font-size:12px;color:var(--text-secondary,#53635b);margin-top:5px}
#lb-pagamento-lote label{display:block;font-size:12px;font-weight:600;margin-bottom:5px}
#lb-pagamento-lote input{box-sizing:border-box;width:100%;min-width:0;min-height:40px;padding:8px;border:1px solid #b8c9bf;border-radius:7px;background:var(--bg-surface,#fff);color:inherit;font:inherit;font-size:13px}
#lb-pagamento-lote .pl-foot{border-top:1px solid #dce5df;justify-content:flex-end}
#lb-pagamento-lote .pl-summary{margin-right:auto;font-size:12px;flex:1 1 220px}
#lb-pagamento-lote .pl-error{color:#b32929;font-size:13px;margin-top:12px}
#lb-pagamento-lote button{cursor:pointer;min-height:38px}
#lb-pagamento-lote :focus-visible{outline:2px solid #2d6a4f;outline-offset:3px}
@media(max-width:700px){#lb-pagamento-lote .pl-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}#lb-pagamento-lote .pl-ident{grid-column:1/-1}#lb-pagamento-lote .pl-clear{grid-column:1/-1}#lb-pagamento-lote .pl-body{padding:12px}}
@media(prefers-color-scheme:dark){#lb-pagamento-lote{background:var(--bg-surface,#202a24);color:var(--text-primary,#eaf1ec)}#lb-pagamento-lote .pl-body{background:var(--bg-app,#17201b)}#lb-pagamento-lote .pl-row,#lb-pagamento-lote input{background:var(--bg-surface,#202a24)}#lb-pagamento-lote .pl-detail{color:var(--text-secondary,#bdcdc3)}#lb-pagamento-lote .pl-error{color:#ffaaaa}}
`;
    document.head.appendChild(style);
    dialog=node('dialog');dialog.id='lb-pagamento-lote';dialog.setAttribute('aria-labelledby','pl-title');
    form=node('form');
    const head=node('div','pl-head');const title=node('h2','','Informar pagamento integral');title.id='pl-title';
    head.append(title,button('Fechar',close));
    const body=node('div','pl-body');
    const subtitle=node('p');subtitle.id='pl-subtitle';
    const hint=node('p','','Confira as datas e os valores de cada compra antes de salvar. Para uma compra que ainda não foi paga, use “Não paga”, que limpa a data e o valor recebido. Os valores a receber permanecem inalterados.');
    list=node('div');error=node('div','pl-error');error.setAttribute('role','alert');
    body.append(subtitle,hint,list,error);
    const foot=node('div','pl-foot');summary=node('div','pl-summary');summary.setAttribute('aria-live','polite');
    const submit=node('button','btn btn-primary','Salvar pagamentos');submit.type='submit';
    foot.append(summary,button('Cancelar',close),submit);
    form.append(head,body,foot);dialog.appendChild(form);document.body.appendChild(dialog);
    form.addEventListener('submit',saveAll);
    form.addEventListener('input',()=>{error.textContent='';updateSummary();});
    dialog.addEventListener('cancel',()=>{if(opener&&opener.isConnected)setTimeout(()=>opener.focus(),0);});
  }
  function open(id) {
    const emp=empById(id);if(!emp)return;
    if(!(emp.compras||[]).length){toast('Este empenho não possui compras cadastradas.','warning');return;}
    create();opener=document.activeElement;currentId=id;originalFingerprint=fingerprint(emp);rows=[];list.replaceChildren();error.textContent='';
    document.getElementById('pl-subtitle').textContent=['Empenho '+(emp.num||''),emp.orgao||''].filter(Boolean).join(' · ');
    (emp.compras||[]).forEach((c,i)=>{
      const item=(emp.itens||[]).find(x=>x.id===c.itemId);
      const rec=c.recManual!=null?Number(c.recManual):Number(c.rec);
      const recOk=Number.isFinite(rec)&&rec>=0;
      const row=node('div','pl-row');const ident=node('div','pl-ident');
      ident.append(node('div','pl-title',(i+1)+'. '+(item&&item.descricao||'Compra '+(i+1))),node('div','pl-detail','A receber: '+(recOk?money(rec):'valor indisponível')+' · Qtd.: '+(c.qtd??'')+(c.plataforma?' · '+c.plataforma:'')));
      const date=node('input');date.type='date';date.id='pl-date-'+i;
      const amount=node('input');amount.type='number';amount.min='0';amount.step='0.01';amount.id='pl-amount-'+i;
      // Registros com qualquer dado financeiro preexistente sao preservados.
      const existing=!!c.dpag || (c.recebido!=null && c.recebido!=='' && Number(c.recebido)!==0);
      date.value=existing?(c.dpag||''):today();
      amount.value=existing?(c.recebido==null?'':String(c.recebido)):(recOk?rec.toFixed(2):'');
      function field(input,label){const wrap=node('div');const l=node('label','',label+' · compra '+(i+1));l.htmlFor=input.id;wrap.append(l,input);return wrap;}
      const clear=button('Não paga',()=>{date.value='';amount.value='';updateSummary();},'btn btn-ghost pl-clear');
      row.append(ident,field(date,'Data do pagamento'),field(amount,'Valor recebido (R$)'),clear);list.appendChild(row);
      rows.push({id:c.id,date,amount});
    });
    updateSummary();if(!dialog.open)dialog.showModal();
  }
  function saveAll(event) {
    event.preventDefault();error.textContent='';
    if(!fbAuth.currentUser){fail('Sua sessão terminou. Entre novamente antes de salvar.');return;}
    const emp=empById(currentId);
    if(!emp){fail('O empenho não está mais disponível. Feche esta janela e atualize a tela.');return;}
    if(fingerprint(emp)!==originalFingerprint){fail('As compras foram alteradas enquanto esta janela estava aberta. Feche e abra novamente para carregar os dados atualizados.');return;}
    const updates=[];
    for(let i=0;i<rows.length;i++){
      const r=rows[i],d=r.date.value,v=r.amount.value;
      if(r.date.validity.badInput || r.amount.validity.badInput){fail('Revise os campos da compra '+(i+1)+'.',r.amount);return;}
      if(!d && v===''){updates.push({id:r.id,dpag:'',recebido:0});continue;}
      if(!d || v===''){fail('Na compra '+(i+1)+', preencha data e valor, ou use “Não paga” para deixar ambos em branco.',!d?r.date:r.amount);return;}
      if(!validDate(d)){fail('Informe uma data válida na compra '+(i+1)+'.',r.date);return;}
      const n=Number(v);
      if(!Number.isFinite(n)||n<0||!r.amount.validity.valid){fail('Informe um valor não negativo, com até duas casas decimais, na compra '+(i+1)+'.',r.amount);return;}
      updates.push({id:r.id,dpag:d,recebido:Math.round(n*100)/100});
    }
    // Todos os campos sao validados antes de alterar qualquer compra.
    const byId=new Map(updates.map(u=>[u.id,u]));
    (emp.compras||[]).forEach(c=>{const u=byId.get(c.id);c.dpag=u.dpag;c.recebido=u.recebido;});
    if(empenhoEstaPago(emp)){
      if(!emp.finalizado){emp.finalizado=true;emp.dataFinalizacao=emp.dataFinalizacao||today();}
    }else{emp.finalizado=false;emp.dataFinalizacao=null;}
    if(emp.disputaId)verificarAutoFinalizarDisputa(emp.disputaId);
    const id=currentId;
    close();
    // A funcao save existente nao retorna Promise; a mensagem nao confirma gravacao remota.
    save('empenhos',DB.empenhos);
    renderActive();
    toast('Pagamentos atualizados. Sincronização solicitada.','info');
    setTimeout(()=>window.abrirPopupEmpenho(id),150);
  }
  function init(){
    const original=window.abrirPopupEmpenho;
    if(typeof original!=='function'){console.warn('[pagamento-lote] Carregue este arquivo depois dos demais scripts.');return;}
    window.abrirPopupEmpenho=function(id){
      const result=original.apply(this,arguments);
      const popup=document.getElementById('popup-empenho');
      const foot=popup&&popup.querySelector('.detail-actions');
      if(!foot)return result;
      let b=foot.querySelector('[data-lb-pagamento-lote]');
      if(!b){b=button('Informar pagamento integral',()=>open(b.__empId),'btn btn-ghost');b.dataset.lbPagamentoLote='1';foot.appendChild(b);}
      b.__empId=id;const emp=empById(id);b.disabled=!(emp&&(emp.compras||[]).length);
      return result;
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
