// LicitationBiznis: camada visual isolada do Dashboard.
// O JS 06 (formulas, filtros, criacao dos graficos) permanece intacto. Este modulo apenas
// reorganiza a apresentacao depois de cada execucao de atualizarDashboard().
(function () {
  'use strict';

  const css = `
#tab-dashboard.dm{--dm-green:#2d6a4f;--dm-line:var(--surface-border,#e3e8e5);--dm-muted:#5f6d68}
body:has(#tab-dashboard.active)::before{content:"";position:fixed;top:0;left:0;right:0;height:var(--lb-gap,12px);background:var(--bg-app,#f6f8f9);z-index:499;pointer-events:none}
@media(max-width:860px){body:has(#tab-dashboard.active)::before{height:8px}}
#tab-dashboard.dm .dm-filters{display:flex!important;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 14px;margin:0 0 16px!important;background:#fff;border:1px solid var(--dm-line);border-radius:12px}
#tab-dashboard.dm .filter-group{padding:7px 10px;border:1px solid var(--dm-line);border-radius:8px!important;background:var(--bg-surface-soft,#f7f9f8);display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:3px;min-width:150px}
#tab-dashboard.dm .filter-group label{font-size:10px;color:var(--dm-muted);letter-spacing:.2px}
#tab-dashboard.dm .filter-group select{border:0!important;background-color:transparent!important;height:24px!important;padding:0 14px 0 0!important;font-size:12px;min-width:0}
#tab-dashboard.dm .dm-clear{margin-left:auto;padding:10px 14px;border:1px solid var(--dm-line);border-radius:8px;background:#fff;color:var(--dm-muted);font-size:12px;cursor:pointer}
#tab-dashboard.dm .dm-clear:hover{background:var(--bg-surface-hover,#f4f7f5);color:var(--text-primary)}
#tab-dashboard.dm .dm-note{font-size:11px;line-height:1.5;color:var(--dm-muted);margin:6px 0 0}
#tab-dashboard.dm .dm-filters .dm-note{flex-basis:100%;margin:0}
#tab-dashboard.dm .dm-kpis{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;margin-bottom:16px!important}
#tab-dashboard.dm .dm-kpi{display:flex!important;align-items:center;gap:14px;min-height:100px;border:1px solid var(--dm-line)!important;border-left:1px solid var(--dm-line)!important;border-radius:12px!important;min-width:0}
#tab-dashboard.dm .dm-icon{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;flex:0 0 46px;background:#e6f2ec;color:var(--dm-green)}
#tab-dashboard.dm .dm-tone-purple .dm-icon{background:#f0eafa;color:#7637d4}
#tab-dashboard.dm .dm-tone-amber .dm-icon{background:#fbefdb;color:#a56300}
#tab-dashboard.dm .dm-svg{width:22px!important;height:22px!important;min-width:22px!important;max-width:22px!important;min-height:22px!important;max-height:22px!important;display:block;flex:0 0 22px}
#tab-dashboard.dm .dm-main{min-width:0;flex:1}
#tab-dashboard.dm .dm-kpi .card-label{font-size:12px!important;text-transform:none!important;letter-spacing:0!important;margin:0 0 4px!important;color:var(--dm-muted)!important}
#tab-dashboard.dm .dm-kpi .card-value{font-size:clamp(24px,2vw,30px)!important;line-height:1.15;overflow-wrap:anywhere}
#tab-dashboard.dm .dm-sub{font-size:11px;line-height:1.4;color:var(--dm-muted);margin-top:5px}
#tab-dashboard.dm .dm-row-2{display:grid!important;grid-template-columns:minmax(0,2fr) minmax(0,1fr)!important;gap:16px!important;margin-bottom:16px!important}
#tab-dashboard.dm .dm-row-2>.card{grid-column:auto!important;min-width:0}
#tab-dashboard.dm .dm-grid-2{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important;margin:0 0 16px!important}
#tab-dashboard.dm .chart-card,#tab-dashboard.dm .dm-row-2>.card{border:1px solid var(--dm-line)!important;border-radius:12px!important;padding:18px 20px!important;min-width:0}
#tab-dashboard.dm .chart-card{margin-top:0!important;margin-bottom:16px}
#tab-dashboard.dm .dm-grid-2>.chart-card,#tab-dashboard.dm .dm-two>.chart-card{margin-bottom:0}
#tab-dashboard.dm .dm-two{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important;margin-top:0!important;margin-bottom:16px}
#tab-dashboard.dm .dm-title{font-size:15px!important;font-weight:650!important;letter-spacing:-.2px!important;text-transform:none!important;color:var(--text-primary)!important;margin:0 0 4px!important;display:block}
#tab-dashboard.dm .dm-donut{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:10px}
#tab-dashboard.dm .dm-donut-chart{position:relative;width:170px;height:170px;flex:0 0 170px}
#tab-dashboard.dm .dm-donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
#tab-dashboard.dm .dm-donut-center strong{font-size:26px;line-height:1.1;color:var(--text-primary)}
#tab-dashboard.dm .dm-donut-center span{font-size:11px;color:var(--dm-muted)}
#tab-dashboard.dm .dm-legend{list-style:none;margin:0;padding:0;display:grid;gap:10px;flex:1;min-width:150px}
#tab-dashboard.dm .dm-legend li{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:start;font-size:12px}
#tab-dashboard.dm .dm-legend i{width:12px;height:12px;border-radius:3px;margin-top:2px}
#tab-dashboard.dm .dm-legend small{display:block;color:var(--dm-muted);font-size:11px}
#tab-dashboard.dm .dm-legend b{font-variant-numeric:tabular-nums}
#tab-dashboard.dm .chart-card{display:flex;flex-direction:column}
#tab-dashboard.dm .dm-chart{position:relative;flex:0 0 auto}
#tab-dashboard.dm .dm-chart canvas{position:absolute;inset:0;width:100%!important;height:100%!important}
#tab-dashboard.dm .dm-chart.dm-pie{height:280px!important}
#tab-dashboard.dm .dm-chart.dm-grow{height:auto!important;flex:1 1 240px;min-height:240px}
#tab-dashboard.dm .dm-values{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:0;font-size:12px}
#tab-dashboard.dm .dm-values li{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:10px;align-items:start;padding:7px 0;border-top:1px solid var(--dm-line)}
#tab-dashboard.dm .dm-values .dm-mark{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:650;background:#edf1ef;color:#34413b}
#tab-dashboard.dm .dm-values .dm-dot{width:12px;height:12px;border-radius:3px;margin:4px 4px 0}
#tab-dashboard.dm .dm-values .dm-name{overflow-wrap:anywhere;line-height:1.4;color:var(--text-secondary)}
#tab-dashboard.dm .dm-values strong{white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--dm-green)}
#tab-dashboard.dm .dm-readout{display:grid;gap:4px;margin-top:10px;padding-top:10px;border-top:1px solid var(--dm-line);font-size:12px;color:var(--text-secondary)}
#tab-dashboard.dm .dm-readout b{color:var(--text-primary)}
#tab-dashboard.dm .dm-table-wrap{overflow-x:auto!important;max-width:100%}
#tab-dashboard.dm table{width:100%;min-width:560px}
#tab-dashboard.dm th{padding:11px 10px!important;font-size:11px!important;font-weight:650!important;text-transform:none!important;letter-spacing:0!important;white-space:nowrap;background:var(--bg-surface-soft,#f7f9f8)!important;cursor:default}
#tab-dashboard.dm td{padding:10px!important;font-size:12.5px!important;line-height:1.45!important;height:auto!important;border-bottom:1px solid var(--dm-line)!important}
#tab-dashboard.dm td.dm-org{white-space:normal!important;overflow-wrap:anywhere;min-width:210px}
#tab-dashboard.dm td.dm-num,#tab-dashboard.dm th.dm-num{width:44px;text-align:center!important;color:var(--dm-muted);font-variant-numeric:tabular-nums}
#tab-dashboard.dm #dash-tbody-taxa td:last-child{min-width:150px}
#tab-dashboard.dm #dash-tbody-taxa td:last-child>div>div:first-child{min-width:64px}
#tab-dashboard.dm td[colspan]{text-align:center;color:var(--dm-muted)}
#tab-dashboard.dm .dm-hidden{display:none!important}
#tab-dashboard.dm button:focus-visible,#tab-dashboard.dm select:focus-visible{outline:3px solid var(--accent,#2d6a4f);outline-offset:2px}
@media(max-width:1100px){#tab-dashboard.dm .dm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}#tab-dashboard.dm .dm-row-2{grid-template-columns:minmax(0,1fr)!important}}
@media(max-width:900px){#tab-dashboard.dm .dm-grid-2,#tab-dashboard.dm .dm-two{grid-template-columns:minmax(0,1fr)!important}}
@media(max-width:600px){#tab-dashboard.dm .dm-kpis{grid-template-columns:minmax(0,1fr)!important}#tab-dashboard.dm .dm-filters .filter-group{flex:1 1 calc(50% - 10px);min-width:0}#tab-dashboard.dm .dm-clear{margin-left:0;width:100%}#tab-dashboard.dm .chart-card,#tab-dashboard.dm .dm-row-2>.card{padding:14px!important}#tab-dashboard.dm .dm-donut-chart{margin:0 auto}}
`;

  const $ = (id) => document.getElementById(id);
  const money = (v) => (typeof fmt === 'function' ? fmt(v) : 'R$ ' + Number(v || 0).toFixed(2));
  const paths = {
    file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
    receipt: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8',
    wallet: 'M3 6h17v15H3z M3 6V3h14v3 M15 11h5v5h-5z',
    percent: 'M5 19L19 5 M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M18 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'
  };
  const svg = (name) =>
    '<svg class="dm-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' +
    paths[name] + '"/></svg>';

  function safe(label, fn) {
    try { fn(); } catch (err) { if (window.console) console.warn('[dashboard-moderno] ' + label + ':', err); }
  }

  /* Plugin leve para escrever o valor ao fim de cada barra. Sem dependencia externa. */
  function registerLabels() {
    if (!window.Chart || window.__lbValueLabels) return;
    window.__lbValueLabels = true;
    try {
      Chart.register({
        id: 'lbValueLabels',
        afterDatasetsDraw(chart, args, opts) {
          if (!opts || !opts.mode) return;
          const meta = chart.getDatasetMeta(0), ds = chart.data.datasets[0], ctx = chart.ctx;
          ctx.save();
          ctx.font = '600 11px "DM Sans", system-ui, sans-serif';
          ctx.fillStyle = '#34413b';
          ctx.textBaseline = 'middle';
          meta.data.forEach((bar, i) => {
            const v = Number(ds.data[i] || 0);
            const text = opts.mode === 'days' ? v + ' dias' : money(v);
            ctx.fillText(text, bar.x + 6, bar.y);
          });
          ctx.restore();
        }
      });
    } catch (err) { window.__lbValueLabels = false; }
  }

  /* Mesmo recorte de analista e periodo aplicado pelo JS 06, usado apenas para leitura. */
  function filteredEmp() {
    const an = ($('dash-filtro-analista') || {}).value || 'todos';
    const per = ($('dash-filtro-periodo') || {}).value || 'todos';
    const hoje = new Date();
    const mesAtual = hoje.toISOString().substring(0, 7);
    const limite = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1).toISOString().substring(0, 7);
    const dentro = (data) => {
      if (per === 'todos') return true;
      if (!data) return false;
      const d = data.substring(0, 7);
      if (per === 'mes') return d === mesAtual;
      if (per === 'trim') return d >= limite;
      if (per === 'ano') return d.substring(0, 4) === mesAtual.substring(0, 4);
      return true;
    };
    return DB.empenhos.filter((r) => (an === 'todos' || r.analista === an) && dentro(r.data));
  }

  const lucroCompra = (c) => (c.luc !== undefined && c.luc !== null ? c.luc : (c.rec || 0) - (c.vtotal || 0) - (c.custo || 0));

  function monthName(m) {
    const p = m.split('-');
    const t = new Date(+p[0], +p[1] - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function syncMonths() {
    const set = new Set();
    (DB.empenhos || []).forEach((e) => (e.compras || []).forEach((c) => { if (c.dpag) set.add(c.dpag.slice(0, 7)); }));
    const months = [...set].sort().reverse();
    const key = months.join(',');
    [['dash-comp-mes1', 'Mês atual'], ['dash-comp-mes2', 'Mês anterior']].forEach(([id, first]) => {
      const sel = $(id);
      if (!sel || sel.dataset.dmKey === key) return;
      const prev = sel.value;
      sel.innerHTML = '';
      const o0 = document.createElement('option');
      o0.value = '';
      o0.textContent = first;
      sel.appendChild(o0);
      months.forEach((m) => {
        const o = document.createElement('option');
        o.value = m;
        o.textContent = monthName(m);
        sel.appendChild(o);
      });
      sel.value = months.includes(prev) ? prev : '';
      sel.dataset.dmKey = key;
    });
  }

  function variation(cur, prev) {
    if (!prev) return cur ? 'sem base no mês comparado' : 'sem movimento nos dois meses';
    const p = ((cur - prev) / Math.abs(prev)) * 100;
    return (p >= 0 ? '+' : '-') + Math.abs(p).toFixed(1).replace('.', ',') + '%';
  }

  function previousMonth(m) {
    const p = m.split('-').map(Number);
    const y = p[1] === 1 ? p[0] - 1 : p[0], mo = p[1] === 1 ? 12 : p[1] - 1;
    return y + '-' + String(mo).padStart(2, '0');
  }

  function applyComparison() {
    const a = $('dash-comp-mes1'), b = $('dash-comp-mes2');
    const ch = typeof graficos !== 'undefined' ? graficos.comparativo : null;
    if (!a || !b || !ch) return;
    const card = $('grafico-comparativo').closest('.card');
    const title = card.querySelector('.dm-title');
    if (a.value || b.value) {
      const ref = a.value || new Date().toISOString().substring(0, 7);
      const cmp = b.value || previousMonth(ref);
      const lista = filteredEmp();
      const soma = (m) => {
        let rec = 0, luc = 0;
        lista.forEach((e) => (e.compras || []).filter((c) => c.dpag && c.dpag.substring(0, 7) === m).forEach((c) => {
          rec += c.rec || 0;
          luc += lucroCompra(c);
        }));
        return [rec, luc];
      };
      const rotulo = (m) => m.substring(5) + '/' + m.substring(2, 4);
      ch.data.datasets[0].label = rotulo(cmp);
      ch.data.datasets[0].data = soma(cmp);
      ch.data.datasets[1].label = rotulo(ref);
      ch.data.datasets[1].data = soma(ref);
      ch.update('none');
      title.textContent = 'Comparativo entre ' + monthName(ref) + ' e ' + monthName(cmp);
    } else {
      title.textContent = 'Comparativo: mês atual e anterior';
    }
    let box = card.querySelector('.dm-readout');
    if (!box) {
      box = document.createElement('div');
      box.className = 'dm-readout';
      card.appendChild(box);
    }
    const d0 = ch.data.datasets[0], d1 = ch.data.datasets[1];
    box.innerHTML = ['Recebido', 'Lucro'].map((nome, i) =>
      '<div><b>' + nome + ':</b> ' + d1.label + ' ' + money(d1.data[i]) + ' contra ' + d0.label + ' ' + money(d0.data[i]) +
      ' (variação de ' + variation(d1.data[i], d0.data[i]) + ')</div>').join('');
  }

  function renderList(card, rows, mode) {
    let list = card.querySelector(':scope > .dm-values');
    if (!list) {
      list = document.createElement('ol');
      list.className = 'dm-values';
      card.appendChild(list);
    }
    list.replaceChildren();
    if (!rows.length) {
      const li = document.createElement('li');
      li.style.gridTemplateColumns = '1fr';
      li.textContent = 'Sem dados para os filtros selecionados.';
      list.appendChild(li);
      return;
    }
    rows.forEach((r, i) => {
      const li = document.createElement('li');
      const mark = document.createElement('span');
      if (mode === 'dot') { mark.className = 'dm-dot'; mark.style.background = r.color; } else { mark.className = 'dm-mark'; mark.textContent = String(i + 1); }
      const name = document.createElement('span');
      name.className = 'dm-name';
      name.textContent = r.name;
      const val = document.createElement('strong');
      val.textContent = r.value;
      li.append(mark, name, val);
      list.appendChild(li);
    });
  }

  /* Os graficos reconfigurados aqui nao animam a transicao entre a configuracao original e a nova. */
  function settle(ch) {
    ch.stop();
    ch.options.animation = false;
    ch.update('none');
  }

  function fullTitle(ch, i, fallback) {
    try {
      const cb = (ch.config.options || ch.options).plugins.tooltip.callbacks.title;
      return cb ? cb([{ dataIndex: i }]) : fallback;
    } catch (e) { return fallback; }
  }

  function decorateCharts() {
    if (typeof graficos === 'undefined') return;
    registerLabels();
    const g = graficos;

    if (g.orgaos) {
      const ch = g.orgaos;
      const names = ch.data.labels.map((l, i) => fullTitle(ch, i, l));
      const values = ch.data.datasets[0].data.slice();
      ch.data.labels = names.map((_, i) => String(i + 1));
      ch.data.datasets[0].backgroundColor = '#2d6a4f';
      ch.options.layout = { padding: { right: 96 } };
      ch.options.plugins.lbValueLabels = { mode: 'money' };
      settle(ch);
      renderList($('grafico-orgaos').closest('.chart-card'), names.map((n, i) => ({ name: n, value: money(values[i]) })), 'rank');
    }

    if (g.velocidade) {
      const ch = g.velocidade;
      const names = ch.data.labels.map((l, i) => fullTitle(ch, i, l));
      const values = ch.data.datasets[0].data.slice();
      const colors = [].concat(ch.data.datasets[0].backgroundColor);
      ch.data.labels = names.map((_, i) => String(i + 1));
      ch.options.indexAxis = 'y';
      ch.options.scales = { x: { beginAtZero: true, title: { display: true, text: 'Dias médios' } }, y: { ticks: { font: { size: 11 } } } };
      ch.options.layout = { padding: { right: 56 } };
      ch.options.plugins.lbValueLabels = { mode: 'days' };
      settle(ch);
      renderList($('grafico-velocidade').closest('.chart-card'), names.map((n, i) => ({ name: n, value: values[i] + ' dias', color: colors[i] })), 'rank');
    }

    if (g.analistas) {
      const ch = g.analistas;
      const data = ch.data.datasets[0].data;
      const total = data.reduce((s, v) => s + (Number(v) || 0), 0);
      const colors = [].concat(ch.data.datasets[0].backgroundColor);
      ch.options.plugins.legend = { display: false };
      settle(ch);
      renderList($('grafico-analistas').closest('.chart-card'), ch.data.labels.map((n, i) => ({
        name: n + (total > 0 ? ' (' + Math.round((Number(data[i]) || 0) / total * 100) + '%)' : ''),
        value: money(data[i]), color: colors[i % colors.length]
      })), 'dot');
    }
  }

  function decorateDonut() {
    const ch = typeof graficos !== 'undefined' ? graficos.situacoes : null;
    if (!ch) return;
    const card = $('grafico-situacoes').closest('.card');
    let fin = 0, pend = 0, atr = 0;
    const lista = filteredEmp();
    lista.forEach((e) => {
      const atrasado = !empenhoEstaPago(e) && diasSemPagamento(e) >= 60;
      if (atrasado) atr++; else if (e.finalizado) fin++; else pend++;
    });
    const total = lista.length;
    const rows = [
      ['Finalizados', fin, '#2d6a4f', 'Empenhos pagos e encerrados'],
      ['Pendentes', pend, '#e0a526', 'Aguardando pagamento, com menos de 60 dias'],
      ['Em atraso', atr, '#d64545', 'Sem pagamento há 60 dias ou mais']
    ];
    ch.data.labels = rows.map((r) => r[0]);
    ch.data.datasets[0].data = rows.map((r) => r[1]);
    ch.data.datasets[0].backgroundColor = rows.map((r) => r[2]);
    ch.options.cutout = '68%';
    ch.options.plugins.legend = { display: false };
    settle(ch);
    card.querySelector('.dm-center strong').textContent = String(total);
    const legend = card.querySelector('.dm-legend');
    legend.replaceChildren();
    rows.forEach((r) => {
      const li = document.createElement('li');
      const sw = document.createElement('i');
      sw.style.background = r[2];
      const body = document.createElement('div');
      body.textContent = r[0];
      const small = document.createElement('small');
      small.textContent = total ? r[3] + ' (' + (r[1] / total * 100).toFixed(1).replace('.', ',') + '%)' : r[3];
      body.appendChild(small);
      const num = document.createElement('b');
      num.textContent = String(r[1]);
      li.append(sw, body, num);
      legend.appendChild(li);
    });
  }

  function decorateTables() {
    const pane = $('tab-dashboard');
    const ids = (tr) => (tr.getAttribute('onclick') || '').match(/abrirPopupEmpenho\('([^']+)'\)/);

    /* Nomes completos: o JS 06 corta os nomes em 28 e 30 caracteres. So substitui quando o
       nome completo comeca exatamente com o texto exibido, o que descarta qualquer divergencia. */
    const restore = (cell, full) => {
      const shown = cell.textContent.trim();
      if (full && full !== shown && full.startsWith(shown)) cell.textContent = full;
    };
    [...$('dash-tbody-caixa').rows].forEach((tr) => {
      const m = ids(tr);
      if (!m || tr.cells.length < 2) return;
      const emp = DB.empenhos.find((e) => e.id === m[1]);
      if (emp) restore(tr.cells[1], emp.orgao);
    });

    const lista = filteredEmp();
    const dev = new Map();
    lista.filter((e) => !e.finalizado && !empenhoEstaPago(e)).forEach((e) => {
      const org = e.orgao || '?';
      if (!dev.has(org)) dev.set(org, 0);
      dev.set(org, dev.get(org) + (e.compras || []).filter((c) => !c.dpag || c.dpag === '').reduce((s, c) => s + (c.rec || 0), 0));
    });
    const devNames = [...dev.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);
    const taxa = new Map();
    lista.forEach((e) => {
      const org = e.orgao || '?';
      taxa.set(org, (taxa.get(org) || 0) + 1);
    });
    const taxaNames = [...taxa.entries()].filter((x) => x[1] >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8).map((x) => x[0]);

    [['dash-tbody-devedores', devNames], ['dash-tbody-taxa', taxaNames]].forEach(([id, names]) => {
      const tb = $(id), table = tb.closest('table'), head = table.tHead.rows[0];
      if (!head.querySelector('.dm-num')) {
        const th = document.createElement('th');
        th.className = 'dm-num';
        th.textContent = '#';
        head.insertBefore(th, head.firstChild);
      }
      [...tb.rows].forEach((tr, i) => {
        if (tr.dataset.dm) return;
        tr.dataset.dm = '1';
        if (tr.cells.length === 1) { tr.cells[0].colSpan = head.cells.length; return; }
        restore(tr.cells[0], names[i]);
        const td = tr.insertCell(0);
        td.className = 'dm-num';
        td.textContent = String(i + 1);
      });
    });

    [...$('dash-tbody-ranking').rows].forEach((tr, i) => { if (tr.cells.length === 5) tr.cells[0].textContent = String(i + 1); });

    pane.querySelectorAll('tbody td[colspan]').forEach((td) => {
      td.textContent = td.textContent.replace(/^[^\p{L}\p{N}]+/u, '');
    });

    pane.querySelectorAll('table').forEach((table) => {
      const head = [...table.tHead.rows[0].cells];
      const idx = head.findIndex((th) => /^[ÓO]rg[ãa]o/i.test(th.textContent.trim()));
      if (idx < 0) return;
      [...table.tBodies[0].rows].forEach((tr) => { if (tr.cells.length === head.length) tr.cells[idx].classList.add('dm-org'); });
    });
  }

  function build() {
    const pane = $('tab-dashboard');
    pane.classList.add('dm');
    const style = document.createElement('style');
    style.id = 'lb-dashboard-moderno';
    style.textContent = css;
    document.head.appendChild(style);

    const filters = $('dash-filtro-analista').closest('.filter-group').parentElement;
    filters.classList.add('dm-filters');
    [['dash-filtro-analista', 'Analista'], ['dash-filtro-periodo', 'Período de cadastro'], ['dash-comp-mes1', 'Mês de referência'], ['dash-comp-mes2', 'Comparar com']].forEach(([id, text]) => {
      const sel = $(id);
      if (!sel) return;
      const group = sel.closest('.filter-group');
      const label = group.querySelector('label');
      label.textContent = text;
      label.htmlFor = id;
      filters.appendChild(group);
    });
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'dm-clear';
    clear.textContent = 'Limpar filtros';
    clear.onclick = () => {
      $('dash-filtro-analista').value = 'todos';
      $('dash-filtro-periodo').value = 'todos';
      ['dash-comp-mes1', 'dash-comp-mes2'].forEach((id) => { if ($(id)) $(id).value = ''; });
      atualizarDashboard();
    };
    filters.appendChild(clear);
    const filterNote = document.createElement('p');
    filterNote.className = 'dm-note';
    filterNote.textContent = 'Analista e período valem para todos os indicadores e gráficos, e o período considera a data de cadastro. Os seletores de mês atuam apenas sobre o comparativo, pela data de pagamento das compras.';
    filters.appendChild(filterNote);

    [['dk-contratos', 'Contratos ativos', 'Contratos não finalizados', 'file', 'green'],
      ['dk-empenhos', 'Empenhos ativos', 'Empenhos não finalizados', 'receipt', 'purple'],
      ['dk-lucro', 'Lucro total', 'Compras pagas, de todos os empenhos', 'wallet', 'green'],
      ['dk-conversao', 'Taxa de conversão', 'Contratos com empenho vinculado', 'percent', 'amber']].forEach(([id, label, sub, icon, tone]) => {
      const card = $(id).closest('.card');
      card.parentElement.classList.add('dm-kpis');
      card.classList.add('dm-kpi', 'dm-tone-' + tone);
      card.querySelector('.card-label').textContent = label;
      const main = document.createElement('div');
      main.className = 'dm-main';
      while (card.firstChild) main.appendChild(card.firstChild);
      const hint = document.createElement('div');
      hint.className = 'dm-sub';
      hint.textContent = sub;
      main.appendChild(hint);
      const ic = document.createElement('span');
      ic.className = 'dm-icon';
      ic.innerHTML = svg(icon);
      card.append(ic, main);
    });

    const comp = $('grafico-comparativo').closest('.card');
    comp.parentElement.classList.add('dm-row-2');
    const compTitle = comp.querySelector('h3');
    compTitle.className = 'dm-title';
    compTitle.textContent = 'Comparativo: mês atual e anterior';

    const sit = $('grafico-situacoes').closest('.card');
    sit.querySelector('.card-label').className = 'dm-title';
    sit.querySelector('.dm-title').textContent = 'Distribuição dos empenhos';
    $('dk-atraso').classList.add('dm-hidden');
    const chartBox = $('grafico-situacoes').parentElement;
    chartBox.removeAttribute('style');
    chartBox.className = 'dm-donut-chart';
    const center = document.createElement('div');
    center.className = 'dm-center dm-donut-center';
    center.innerHTML = '<strong>0</strong><span>empenhos</span>';
    chartBox.appendChild(center);
    const wrap = document.createElement('div');
    wrap.className = 'dm-donut';
    const legend = document.createElement('ul');
    legend.className = 'dm-legend';
    legend.setAttribute('aria-label', 'Distribuição dos empenhos por situação');
    sit.insertBefore(wrap, chartBox);
    wrap.append(chartBox, legend);
    addNote(sit, 'Em atraso segue a regra do sistema: sem pagamento há 60 dias ou mais.');

    const titles = {
      'grafico-lucro-mensal': ['Recebido e lucro por mês', 'Até 12 meses com pagamentos, pela data de pagamento das compras.'],
      'grafico-orgaos': ['Top 5 órgãos por lucro recebido', 'Lucro das compras pagas, somado por órgão.'],
      'grafico-analistas': ['Lucro recebido por analista', 'Soma do lucro das compras pagas.'],
      'grafico-velocidade': ['Tempo médio de pagamento', 'Seis órgãos com menor média de dias entre a última compra, ou o empenho, e o pagamento.']
    };
    Object.entries(titles).forEach(([id, [text, hint]]) => {
      const card = $(id).closest('.chart-card');
      const h = card.querySelector('h3');
      h.className = 'dm-title';
      h.textContent = text;
      addNote(card, hint, h);
    });
    ['grafico-lucro-mensal', 'grafico-orgaos', 'grafico-analistas', 'grafico-velocidade'].forEach((id) => $(id).parentElement.classList.add('dm-chart'));
    $('grafico-lucro-mensal').parentElement.classList.add('dm-grow');
    $('grafico-analistas').parentElement.classList.add('dm-pie');
    $('grafico-lucro-mensal').closest('.dashboard-grid').classList.add('dm-grid-2');
    $('grafico-analistas').closest('.dashboard-grid').classList.add('dm-grid-2');

    const caixa = $('dash-tbody-caixa').closest('.chart-card');
    caixa.querySelector('h3').textContent = 'A receber por tempo sem pagamento';
    caixa.querySelector('h3').className = 'dm-title';
    const bands = ['Até 30 dias', '31 a 60 dias', '61 a 90 dias', 'Acima de 90 dias'];
    ['30', '60', '90', '90p'].forEach((k, i) => {
      const c = $('caixa-' + k).closest('.card');
      c.querySelector('.card-label').textContent = bands[i];
    });
    addNote(caixa, 'Faixas pelos dias sem pagamento, conforme a regra do sistema. Não representam data prevista de recebimento.', caixa.querySelector('h3'));

    [['dash-tbody-urgentes', 'Empenhos pendentes há mais de 30 dias'], ['dash-tbody-ranking', 'Ranking de órgãos por valor contratado'],
      ['dash-tbody-devedores', 'Órgãos com valores a receber'], ['dash-tbody-taxa', 'Taxa de recebimento por órgão']].forEach(([id, text]) => {
      const card = $(id).closest('.chart-card');
      const h = card.querySelector('h3');
      h.className = 'dm-title';
      h.textContent = text;
    });
    $('dash-tbody-devedores').closest('.chart-card').parentElement.classList.add('dm-two');
    pane.querySelectorAll('table').forEach((t) => t.parentElement.classList.add('dm-table-wrap'));
    pane.querySelectorAll('canvas').forEach((c) => {
      const card = c.closest('.card, .chart-card');
      const h = card && card.querySelector('.dm-title');
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', h ? h.textContent : 'Gráfico do dashboard');
    });
  }

  function addNote(card, text, after) {
    const p = document.createElement('p');
    p.className = 'dm-note';
    p.textContent = text;
    if (after) after.insertAdjacentElement('afterend', p); else card.appendChild(p);
  }

  const original = window.atualizarDashboard;
  if (typeof original !== 'function') return;
  window.atualizarDashboard = function () {
    const result = original.apply(this, arguments);
    const pane = $('tab-dashboard');
    if (!pane) return result;
    if (!pane.dataset.dmReady) {
      pane.dataset.dmReady = '1';
      safe('estrutura', build);
    }
    safe('meses', syncMonths);
    safe('graficos', decorateCharts);
    safe('distribuicao', decorateDonut);
    safe('comparativo', applyComparison);
    safe('tabelas', decorateTables);
    return result;
  };
})();
