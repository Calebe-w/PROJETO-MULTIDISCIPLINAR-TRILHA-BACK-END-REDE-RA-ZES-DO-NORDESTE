# DER — Diagrama Entidade-Relacionamento

Modelo de dados da API (compatível com o schema Prisma em
[`prisma/schema.prisma`](../prisma/schema.prisma)). Renderize o diagrama abaixo
no GitHub ou em https://mermaid.live.

```mermaid
erDiagram
    USUARIO ||--o{ PEDIDO : "faz"
    USUARIO ||--o| CONTA_FIDELIDADE : "possui"
    USUARIO ||--o{ LOG_AUDITORIA : "gera"
    USUARIO }o--o| UNIDADE : "trabalha em"

    UNIDADE ||--o{ ESTOQUE : "mantém"
    UNIDADE ||--o{ PEDIDO : "recebe"

    PRODUTO ||--o{ ESTOQUE : "está em"
    PRODUTO ||--o{ ITEM_PEDIDO : "compõe"

    ESTOQUE ||--o{ MOVIMENTACAO_ESTOQUE : "registra"

    PEDIDO ||--|{ ITEM_PEDIDO : "contém"
    PEDIDO ||--o{ PAGAMENTO : "recebe"
    PEDIDO ||--o{ MOVIMENTACAO_FIDELIDADE : "credita"

    CONTA_FIDELIDADE ||--o{ MOVIMENTACAO_FIDELIDADE : "tem"

    USUARIO {
        int id PK
        string nome
        string email UK
        string senhaHash
        string perfil "ADMIN|GERENTE|ATENDENTE|COZINHA|CLIENTE"
        bool consentimentoLGPD
        datetime consentimentoEm
        int unidadeId FK "nullable"
    }
    UNIDADE {
        int id PK
        string nome
        string cidade
        string endereco
        bool ativo
    }
    PRODUTO {
        int id PK
        string nome
        string categoria "LANCHE|BEBIDA|ACOMPANHAMENTO|SOBREMESA"
        float preco
        bool ativo
    }
    ESTOQUE {
        int id PK
        int unidadeId FK
        int produtoId FK
        int quantidade
    }
    MOVIMENTACAO_ESTOQUE {
        int id PK
        int estoqueId FK
        string tipo "ENTRADA|SAIDA"
        int quantidade
        int usuarioId FK "nullable"
    }
    PEDIDO {
        int id PK
        int clienteId FK
        int unidadeId FK
        string canalPedido "APP|TOTEM|BALCAO|PICKUP|WEB"
        string status "AGUARDANDO_PAGAMENTO|PAGO|EM_PREPARO|PRONTO|ENTREGUE|CANCELADO"
        float total
    }
    ITEM_PEDIDO {
        int id PK
        int pedidoId FK
        int produtoId FK
        int quantidade
        float precoUnitario
    }
    PAGAMENTO {
        int id PK
        int pedidoId FK
        string status "PENDENTE|APROVADO|RECUSADO"
        string metodo "MOCK|PIX|CARTAO"
        float valor
        string transacaoId
        string payloadEnviado
        string payloadRetorno
    }
    CONTA_FIDELIDADE {
        int id PK
        int clienteId FK,UK
        int saldoPontos
    }
    MOVIMENTACAO_FIDELIDADE {
        int id PK
        int contaId FK
        string tipo "ACUMULO|RESGATE"
        int pontos
        int pedidoId FK "nullable"
    }
    LOG_AUDITORIA {
        int id PK
        int usuarioId FK "nullable"
        string acao
        string entidade
        string entidadeId
        string detalhes
        string ip
    }
```

## Cardinalidades e restrições principais

| Relacionamento                         | Cardinalidade | Restrição/Regra                                              |
|----------------------------------------|---------------|-------------------------------------------------------------|
| Unidade → Estoque                      | 1:N           | cada unidade tem **estoque próprio** por produto            |
| (Unidade, Produto) em Estoque          | —             | **UNIQUE(unidadeId, produtoId)**                            |
| Pedido → ItemPedido                    | 1:N           | pedido possui ao menos 1 item                               |
| Pedido → Pagamento                     | 1:N           | **pagamento desacoplado** (entidade própria; histórico)     |
| Usuário → ContaFidelidade              | 1:1           | **UNIQUE(clienteId)**                                       |
| Produto (exclusão)                     | —             | exclusão **lógica** (`ativo=false`) p/ preservar histórico  |

> Observação: o SQLite não possui tipo `ENUM` nativo; os enums são armazenados
> como `String` e validados na aplicação ([`src/domain/enums.js`](../src/domain/enums.js)).
> `payloadEnviado`/`payloadRetorno` e `detalhes` são JSON serializado em texto.
