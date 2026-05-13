const LIMITE = 400;
const ALVO_MIN = 0.75;

const state = {
  alimentos: [],
  lancheira: [],
  categoria: 'Todos',
};

const icones = {
  'Todos': 'fa-layer-group',
  'Frutas': 'fa-apple-whole',
  'Verduras e Legumes': 'fa-carrot',
  'Laticínios e Derivados': 'fa-cheese',
  'Carboidratos e Cereais': 'fa-bread-slice',
  'Proteínas e Gorduras Saudáveis': 'fa-egg',
  'Proteínas e Gorduras Ultraprocessadas': 'fa-burger',
  'Bebidas': 'fa-mug-saucer',
  'Doces e Outros': 'fa-cookie-bite',
  'Oleaginosas': 'fa-seedling',
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function carregarAlimentos() {
  try {
    const resp = await fetch('/api/alimentos');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    state.alimentos = await resp.json();
    renderChips();
    renderFoods();
    renderLunch();
  } catch (err) {
    const msg = $('#mensagem');
    if (msg) {
      msg.textContent = 'Não foi possível carregar os alimentos. Verifique se o servidor está rodando.';
      msg.className = 'message danger';
    }
    console.error('Falha ao carregar alimentos', err);
  }
}

function categoriasUnicas() {
  const ordem = [
    'Frutas',
    'Verduras e Legumes',
    'Laticínios e Derivados',
    'Carboidratos e Cereais',
    'Proteínas e Gorduras Saudáveis',
    'Proteínas e Gorduras Ultraprocessadas',
    'Oleaginosas',
    'Bebidas',
    'Doces e Outros',
  ];
  const presentes = new Set(state.alimentos.map((a) => a.categoria));
  const sorted = ordem.filter((c) => presentes.has(c));
  for (const extra of presentes) if (!sorted.includes(extra)) sorted.push(extra);
  return ['Todos', ...sorted];
}

function renderChips() {
  const container = $('#categorias-container');
  if (!container) return;
  container.innerHTML = '';

  for (const cat of categoriasUnicas()) {
    const btn = document.createElement('button');
    btn.className = 'chip' + (cat === state.categoria ? ' chip-active' : '');
    btn.type = 'button';
    btn.innerHTML = `
      <i class="fa-solid ${icones[cat] || 'fa-utensils'}"></i>
      <span>${cat}</span>
    `;
    btn.addEventListener('click', () => {
      state.categoria = cat;
      renderChips();
      renderFoods();
    });
    container.appendChild(btn);
  }
}

function renderFoods() {
  const list = $('#alimentos-lista');
  if (!list) return;
  list.innerHTML = '';

  const itens =
    state.categoria === 'Todos'
      ? state.alimentos
      : state.alimentos.filter((a) => a.categoria === state.categoria);

  if (!itens.length) {
    list.innerHTML = '<p class="empty">Nenhum alimento nesta categoria.</p>';
    return;
  }

  for (const alimento of itens) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'food-card';
    card.innerHTML = `
      <span class="food-icon">
        <i class="fa-solid ${icones[alimento.categoria] || 'fa-utensils'}"></i>
      </span>
      <span class="food-info">
        <span class="food-name">${alimento.nome}</span>
        <span class="food-cat">${alimento.categoria}</span>
      </span>
      <span class="food-kcal">
        ${alimento.kcal}
        <small>kcal</small>
      </span>
    `;
    card.addEventListener('click', () => {
      state.lancheira.push({ ...alimento });
      renderLunch();
      card.classList.add('pulse');
      setTimeout(() => card.classList.remove('pulse'), 400);
    });
    list.appendChild(card);
  }
}

function renderLunch() {
  const ul = $('#lancheira');
  const totalEl = $('#total-kcal');
  const fill = $('#progress-fill');
  const msg = $('#mensagem');
  const count = $('#contador-itens');
  if (!ul || !totalEl || !fill || !msg || !count) return;

  ul.innerHTML = '';
  let total = 0;

  state.lancheira.forEach((item, i) => {
    total += item.kcal;
    const li = document.createElement('li');
    li.className = 'lunch-item';
    li.innerHTML = `
      <span class="lunch-icon">
        <i class="fa-solid ${icones[item.categoria] || 'fa-utensils'}"></i>
      </span>
      <span class="lunch-info">
        <strong>${item.nome}</strong>
        <small>${item.categoria}</small>
      </span>
      <span class="lunch-kcal">${item.kcal} kcal</span>
      <button class="lunch-remove" data-i="${i}" aria-label="Remover item">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    ul.appendChild(li);
  });

  const qtd = state.lancheira.length;
  count.textContent = `${qtd} ${qtd === 1 ? 'item' : 'itens'}`;
  totalEl.textContent = `${total} / ${LIMITE} kcal`;

  const pct = Math.min((total / LIMITE) * 100, 100);
  fill.style.width = pct + '%';
  fill.dataset.state =
    total > LIMITE ? 'over' : total >= LIMITE * ALVO_MIN ? 'good' : 'low';

  const ultra = state.lancheira.some(
    (i) => i.categoria === 'Proteínas e Gorduras Ultraprocessadas'
  );
  const aviso = ultra
    ? ' Contém ultraprocessados — prefira opções naturais.'
    : '';

  if (!qtd) {
    msg.textContent = 'Comece adicionando um item ao lado.';
    msg.className = 'message neutral';
  } else if (total > LIMITE) {
    msg.textContent = `Você passou ${total - LIMITE} kcal do limite. Tente trocar por algo mais leve.${aviso}`;
    msg.className = 'message danger';
  } else if (total >= LIMITE * ALVO_MIN) {
    msg.textContent = `Equilíbrio perfeito — você está no alvo.${aviso}`;
    msg.className = 'message success';
  } else {
    msg.textContent = `Boa escolha. Faltam ${LIMITE - total} kcal para o alvo.${aviso}`;
    msg.className = 'message warn';
  }

  ul.querySelectorAll('.lunch-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i, 10);
      state.lancheira.splice(i, 1);
      renderLunch();
    });
  });
}

function iniciarMontagem() {
  const hero = $('#hero');
  const info = $('#sobre');
  const steps = $('#como');
  const app = $('#app');
  if (!app) return;

  [hero, info, steps].forEach((s) => s && s.classList.add('fade-out'));

  setTimeout(() => {
    [hero, info, steps].forEach((s) => {
      if (s) s.classList.add('off');
    });
    app.classList.remove('hidden');
    requestAnimationFrame(() => app.classList.add('show'));
    app.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 350);
}

function voltarInicio() {
  const hero = $('#hero');
  const info = $('#sobre');
  const steps = $('#como');
  const app = $('#app');

  app?.classList.remove('show');
  setTimeout(() => {
    app?.classList.add('hidden');
    [hero, info, steps].forEach((s) => {
      if (!s) return;
      s.classList.remove('off');
      requestAnimationFrame(() => s.classList.remove('fade-out'));
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 300);
}

function navegarPara(id) {
  const alvo = document.getElementById(id);
  if (!alvo) return;
  if (alvo.classList.contains('off')) {
    voltarInicio();
    setTimeout(() => {
      alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 450);
  } else {
    alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function limparLancheira() {
  if (!state.lancheira.length) return;
  const ok = window.confirm('Deseja remover todos os itens da lancheira?');
  if (!ok) return;
  state.lancheira = [];
  renderLunch();
}

document.addEventListener('DOMContentLoaded', () => {
  carregarAlimentos();

  $('#btn-iniciar')?.addEventListener('click', iniciarMontagem);
  $('#nav-cta')?.addEventListener('click', (e) => {
    e.preventDefault();
    iniciarMontagem();
  });
  $('#btn-voltar')?.addEventListener('click', voltarInicio);
  $('#btn-limpar')?.addEventListener('click', limparLancheira);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.id === 'nav-cta') return;
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      e.preventDefault();
      navegarPara(id);
    });
  });
});
