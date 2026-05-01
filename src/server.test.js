const request = require('supertest');
const app = require('./server');

console.log(typeof app);

describe('POST /api/lancheiras', () => {
  it('deve criar uma lancheira com sucesso', async () => {
    const response = await request(app)
      .post('/api/lancheiras')
      .send({
        itens: [{ nome: 'Maçã' }]
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.mensagem).toBe('Lancheira salva com sucesso!');
  });
});