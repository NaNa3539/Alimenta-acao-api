const express = require('express');
let db;

if (process.env.NODE_ENV !== 'test') {
  db = require('./database/db');
}
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

app.post('/api/lancheiras', (req, res) => {
  const { itens } = req.body;

  if (!itens || itens.length === 0) {
    return res.status(400).json({ error: 'Nenhum item enviado' });
  }

  const novaLancheira = {
    id: Date.now(),
    itens,
    dataCriacao: new Date().toISOString()
  };

  res.status(201).json({
    mensagem: 'Lancheira salva com sucesso!',
    lancheira: novaLancheira
  });
 });

if (require.main === module) {

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });
}

module.exports = app;