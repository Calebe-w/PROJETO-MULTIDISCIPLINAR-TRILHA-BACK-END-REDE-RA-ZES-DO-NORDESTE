# API Back-end - Rede de Lanchonetes Multicanal

API REST desenvolvida para uma rede de lanchonetes. O sistema possui suporte para múltiplos canais de venda, como aplicativo, totem interativo, balcão, retirada (pickup) e portal web.
O projeto foca no fluxo crítico de pedido de itens do cardápio, prosseguindo para o processamento de pagamento simulado e alterando o status conforme a evolução do preparo até a entrega. Implementou-se também o controle de estoque, sistema de fidelidade para os clientes e segurança da informação em aderência à LGPD com autenticação baseada em JWT.
Trata-se de um projeto acadêmico construído com Node.js, Prisma ORM e banco de dados SQLite, além de possuir documentação OpenAPI/Swagger para os contratos.

## 1. Requisitos para Execução
O ambiente de execução requer Node.js na versão 18 ou superior. Não é necessária a instalação de um servidor de banco de dados externo, pois o projeto utiliza o banco de dados local SQLite, que já vem embutido por padrão. O mapeamento relacional é realizado através do Prisma ORM na versão 5. Caso haja interesse em utilizar um banco de dados relacional robusto (PostgreSQL ou MySQL), basta alterar a string de conexão no arquivo de ambiente.

## 2. Como Inicializar o Projeto
No terminal do sistema operacional, execute a instalação das dependências com "npm install".
Crie uma cópia do arquivo de configuração executando a duplicação do arquivo .env.example e renomeando a cópia para .env.
Para estruturar e popular o banco de dados, execute os três comandos a seguir sequencialmente:
npm run db:generate
npm run db:migrate
npm run db:seed
Ao final, inicialize o servidor com o comando "npm start".
O servidor executará os serviços na porta 3000 localmente. Alternativamente, é possível utilizar o script unificado "npm run setup" para realizar as ações de banco de dados em um único comando após configurar o arquivo de ambiente.

## 3. Documentação Swagger
A documentação interativa detalhando os contratos (request e response) dos endpoints pode ser acessada em http://localhost:3000/docs. Recomenda-se também a leitura do arquivo raiz openapi.yaml, no qual a estrutura declarativa das rotas está redigida de forma oficial.

## 4. Usuários Pré-Cadastrados para Teste
O script de população de dados gerou contas para facilitar os testes da equipe avaliadora. A senha de acesso padronizada para todas as contas é Senha@123.
As credenciais pré-existentes incluem os e-mails: admin@lanchonete.com (com permissões da classe ADMIN), gerente@lanchonete.com (com permissões da classe GERENTE), cozinha@lanchonete.com (com acesso apropriado à classe COZINHA) e o perfil padrão cliente@exemplo.com (limitado pela classe CLIENTE).

## 5. Orientações de Teste Funcional
É recomendada a utilização do software Postman para inspecionar os endpoints. A coleção pré-configurada encontra-se disponibilizada no diretório /postman, por meio do arquivo colecao.json. A estrutura da coleção possui tratamento de variáveis dinâmicas de ambiente, de modo que os tokens de autorização são capturados e utilizados automaticamente nas execuções que sucedem o consumo da rota de Autenticação.

## 6. Rotas Principais da API
Para o registro e autenticação, os endpoints estão em POST /api/auth/register e POST /api/auth/login.
Os dados dos usuários podem ser manuseados a partir do endpoint /api/usuarios, possuindo restrições baseadas no privilégio em uso. A base de itens, controle de unidades e contabilidade de estoque pertencem às divisões em /api/produtos, /api/unidades e /api/estoque.
Para orquestrar os processos do sistema de vendas, utiliza-se a requisição POST em /api/pedidos garantindo a passagem do respectivo canal de origem no corpo do cadastro. Para fazer avançar o progresso constata-se a utilização de PATCH na rota /api/pedidos/ID/status. O mock transacional do pagamento é invocado no direcionamento POST via /api/pagamentos.

## 7. Padronização de Retorno de Erros
Com vistas ao controle e manutenção, os blocos estruturais do software que levantam exceções, respondem uniformemente à requisição. O modelo adota um pacote textual em formatação json contendo a indicação da falha generalizada (error), seu detalhamento técnico ou log de regra ferida (message), os possíveis detalhes originados pela requisição indevida, seguido da marca temporal, da referência abstrata do caminho roteador (path) e do tracking interno (requestId).

## 8. Segurança Lógica e Diretrizes LGPD
As credenciais dos usuários encontram-se protegidas por hash no sistema, suportado pela criptografia natural do pacote bcrypt, impedindo que vazamentos permitam seu conhecimento reverso. O mecanismo de permissões é validado por escopo JWT que viaja encriptado entre o servidor e os parceiros interacionais, sendo extraído pelo middleware de Autenticação. O acumulado de premiação via sistema de fidelização da lanchonete opera restrito, mediante coleta prévia e gravada de consentimento autoral (conforme especificações da LGPD). Processos do banco de dados disfarçam ou isolam identidades ao longo dos agrupamentos estatísticos, para o qual adicionou-se uma política abrangente de Log de Auditoria que garante a segurança técnica dos acessos realizados.

## 9. Repositório
https://github.com/Calebe-w/PROJETO-MULTIDISCIPLINAR-TRILHA-BACK-END-REDE-RA-ZES-DO-NORDESTE 

