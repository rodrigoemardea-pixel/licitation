// ========== NOTA FISCAL / ORDEM DE FORNECIMENTO - LICITATIONBIZNIS ==========
// Modulo autonomo (estilo 22/23/24). Nao altera 07/08; apenas:
//  1) Injeta campo CNPJ no modal de empenho e persiste em emp.cnpj.
//  2) Injeta Marca/Modelo no modal de compra e persiste em compra.marca / compra.modelo.
//  3) Renomeia o rotulo "No Empenho" para "No Ordem de Fornecimento" (campo interno segue 'num').
//  4) Adiciona botao no detalhe do empenho para gerar PDF de dados da NF (janela de impressao).
//     A nota agrupa por item do empenho: uma linha por item, somando a quantidade das compras.
(function () {
  'use strict';

  function _banco()      { try { if (Array.isArray(DB.empenhos)) return DB.empenhos; } catch (e) {} try { if (Array.isArray(_fullDB.empenhos)) return _fullDB.empenhos; } catch (e) {} return []; }
  function _bancoDisp()   { try { if (Array.isArray(DB.disputas)) return DB.disputas; } catch (e) {} try { if (Array.isArray(_fullDB.disputas)) return _fullDB.disputas; } catch (e) {} return []; }
  function _findEmp(id)   { return (_banco() || []).find(function (e) { return e.id === id; }); }
  function _findDisp(id)  { return (_bancoDisp() || []).find(function (d) { return d.id === id; }); }
  function _save()        { try { if (typeof save === 'function') save('empenhos', _banco()); } catch (e) { console.error(e); } }
  function escHTML(v)     { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function fmtBR(v)       { return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // ---------- 1) Campo CNPJ no modal de empenho + rotulo OF ----------
  function injetarCNPJeRotulo() {
    var numEl = document.getElementById('e-num');
    if (!numEl) return false;
    // Relabel do campo de numero para Ordem de Fornecimento.
    var fgNum = numEl.closest('.fg');
    if (fgNum) {
      var lbl = fgNum.querySelector('.fl');
      if (lbl && lbl.textContent.indexOf('Ordem') === -1) lbl.textContent = 'No Ordem de Fornecimento';
      numEl.placeholder = 'No da ordem de fornecimento';
    }
    // Campo CNPJ (uma vez).
    if (!document.getElementById('e-cnpj')) {
      var grid = document.querySelector('#modal-empenhos .form-grid');
      if (grid && fgNum) {
        var fg = document.createElement('div');
        fg.className = 'fg';
        fg.innerHTML = '<label class="fl">CNPJ do destinatario (p/ NF)</label>' +
          '<input type="text" class="fc" id="e-cnpj" placeholder="00.000.000/0000-00">';
        // Insere logo apos o campo de OF.
        if (fgNum.nextSibling) grid.insertBefore(fg, fgNum.nextSibling); else grid.appendChild(fg);
      }
    }
    return true;
  }

  // ---------- 2) Marca/Modelo no modal de compra ----------
  function injetarMarcaModelo() {
    var campos = document.getElementById('compra-campos');
    if (!campos || document.getElementById('c-nf-marca')) return false;
    var box = document.createElement('div');
    box.id = 'c-nf-box';
    box.className = 'form-grid';
    box.style.cssText = 'margin:4px 0 6px;';
    box.innerHTML =
      '<div class="fg"><label class="fl">Marca (p/ NF)</label>' +
        '<input type="text" class="fc" id="c-nf-marca" placeholder="Marca"></div>' +
      '<div class="fg"><label class="fl">Modelo (p/ NF)</label>' +
        '<input type="text" class="fc" id="c-nf-modelo" placeholder="Modelo"></div>';
    campos.insertBefore(box, campos.firstChild);
    return true;
  }

  // ---------- Wraps: preencher/limpar/persistir CNPJ ----------
  function wrapEditE() {
    var orig = window.editE;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.editE = function (id) {
      var r = orig.apply(this, arguments);
      setTimeout(function () {
        injetarCNPJeRotulo();
        var emp = _findEmp(id);
        var el = document.getElementById('e-cnpj');
        if (el) el.value = (emp && emp.cnpj) || '';
      }, 0);
      return r;
    };
    window.editE._nfWrapped = true;
    return true;
  }
  function wrapClearE() {
    var orig = window.clearE;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.clearE = function () {
      var r = orig.apply(this, arguments);
      var el = document.getElementById('e-cnpj'); if (el) el.value = '';
      return r;
    };
    window.clearE._nfWrapped = true;
    return true;
  }
  function wrapSaveE() {
    var orig = window.saveE;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.saveE = function () {
      var cnpj = (document.getElementById('e-cnpj') || {}).value || '';
      var editId = null; try { editId = EID.empenhos; } catch (e) {}
      var before = (_banco() || []).map(function (x) { return x.id; });
      var r = orig.apply(this, arguments);
      try {
        var target = null;
        if (editId) target = _findEmp(editId);
        if (!target) target = (_banco() || []).find(function (x) { return before.indexOf(x.id) === -1; });
        if (target) { target.cnpj = cnpj; _save(); }
      } catch (e) { console.error('NF cnpj persist', e); }
      return r;
    };
    window.saveE._nfWrapped = true;
    return true;
  }

  // ---------- Wraps: preencher/limpar/persistir Marca/Modelo ----------
  function wrapAbrirCompra() {
    var orig = window.abrirCompra;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.abrirCompra = function () {
      var editando = false; try { editando = !!compraEditId; } catch (e) {}
      var r = orig.apply(this, arguments);
      setTimeout(function () {
        injetarMarcaModelo();
        if (!editando) {
          var m = document.getElementById('c-nf-marca'); if (m) m.value = '';
          var mo = document.getElementById('c-nf-modelo'); if (mo) mo.value = '';
        }
      }, 0);
      return r;
    };
    window.abrirCompra._nfWrapped = true;
    return true;
  }
  function wrapSelecionarLote() {
    var orig = window.selecionarCompraLote;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.selecionarCompraLote = function (empenhoId, itemId, dadosExist) {
      var r = orig.apply(this, arguments);
      setTimeout(function () {
        injetarMarcaModelo();
        var m = document.getElementById('c-nf-marca'); if (m) m.value = (dadosExist && dadosExist.marca) || '';
        var mo = document.getElementById('c-nf-modelo'); if (mo) mo.value = (dadosExist && dadosExist.modelo) || '';
      }, 0);
      return r;
    };
    window.selecionarCompraLote._nfWrapped = true;
    return true;
  }
  function wrapSaveCompra() {
    var orig = window.saveCompra;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.saveCompra = function () {
      var marca = (document.getElementById('c-nf-marca') || {}).value || '';
      var modelo = (document.getElementById('c-nf-modelo') || {}).value || '';
      var empId, editId; try { empId = compraEmpenhoId; } catch (e) {} try { editId = compraEditId; } catch (e) {}
      var emp = _findEmp(empId);
      var before = (emp && emp.compras) ? emp.compras.map(function (c) { return c.id; }) : [];
      var r = orig.apply(this, arguments);
      try {
        var emp2 = _findEmp(empId);
        if (emp2 && emp2.compras) {
          var target = null;
          if (editId) target = emp2.compras.find(function (c) { return c.id === editId; });
          if (!target) target = emp2.compras.find(function (c) { return before.indexOf(c.id) === -1; });
          if (!target) target = emp2.compras[emp2.compras.length - 1];
          if (target) { target.marca = marca; target.modelo = modelo; _save(); }
        }
      } catch (e) { console.error('NF marca/modelo persist', e); }
      return r;
    };
    window.saveCompra._nfWrapped = true;
    return true;
  }

  // ---------- 4) Botao + geracao do PDF da NF ----------
  function wrapPopup() {
    var orig = window.abrirPopupEmpenho;
    if (typeof orig !== 'function' || orig._nfWrapped) return !!(orig && orig._nfWrapped);
    window.abrirPopupEmpenho = function (id) {
      var r = orig.apply(this, arguments);
      setTimeout(function () { injetarBotaoNF(id); }, 60);
      setTimeout(function () { injetarBotaoNF(id); }, 260);
      return r;
    };
    window.abrirPopupEmpenho._nfWrapped = true;
    return true;
  }
  function injetarBotaoNF(id) {
    var body = document.getElementById('popup-e-body');
    if (!body || body.querySelector('#nf-bar-' + id)) return;
    var bar = document.createElement('div');
    bar.id = 'nf-bar-' + id;
    bar.style.cssText = 'margin:8px 0;';
    bar.innerHTML = '<button type="button" class="btn btn-ghost btn-sm" onclick="lbGerarNotaFiscal(\'' + id + '\')">Gerar dados p/ Nota Fiscal (PDF)</button>';
    body.insertBefore(bar, body.firstChild);
  }

  function gerarNotaFiscal(id) {
    var emp = _findEmp(id);
    if (!emp) return;
    var disp = emp.disputaId ? _findDisp(emp.disputaId) : null;
    var cidade = emp.orgao || (disp && disp.orgao) || '-';
    var cnpj = emp.cnpj || '-';
    var of = emp.num || '-';
    var lotes = (disp && disp.lotes) ? disp.lotes : [];
    var itens = emp.itens || [];
    var compras = emp.compras || [];

    if (!compras.length) {
      if (typeof toast === 'function') toast('Cadastre ao menos uma compra para gerar os dados da NF.', 'error');
      return;
    }

    // Agrupa por item do empenho: soma as quantidades das compras do mesmo item.
    var mapa = {}; // itemId -> { desc, vunit, qtd, marcas:[], modelos:[] }
    compras.forEach(function (c) {
      var item = itens.find(function (i) { return i.id === c.itemId; }) || {};
      var lote = lotes.find(function (l) { return l.id === item.loteId; }) || {};
      var chave = c.itemId || item.id || lote.id || '_sem_item';
      if (!mapa[chave]) {
        mapa[chave] = {
          desc: lote.descricao || item.descricao || '-',
          vunit: (lote.vunit != null) ? lote.vunit : (item.vunit || 0), // valor do item no contrato
          qtd: 0,
          marcas: [],
          modelos: []
        };
      }
      mapa[chave].qtd += (c.qtd || 0);
      if (c.marca && mapa[chave].marcas.indexOf(c.marca) === -1) mapa[chave].marcas.push(c.marca);
      if (c.modelo && mapa[chave].modelos.indexOf(c.modelo) === -1) mapa[chave].modelos.push(c.modelo);
    });

    var linhas = [];
    var totalNota = 0;
    Object.keys(mapa).forEach(function (k) {
      var g = mapa[k];
      var totalLinha = g.vunit * g.qtd;
      totalNota += totalLinha;
      var produto = g.desc;
      var mm = [g.marcas.join('/'), g.modelos.join('/')].filter(Boolean).join(' ');
      if (mm) produto += ' - ' + mm;
      linhas.push({ produto: produto, qtd: g.qtd, vunit: g.vunit, total: totalLinha });
    });

    var corpo = linhas.map(function (l) {
      return '<tr>' +
        '<td>' + escHTML(l.produto) + '</td>' +
        '<td class="n">' + l.qtd + '</td>' +
        '<td class="n">' + fmtBR(l.vunit) + '</td>' +
        '<td class="n">' + fmtBR(l.total) + '</td>' +
        '</tr>';
    }).join('');

    var janela = window.open('', '_blank');
    if (!janela) { if (typeof toast === 'function') toast('O navegador bloqueou a janela do PDF.', 'error'); return; }
    janela.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Dados NF - OF ' + escHTML(of) + '</title>' +
      '<style>' +
      '@page{size:A4 portrait;margin:14mm}' +
      'body{font-family:Arial,sans-serif;color:#1f2937;margin:0}' +
      'h1{font-size:18px;color:#2d6a4f;margin:0 0 10px}' +
      '.cab{border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px}' +
      '.cab div{margin:2px 0}' +
      '.cab b{color:#2d6a4f}' +
      'table{width:100%;border-collapse:collapse;font-size:11px}' +
      'th{background:#2d6a4f;color:#fff;padding:7px 6px;border:1px solid #24583f;text-align:left}' +
      'td{padding:6px;border:1px solid #cbd5e1;vertical-align:top}' +
      'tbody tr:nth-child(even){background:#f8fafc}' +
      '.n{text-align:right;white-space:nowrap}' +
      'tfoot td{font-weight:bold;background:#d9ead3;font-size:12px}' +
      '</style></head><body>' +
      '<h1>Dados para emissao de Nota Fiscal</h1>' +
      '<div class="cab">' +
        '<div><b>Destinatario:</b> ' + escHTML(cidade) + '</div>' +
        '<div><b>CNPJ:</b> ' + escHTML(cnpj) + '</div>' +
        '<div><b>Ordem de Fornecimento:</b> ' + escHTML(of) + '</div>' +
      '</div>' +
      '<table><thead><tr>' +
        '<th>Produto / Modelo</th><th class="n">Qtd</th><th class="n">Vl. Unitario</th><th class="n">Vl. Total</th>' +
      '</tr></thead><tbody>' + corpo + '</tbody>' +
      '<tfoot><tr><td colspan="3" class="n">TOTAL DA NOTA</td><td class="n">' + fmtBR(totalNota) + '</td></tr></tfoot>' +
      '</table>' +
      '<script>window.onload=function(){window.print();};<\/script>' +
      '</body></html>');
    janela.document.close();
  }

  function init() {
    window.lbGerarNotaFiscal = gerarNotaFiscal;

    // Injeta campos (os modais existem no DOM desde o load, apenas ocultos).
    var n = 0;
    var it = setInterval(function () {
      n++;
      var a = injetarCNPJeRotulo();
      var b = injetarMarcaModelo();
      if ((a && b) || n > 60) clearInterval(it);
    }, 250);

    // Wraps (aguarda as funcoes existirem).
    var m = 0;
    var it2 = setInterval(function () {
      m++;
      var ok = wrapEditE() & wrapClearE() & wrapSaveE() &
               wrapAbrirCompra() & wrapSelecionarLote() & wrapSaveCompra() & wrapPopup();
      if (ok || m > 80) clearInterval(it2);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
