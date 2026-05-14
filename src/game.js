const STORAGE = {
  PROFILES: 'aa_profiles',
  ACTIVE: 'aa_active_profile',
};

export const REWARDS = {
  skins: [
    { id: 'laranja',  nome: 'Laranja Clássica',  cost: 0,    color: '#F97316', accent: '#EA580C' },
    { id: 'rosa',     nome: 'Rosa Doce',         cost: 100,  color: '#EC4899', accent: '#DB2777' },
    { id: 'azul',     nome: 'Azul Oceano',       cost: 300,  color: '#3B82F6', accent: '#2563EB' },
    { id: 'verde',    nome: 'Verde Folha',       cost: 600,  color: '#16A34A', accent: '#15803D' },
    { id: 'roxo',     nome: 'Roxo Galáxia',      cost: 1000, color: '#9333EA', accent: '#7E22CE' },
    { id: 'dourada',  nome: 'Dourada Lendária',  cost: 2000, color: '#FBBF24', accent: '#D97706' },
  ],
  scenes: [
    { id: 'default',  nome: 'Manhã Quente',  cost: 0 },
    { id: 'praia',    nome: 'Praia',         cost: 250 },
    { id: 'floresta', nome: 'Floresta',      cost: 750 },
    { id: 'noite',    nome: 'Noite Estrelada', cost: 1500 },
    { id: 'espaco',   nome: 'Espaço',        cost: 3000 },
  ],
};

export const BOSSES = [
  { id: 'goblin',     nome: 'Goblin do Refri',           emoji: '👹', score: 50,   descricao: 'Adora refrigerante todo santo dia.' },
  { id: 'bruxa',      nome: 'Bruxa do Salgadinho',       emoji: '🧙', score: 150,  descricao: 'Espalha pacotinhos por todo canto.' },
  { id: 'cavaleiro',  nome: 'Cavaleiro do Doce',         emoji: '🛡️', score: 350,  descricao: 'Armadura coberta de calda de chocolate.' },
  { id: 'dragao',     nome: 'Dragãozinho do Fast Food',  emoji: '🐉', score: 700,  descricao: 'Vive soltando baforadas de hambúrguer.' },
  { id: 'imperador',  nome: 'Imperador do Açúcar',       emoji: '👑', score: 1200, descricao: 'Reina sobre todas as sobremesas industrializadas.' },
  { id: 'lorde',      nome: 'Lorde dos Ultraprocessados', emoji: '💀', score: 2000, descricao: 'O líder dos conservantes e aromas artificiais.' },
  { id: 'campeao',    nome: 'Super Guerreiro Saudável',  emoji: '🏆', score: 3500, descricao: 'O título supremo da Alimenta+Ação.' },
];

export function jornada(score) {
  const proximo = BOSSES.find((b) => score < b.score) || null;
  const derrotados = BOSSES.filter((b) => score >= b.score);
  const idxAtual = proximo ? BOSSES.indexOf(proximo) : BOSSES.length;
  const anterior = idxAtual > 0 ? BOSSES[idxAtual - 1] : null;
  const baseScore = anterior?.score || 0;
  const alvoScore = proximo?.score || BOSSES[BOSSES.length - 1].score;
  const progresso = proximo
    ? Math.min(100, Math.max(0, ((score - baseScore) / (alvoScore - baseScore)) * 100))
    : 100;
  return {
    derrotados,
    proximo,
    idx: idxAtual,
    total: BOSSES.length,
    progresso,
    completou: !proximo,
  };
}

const STREAK_TIERS = [
  { dia: 1,  pts: 5 },
  { dia: 2,  pts: 5 },
  { dia: 3,  pts: 10 },
  { dia: 5,  pts: 15 },
  { dia: 7,  pts: 25 },
  { dia: 14, pts: 50 },
  { dia: 21, pts: 75 },
  { dia: 30, pts: 100 },
];

export function streakBonus(dias) {
  let pts = 5;
  for (const tier of STREAK_TIERS) {
    if (dias >= tier.dia) pts = tier.pts;
  }
  return pts;
}

export const hoje = () => new Date().toISOString().slice(0, 10);
export const ontem = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function novoPerfil(apelido) {
  return {
    id: uid(),
    apelido: apelido.trim().slice(0, 20),
    criadoEm: new Date().toISOString(),
    score: 0,
    streak: 0,
    melhorStreak: 0,
    ultimaPontuacao: null,
    lancheiraDoDia: null,
    historico: [],
    skinAtiva: 'laranja',
    cenarioAtivo: 'default',
    skinsDesbloqueadas: ['laranja'],
    cenariosDesbloqueados: ['default'],
    bossesDerrotados: [],
    tutorialVisto: false,
  };
}

export function marcarTutorialVisto(perfil) {
  perfil.tutorialVisto = true;
  Store.atualizar(perfil);
}

export const Store = {
  listar() {
    try { return JSON.parse(localStorage.getItem(STORAGE.PROFILES) || '[]'); }
    catch { return []; }
  },
  salvar(perfis) {
    localStorage.setItem(STORAGE.PROFILES, JSON.stringify(perfis));
  },
  getAtivoId() {
    return localStorage.getItem(STORAGE.ACTIVE);
  },
  setAtivoId(id) {
    if (id) localStorage.setItem(STORAGE.ACTIVE, id);
    else localStorage.removeItem(STORAGE.ACTIVE);
  },
  getAtivo() {
    const id = this.getAtivoId();
    if (!id) return null;
    return this.listar().find((p) => p.id === id) || null;
  },
  atualizar(perfil) {
    const perfis = this.listar();
    const i = perfis.findIndex((p) => p.id === perfil.id);
    if (i >= 0) perfis[i] = perfil;
    else perfis.push(perfil);
    this.salvar(perfis);
  },
  criar(apelido) {
    const p = novoPerfil(apelido);
    const perfis = this.listar();
    perfis.push(p);
    this.salvar(perfis);
    this.setAtivoId(p.id);
    return p;
  },
  remover(id) {
    const perfis = this.listar().filter((p) => p.id !== id);
    this.salvar(perfis);
    if (this.getAtivoId() === id) this.setAtivoId(perfis[0]?.id || null);
  },
  trocar(id) {
    if (this.listar().find((p) => p.id === id)) this.setAtivoId(id);
  },
};

export function calcularPontos(lancheira) {
  const breakdown = [];
  if (!lancheira.length) return { total: 0, breakdown };

  const totalKcal = lancheira.reduce((s, i) => s + i.kcal, 0);
  const categorias = new Set(lancheira.map((i) => i.categoria));
  const temUltra = categorias.has('Proteínas e Gorduras Ultraprocessadas');
  const temDoce = categorias.has('Doces e Outros');

  let pts = 10;
  breakdown.push({ label: 'Lancheira montada', pts: 10 });

  if (totalKcal >= 300 && totalKcal <= 400) {
    pts += 15;
    breakdown.push({ label: 'No alvo de calorias', pts: 15 });
  } else if (totalKcal >= 200 && totalKcal < 300) {
    pts += 8;
    breakdown.push({ label: 'Quase no alvo', pts: 8 });
  } else if (totalKcal > 400) {
    pts -= 5;
    breakdown.push({ label: 'Acima do limite', pts: -5 });
  }

  if (categorias.size >= 4) {
    pts += 8;
    breakdown.push({ label: 'Variedade (4+ grupos)', pts: 8 });
  } else if (categorias.size >= 3) {
    pts += 5;
    breakdown.push({ label: 'Variedade (3 grupos)', pts: 5 });
  }

  if (temUltra) {
    pts -= 5;
    breakdown.push({ label: 'Ultraprocessado', pts: -5 });
  }

  if (!temUltra && !temDoce && lancheira.length >= 3) {
    pts += 10;
    breakdown.push({ label: 'Só naturais', pts: 10 });
  }

  return { total: Math.max(0, pts), breakdown };
}

export function avaliarStreak(perfil) {
  const ultima = perfil.ultimaPontuacao?.slice(0, 10);
  if (!ultima) return { streak: 1, bonus: 5, status: 'inicio' };
  if (ultima === hoje()) return { streak: perfil.streak, bonus: 0, status: 'jaPontuou' };
  if (ultima === ontem()) {
    const novo = perfil.streak + 1;
    return { streak: novo, bonus: streakBonus(novo), status: 'continuou' };
  }
  return { streak: 1, bonus: 5, status: 'zerou' };
}

export function jaPontuouHoje(perfil) {
  return perfil.ultimaPontuacao?.slice(0, 10) === hoje();
}

function verificarDesbloqueios(perfil) {
  const novasSkins = REWARDS.skins.filter(
    (s) => perfil.score >= s.cost && !perfil.skinsDesbloqueadas.includes(s.id)
  );
  const novosCenarios = REWARDS.scenes.filter(
    (c) => perfil.score >= c.cost && !perfil.cenariosDesbloqueados.includes(c.id)
  );
  if (!perfil.bossesDerrotados) perfil.bossesDerrotados = [];
  const novosBosses = BOSSES.filter(
    (b) => perfil.score >= b.score && !perfil.bossesDerrotados.includes(b.id)
  );
  perfil.skinsDesbloqueadas.push(...novasSkins.map((s) => s.id));
  perfil.cenariosDesbloqueados.push(...novosCenarios.map((c) => c.id));
  perfil.bossesDerrotados.push(...novosBosses.map((b) => b.id));
  return { skins: novasSkins, cenarios: novosCenarios, bosses: novosBosses };
}

export function avaliarLancheira(itens) {
  if (!itens?.length) return { nivel: 'vazia', nome: 'Vazia', emoji: '🫥', cor: 'neutral' };
  const total = itens.reduce((s, i) => s + i.kcal, 0);
  const categorias = new Set(itens.map((i) => i.categoria));
  const ultra = categorias.has('Proteínas e Gorduras Ultraprocessadas');
  const doce = categorias.has('Doces e Outros');

  if (total >= 300 && total <= 400 && !ultra && categorias.size >= 3) {
    return { nivel: 'excelente', nome: 'Excelente!', emoji: '🌟', cor: 'success', total, categorias: categorias.size };
  }
  if (total >= 300 && total <= 400 && !ultra) {
    return { nivel: 'muitoBoa', nome: 'Muito boa', emoji: '💚', cor: 'success', total, categorias: categorias.size };
  }
  if (total >= 200 && total < 300 && !ultra) {
    return { nivel: 'boa', nome: 'Boa', emoji: '👍', cor: 'warn', total, categorias: categorias.size };
  }
  if (total > 400 || (ultra && total > 300)) {
    return { nivel: 'pesada', nome: 'Pesada', emoji: '⚠️', cor: 'danger', total, categorias: categorias.size };
  }
  if (total < 200) {
    return { nivel: 'leve', nome: 'Muito leve', emoji: '🪶', cor: 'warn', total, categorias: categorias.size };
  }
  if (ultra) {
    return { nivel: 'industrializada', nome: 'Industrializada', emoji: '🥤', cor: 'warn', total, categorias: categorias.size };
  }
  if (doce && !ultra) {
    return { nivel: 'docinha', nome: 'Docinha', emoji: '🍪', cor: 'warn', total, categorias: categorias.size };
  }
  return { nivel: 'ok', nome: 'OK', emoji: '🙂', cor: 'neutral', total, categorias: categorias.size };
}

export function salvarLancheira(perfil, lancheira) {
  const pontuacao = calcularPontos(lancheira);
  const streakRes = avaliarStreak(perfil);
  const ganho = pontuacao.total + streakRes.bonus;

  perfil.score += ganho;
  perfil.streak = streakRes.streak;
  perfil.melhorStreak = Math.max(perfil.melhorStreak || 0, perfil.streak);
  perfil.ultimaPontuacao = new Date().toISOString();
  perfil.lancheiraDoDia = {
    data: hoje(),
    itens: lancheira,
    pontos: ganho,
    timestamp: new Date().toISOString(),
  };
  perfil.historico.unshift({
    data: hoje(),
    itens: lancheira,
    pontos: ganho,
    timestamp: new Date().toISOString(),
  });
  perfil.historico = perfil.historico.slice(0, 60);

  const desbloqueios = verificarDesbloqueios(perfil);
  Store.atualizar(perfil);

  return { pontuacao, streakRes, ganho, desbloqueios };
}

export function atualizarLancheira(perfil, lancheira) {
  perfil.lancheiraDoDia = {
    ...perfil.lancheiraDoDia,
    data: hoje(),
    itens: lancheira,
    timestamp: new Date().toISOString(),
  };
  Store.atualizar(perfil);
}

export function ativarSkin(perfil, id) {
  if (!perfil.skinsDesbloqueadas.includes(id)) return false;
  perfil.skinAtiva = id;
  Store.atualizar(perfil);
  return true;
}

export function ativarCenario(perfil, id) {
  if (!perfil.cenariosDesbloqueados.includes(id)) return false;
  perfil.cenarioAtivo = id;
  Store.atualizar(perfil);
  return true;
}

const FAKES_KEY = 'aa_fakes_v1';
const FAKES_COUNTER_KEY = 'aa_fakes_counter';
const EVOLUI_A_CADA = 3;
const NOMES_FAKE = [
  { apelido: 'Ana Beatriz', skin: 'rosa' },
  { apelido: 'Lucas',       skin: 'azul' },
  { apelido: 'Sofia',       skin: 'verde' },
  { apelido: 'Pedrinho',    skin: 'laranja' },
  { apelido: 'Bia',         skin: 'rosa' },
  { apelido: 'Davi',        skin: 'azul' },
  { apelido: 'Helena',      skin: 'roxo' },
  { apelido: 'Gabi',        skin: 'verde' },
  { apelido: 'Mateus',      skin: 'laranja' },
  { apelido: 'Júlia',       skin: 'roxo' },
  { apelido: 'Caio',        skin: 'azul' },
  { apelido: 'Larissa',     skin: 'rosa' },
  { apelido: 'Bruno',       skin: 'laranja' },
  { apelido: 'Vitória',     skin: 'verde' },
  { apelido: 'Enzo',        skin: 'azul' },
  { apelido: 'Maria Clara', skin: 'rosa' },
  { apelido: 'Rafa',        skin: 'verde' },
  { apelido: 'Yasmin',      skin: 'roxo' },
];

function aleatorio(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function novoFake(nome, scoreBase) {
  const variacao = aleatorio(-60, 60);
  const score = Math.max(5, scoreBase + variacao);
  const streak = aleatorio(0, 12);
  return {
    id: 'fake_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
    apelido: nome.apelido,
    skinAtiva: nome.skin,
    score,
    streak,
    melhorStreak: Math.max(streak, aleatorio(streak, streak + 18)),
    fake: true,
  };
}

function obterFakes(scoreReferencia) {
  let fakes = [];
  try {
    fakes = JSON.parse(localStorage.getItem(FAKES_KEY)) || [];
  } catch {
    fakes = [];
  }

  if (!fakes.length) {
    const escolhidos = [...NOMES_FAKE].sort(() => Math.random() - 0.5).slice(0, 12);
    const base = Math.max(scoreReferencia, 80);
    fakes = escolhidos.map((n) => novoFake(n, aleatorio(20, base + 200)));
  }

  const contador = (parseInt(localStorage.getItem(FAKES_COUNTER_KEY), 10) || 0) + 1;
  localStorage.setItem(FAKES_COUNTER_KEY, String(contador));

  if (contador % EVOLUI_A_CADA === 0) {
    for (const f of fakes) {
      if (Math.random() < 0.35) {
        f.score += aleatorio(5, 30);
        if (Math.random() < 0.30) {
          f.streak = (f.streak || 0) + 1;
          f.melhorStreak = Math.max(f.melhorStreak || 0, f.streak);
        }
      }
    }
  }

  if (scoreReferencia >= 20) {
    fakes.sort((a, b) => Math.abs(a.score - scoreReferencia) - Math.abs(b.score - scoreReferencia));
    const ajustar = Math.min(4, fakes.length);
    for (let i = 0; i < ajustar; i++) {
      const distancia = Math.max(scoreReferencia * 0.6, 100);
      if (Math.abs(fakes[i].score - scoreReferencia) > distancia) {
        const direcao = Math.random() < 0.5 ? -1 : 1;
        fakes[i].score = Math.max(5, scoreReferencia + direcao * aleatorio(15, Math.floor(distancia)));
      }
    }
  }

  localStorage.setItem(FAKES_KEY, JSON.stringify(fakes));
  return fakes;
}

export function leaderboard(scoreReferencia = 0) {
  const reais = Store.listar();
  const fakes = obterFakes(scoreReferencia);
  return [...reais, ...fakes]
    .sort((a, b) => b.score - a.score || (b.streak || 0) - (a.streak || 0))
    .map((p, i) => ({
      pos: i + 1,
      id: p.id,
      apelido: p.apelido,
      score: p.score,
      streak: p.streak || 0,
      melhorStreak: p.melhorStreak || 0,
      skin: REWARDS.skins.find((s) => s.id === p.skinAtiva) || REWARDS.skins[0],
      fake: !!p.fake,
    }));
}

export function ehHojeIgual(perfil) {
  return perfil.lancheiraDoDia?.data === hoje();
}
