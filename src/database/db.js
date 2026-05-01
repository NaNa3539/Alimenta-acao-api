const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.message);
  } else {
    if (process.env.NODE_ENV !== 'test') {
  console.log('Banco SQLite conectado com sucesso.');
}
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS alimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      calorias INTEGER NOT NULL,
      proteina REAL NOT NULL,
      carboidrato REAL NOT NULL,
      gordura REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lancheiras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_criacao TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lancheira_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lancheira_id INTEGER NOT NULL,
      alimento_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      FOREIGN KEY (lancheira_id) REFERENCES lancheiras(id),
      FOREIGN KEY (alimento_id) REFERENCES alimentos(id)
    )
  `);

  db.get(`SELECT COUNT(*) AS total FROM alimentos`, (err, row) => {
    if (row.total === 0) {
      const inserir = db.prepare(`
        INSERT INTO alimentos 
        (nome, categoria, calorias, proteina, carboidrato, gordura)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const alimentos = [
        ['Maçã', 'Fruta', 52, 0.3, 14, 0.2],
        ['Banana', 'Fruta', 89, 1.1, 23, 0.3],
        ['Pão integral', 'Carboidrato', 247, 13, 41, 4.2],
        ['Queijo branco', 'Proteína', 264, 17, 3, 20],
        ['Iogurte natural', 'Laticínio', 61, 3.5, 4.7, 3.3],
        ['Suco de laranja', 'Bebida', 45, 0.7, 10.4, 0.2],
        ['Ovo cozido', 'Proteína', 155, 13, 1.1, 11],
        ['Granola', 'Cereal', 471, 10, 64, 20],
        ['Frango desfiado', 'Proteína', 165, 31, 0, 3.6],
        ['Cenoura', 'Legume', 41, 0.9, 10, 0.2]
      ];

      alimentos.forEach((alimento) => inserir.run(alimento));
      inserir.finalize();

      console.log('Alimentos iniciais cadastrados.');
    }
  });
});

module.exports = db;