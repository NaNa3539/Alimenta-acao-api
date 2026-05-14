import * as G from './game.js';

const $ = (s) => document.querySelector(s);

export function aplicarTema(perfil) {
  if (!perfil) return;
  document.body.dataset.skin = perfil.skinAtiva || 'laranja';
  document.body.dataset.scene = perfil.cenarioAtivo || 'default';
}

export function montarDashboard(perfil, handlers = {}) {
  const host = $('#dashboard');
  if (!host) return;
  if (!perfil) {
    host.innerHTML = '';
    host.hidden = true;
    return;
  }
  host.hidden = false;
  host.innerHTML = `
    <button class="dash-chip dash-profile" data-action="trocar" title="Trocar perfil">
      <span class="dash-avatar">${perfil.apelido.slice(0, 1).toUpperCase()}</span>
      <span class="dash-text">
        <small>Jogando como</small>
        <strong>${perfil.apelido}</strong>
      </span>
    </button>
    <button class="dash-chip" data-action="score" title="Pontuação">
      <i class="fa-solid fa-star"></i>
      <span class="dash-text">
        <small>Pontos</small>
        <strong>${perfil.score}</strong>
      </span>
    </button>
    <button class="dash-chip" data-action="streak" title="Dias seguidos">
      <i class="fa-solid fa-fire"></i>
      <span class="dash-text">
        <small>Streak</small>
        <strong>${perfil.streak} ${perfil.streak === 1 ? 'dia' : 'dias'}</strong>
      </span>
    </button>
    <button class="dash-chip dash-action" data-action="loja" title="Loja">
      <i class="fa-solid fa-store"></i><span>Loja</span>
    </button>
    <button class="dash-chip dash-action" data-action="historico" title="Histórico">
      <i class="fa-solid fa-clock-rotate-left"></i><span>Histórico</span>
    </button>
    <button class="dash-chip dash-action" data-action="ranking" title="Ranking">
      <i class="fa-solid fa-trophy"></i><span>Ranking</span>
    </button>
  `;
  host.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => handlers[btn.dataset.action]?.());
  });
}

function abrirModal(html, opcoes = {}) {
  fecharModais();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal ${opcoes.classe || ''}">
      ${opcoes.titulo ? `
        <header class="modal-header">
          <h3>${opcoes.titulo}</h3>
          <button class="modal-close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        </header>
      ` : ''}
      <div class="modal-body">${html}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => overlay.classList.add('show'));

  const fechar = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.modal-overlay')) {
        document.body.classList.remove('modal-open');
      }
      opcoes.onClose?.();
    }, 250);
  };

  overlay.querySelector('.modal-close')?.addEventListener('click', fechar);
  if (opcoes.fecharFora !== false) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fechar();
    });
  }
  return { overlay, fechar };
}

function fecharModais() {
  document.querySelectorAll('.modal-overlay').forEach((m) => m.remove());
  document.body.classList.remove('modal-open');
}

export function modalOnboarding(onCriar) {
  const perfis = G.Store.listar();
  const temPerfis = perfis.length > 0;
  const html = `
    <p class="modal-intro">
      ${temPerfis ? 'Adicione um novo perfil ou escolha um já criado.' : 'Bem-vindo à Alimenta+Ação! Escolha um apelido pra começar a montar suas lancheiras e ganhar pontos.'}
    </p>
    <form id="form-perfil" class="modal-form">
      <label>
        <span>Seu apelido</span>
        <input type="text" id="input-apelido" maxlength="20" placeholder="Ex: Rafa, Bia, Lipe..." required autocomplete="off" />
      </label>
      <button type="submit" class="btn-primary">
        <i class="fa-solid fa-rocket"></i> Começar a jogar
      </button>
    </form>
    ${temPerfis ? `
      <div class="modal-divisor"><span>ou continue como</span></div>
      <ul class="lista-perfis">
        ${perfis.map((p) => `
          <li>
            <button class="perfil-item" data-id="${p.id}">
              <span class="dash-avatar">${p.apelido.slice(0, 1).toUpperCase()}</span>
              <span class="perfil-info">
                <strong>${p.apelido}</strong>
                <small>${p.score} pts · streak ${p.streak}</small>
              </span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </li>
        `).join('')}
      </ul>
    ` : ''}
  `;
  const { fechar } = abrirModal(html, {
    titulo: temPerfis ? 'Trocar de perfil' : 'Olá! Bora montar?',
    classe: 'modal-onboarding',
    fecharFora: temPerfis,
  });
  const input = $('#input-apelido');
  input?.focus();
  $('#form-perfil')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    const novo = G.Store.criar(v);
    fechar();
    onCriar?.(novo);
  });
  document.querySelectorAll('.perfil-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      G.Store.trocar(btn.dataset.id);
      fechar();
      onCriar?.(G.Store.getAtivo());
    });
  });
}

export function modalCelebracao(resultado, perfil, onFechar) {
  const { pontuacao, streakRes, ganho, desbloqueios } = resultado;
  const breakdownHtml = pontuacao.breakdown.map((b) => `
    <li><span>${b.label}</span><strong class="${b.pts < 0 ? 'neg' : 'pos'}">${b.pts > 0 ? '+' : ''}${b.pts}</strong></li>
  `).join('');
  const streakHtml = streakRes.bonus > 0 ? `
    <li class="streak-line">
      <span><i class="fa-solid fa-fire"></i> Bônus de streak (${streakRes.streak} dias)</span>
      <strong class="pos">+${streakRes.bonus}</strong>
    </li>
  ` : '';

  const totalDesbloqueios =
    desbloqueios.skins.length + desbloqueios.cenarios.length + (desbloqueios.bosses?.length || 0);
  const desbloqueiosHtml = totalDesbloqueios > 0 ? `
    <div class="desbloqueios">
      <h4><i class="fa-solid fa-gift"></i> Você desbloqueou!</h4>
      <ul>
        ${(desbloqueios.bosses || []).map((b) => `<li class="boss-conquista">${b.emoji} Venceu <strong>${b.nome}</strong>!</li>`).join('')}
        ${desbloqueios.skins.map((s) => `<li>🎒 Skin "${s.nome}"</li>`).join('')}
        ${desbloqueios.cenarios.map((c) => `<li>🌅 Cenário "${c.nome}"</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const html = `
    <div class="celebra">
      <div class="celebra-emoji">🎉</div>
      <h2>Mandou bem, ${perfil.apelido}!</h2>
      <p class="celebra-sub">Sua lancheira do dia foi salva.</p>
      <div class="ganho-total">+${ganho} <small>pontos</small></div>
      <ul class="breakdown">
        ${breakdownHtml}
        ${streakHtml}
      </ul>
      ${desbloqueiosHtml}
      <div class="celebra-cta">
        <button class="btn-secondary" data-share>
          <i class="fa-solid fa-share-nodes"></i> Compartilhar
        </button>
        <button class="btn-primary" data-fechar>
          <i class="fa-solid fa-check"></i> Continuar
        </button>
      </div>
    </div>
  `;
  const { fechar } = abrirModal(html, { classe: 'modal-celebra' });
  confete();
  document.querySelector('[data-fechar]')?.addEventListener('click', () => {
    fechar();
    onFechar?.();
  });
  document.querySelector('[data-share]')?.addEventListener('click', async () => {
    const status = await compartilhar(
      `Ganhei +${ganho} pontos montando minha lancheira na Alimenta+Ação! 🎉 Streak: ${streakRes.streak} ${streakRes.streak === 1 ? 'dia' : 'dias'} 🔥. Vem montar a sua!`
    );
    feedbackShare(status);
  });
}

export function modalLoja(perfil, onAtivar) {
  const skinsHtml = G.REWARDS.skins.map((s) => {
    const desbloqueada = perfil.skinsDesbloqueadas.includes(s.id);
    const ativa = perfil.skinAtiva === s.id;
    return `
      <li class="loja-item ${desbloqueada ? 'unlocked' : 'locked'} ${ativa ? 'ativa' : ''}">
        <div class="loja-preview" style="--c:${s.color};--c2:${s.accent}"></div>
        <div class="loja-info">
          <strong>${s.nome}</strong>
          <small>${desbloqueada ? (ativa ? 'Ativa' : 'Disponível') : `${s.cost} pts pra desbloquear`}</small>
        </div>
        ${desbloqueada
          ? (ativa ? '<span class="badge-ativa"><i class="fa-solid fa-check"></i></span>'
                  : `<button class="btn-secondary btn-ativar-skin" data-id="${s.id}">Usar</button>`)
          : `<span class="trava"><i class="fa-solid fa-lock"></i> ${Math.max(0, s.cost - perfil.score)} pts</span>`}
      </li>
    `;
  }).join('');

  const cenHtml = G.REWARDS.scenes.map((c) => {
    const desbloqueado = perfil.cenariosDesbloqueados.includes(c.id);
    const ativo = perfil.cenarioAtivo === c.id;
    return `
      <li class="loja-item ${desbloqueado ? 'unlocked' : 'locked'} ${ativo ? 'ativa' : ''}">
        <div class="loja-preview scene-preview" data-scene="${c.id}"></div>
        <div class="loja-info">
          <strong>${c.nome}</strong>
          <small>${desbloqueado ? (ativo ? 'Ativo' : 'Disponível') : `${c.cost} pts pra desbloquear`}</small>
        </div>
        ${desbloqueado
          ? (ativo ? '<span class="badge-ativa"><i class="fa-solid fa-check"></i></span>'
                  : `<button class="btn-secondary btn-ativar-scene" data-id="${c.id}">Usar</button>`)
          : `<span class="trava"><i class="fa-solid fa-lock"></i> ${Math.max(0, c.cost - perfil.score)} pts</span>`}
      </li>
    `;
  }).join('');

  const html = `
    <p class="modal-intro">Use seus pontos pra desbloquear skins de lancheira e cenários novos. Os pontos não são gastos — uma vez desbloqueado, é seu pra sempre.</p>
    <div class="loja-tabs">
      <button class="loja-tab active" data-tab="skins"><i class="fa-solid fa-bag-shopping"></i> Skins de lancheira</button>
      <button class="loja-tab" data-tab="cenarios"><i class="fa-solid fa-image"></i> Cenários</button>
    </div>
    <ul class="loja-lista" data-tab-content="skins">${skinsHtml}</ul>
    <ul class="loja-lista" data-tab-content="cenarios" hidden>${cenHtml}</ul>
  `;
  const { fechar } = abrirModal(html, { titulo: 'Loja de recompensas', classe: 'modal-loja' });

  document.querySelectorAll('.loja-tab').forEach((t) => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.loja-tab').forEach((x) => x.classList.toggle('active', x === t));
      document.querySelectorAll('[data-tab-content]').forEach((c) => {
        c.hidden = c.dataset.tabContent !== t.dataset.tab;
      });
    });
  });

  document.querySelectorAll('.btn-ativar-skin').forEach((b) => {
    b.addEventListener('click', () => {
      G.ativarSkin(perfil, b.dataset.id);
      fechar();
      onAtivar?.(G.Store.getAtivo());
    });
  });
  document.querySelectorAll('.btn-ativar-scene').forEach((b) => {
    b.addEventListener('click', () => {
      G.ativarCenario(perfil, b.dataset.id);
      fechar();
      onAtivar?.(G.Store.getAtivo());
    });
  });
}

export function modalHistorico(perfil) {
  if (!perfil.historico.length) {
    abrirModal(`
      <div class="vazio">
        <div class="vazio-emoji">📚</div>
        <p>Você ainda não montou nenhuma lancheira. Comece hoje e veja seu progresso aqui!</p>
      </div>
    `, { titulo: 'Seu histórico', classe: 'modal-historico' });
    return;
  }
  const hoje = G.hoje();
  const itensHtml = perfil.historico.map((h, idx) => {
    const aval = G.avaliarLancheira(h.itens);
    const data = new Date(h.timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const ehHoje = h.data === hoje;
    return `
      <li>
        <button class="hist-item ${ehHoje ? 'hist-hoje' : ''}" data-idx="${idx}">
          <div class="hist-emoji">${aval.emoji}</div>
          <div class="hist-data">
            ${ehHoje ? '<span class="hist-tag-hoje">Hoje</span>' : ''}
            <i class="fa-solid fa-calendar"></i> ${data}
          </div>
          <div class="hist-info">
            <strong>${aval.nome} · ${aval.total} kcal</strong>
            <small>${h.itens.length} ${h.itens.length === 1 ? 'item' : 'itens'} · ${aval.categorias} ${aval.categorias === 1 ? 'grupo' : 'grupos'}</small>
          </div>
          <div class="hist-pts">+${h.pontos}<small>pts</small></div>
          <i class="fa-solid fa-chevron-right hist-chevron"></i>
        </button>
      </li>
    `;
  }).join('');
  abrirModal(`<ul class="hist-lista">${itensHtml}</ul>`, {
    titulo: 'Seu histórico',
    classe: 'modal-historico',
  });
  document.querySelectorAll('.hist-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const item = perfil.historico[idx];
      if (item) modalDetalhesLancheira(item, perfil);
    });
  });
}

export function modalDetalhesLancheira(lanche, perfil) {
  const aval = G.avaliarLancheira(lanche.itens);
  const data = new Date(lanche.timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const hora = new Date(lanche.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
  const categorias = [...new Set(lanche.itens.map((i) => i.categoria))];
  const ultra = categorias.includes('Proteínas e Gorduras Ultraprocessadas');

  const itensHtml = lanche.itens.map((i) => `
    <li class="det-item">
      <span class="det-icon"><i class="fa-solid ${iconePorCategoria(i.categoria)}"></i></span>
      <span class="det-info">
        <strong>${i.nome}</strong>
        <small>${i.categoria}</small>
      </span>
      <span class="det-kcal">${i.kcal} kcal</span>
    </li>
  `).join('');

  const pct = Math.min((aval.total / 400) * 100, 100);
  const fillState = aval.total > 400 ? 'over' : aval.total >= 300 ? 'good' : 'low';

  const html = `
    <div class="detalhes">
      <div class="det-header det-${aval.cor}">
        <div class="det-emoji">${aval.emoji}</div>
        <div>
          <h3>${aval.nome}</h3>
          <small>${data} às ${hora}</small>
        </div>
        <div class="det-pts">+${lanche.pontos}<small>pts</small></div>
      </div>

      <div class="det-resumo">
        <div class="det-resumo-info">
          <span>Calorias</span>
          <strong>${aval.total} / 400 kcal</strong>
        </div>
        <div class="progress-bar"><div class="progress-fill" data-state="${fillState}" style="width:${pct}%"></div></div>
      </div>

      <div class="det-stats">
        <div class="det-stat"><strong>${lanche.itens.length}</strong><span>${lanche.itens.length === 1 ? 'item' : 'itens'}</span></div>
        <div class="det-stat"><strong>${categorias.length}</strong><span>${categorias.length === 1 ? 'grupo' : 'grupos'}</span></div>
        <div class="det-stat ${ultra ? 'alerta' : 'ok'}">
          <strong>${ultra ? '⚠️' : '✓'}</strong>
          <span>${ultra ? 'tem ultra' : 'natural'}</span>
        </div>
      </div>

      <h4 class="det-titulo">Alimentos da lancheira</h4>
      <ul class="det-lista">${itensHtml}</ul>

      <div class="celebra-cta">
        <button class="btn-secondary" data-share>
          <i class="fa-solid fa-share-nodes"></i> Compartilhar
        </button>
      </div>
    </div>
  `;
  abrirModal(html, { titulo: 'Detalhes da lancheira', classe: 'modal-detalhes' });
  document.querySelector('[data-share]')?.addEventListener('click', async () => {
    const status = await compartilhar(
      `Minha lancheira na Alimenta+Ação: ${aval.nome} ${aval.emoji} — ${aval.total} kcal, ${lanche.pontos} pontos. Bora montar a sua!`
    );
    feedbackShare(status);
  });
}

function iconePorCategoria(cat) {
  const m = {
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
  return m[cat] || 'fa-utensils';
}

export async function compartilhar(texto) {
  const url = window.location.origin;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Alimenta+Ação', text: texto, url });
      return 'shared';
    }
    await navigator.clipboard.writeText(`${texto}\n${url}`);
    return 'copied';
  } catch {
    return 'cancelled';
  }
}

function feedbackShare(status) {
  if (status === 'cancelled') return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = status === 'shared' ? 'Compartilhado!' : 'Link copiado!';
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

export function modalRanking(perfilAtivo) {
  const score = perfilAtivo?.score || 0;
  const j = G.jornada(score);

  const bossesHtml = G.BOSSES.map((b, i) => {
    const derrotado = score >= b.score;
    const eAtual = j.proximo?.id === b.id;
    const trancado = !derrotado && !eAtual;
    const estado = derrotado ? 'derrotado' : eAtual ? 'atual' : 'trancado';
    const faltam = Math.max(0, b.score - score);
    return `
      <li class="boss-item boss-${estado}">
        <div class="boss-num">${i + 1}</div>
        <div class="boss-avatar">
          <span class="boss-emoji">${b.emoji}</span>
          ${derrotado ? '<span class="boss-derrotado-mark"><i class="fa-solid fa-check"></i></span>' : ''}
        </div>
        <div class="boss-info">
          <div class="boss-titulo">
            <strong>${b.nome}</strong>
            ${derrotado ? '<span class="boss-tag tag-ok">Vencido</span>'
              : eAtual ? '<span class="boss-tag tag-now">Próximo</span>'
              : '<span class="boss-tag tag-lock"><i class="fa-solid fa-lock"></i></span>'}
          </div>
          <small>${b.descricao}</small>
          ${eAtual ? `
            <div class="boss-progresso">
              <div class="progress-bar"><div class="progress-fill" data-state="good" style="width:${j.progresso}%"></div></div>
              <small>faltam ${faltam} pts</small>
            </div>
          ` : ''}
        </div>
        <div class="boss-score">
          <strong>${b.score}</strong>
          <small>pts</small>
        </div>
      </li>
    `;
  }).join('');

  const linhas = G.leaderboard(score);
  const rankingHtml = linhas.length === 0 ? '' : `
    <h4 class="ranking-titulo"><i class="fa-solid fa-users"></i> Ranking dos jogadores</h4>
    <p class="modal-intro modal-intro-mini">Perfis deste navegador, ordenados por pontuação.</p>
    <ul class="rank-lista">
      ${linhas.map((p) => `
        <li class="rank-item ${p.id === perfilAtivo?.id ? 'voce' : ''}">
          <div class="rank-pos">${medalha(p.pos)}</div>
          <div class="rank-avatar" style="background:${p.skin.color}">${p.apelido.slice(0,1).toUpperCase()}</div>
          <div class="rank-info">
            <strong>${p.apelido}${p.id === perfilAtivo?.id ? ' <small>(você)</small>' : ''}</strong>
            <small><i class="fa-solid fa-fire"></i> ${p.streak} ${p.streak === 1 ? 'dia' : 'dias'} · melhor: ${p.melhorStreak}</small>
          </div>
          <div class="rank-pts">${p.score}<small>pts</small></div>
        </li>
      `).join('')}
    </ul>
  `;

  const headerHtml = j.completou
    ? `
      <div class="jornada-header jornada-vitoria">
        <div class="jornada-trofeu">🏆</div>
        <h3>VOCÊ É O SUPER GUERREIRO!</h3>
        <p>Venceu todos os monstrinhos da Alimenta+Ação. Lenda absoluta!</p>
        <button class="btn-primary" data-share-vitoria>
          <i class="fa-solid fa-share-nodes"></i> Compartilhar conquista
        </button>
      </div>
    `
    : `
      <div class="jornada-header">
        <h3>Sua jornada</h3>
        <p>Vença os monstrinhos da jornada pra conquistar o título de <strong>Super Guerreiro Saudável</strong>.</p>
        <div class="jornada-progresso">
          <span>${j.derrotados.length} / ${j.total} vencidos</span>
          <div class="progress-bar"><div class="progress-fill" data-state="good" style="width:${(j.derrotados.length / j.total) * 100}%"></div></div>
        </div>
      </div>
    `;

  abrirModal(`
    ${headerHtml}
    <ul class="boss-lista">${bossesHtml}</ul>
    ${rankingHtml}
  `, { titulo: 'Jornada & Ranking', classe: 'modal-ranking' });

  document.querySelector('[data-share-vitoria]')?.addEventListener('click', async () => {
    const status = await compartilhar(
      `Sou Super Guerreiro Saudável na Alimenta+Ação! 🏆 Derrotei todos os 7 inimigos com ${score} pontos. Vem montar sua lancheira!`
    );
    feedbackShare(status);
  });
}

function medalha(pos) {
  if (pos === 1) return '🥇';
  if (pos === 2) return '🥈';
  if (pos === 3) return '🥉';
  return `<span class="rank-num">${pos}º</span>`;
}

export function modalJaPontuou(perfil, onContinuar) {
  const lanche = perfil.lancheiraDoDia;
  const kcal = lanche?.itens.reduce((s, i) => s + i.kcal, 0) || 0;
  abrirModal(`
    <div class="aviso">
      <div class="aviso-emoji">✅</div>
      <h2>Você já pontuou hoje!</h2>
      <p>Sua lancheira de hoje já foi salva — você ganhou <strong>+${lanche?.pontos || 0} pontos</strong> com ela (${kcal} kcal). Volte amanhã pra continuar seu streak!</p>
      <p class="dica">Você pode <strong>editar a lancheira</strong>, mas não ganha pontos novos hoje.</p>
      <div class="celebra-cta">
        <button class="btn-secondary" data-cancelar>Voltar ao início</button>
        <button class="btn-primary" data-continuar>
          <i class="fa-solid fa-pen"></i> Editar lancheira
        </button>
      </div>
    </div>
  `, { classe: 'modal-aviso', titulo: 'Lancheira de hoje' });

  document.querySelector('[data-continuar]')?.addEventListener('click', () => {
    fecharModais();
    onContinuar?.();
  });
  document.querySelector('[data-cancelar]')?.addEventListener('click', fecharModais);
}

export function modalTutorial(perfil, onFim) {
  const slides = [
    {
      emoji: '🎒',
      titulo: `Oi, ${perfil.apelido}!`,
      texto: 'Aqui você monta lancheiras saudáveis com alimentos de verdade. Toque nos itens para adicionar e fique atento ao alvo de calorias.',
      destaque: 'Limite: 400 kcal · alvo: 300-400',
    },
    {
      emoji: '⭐',
      titulo: 'Ganhe pontos todo dia',
      texto: 'Quando salvar sua lancheira, você recebe pontos. Quanto mais equilibrada (frutas, proteínas, variedade), mais pontos cai na sua conta.',
      destaque: 'Vale só a primeira lancheira do dia',
    },
    {
      emoji: '🔥',
      titulo: 'Streak de presença',
      texto: 'Vem todo dia que seu streak cresce e os bônus ficam maiores. Pulou um dia? Zera e começa do 1 de novo, sem drama.',
      destaque: '7 dias = +25 · 30 dias = +100',
    },
    {
      emoji: '🏆',
      titulo: 'Loja, jornada e ranking',
      texto: 'Troque pontos por skins de lancheira e cenários novos, vença os monstrinhos da jornada e veja sua posição entre os jogadores.',
      destaque: 'Bora montar a primeira?',
    },
  ];

  let idx = 0;
  fecharModais();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-tutorial">
      <div class="tut-dots">
        ${slides.map((_, i) => `<span class="tut-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
      </div>
      <div class="modal-body tut-body">
        <div class="tut-emoji"></div>
        <h3 class="tut-titulo"></h3>
        <p class="tut-texto"></p>
        <div class="tut-destaque"></div>
      </div>
      <div class="tut-footer">
        <button class="link-voltar" data-pular>Pular tutorial</button>
        <button class="btn-primary" data-prox></button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => overlay.classList.add('show'));

  const emojiEl = overlay.querySelector('.tut-emoji');
  const titEl   = overlay.querySelector('.tut-titulo');
  const txtEl   = overlay.querySelector('.tut-texto');
  const destEl  = overlay.querySelector('.tut-destaque');
  const proxEl  = overlay.querySelector('[data-prox]');
  const dots    = overlay.querySelectorAll('.tut-dot');

  function fim() {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.modal-overlay')) document.body.classList.remove('modal-open');
      G.marcarTutorialVisto(perfil);
      onFim?.();
    }, 250);
  }

  function renderiza() {
    const s = slides[idx];
    emojiEl.textContent = s.emoji;
    titEl.textContent = s.titulo;
    txtEl.textContent = s.texto;
    destEl.textContent = s.destaque;
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    emojiEl.classList.remove('bump');
    void emojiEl.offsetWidth;
    emojiEl.classList.add('bump');
    proxEl.innerHTML = idx === slides.length - 1
      ? '<i class="fa-solid fa-check"></i> Bora começar!'
      : 'Próximo <i class="fa-solid fa-arrow-right"></i>';
  }

  overlay.querySelector('[data-pular]').addEventListener('click', fim);
  proxEl.addEventListener('click', () => {
    if (idx === slides.length - 1) fim();
    else { idx++; renderiza(); }
  });

  renderiza();
}

export function confete(quantidade = 80) {
  const cores = ['#F97316', '#FACC15', '#16A34A', '#EC4899', '#3B82F6', '#9333EA'];
  const wrap = document.createElement('div');
  wrap.className = 'confete-wrap';
  document.body.appendChild(wrap);
  for (let i = 0; i < quantidade; i++) {
    const p = document.createElement('span');
    p.className = 'confete';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = cores[i % cores.length];
    p.style.animationDelay = Math.random() * 0.5 + 's';
    p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    wrap.appendChild(p);
  }
  setTimeout(() => wrap.remove(), 3500);
}
