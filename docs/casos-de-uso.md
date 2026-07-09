# Diagrama de Casos de Uso + Descrição de Feature

## 1. Diagrama de Casos de Uso

```mermaid
flowchart LR
    cliente([Cliente<br/>App/Web/Totem])
    atendente([Atendente<br/>Balcão])
    cozinha([Cozinha])
    gerente([Gerente / Admin])
    gateway([Gateway de<br/>Pagamento - mock])

    subgraph Sistema [API Lanchonete]
        UC1((Autenticar))
        UC2((Consultar<br/>cardápio))
        UC3((Realizar<br/>pedido))
        UC4((Solicitar<br/>pagamento))
        UC5((Atualizar<br/>status do pedido))
        UC6((Gerir estoque))
        UC7((Gerir produtos<br/>e unidades))
        UC8((Acumular/<br/>resgatar pontos))
        UC9((Consultar<br/>pedidos por canal))
    end

    cliente --> UC1
    cliente --> UC2
    cliente --> UC3
    cliente --> UC4
    cliente --> UC8

    atendente --> UC1
    atendente --> UC3
    atendente --> UC5

    cozinha --> UC1
    cozinha --> UC5

    gerente --> UC1
    gerente --> UC5
    gerente --> UC6
    gerente --> UC7
    gerente --> UC9

    UC4 -.->|integra| gateway
    UC3 -.->|include| UC2
    UC4 -.->|include| UC3
```

- **UC3 (Realizar pedido)** *inclui* a consulta de disponibilidade (cardápio/estoque).
- **UC4 (Solicitar pagamento)** depende de um pedido existente (relação *include*).
- O **Gateway** é um ator externo (sistema), acionado pelo UC4.

## 2. Descrição de Feature (fluxo crítico): Realizar Pedido + Solicitar Pagamento

| Campo | Descrição |
|-------|-----------|
| **Nome** | Realizar pedido e solicitar pagamento (Fluxo A) |
| **Ator principal** | Cliente (App/Totem/Web) |
| **Atores secundários** | Gateway de pagamento (mock); Cozinha/Gerente (status) |
| **Pré-condições** | Cliente autenticado (JWT); unidade existente; produtos com estoque na unidade |
| **Pós-condições** | Pedido criado e pago; estoque baixado; pontos creditados (se consentimento); status avançado |

### Fluxo principal
1. Cliente autentica (`POST /api/auth/login`) e recebe o token.
2. Cliente consulta o cardápio da unidade (`GET /api/unidades/{id}/cardapio`).
3. Cliente cria o pedido informando **canalPedido**, unidade e itens
   (`POST /api/pedidos`).
4. O sistema valida itens, verifica estoque por unidade, calcula o total no
   servidor, dá baixa no estoque (transação) e cria o pedido com status
   `AGUARDANDO_PAGAMENTO`.
5. Cliente solicita o pagamento (`POST /api/pagamentos`), que envia o payload ao
   gateway externo (mock) e registra o retorno.
6. Se **aprovado**: pedido vai para `PAGO` e pontos de fidelidade são creditados.
7. Cozinha/Gerente avança o status: `EM_PREPARO → PRONTO → ENTREGUE`.

### Fluxos de exceção / regras de negócio
- **canalPedido ausente/ inválido** → `422 VALIDACAO`.
- **Produto/unidade inexistente** → `404 NAO_ENCONTRADO`.
- **Estoque insuficiente** → `409 ESTOQUE_INSUFICIENTE` (não cria o pedido; nada é baixado).
- **Pagamento recusado** → pedido permanece `AGUARDANDO_PAGAMENTO`; mensagem coerente.
- **Gateway indisponível (timeout)** → `409 GATEWAY_INDISPONIVEL`; pagamento gravado como `PENDENTE` (tolerância a falha).
- **Transição de status inválida** → `409 TRANSICAO_INVALIDA` (máquina de estados).
- **Cancelamento** → devolve o estoque (movimentação de ENTRADA/estorno).
- **Idempotência/consistência** → baixa de estoque e criação do pedido ocorrem na
  mesma transação (`prisma.$transaction`), evitando estado parcial.
