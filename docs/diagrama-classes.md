# Diagrama de Classes (visão de domínio)

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string email
        -string senhaHash
        +string perfil
        +bool consentimentoLGPD
        +datetime consentimentoEm
        +autenticar(senha) bool
    }
    class Unidade {
        +int id
        +string nome
        +string cidade
        +bool ativo
        +cardapio() Item[]
    }
    class Produto {
        +int id
        +string nome
        +string categoria
        +float preco
        +bool ativo
    }
    class Estoque {
        +int id
        +int quantidade
        +temDisponibilidade(qtd) bool
        +baixar(qtd)
        +repor(qtd)
    }
    class MovimentacaoEstoque {
        +string tipo
        +int quantidade
        +string motivo
    }
    class Pedido {
        +int id
        +string canalPedido
        +string status
        +float total
        +calcularTotal()
        +podeTransicionar(novoStatus) bool
    }
    class ItemPedido {
        +int quantidade
        +float precoUnitario
        +subtotal() float
    }
    class Pagamento {
        +string status
        +string metodo
        +float valor
        +string transacaoId
        +string payloadEnviado
        +string payloadRetorno
    }
    class ContaFidelidade {
        +int saldoPontos
        +acumular(pontos)
        +resgatar(pontos)
    }
    class MovimentacaoFidelidade {
        +string tipo
        +int pontos
    }
    class LogAuditoria {
        +string acao
        +string entidade
        +string detalhes
    }

    Usuario "1" --> "0..*" Pedido : faz
    Usuario "1" --> "0..1" ContaFidelidade : possui
    Usuario "0..*" --> "0..1" Unidade : trabalha
    Unidade "1" --> "0..*" Estoque : mantem
    Unidade "1" --> "0..*" Pedido : recebe
    Produto "1" --> "0..*" Estoque : em
    Estoque "1" --> "0..*" MovimentacaoEstoque : registra
    Pedido "1" --> "1..*" ItemPedido : contem
    Pedido "1" --> "0..*" Pagamento : recebe
    ItemPedido "0..*" --> "1" Produto : referencia
    ContaFidelidade "1" --> "0..*" MovimentacaoFidelidade : tem
    Usuario "1" --> "0..*" LogAuditoria : gera
```

> Os métodos representam o comportamento conceitual do domínio. Na implementação,
> essas regras vivem na camada de **Application** (serviços) usando os tipos/regras
> da camada **Domain** (enums, máquina de estados, erros) — ver
> [`src/application/`](../src/application) e [`src/domain/`](../src/domain).
