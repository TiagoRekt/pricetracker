// API base relativo (mesmo host)
const API = '';

// util
function lojaColor(loja) {
  loja = (loja || '').toLowerCase();
  if (loja.includes('pcdiga')) return '#3B82F6';
  if (loja.includes('pccomponentes')) return '#10B981';
  if (loja.includes('globaldata')) return '#F59E0B';
  if (loja.includes('chip7')) return '#EC4899';
  return '#7C3AED';
}

function mudarTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('page-' + tab).classList.add('active');
  if (tab === 'alertas') carregarAlertas();
  if (tab === 'notificacoes') carregarNotificacoes();
}

function mostrarToast(msg, cor = '#10B981') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = cor;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function pesquisar() {
  const query = document.getElementById('input-pesquisa').value.trim();
  if (!query) return;
  const btn = document.getElementById('btn-pesquisar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  document.getElementById('resultados').innerHTML = '';
  document.getElementById('results-count').textContent = '';
  document.getElementById('cache-info').style.display = 'none';

  try {
    const r = await fetch(`${API}/search?q=${encodeURIComponent(query)}`);
    const data = await r.json();
    const resultados = data.resultados || [];

    if (data.cache) {
      document.getElementById('cache-info').style.display = 'flex';
      document.getElementById('cache-texto').textContent =
        `Dados em cache — atualizado em ${data.atualizado_em}`;
    }

    document.getElementById('results-count').textContent =
      `${resultados.length} resultados encontrados`;

    if (resultados.length === 0) {
      document.getElementById('resultados').innerHTML = `
        <div class="empty">
          <div class="icon">🔍</div>
          <p>Nenhum resultado encontrado</p>
        </div>`;
      return;
    }

    document.getElementById('resultados').innerHTML = resultados.map(item => {
      const cor = lojaColor(item.loja || '');
      const logoHtml = item.logo
        ? `<img src="${item.logo}" alt="${item.loja}" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">`
        : `<span style="font-size:20px">💻</span>`;

      return `
        <div class="card" onclick="abrirUrl('${item.url || ''}')">
          <div class="card-icon" style="background:${cor}22">${logoHtml}</div>
          <div class="card-info">
            <div class="card-nome">${item.nome}</div>
            <span class="card-loja" style="background:${cor}22;color:${cor}">${item.loja}</span>
          </div>
          <div class="card-right">
            <span class="card-preco">${item.preco}</span>
            <button class="btn-alerta" onclick="event.stopPropagation();abrirModal('${(item.nome||'').replace(/'/g,\"\\'\")}')">🔔</button>
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    document.getElementById('resultados').innerHTML = `
      <div class="empty">
        <div class="icon">⚠️</div>
        <p>Erro de ligação ao servidor</p>
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Pesquisar';
  }
}

function abrirUrl(url) {
  if (url) window.open(url, '_blank');
}

let produtoAtual = '';

function abrirModal(produto) {
  produtoAtual = produto;
  document.getElementById('modal-produto-texto').textContent = `Produto: ${produto}`;
  document.getElementById('modal-preco').value = '';
  document.getElementById('modal-overlay').classList.add('active');
}

function fecharModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

async function confirmarAlerta() {
  const preco = document.getElementById('modal-preco').value;
  if (!preco) return;
  await fetch(`${API}/alertas?produto=${encodeURIComponent(produtoAtual)}&preco_max=${preco}`, { method: 'POST' });
  fecharModal();
  mostrarToast(`✅ Alerta criado abaixo de ${preco}€`);
}

async function carregarAlertas() {
  const r = await fetch(`${API}/alertas`);
  const alertas = await r.json();
  const el = document.getElementById('lista-alertas');

  if (!alertas || alertas.length === 0) {
    el.innerHTML = `
      <div class="empty">
        <div class="icon">🔕</div>
        <p>Sem alertas ativos</p>
        <p style="font-size:13px;margin-top:8px">Pesquisa um produto e clica em 🔔</p>
      </div>`;
    return;
  }

  el.innerHTML = alertas.map(a => `
    <div class="alerta-card">
      <div style="font-size:28px">🔔</div>
      <div class="alerta-info">
        <div class="alerta-produto">${a.produto}</div>
        <div class="alerta-preco">Alerta abaixo de ${a.preco_max}€</div>
      </div>
      <button class="btn btn-red" onclick="apagarAlerta(${a.id})">🗑️</button>
    </div>`).join('');
}

async function apagarAlerta(id) {
  await fetch(`${API}/alertas/${id}`, { method: 'DELETE' });
  mostrarToast('🗑️ Alerta removido', '#ef4444');
  carregarAlertas();
}

async function carregarNotificacoes() {
  const r = await fetch(`${API}/notificacoes`);
  const notifs = await r.json();
  const el = document.getElementById('lista-notificacoes');

  if (!notifs || notifs.length === 0) {
    el.innerHTML = `
      <div class="empty">
        <div class="icon">📭</div>
        <p>Sem notificações novas</p>
      </div>`;
    return;
  }

  el.innerHTML = notifs.map(n => `
    <a class="notif-card" href="${n.url || '#'}" target="_blank">
      <div class="notif-nome">✅ ${n.nome}</div>
      <div class="notif-row">
        <span class="notif-loja">${n.loja}</span>
        <span class="notif-preco">${n.preco}</span>
      </div>
      <div class="notif-limite">Alerta: abaixo de ${n.preco_max}€</div>
    </a>`).join('');
}

async function limparNotificacoes() {
  await fetch(`${API}/notificacoes/limpar`, { method: 'POST' });
  mostrarToast('🗑️ Notificações limpas', '#ef4444');
  carregarNotificacoes();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // mantém a tab Pesquisar ativa por defeito
});
