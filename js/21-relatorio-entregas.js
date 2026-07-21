// ========== RELATÓRIO DE ENTREGAS PENDENTES ==========
// Lista todas as compras cujo statusEntrega ainda não é 'recebida'
// (aguardando_envio, em_transito, nao_recebida). Filtros por status,
// órgão e analista. Exportação para Excel (SheetJS) e PDF (janela impressão).
(function(){
  'use strict';

  const STATUS_LABEL = {
    aguardando_envio: 'Aguardando envio',
    em_transito:      'Em trânsito',
    nao_recebida:     'Não recebida',
    sem_status:       'Sem status'
  };
  const STATUS_COR = {
    aguardando_envio: '#f59e0b',
    em_transito:      '#3b82f6',
    nao_recebida:     '#ef4444',
    sem_status:       '#94a3b8'
  };

  function hojeISO(){ return new Date().toISOString().slice(0,10); }
  function diasEntre(a, b){
    if(!a || !b) return '';
    const d1 = new Date(a + 'T12:00:00');
    const d2 = new Date(b + 'T12:00:00');
    if (isNaN(d1) || isNaN(d2)) return '';
    return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
  }
  function fmtBR(v){
    return Number(v||0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  }
  function escHTML(v){
    return String(v ?? '').replace(/[&<>"']/g, ch =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  // ---------- Coleta e filtragem ----------
  // Acesso direto ao identificador (não window.X), porque DB / _fullDB podem
  // ter sido declarados com let/const globalmente e nesse caso NÃO ficam em window.
  function _tryGet(fn){ try { return fn(); } catch(e){ return undefined; } }
  function _bancoEmpenhos(){
    let arr;
    arr = _tryGet(() => DB.empenhos);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => _fullDB.empenhos); if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window.DB && window.DB.empenhos);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window._fullDB && window._fullDB.empenhos); if (Array.isArray(arr) && arr.length) return arr;
    // último recurso: retorna qualquer array (mesmo vazio) só para não travar
    arr = _tryGet(() => DB.empenhos);      if (Array.isArray(arr)) return arr;
    arr = _tryGet(() => _fullDB.empenhos); if (Array.isArray(arr)) return arr;
    return [];
  }
  function _bancoDisputas(){
    let arr;
    arr = _tryGet(() => DB.disputas);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => _fullDB.disputas); if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window.DB && window.DB.disputas);      if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => window._fullDB && window._fullDB.disputas); if (Array.isArray(arr) && arr.length) return arr;
    arr = _tryGet(() => DB.disputas);      if (Array.isArray(arr)) return arr;
    arr = _tryGet(() => _fullDB.disputas); if (Array.isArray(arr)) return arr;
    return [];
  }

  function coletarPendentes(){
    const empenhos = _bancoEmpenhos();
    const disputas = _bancoDisputas();
    const dispMap = {};
    disputas.forEach(d => { dispMap[d.id] = d; });

    // Diagnóstico: contadores brutos por status para ajudar em problemas de dados
    const diag = { empenhos: empenhos.length, comprasTotal: 0, porStatus: {} };
    empenhos.forEach(e => (e.compras||[]).forEach(c => {
      diag.comprasTotal++;
      const s = c.statusEntrega || '(sem statusEntrega)';
      diag.porStatus[s] = (diag.porStatus[s]||0) + 1;
    }));
    console.log('[RelEntregas] fontes lidas:', diag);
    window._relEntregasDiag = diag;

    const hoje = hojeISO();
    const linhas = [];

    empenhos.forEach(e => {
      (e.compras || []).forEach(c => {
        const status = c.statusEntrega || 'sem_status';
        if (status === 'recebida') return;

        const item = (e.itens || []).find(i => i.id === c.itemId) || {};
        const disp = e.disputaId ? dispMap[e.disputaId] : null;

        const prev = c.dataPrevistaRecebimento || '';
        const diasDesdeCompra = c.dcompra ? diasEntre(c.dcompra, hoje) : '';
        const diasParaPrevisao = prev ? diasEntre(hoje, prev) : ''; // negativo = atrasada
        const atrasada = (typeof diasParaPrevisao === 'number' && diasParaPrevisao < 0);

        linhas.push({
          empenhoId: e.id,
          compraId: c.id,
          orgao: e.orgao || (disp && disp.orgao) || '',
          empresa: (disp && disp.empresa) || '',
          estado: (disp && disp.estado) || '',
          analista: e.analista || (disp && disp.analista) || '',
          numEmpenho: e.num || '',
          item: item.descricao || c.loteDesc || '',
          qtd: c.qtd || 0,
          vunit: c.vunit || 0,
          vtotal: c.vtotal || 0,
          dcompra: c.dcompra || '',
          status: status,
          statusLabel: STATUS_LABEL[status] || status,
          dataPrevista: prev,
          plataforma: c.plataforma || '',
          link: c.link || '',
          diasDesdeCompra,
          diasParaPrevisao,
          atrasada
        });
      });
    });

    // Ordenação padrão: atrasadas primeiro, depois por data prevista
    linhas.sort((a, b) => {
      if (a.atrasada !== b.atrasada) return a.atrasada ? -1 : 1;
      if (a.dataPrevista && b.dataPrevista) return a.dataPrevista.localeCompare(b.dataPrevista);
      if (a.dataPrevista) return -1;
      if (b.dataPrevista) return 1;
      return (a.dcompra || '').localeCompare(b.dcompra || '');
    });

    return linhas;
  }

  function aplicarFiltros(linhas){
    const fStatus   = (document.getElementById('rep-ent-status')?.value    || '').trim();
    const fOrgao    = (document.getElementById('rep-ent-orgao')?.value     || '').toLowerCase().trim();
    const fAnalista = (document.getElementById('rep-ent-analista')?.value  || '').toLowerCase().trim();
    const fEmpresa  = (document.getElementById('rep-ent-empresa')?.value   || '').trim();
    const fAtraso   = document.getElementById('rep-ent-atrasadas')?.checked;

    return linhas.filter(l => {
      if (fStatus && l.status !== fStatus) return false;
      if (fOrgao && !(l.orgao || '').toLowerCase().includes(fOrgao)) return false;
      if (fAnalista && !(l.analista || '').toLowerCase().includes(fAnalista)) return false;
      if (fEmpresa && l.empresa !== fEmpresa) return false;
      if (fAtraso && !l.atrasada) return false;
      return true;
    });
  }

  // ---------- Modal ----------
  function garantirModal(){
    if (document.getElementById('modal-rel-entregas')) return;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-rel-entregas';
    overlay.innerHTML = `
      <div class="modal" style="max-width:1180px;width:96vw;">
        <div class="modal-head" style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div class="modal-title" style="font-size:16px;font-weight:800;">Entregas pendentes</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">
              Compras sem confirmação de recebimento (aguardando envio, em trânsito ou não recebida)
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="fecharRelEntregas()">✕</button>
        </div>

        <div class="modal-body" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;padding:10px;border:1px solid var(--border-light);border-radius:10px;background:var(--bg-surface-soft);">
            <div class="form-group" style="margin:0;">
              <label style="font-size:10px;">Status</label>
              <select id="rep-ent-status" class="fc" onchange="renderRelEntregas()">
                <option value="">Todos</option>
                <option value="aguardando_envio">Aguardando envio</option>
                <option value="em_transito">Em trânsito</option>
                <option value="nao_recebida">Não recebida</option>
                <option value="sem_status">Sem status</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size:10px;">Empresa</label>
              <select id="rep-ent-empresa" class="fc" onchange="renderRelEntregas()">
                <option value="">Todas</option>
                <option value="Hamate">Hamate</option>
                <option value="Gadita">Gadita</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size:10px;">Órgão contém</label>
              <input type="text" id="rep-ent-orgao" class="fc" placeholder="Filtrar órgão..." oninput="renderRelEntregas()">
            </div>
            <div class="form-group" style="margin:0;">
              <label style="font-size:10px;">Analista contém</label>
              <input type="text" id="rep-ent-analista" class="fc" placeholder="Filtrar analista..." oninput="renderRelEntregas()">
            </div>
            <div class="form-group" style="margin:0;display:flex;align-items:flex-end;gap:6px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;cursor:pointer;">
                <input type="checkbox" id="rep-ent-atrasadas" onchange="renderRelEntregas()">
                Apenas atrasadas
              </label>
            </div>
          </div>

          <div id="rep-ent-resumo" style="display:flex;flex-wrap:wrap;gap:8px;font-size:11px;"></div>

          <div style="max-height:60vh;overflow:auto;border:1px solid var(--border-light);border-radius:10px;">
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
              <thead style="position:sticky;top:0;background:var(--bg-surface);z-index:1;">
                <tr style="text-align:left;">
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Órgão</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Nº Empenho</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Item</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);text-align:right;">Qtd</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);text-align:right;">Vl. Total</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Data compra</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);text-align:right;">Dias</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Status</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Prev. entrega</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Plataforma</th>
                  <th style="padding:8px;border-bottom:1px solid var(--border-light);">Analista</th>
                </tr>
              </thead>
              <tbody id="rep-ent-tbody"></tbody>
            </table>
          </div>
        </div>

        <div class="modal-actions" style="display:flex;justify-content:flex-end;gap:8px;padding-top:10px;">
          <button class="btn btn-ghost" onclick="fecharRelEntregas()">Fechar</button>
          <button class="btn btn-ghost" onclick="exportarRelEntregasPDF()">Exportar PDF</button>
          <button class="btn btn-primary" onclick="exportarRelEntregasXLSX()">Exportar Excel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // ---------- Render ----------
  function renderRelEntregas(){
    const linhas = aplicarFiltros(coletarPendentes());
    const tbody = document.getElementById('rep-ent-tbody');
    const resumo = document.getElementById('rep-ent-resumo');
    if (!tbody) return;

    if (!linhas.length) {
      tbody.innerHTML = `<tr><td colspan="11" style="padding:24px;text-align:center;color:var(--text-tertiary);">Nenhuma compra pendente de recebimento com os filtros atuais.</td></tr>`;
    } else {
      tbody.innerHTML = linhas.map(l => {
        const cor = STATUS_COR[l.status] || '#94a3b8';
        const rowStyle = l.atrasada ? 'background:rgba(239,68,68,0.06);' : '';
        const previsao = l.dataPrevista
          ? `<span style="${l.atrasada?'color:#ef4444;font-weight:700;':''}">${l.dataPrevista}${l.atrasada?' ⚠':''}</span>`
          : '<span style="color:var(--text-tertiary);">—</span>';
        return `
          <tr style="border-bottom:1px solid var(--border-light);${rowStyle}">
            <td style="padding:6px 8px;">${escHTML(l.orgao)}</td>
            <td style="padding:6px 8px;font-family:monospace;">${escHTML(l.numEmpenho || '—')}</td>
            <td style="padding:6px 8px;">${escHTML(l.item || '—')}</td>
            <td style="padding:6px 8px;text-align:right;">${l.qtd}</td>
            <td style="padding:6px 8px;text-align:right;font-family:monospace;">${fmtBR(l.vtotal)}</td>
            <td style="padding:6px 8px;">${escHTML(l.dcompra || '—')}</td>
            <td style="padding:6px 8px;text-align:right;">${l.diasDesdeCompra===''?'—':l.diasDesdeCompra}</td>
            <td style="padding:6px 8px;">
              <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${cor}22;color:${cor};">
                ${escHTML(l.statusLabel)}
              </span>
            </td>
            <td style="padding:6px 8px;">${previsao}</td>
            <td style="padding:6px 8px;">${escHTML(l.plataforma || '—')}</td>
            <td style="padding:6px 8px;">${escHTML(l.analista || '—')}</td>
          </tr>
        `;
      }).join('');
    }

    // Resumo por status
    const agrup = { aguardando_envio:0, em_transito:0, nao_recebida:0, sem_status:0 };
    let totalValor = 0, atrasadas = 0;
    linhas.forEach(l => {
      agrup[l.status] = (agrup[l.status]||0) + 1;
      totalValor += (l.vtotal||0);
      if (l.atrasada) atrasadas++;
    });
    if (resumo) {
      const bloco = (label, valor, cor) => `
        <span style="padding:4px 10px;border-radius:8px;background:${cor}22;color:${cor};font-weight:700;">
          ${label}: ${valor}
        </span>`;
      resumo.innerHTML =
        bloco(`Total`, linhas.length, '#0f766e') +
        bloco(STATUS_LABEL.aguardando_envio, agrup.aguardando_envio, STATUS_COR.aguardando_envio) +
        bloco(STATUS_LABEL.em_transito, agrup.em_transito, STATUS_COR.em_transito) +
        bloco(STATUS_LABEL.nao_recebida, agrup.nao_recebida, STATUS_COR.nao_recebida) +
        bloco(`Atrasadas`, atrasadas, '#ef4444') +
        bloco(`Valor total`, fmtBR(totalValor), '#2d6a4f');
    }
  }

  function abrirRelEntregas(){
    garantirModal();
    ['rep-ent-status','rep-ent-orgao','rep-ent-analista','rep-ent-empresa'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const chk = document.getElementById('rep-ent-atrasadas'); if (chk) chk.checked = false;
    renderRelEntregas();
    document.getElementById('modal-rel-entregas').classList.add('open');
  }
  function fecharRelEntregas(){
    const m = document.getElementById('modal-rel-entregas');
    if (m) m.classList.remove('open');
  }

  // ---------- Exportações ----------
  function exportarRelEntregasXLSX(){
    const linhas = aplicarFiltros(coletarPendentes());
    if (!linhas.length) { toastSafe('Nenhuma linha para exportar.', 'error'); return; }
    if (typeof XLSX === 'undefined') { toastSafe('Biblioteca XLSX não carregada.', 'error'); return; }

    const cabecalho = [
      'Órgão','Empresa','UF','Nº Empenho','Item','Qtd','Vl. Unit.','Vl. Total',
      'Data compra','Dias desde compra','Status','Data prevista','Dias até previsão',
      'Plataforma','Analista','Link'
    ];
    const dados = linhas.map(l => [
      l.orgao, l.empresa, l.estado, l.numEmpenho, l.item, l.qtd, l.vunit, l.vtotal,
      l.dcompra, l.diasDesdeCompra, l.statusLabel, l.dataPrevista,
      l.diasParaPrevisao === '' ? '' : l.diasParaPrevisao,
      l.plataforma, l.analista, l.link
    ]);

    const totalQtd    = linhas.reduce((s,l)=>s+(+l.qtd||0),0);
    const totalValor  = linhas.reduce((s,l)=>s+(+l.vtotal||0),0);
    const totais = ['TOTAL','','','','', totalQtd, '', totalValor, '','','','','','','',''];

    const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...dados, totais]);
    ws['!cols'] = [
      {wch:32},{wch:10},{wch:6},{wch:16},{wch:36},{wch:8},{wch:12},{wch:14},
      {wch:12},{wch:10},{wch:18},{wch:12},{wch:12},{wch:16},{wch:16},{wch:32}
    ];
    // Formatação moeda (colunas G e H = índices 6 e 7)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R=1; R<=range.e.r; R++){
      [6,7].forEach(C => {
        const cell = ws[XLSX.utils.encode_cell({r:R,c:C})];
        if (cell) cell.z = 'R$ #,##0.00';
      });
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entregas pendentes');
    XLSX.writeFile(wb, `Entregas_pendentes_${hojeISO()}.xlsx`);
    toastSafe(`Excel gerado: ${linhas.length} compra(s).`, 'success');
  }

  function exportarRelEntregasPDF(){
    const linhas = aplicarFiltros(coletarPendentes());
    if (!linhas.length) { toastSafe('Nenhuma linha para exportar.', 'error'); return; }

    const corpo = linhas.map(l => `
      <tr${l.atrasada?' class="atrasada"':''}>
        <td>${escHTML(l.orgao)}</td>
        <td>${escHTML(l.numEmpenho)}</td>
        <td>${escHTML(l.item)}</td>
        <td class="n">${l.qtd}</td>
        <td class="n">${fmtBR(l.vtotal)}</td>
        <td>${escHTML(l.dcompra)}</td>
        <td class="n">${l.diasDesdeCompra===''?'':l.diasDesdeCompra}</td>
        <td>${escHTML(l.statusLabel)}</td>
        <td>${escHTML(l.dataPrevista)}${l.atrasada?' ⚠':''}</td>
        <td>${escHTML(l.plataforma)}</td>
        <td>${escHTML(l.analista)}</td>
      </tr>
    `).join('');
    const totalValor = linhas.reduce((s,l)=>s+(+l.vtotal||0),0);
    const totalQtd   = linhas.reduce((s,l)=>s+(+l.qtd||0),0);

    const janela = window.open('', '_blank');
    if (!janela) { toastSafe('O navegador bloqueou a janela do PDF.', 'error'); return; }
    janela.document.write(`<!doctype html><html><head><meta charset="utf-8">
      <title>Entregas pendentes</title>
      <style>
        @page{size:A4 landscape;margin:12mm}
        body{font-family:Arial,sans-serif;color:#1f2937;margin:0}
        h1{font-size:18px;color:#2d6a4f;margin:0 0 4px}
        p{font-size:10px;color:#64748b;margin:0 0 14px}
        table{width:100%;border-collapse:collapse;font-size:9px}
        th{background:#2d6a4f;color:#fff;padding:6px 5px;border:1px solid #24583f;text-align:left}
        td{padding:5px;border:1px solid #cbd5e1;vertical-align:top}
        tbody tr:nth-child(even){background:#f8fafc}
        tbody tr.atrasada{background:#fee2e2}
        .n{text-align:right;white-space:nowrap}
        tfoot td{font-weight:bold;background:#d9ead3}
      </style></head><body>
      <h1>Entregas pendentes</h1>
      <p>Gerado em ${new Date().toLocaleString('pt-BR')} · ${linhas.length} compra(s) sem confirmação de recebimento</p>
      <table>
        <thead><tr>
          <th>Órgão</th><th>Nº Empenho</th><th>Item</th><th>Qtd</th><th>Vl. Total</th>
          <th>Data compra</th><th>Dias</th><th>Status</th><th>Prev. entrega</th>
          <th>Plataforma</th><th>Analista</th>
        </tr></thead>
        <tbody>${corpo}</tbody>
        <tfoot><tr>
          <td colspan="3">TOTAL</td>
          <td class="n">${totalQtd}</td>
          <td class="n">${fmtBR(totalValor)}</td>
          <td colspan="6"></td>
        </tr></tfoot>
      </table>
      <script>window.onload=function(){window.print();};<\/script>
      </body></html>`);
    janela.document.close();
    toastSafe(`PDF aberto com ${linhas.length} compra(s).`, 'success');
  }

  function toastSafe(msg, type){
    if (typeof window.toast === 'function') { window.toast(msg, type); return; }
    console.log('[' + (type||'info') + '] ' + msg);
  }

  // ---------- Injeção do botão na aba Empenhos ----------
  function injetarBotao(){
    const tab = document.getElementById('tab-empenhos');
    if (!tab) return false;
    const toolbar = tab.querySelector('.toolbar');
    if (!toolbar) return false;
    if (toolbar.querySelector('#btn-rel-entregas')) return true;

    const btn = document.createElement('button');
    btn.id = 'btn-rel-entregas';
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-sm';
    btn.title = 'Compras sem confirmação de recebimento';
    btn.innerHTML = '📦 Entregas pendentes';
    btn.onclick = abrirRelEntregas;
    toolbar.appendChild(btn);
    return true;
  }

  function init(){
    // Expõe as funções que os handlers HTML chamam
    window.abrirRelEntregas       = abrirRelEntregas;
    window.fecharRelEntregas      = fecharRelEntregas;
    window.renderRelEntregas      = renderRelEntregas;
    window.exportarRelEntregasXLSX = exportarRelEntregasXLSX;
    window.exportarRelEntregasPDF  = exportarRelEntregasPDF;

    // Tenta injetar o botão. Se a aba ainda não existir, observa o DOM.
    if (!injetarBotao()){
      const obs = new MutationObserver(() => {
        if (injetarBotao()) obs.disconnect();
      });
      obs.observe(document.body, { childList:true, subtree:true });
      // Segurança extra: tenta de novo após 2s
      setTimeout(injetarBotao, 2000);
    }
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
