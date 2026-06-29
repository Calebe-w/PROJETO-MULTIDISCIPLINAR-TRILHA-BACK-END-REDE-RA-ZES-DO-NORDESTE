// ======================================================================
// Seed - popula o banco com dados de demonstracao para testes/Postman.
// Usuarios (senha de todos: Senha@123):
//   admin@lanchonete.com    -> ADMIN
//   gerente@lanchonete.com  -> GERENTE (Unidade Centro)
//   cozinha@lanchonete.com  -> COZINHA (Unidade Centro)
//   cliente@exemplo.com     -> CLIENTE (com consentimento LGPD)
// ======================================================================
const bcrypt = require('bcryptjs');
const prisma = require('../src/infrastructure/prisma');

async function main() {
  console.log('Iniciando seed...');

  const senhaHash = await bcrypt.hash('Senha@123', 10);

  // ----- Unidades -----
  const centro = await prisma.unidade.upsert({
    where: { id: 1 },
    update: {},
    create: { nome: 'Lanchonete Centro', cidade: 'Sao Paulo', endereco: 'Rua A, 100' },
  });
  const zonaSul = await prisma.unidade.upsert({
    where: { id: 2 },
    update: {},
    create: { nome: 'Lanchonete Zona Sul', cidade: 'Sao Paulo', endereco: 'Av. B, 2000' },
  });

  // ----- Usuarios -----
  await prisma.usuario.upsert({
    where: { email: 'admin@lanchonete.com' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@lanchonete.com', senhaHash, perfil: 'ADMIN' },
  });
  await prisma.usuario.upsert({
    where: { email: 'gerente@lanchonete.com' },
    update: {},
    create: { nome: 'Gerente Centro', email: 'gerente@lanchonete.com', senhaHash, perfil: 'GERENTE', unidadeId: centro.id },
  });
  await prisma.usuario.upsert({
    where: { email: 'cozinha@lanchonete.com' },
    update: {},
    create: { nome: 'Cozinha Centro', email: 'cozinha@lanchonete.com', senhaHash, perfil: 'COZINHA', unidadeId: centro.id },
  });
  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: {
      nome: 'Maria Cliente',
      email: 'cliente@exemplo.com',
      senhaHash,
      perfil: 'CLIENTE',
      consentimentoLGPD: true,
      consentimentoEm: new Date(),
    },
  });
  await prisma.contaFidelidade.upsert({
    where: { clienteId: cliente.id },
    update: {},
    create: { clienteId: cliente.id },
  });

  // ----- Produtos (catalogo) -----
  const produtosBase = [
    { nome: 'X-Burger', descricao: 'Hamburguer artesanal', categoria: 'LANCHE', preco: 24.9 },
    { nome: 'X-Salada', descricao: 'Hamburguer com salada', categoria: 'LANCHE', preco: 27.9 },
    { nome: 'Batata Frita', descricao: 'Porcao individual', categoria: 'ACOMPANHAMENTO', preco: 14.9 },
    { nome: 'Refrigerante Lata', descricao: '350ml', categoria: 'BEBIDA', preco: 7.5 },
    { nome: 'Suco Natural', descricao: 'Laranja 300ml', categoria: 'BEBIDA', preco: 9.9 },
    { nome: 'Milkshake', descricao: 'Chocolate 400ml', categoria: 'SOBREMESA', preco: 18.0 },
  ];

  const produtos = [];
  for (let i = 0; i < produtosBase.length; i += 1) {
    const p = await prisma.produto.upsert({
      where: { id: i + 1 },
      update: {},
      create: produtosBase[i],
    });
    produtos.push(p);
  }

  // ----- Estoque por unidade -----
  for (const unidade of [centro, zonaSul]) {
    for (const produto of produtos) {
      await prisma.estoque.upsert({
        where: { unidadeId_produtoId: { unidadeId: unidade.id, produtoId: produto.id } },
        update: {},
        // Centro com bastante estoque; Zona Sul com menos (para testar 409).
        create: {
          unidadeId: unidade.id,
          produtoId: produto.id,
          quantidade: unidade.id === centro.id ? 100 : 5,
        },
      });
    }
  }

  console.log('Seed concluido com sucesso.');
  console.log('Unidades: 2 | Produtos: 6 | Usuarios: 4 (senha: Senha@123)');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
