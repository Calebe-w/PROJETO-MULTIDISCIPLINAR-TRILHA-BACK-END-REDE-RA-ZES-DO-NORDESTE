-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'CLIENTE',
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "consentimentoLGPD" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" DATETIME,
    "unidadeId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Usuario_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "endereco" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL DEFAULT 'LANCHE',
    "preco" REAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Estoque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "unidadeId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Estoque_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentacaoEstoque" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "estoqueId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "usuarioId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimentacaoEstoque_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "Estoque" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MovimentacaoEstoque_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "canalPedido" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO',
    "total" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pedidoId" INTEGER NOT NULL,
    "produtoId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" REAL NOT NULL,
    CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemPedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pedidoId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "metodo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "transacaoId" TEXT,
    "payloadEnviado" TEXT,
    "payloadRetorno" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pagamento_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContaFidelidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "saldoPontos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContaFidelidade_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentacaoFidelidade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contaId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL,
    "pedidoId" INTEGER,
    "descricao" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MovimentacaoFidelidade_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "ContaFidelidade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MovimentacaoFidelidade_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "detalhes" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LogAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_perfil_idx" ON "Usuario"("perfil");

-- CreateIndex
CREATE INDEX "Produto_categoria_idx" ON "Produto"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "Estoque_unidadeId_produtoId_key" ON "Estoque"("unidadeId", "produtoId");

-- CreateIndex
CREATE INDEX "Pedido_canalPedido_idx" ON "Pedido"("canalPedido");

-- CreateIndex
CREATE INDEX "Pedido_status_idx" ON "Pedido"("status");

-- CreateIndex
CREATE INDEX "Pagamento_pedidoId_idx" ON "Pagamento"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "ContaFidelidade_clienteId_key" ON "ContaFidelidade"("clienteId");

-- CreateIndex
CREATE INDEX "LogAuditoria_acao_idx" ON "LogAuditoria"("acao");

-- CreateIndex
CREATE INDEX "LogAuditoria_entidade_idx" ON "LogAuditoria"("entidade");
