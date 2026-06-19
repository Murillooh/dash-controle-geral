let DATA = { chips: [], inventario: [], controle: [], pagamentos: [], emails: [] };
const SHEET_ID = '1ny9SzA7Sxsc6HSuLeJ8OS0w3bhX5Qq5WX-1ZXHIJ21A';

const fmt = n => 'R$' + Number(n).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
const fmtCNPJ = s => {
  s = String(s||'').replace(/\D/g,'').padStart(14,'0');
  return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,'$1.$2.$3/$4-$5');
};

function statusPill(st){
  const map = {'Ativo':'pill-green','Inativo':'pill-red','Em uso':'pill-green',
    'Em estoque':'pill-blue','Em manutenção':'pill-orange','Quarentena':'pill-red','Inutilizável':'pill-dim','Suspenso':'pill-red'};
  return '<span class="pill '+(map[st]||'pill-dim')+'">'+( st||'—')+'</span>';
}
function opPill(op){
  const map = {'Claro':'pill-purple','TIM':'pill-blue','Vivo':'pill-red'};
  return '<span class="pill '+(map[op]||'pill-dim')+'">'+op+'</span>';
}

const PAGE_SIZE = 15;
let pages = { chips: 1, inventario: 1, controle: 1, pagamentos: 1, emails: 1 };

const titles = {
  dashboard: ['Dashboard Geral', 'Visão consolidada de todos os controles'],
  chips: ['Chips / Telefonia Corporativa', 'Base completa de linhas — Claro, TIM, Vivo'],
  inventario: ['Inventário TI', 'Controle de máquinas e ativos'],
  controle: ['Controle de Ativos / Termos', 'Termos de responsabilidade e devoluções'],
  emails: ['Email Google', 'Controle de contas da empresa'],
  pagamentos: ['Pagamentos e Contratos', 'Controle financeiro de fornecedores TI']
};

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  var trigger = document.querySelector('[data-page="'+id+'"]');
  if(trigger) trigger.classList.add('active');
  var t = titles[id]||['',''];
  document.getElementById('topbar-title').textContent = t[0];
  document.getElementById('topbar-meta').textContent  = t[1];
  if(id==='chips')      renderChips();
  if(id==='inventario') renderInventario();
  if(id==='controle')   renderControle();
  if(id==='pagamentos') renderPagamentos();
  if(id==='emails')     renderEmails();
}

const ID_PREFIX = {chips:'chips', inventario:'inv', controle:'ctrl', pagamentos:'pag', emails:'em'};

function renderPagination(module, filtered){
  var prefix = ID_PREFIX[module] || module;
  var cur = pages[module];
  var totalPages = Math.ceil(filtered/PAGE_SIZE);
  var start = (cur-1)*PAGE_SIZE+1, end = Math.min(cur*PAGE_SIZE, filtered);
  if(filtered===0){start=0;end=0;}
  document.getElementById(prefix+'-pag-info').textContent = start+'–'+end+' de '+filtered+' registros';
  var btns = document.getElementById(prefix+'-pag-btns');
  btns.innerHTML = '';
  function addBtn(label, pg, active, disabled){
    var b = document.createElement('button');
    b.className = 'pag-btn'+(active?' active':'');
    b.textContent = label; b.disabled = disabled;
    b.onclick = function(){
      pages[module]=pg;
      if(module==='chips') renderChips();
      else if(module==='inventario') renderInventario();
      else if(module==='controle') renderControle();
      else if(module==='emails') renderEmails();
      else renderPagamentos();
    };
    btns.appendChild(b);
  }
  addBtn('‹ Ant', cur-1, false, cur===1);
  var s = Math.max(1,cur-2), e2 = Math.min(totalPages,cur+2);
  for(var i=s;i<=e2;i++) addBtn(i,i,i===cur,false);
  addBtn('Próx ›', cur+1, false, cur===totalPages||totalPages===0);
}

// ── CHIPS ─────────────────────────────────────────────────────
function chipsFiltered(){
  var op = document.getElementById('chips-op').value;
  var st = document.getElementById('chips-st').value;
  var cn = document.getElementById('chips-cnpj').value;
  var q  = (document.getElementById('chips-search').value||'').toLowerCase();
  return DATA.chips.filter(function(c){
    return (!op||c.operadora===op)&&(!st||c.status===st)&&(!cn||c.cnpj===cn)&&
      (!q||c.numero.toLowerCase().includes(q)||c.nome.toLowerCase().includes(q)||
          c.departamento.toLowerCase().includes(q));
  });
}
function renderChips(){
  var f = chipsFiltered();
  pages.chips = pages.chips > Math.ceil(f.length/PAGE_SIZE) ? 1 : pages.chips;
  var slice = f.slice((pages.chips-1)*PAGE_SIZE, pages.chips*PAGE_SIZE);
  var html = slice.map(function(c){
    return '<tr><td class="mono">'+c.numero+'</td><td>'+opPill(c.operadora)+'</td>'+
      '<td>'+statusPill(c.status)+'</td><td style="max-width:160px">'+(c.nome||'—')+'</td>'+
      '<td>'+(c.departamento||'—')+'</td><td>'+(c.plano||'—')+'</td>'+
      '<td class="mono">R$'+c.valor.toFixed(2)+'</td><td>'+(c.fidelidade||'—')+'</td>'+
      '<td class="mono">'+(c.multa?'R$'+c.multa.toFixed(0):'—')+'</td>'+
      '<td><span class="cnpj-tag">'+fmtCNPJ(c.cnpj)+'</span></td></tr>';
  }).join('');
  document.getElementById('chips-tbody').innerHTML = html||'<tr><td colspan="10" class="empty">Nenhum resultado</td></tr>';
  document.getElementById('chips-count').textContent = f.length+' registros';
  renderPagination('chips', f.length);
}

// ── INVENTÁRIO ────────────────────────────────────────────────
function invFiltered(){
  var cat = document.getElementById('inv-cat').value;
  var st  = document.getElementById('inv-st').value;
  var q   = (document.getElementById('inv-search').value||'').toLowerCase();
  var usoEstoque = document.getElementById('inv-uso-estoque').checked;
  return DATA.inventario.filter(function(i){
    if(usoEstoque){
      if(i.categoria !== 'Notebook') return false;
      if(i.status !== 'Em uso' && i.status !== 'Em estoque') return false;
    }
    return (!cat||i.categoria===cat)&&(!st||i.status===st)&&
      (!q||i.ativo.toLowerCase().includes(q)||i.responsavel.toLowerCase().includes(q)||
          i.matricula.toLowerCase().includes(q)||i.departamento.toLowerCase().includes(q));
  });
}
function renderInventario(){
  var f = invFiltered();
  pages.inventario = pages.inventario > Math.ceil(f.length/PAGE_SIZE) ? 1 : pages.inventario;
  var slice = f.slice((pages.inventario-1)*PAGE_SIZE, pages.inventario*PAGE_SIZE);
  var html = slice.map(function(i){
    var termo = i.termo ? '<span class="pill pill-green">'+i.termo+'</span>' : '—';
    return '<tr><td style="max-width:220px">'+i.ativo+'</td><td>'+i.categoria+'</td>'+
      '<td>'+statusPill(i.status)+'</td><td class="mono">'+(i.matricula||'—')+'</td>'+
      '<td>'+(i.departamento||'—')+'</td><td>'+(i.responsavel||'—')+'</td>'+
      '<td>'+(i.empresa||'—')+'</td><td>'+termo+'</td></tr>';
  }).join('');
  document.getElementById('inv-tbody').innerHTML = html||'<tr><td colspan="8" class="empty">Nenhum resultado</td></tr>';
  document.getElementById('inv-count').textContent = f.length+' itens';
  renderPagination('inventario', f.length);
}

// ── CONTROLE ──────────────────────────────────────────────────
function ctrlFiltered(){
  var un = (document.getElementById('ctrl-unidade').value||'').toLowerCase();
  var q  = (document.getElementById('ctrl-search').value||'').toLowerCase();
  var comNote = document.getElementById('ctrl-com-notebook').checked;
  return DATA.controle.filter(function(c){
    if(comNote){
      if(!c.notebook || c.notebook.trim() === '-' || c.notebook.trim() === '') return false;
    }
    return (!un||c.unidade.toLowerCase().includes(un))&&
      (!q||c.nome.toLowerCase().includes(q)||c.patrimonio.toLowerCase().includes(q)||
          c.celular.toLowerCase().includes(q)||c.cargo.toLowerCase().includes(q));
  });
}
function renderControle(){
  var f = ctrlFiltered();
  pages.controle = pages.controle > Math.ceil(f.length/PAGE_SIZE) ? 1 : pages.controle;
  var slice = f.slice((pages.controle-1)*PAGE_SIZE, pages.controle*PAGE_SIZE);
  var html = slice.map(function(c){
    var recibo = c.recibo ? '<a href="'+c.recibo+'" target="_blank">PDF ↗</a>' : '—';
    return '<tr><td style="max-width:160px">'+c.nome+'</td><td>'+(c.cargo||'—')+'</td>'+
      '<td>'+(c.unidade||'—')+'</td><td>'+(c.notebook||'—')+'</td>'+
      '<td class="mono">'+(c.patrimonio||'—')+'</td><td>'+(c.celular||'—')+'</td>'+
      '<td style="max-width:150px">'+(c.acessorios||'—')+'</td>'+
      '<td style="max-width:140px;color:var(--orange)">'+(c.obs||'—')+'</td>'+
      '<td>'+recibo+'</td></tr>';
  }).join('');
  document.getElementById('ctrl-tbody').innerHTML = html||'<tr><td colspan="9" class="empty">Nenhum resultado</td></tr>';
  document.getElementById('ctrl-count').textContent = f.length+' colaboradores';
  renderPagination('controle', f.length);
}

// ── EMAILS ────────────────────────────────────────────────
function emailsFiltered(){
  var st = document.getElementById('em-st').value;
  var q  = (document.getElementById('em-search').value||'').toLowerCase();
  return DATA.emails.filter(function(e){
    var email = e.email_address_required || e.email || '';
    var nStr = (e.first_name_required ? e.first_name_required + ' ' + (e.last_name_required||'') : e.nome) || '';
    var eStr = String(email).toLowerCase();
    nStr = String(nStr).toLowerCase();
    var dStr = String(e.org_unit_path_required || e.unidade || e.departamento || '').toLowerCase();
    var cStatus = e.status_read_only || e.status || '';
    var statusNorm = cStatus;
    if(statusNorm.toLowerCase() === 'active') statusNorm = 'Ativo';
    if(statusNorm.toLowerCase() === 'suspended') statusNorm = 'Suspenso';
    
    return (!st||statusNorm===st) && (!q||eStr.includes(q)||nStr.includes(q)||dStr.includes(q));
  });
}
function renderEmails(){
  var f = emailsFiltered();
  pages.emails = pages.emails > Math.ceil(f.length/PAGE_SIZE) ? 1 : pages.emails;
  var slice = f.slice((pages.emails-1)*PAGE_SIZE, pages.emails*PAGE_SIZE);
  var html = slice.map(function(e){
    var email = e.email_address_required || e.email || '—';
    var nome = (e.first_name_required ? e.first_name_required + ' ' + (e.last_name_required || '') : e.nome) || '—';
    var unidade = e.org_unit_path_required || e.unidade || '—';
    unidade = String(unidade).replace(/^[\/]+/, '') || 'Matriz';
    
    var phone = e.work_phone || e.mobile_phone || '—';

    var status = e.status_read_only || e.status || '—';
    if(String(status).toLowerCase() === 'active') status = 'Ativo';
    if(String(status).toLowerCase() === 'suspended') status = 'Suspenso';
    
    var ultimo_login = e.last_sign_in_read_only || e.ultimo_login || '—';
    if (String(ultimo_login).includes('Date(')) { // Clean raw date if necessary
      ultimo_login = ultimo_login.split('(')[1].split(')')[0].split(',').slice(0,3).reverse().join('/');
    }
    if (ultimo_login === 'Never logged in') ultimo_login = 'Nunca';
    
    var storage = (e.storage_used_read_only || '0GB') + ' / ' + (e.storage_limit_read_only || '—');
    var twfa = e['2sv_enrolled_read_only'] || '—';
    if (String(twfa).toLowerCase() === 'true') twfa = 'Ativo';
    if (String(twfa).toLowerCase() === 'false') twfa = 'Inativo';

    return '<tr><td>'+email+'</td><td>'+nome+'</td>'+
      '<td>'+unidade+'</td><td>'+phone+'</td><td>'+storage+'</td><td>'+statusPill(twfa === 'Ativo' ? 'Em uso' : 'Inativo')+'</td>'+
      '<td>'+statusPill(status)+'</td><td>'+ultimo_login+'</td></tr>';
  }).join('');
  document.getElementById('em-tbody').innerHTML = html||'<tr><td colspan="8" class="empty">Nenhum resultado</td></tr>';
  document.getElementById('em-count').textContent = f.length+' registros';
  
  // Update KPIs
  var totalAtivos = DATA.emails.filter(e => {
    let st = String(e.status_read_only || e.status || '').toLowerCase();
    return st === 'active' || st === 'ativo';
  }).length;
  var totalSuspensos = DATA.emails.filter(e => {
    let st = String(e.status_read_only || e.status || '').toLowerCase();
    return st === 'suspended' || st === 'suspenso';
  }).length;

  var emTotal = document.getElementById('em-total');
  if (emTotal) {
    emTotal.textContent = DATA.emails.length;
    document.getElementById('em-ativos').textContent = totalAtivos;
    document.getElementById('em-suspensas').textContent = totalSuspensos;
  }
  
  renderPagination('emails', f.length);
}

// ── PAGAMENTOS ────────────────────────────────────────────────
function pagFiltered(){
  var fn = document.getElementById('pag-cat').value;
  var q  = (document.getElementById('pag-search').value||'').toLowerCase();
  return DATA.pagamentos.filter(function(p){
    return (!fn||p.fornecedor===fn)&&
      (!q||p.fornecedor.toLowerCase().includes(q)||p.descricao.toLowerCase().includes(q)||
          p.unidade.toLowerCase().includes(q));
  });
}
function renderPagamentos(){
  var f = pagFiltered().sort(function(a,b){ return (b.valor_mes||0) - (a.valor_mes||0); });
  pages.pagamentos = pages.pagamentos > Math.ceil(f.length/PAGE_SIZE) ? 1 : pages.pagamentos;
  var slice = f.slice((pages.pagamentos-1)*PAGE_SIZE, pages.pagamentos*PAGE_SIZE);
  var html = slice.map(function(p){
    var vu = p.valor_unit ? 'R$'+p.valor_unit.toFixed(2) : '—';
    return '<tr><td style="max-width:180px">'+p.fornecedor+'</td>'+
      '<td style="max-width:180px">'+(p.descricao||'—')+'</td>'+
      '<td style="max-width:140px">'+(p.unidade||'—')+'</td>'+
      '<td>'+(p.cnpj?'<span class="cnpj-tag">'+fmtCNPJ(p.cnpj)+'</span>':'—')+'</td>'+
      '<td class="mono">'+vu+'</td>'+
      '<td class="mono" style="color:var(--gold);font-weight:600">'+fmt(p.valor_mes)+'</td>'+
      '<td style="color:var(--text-muted)">'+(p.obs||'—')+'</td></tr>';
  }).join('');
  document.getElementById('pag-tbody').innerHTML = html||'<tr><td colspan="7" class="empty">Nenhum resultado</td></tr>';
  document.getElementById('pag-count').textContent = f.length+' registros';
  renderPagination('pagamentos', f.length);
}

// ── CHART BARS ────────────────────────────────────────────────
function renderBar(containerId, dataArr, colorFn){
  var max = Math.max.apply(null, dataArr.map(function(d){return d.val;}));
  if(max===0) max=1;
  var el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = dataArr.map(function(d){
    return '<div class="bar-row">'+
      '<div class="bar-label" title="'+d.label+'">'+d.label+'</div>'+
      '<div class="bar-track"><div class="bar-fill" style="width:'+(d.val/max*100).toFixed(1)+'%;background:'+colorFn(d.label)+'"></div></div>'+
      '<div class="bar-val">'+d.display+'</div></div>';
  }).join('');
}

// ── INIT ──────────────────────────────────────────────────────
function initDashboard(){
  var ativas  = DATA.chips.filter(function(c){return c.status==='Ativo';}).length;
  var totalC  = DATA.chips.length;
  var emUso   = DATA.inventario.filter(function(i){return i.status==='Em uso';}).length;
  var totalI  = DATA.inventario.length;
  var emEst   = DATA.inventario.filter(function(i){return i.status==='Em estoque';}).length;
  var totalP  = DATA.pagamentos.reduce(function(s,p){return s+p.valor_mes;},0);
  var uniqF   = [...new Set(DATA.pagamentos.map(function(p){return p.fornecedor;}))].length;
  var mrr     = DATA.chips.filter(function(c){return c.status==='Ativo';}).reduce(function(s,c){return s+c.valor;},0);
  var manut   = DATA.inventario.filter(function(i){return ['Em manutenção','Quarentena','Inutilizável'].includes(i.status);}).length;
  var uniqCNPJ= [...new Set(DATA.pagamentos.filter(function(p){return p.cnpj;}).map(function(p){return p.cnpj;}))].length;
  var maxPag  = DATA.pagamentos.reduce(function(m,p){return p.valor_mes>m.valor_mes?p:m;}, DATA.pagamentos[0]||{valor_mes:0});

  // Dashboard KPIs
  document.getElementById('kpi-chips-ativo').textContent = ativas;
  document.getElementById('kpi-chips-total').textContent = totalC;
  document.getElementById('kpi-chips-pct').textContent   = (totalC > 0 ? (ativas/totalC*100).toFixed(1) : 0)+'% ativos';
  document.getElementById('kpi-inv-uso').textContent     = emUso;
  document.getElementById('kpi-inv-total').textContent   = totalI;
  document.getElementById('kpi-inv-estoque').textContent = emEst+' em estoque';
  document.getElementById('kpi-col-total').textContent   = DATA.controle.length;
  document.getElementById('kpi-col-badge').textContent   = DATA.controle.length+' vínculos';
  document.getElementById('kpi-pag-total').textContent   = fmt(totalP);
  document.getElementById('kpi-pag-fornec').textContent  = uniqF + ' fornecedores';
  // Emails KPIs
  var emTotal = document.getElementById('em-total');
  if (emTotal) {
    emTotal.textContent = DATA.emails.length;
    document.getElementById('em-ativos').textContent = DATA.emails.filter(e=>{
      let st = String(e.status_read_only || e.status || '').toLowerCase();
      return st === 'active' || st === 'ativo';
    }).length;
    document.getElementById('em-suspensas').textContent = DATA.emails.filter(e=>{
      let st = String(e.status_read_only || e.status || '').toLowerCase();
      return st === 'suspended' || st === 'suspenso';
    }).length;
  }

  // Dash page KPIs
  var dashE = document.getElementById('dash-emails');
  if (dashE) dashE.textContent = DATA.emails.filter(e=>{
    let st = String(e.status_read_only || e.status || '').toLowerCase();
    return st === 'active' || st === 'ativo';
  }).length + ' / ' + DATA.emails.length;

  // Chips page KPIs
  document.getElementById('c-total').textContent  = totalC;
  document.getElementById('c-ativas').textContent = ativas;
  document.getElementById('c-inativas').textContent = totalC-ativas;
  document.getElementById('c-mrr').textContent    = fmt(mrr);

  // Inventário page KPIs
  document.getElementById('i-total').textContent   = totalI;
  document.getElementById('i-uso').textContent     = emUso;
  document.getElementById('i-estoque').textContent = emEst;
  document.getElementById('i-manut').textContent   = manut;

  // Controle page KPIs
  var byUnidade = {};
  DATA.controle.forEach(function(c){
    var u = (c.unidade||'').trim();
    byUnidade[u] = (byUnidade[u]||0)+1;
  });
  function sumUnidadeLike(part){
    return Object.entries(byUnidade).reduce(function(s,e){
      return e[0].toLowerCase().includes(part) ? s+e[1] : s;
    },0);
  }
  document.getElementById('ctrl-kpi-total').textContent   = DATA.controle.length;
  document.getElementById('ctrl-kpi-zs').textContent      = sumUnidadeLike('zona sul');
  document.getElementById('ctrl-kpi-limao').textContent   = sumUnidadeLike('lim');
  document.getElementById('ctrl-kpi-barueri').textContent = sumUnidadeLike('barueri');

  // Pagamentos page KPIs
  document.getElementById('p-total').textContent  = fmt(totalP);
  document.getElementById('p-fornec').textContent = uniqF;
  document.getElementById('p-cnpj').textContent   = uniqCNPJ;
  document.getElementById('p-maior').textContent  = maxPag ? fmt(maxPag.valor_mes) : '—';
  document.getElementById('p-maior-nome').textContent = maxPag ? maxPag.fornecedor : '';

  // Populando selects
  var cnpjs = [...new Set(DATA.chips.map(function(c){return c.cnpj;}))].filter(Boolean).sort();
  var sel = document.getElementById('chips-cnpj');
  cnpjs.forEach(function(cn){var o=document.createElement('option');o.value=cn;o.textContent=fmtCNPJ(cn);sel.appendChild(o);});

  var fns = [...new Set(DATA.pagamentos.map(function(p){return p.fornecedor;}))].sort();
  var sel2 = document.getElementById('pag-cat');
  fns.forEach(function(fn){var o=document.createElement('option');o.value=fn;o.textContent=fn;sel2.appendChild(o);});

  // Charts
  var opCounts = {};
  DATA.chips.forEach(function(c){opCounts[c.operadora]=(opCounts[c.operadora]||0)+1;});
  renderBar('chart-operadora',
    Object.entries(opCounts).map(function(e){return {label:e[0],val:e[1],display:e[1]};}).sort(function(a,b){return b.val-a.val;}),
    function(l){return l==='Claro'?'#e879f9':l==='TIM'?'#60a5fa':'#f87171';});

  var catCounts = {};
  DATA.inventario.forEach(function(i){catCounts[i.categoria]=(catCounts[i.categoria]||0)+1;});
  renderBar('chart-categoria',
    Object.entries(catCounts).map(function(e){return {label:e[0],val:e[1],display:e[1]};}).sort(function(a,b){return b.val-a.val;}),
    function(){return '#c9a227';});

  var stCounts = {};
  DATA.inventario.forEach(function(i){stCounts[i.status]=(stCounts[i.status]||0)+1;});
  var stColors = {'Em uso':'#3ecf8e','Em estoque':'#60a5fa','Em manutenção':'#fb923c','Quarentena':'#f87171','Inutilizável':'#4a4a58'};
  renderBar('chart-status-inv',
    Object.entries(stCounts).map(function(e){return {label:e[0],val:e[1],display:e[1]};}).sort(function(a,b){return b.val-a.val;}),
    function(l){return stColors[l]||'#7a7a8a';});

  var fnTotals = {};
  DATA.pagamentos.forEach(function(p){fnTotals[p.fornecedor]=(fnTotals[p.fornecedor]||0)+p.valor_mes;});
  var top8 = Object.entries(fnTotals).sort(function(a,b){return b[1]-a[1];}).slice(0,8);
  renderBar('chart-fornecedores',
    top8.map(function(e){return {label:e[0],val:e[1],display:fmt(e[1])};}),
    function(){return '#c9a227';});
}

async function fetchSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}&headers=1`;
  const response = await fetch(url);
  const text = await response.text();
  const jsonString = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/)[1];
  const jsonData = JSON.parse(jsonString);

  const headers = jsonData.table.cols.map(c => {
    let label = c.label || '';
    return label.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  });
  const rows = jsonData.table.rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = '';
      if (row.c[i] && row.c[i].v !== null && row.c[i].v !== undefined) {
        val = row.c[i].v;
      }
      if (!['valor', 'valor_mensal', 'valor_mes', 'multa', 'valor_unit'].includes(h)) {
        let formatted = (row.c[i] && row.c[i].f) ? row.c[i].f : val;
        if (typeof formatted === 'string' && formatted.includes('########')) {
          val = String(val); 
        } else {
          val = formatted;
        }
      } else {
        if (typeof val === 'string') {
          val = val.replace(/[R$\s]/gi, '').replace(/\./g, '').replace(',', '.');
          val = parseFloat(val);
        }
        val = Number(val) || 0;
      }
      obj[h] = val;
    });
    return obj;
  });
  return rows;
}

async function loadDataAndInit() {
  const title = document.getElementById('topbar-title');
  const meta = document.getElementById('topbar-meta');
  title.textContent = 'Carregando dados...';
  meta.textContent = 'Conectando ao Google Sheets';

  try {
    const [chips, inventario, controle, pagamentos, emails] = await Promise.all([
      fetchSheetData('chips'),
      fetchSheetData('inventario'),
      fetchSheetData('controle'),
      fetchSheetData('pagamentos'),
      fetchSheetData('emails')
    ]);

    DATA.chips = chips;
    DATA.inventario = inventario;
    DATA.controle = controle;
    DATA.pagamentos = pagamentos;
    DATA.emails = emails;

    initDashboard();
  } catch (error) {
    console.error("Erro ao carregar dados do Sheets:", error);
    title.textContent = 'Erro de Conexão';
    meta.textContent = 'Não foi possível carregar os dados da planilha.';
  }
}

document.addEventListener('DOMContentLoaded', function(){
  loadDataAndInit();
});