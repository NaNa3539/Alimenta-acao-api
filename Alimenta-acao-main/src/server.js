const express = require('express');
const db = require('./database/db');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/api/alimentos', (req, res) => {
  const caminhoArquivo = path.join(__dirname, '..', 'public', 'alimentos.json');

  fs.readFile(caminhoArquivo, 'utf8', (err, data) => {
    if (err) {
      console.error('Erro ao ler alimentos.json:', err);
      res.status(500).json({ error: 'Erro ao ler o arquivo de alimentos' });
      return;
    }

    try {
      const alimentos = JSON.parse(data);
      res.json(alimentos);
    } catch (parseError) {
      console.error('Erro no JSON:', parseError);
      res.status(500).json({ error: 'Erro de formato no alimentos.json' });
    }
  });
});

app.post('/api/lancheira', (req, res) => {
  const { itens } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ error: 'Nenhum item enviado' });
  }

  const dataCriacao = new Date().toISOString();

  db.run(
    `INSERT INTO lancheiras (data_criacao) VALUES (?)`,
    [dataCriacao],
    function (err) {
      if (err) {
        console.error('Erro ao criar lancheira:', err.message);
        return res.status(500).json({ error: 'Erro ao criar lancheira' });
      }

      const lancheiraId = this.lastID;

      const stmt = db.prepare(`
        INSERT INTO lancheira_itens (lancheira_id, alimento_id, quantidade)
        VALUES (?, ?, ?)
      `);

      itens.forEach((item) => {
        stmt.run(lancheiraId, item.id, item.quantidade || 1);
      });

      stmt.finalize();

      res.status(201).json({
        message: 'Lancheira salva com sucesso',
        lancheiraId: lancheiraId
      });
    }
  );
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
