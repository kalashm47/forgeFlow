# ⚙️ ForgeFlow

> **Concurrent Order Processing API built with TypeScript, Node.js and PostgreSQL.**

O **ForgeFlow** é uma API de processamento de pedidos projetada para explorar, na prática, **Design Patterns, concorrência, Worker Threads, controle de estoque e consistência transacional**.

O projeto simula um sistema de processamento de pedidos capaz de lidar com múltiplas operações simultâneas, utilizando uma arquitetura preparada para processamento concorrente e diferentes estratégias de pagamento.

---

## 🧠 Sobre o projeto

Imagine um e-commerce recebendo centenas de pedidos simultaneamente.

O sistema precisa:

* processar diferentes tipos de pagamento;
* executar operações independentes concorrentemente;
* distribuir tarefas entre Workers;
* controlar um estoque compartilhado;
* impedir overselling;
* evitar inconsistências causadas por requisições simultâneas;
* manter o banco de dados consistente;
* permitir adicionar novos meios de pagamento sem modificar o núcleo do sistema.

O ForgeFlow foi criado para estudar e demonstrar esses problemas.

---

# 🏗️ Arquitetura

```text
                         ┌──────────────────┐
                         │      Client      │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    Fastify API   │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Order Controller │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   Order Service  │
                         └───────┬───┬──────┘
                                 │   │
                    ┌────────────┘   └─────────────┐
                    ▼                              ▼
          ┌──────────────────┐          ┌──────────────────┐
          │  Payment Factory │          │   Worker Pool    │
          └────────┬─────────┘          └────────┬─────────┘
                   │                             │
        ┌──────────┼──────────┐                  │
        ▼          ▼          ▼                  ▼
      PIX        CARD       CRYPTO           Workers
        │          │          │                  │
        └──────────┼──────────┘                  │
                   │                             │
                   └──────────────┬──────────────┘
                                  ▼
                         ┌──────────────────┐
                         │   PostgreSQL     │
                         └──────────────────┘
```

---

# 🎯 Objetivos

O principal objetivo é estudar como construir um backend que precise lidar com **processamento concorrente e estado compartilhado**.

### Design Pattern

Implementar o **Factory Pattern** para criação dos processadores de pagamento.

```text
PaymentProcessor
       │
       ├── PixProcessor
       ├── CreditCardProcessor
       ├── BankTransferProcessor
       └── CryptoProcessor
```

A aplicação não precisa conhecer diretamente qual implementação deve ser utilizada.

```text
Order
  │
  ▼
PaymentProcessorFactory
  │
  ├── PIX
  ├── CREDIT_CARD
  ├── BANK_TRANSFER
  └── CRYPTO
```

---

# ⚡ Concorrência

Um dos principais objetivos do projeto é explorar concorrência no Node.js.

O ForgeFlow utiliza:

* `Promise.all`
* Worker Threads
* Worker Pool
* Task Queue
* processamento concorrente
* controle de recursos

A ideia é distribuir tarefas:

```text
                    Task Queue
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Worker 1      Worker 2      Worker 3
          │             │             │
          ▼             ▼             ▼
       Order A       Order B       Order C
```

O número de Workers é limitado para evitar a criação indiscriminada de threads.

---

# 🧨 Race Conditions

O projeto possui um cenário específico para demonstrar **race conditions**.

Imagine:

```text
Estoque = 1

Request A ──────┐
                │
Request B ──────┼──► mesmo produto
                │
Request C ──────┘
```

Sem proteção adequada, duas requisições podem observar o mesmo estoque antes que uma delas atualize o banco.

Resultado:

```text
❌ Overselling
❌ Estoque inconsistente
❌ Pedidos inválidos
```

O sistema deverá garantir que uma operação concorrente respeite a quantidade real disponível.

---

# 🔒 Consistência

O PostgreSQL funciona como fonte de verdade para o estado do sistema.

As operações críticas utilizam mecanismos como:

```text
Database Transactions
Atomic Updates
Row-Level Locking
Optimistic Locking
Constraints
```

O objetivo é garantir:

```text
100 requisições simultâneas
          │
          ▼
    ┌─────────────┐
    │   Stock =   │
    │     10      │
    └──────┬──────┘
           │
           ▼
     ┌───────────┐
     │  10 OK    │
     │ 90 FAILED │
     └───────────┘
```

---

# 💳 Processamento de pagamentos

O sistema suporta diferentes estratégias de pagamento:

| Tipo          | Processor               |
| ------------- | ----------------------- |
| PIX           | `PixProcessor`          |
| Cartão        | `CreditCardProcessor`   |
| Transferência | `BankTransferProcessor` |
| Crypto        | `CryptoProcessor`       |

A criação dos processadores é responsabilidade da Factory.

Isso permite adicionar uma nova estratégia:

```text
PIX
CREDIT_CARD
BANK_TRANSFER
CRYPTO
PAYPAL
      ↓
Factory
```

sem precisar alterar toda a lógica de processamento de pedidos.

---

# 🗄️ Banco de dados

O sistema utiliza:

**PostgreSQL + Prisma**

Modelo conceitual:

```text
Customer
   │
   │ 1:N
   ▼
Order
   │
   ├────────────── 1:N ──────────────► OrderItem
   │                                      │
   │                                      │ N:1
   │                                      ▼
   │                                   Product
   │                                      │
   │                                      │ 1:1
   │                                      ▼
   │                                  Inventory
   │
   │ 1:1
   ▼
Payment
   │
   │ 1:N
   ▼
PaymentTransaction
```

O modelo foi pensado para separar:

* identidade do cliente;
* pedido;
* itens;
* produto;
* estoque;
* pagamento;
* tentativas de processamento.

---

# 📁 Estrutura

```text
forgeflow/
│
├── src/
│   ├── config/
│   │   └── env.ts
│   │
│   ├── concurrency/
│   │   ├── TaskQueue.ts
│   │   ├── WorkerManager.ts
│   │   └── WorkerPool.ts
│   │
│   ├── controllers/
│   │   └── OrderController.ts
│   │
│   ├── database/
│   │   └── prisma.ts
│   │
│   ├── domain/
│   │   ├── Order.ts
│   │   └── Payment.ts
│   │
│   ├── errors/
│   │   └── AppError.ts
│   │
│   ├── factories/
│   │   └── PaymentProcessorFactory.ts
│   │
│   ├── middlewares/
│   │   └── errorHandler.ts
│   │
│   ├── payments/
│   │   ├── PaymentProcessor.ts
│   │   ├── PixProcessor.ts
│   │   ├── CreditCardProcessor.ts
│   │   ├── BankTransferProcessor.ts
│   │   └── CryptoProcessor.ts
│   │
│   ├── repositories/
│   │   └── OrderRepository.ts
│   │
│   ├── routes/
│   │   └── orderRoutes.ts
│   │
│   ├── services/
│   │   └── OrderService.ts
│   │
│   ├── workers/
│   │   └── payment.worker.ts
│   │
│   └── server.ts
│
├── tests/
│   ├── concurrency/
│   │   ├── stock-race-condition.test.ts
│   │   └── worker-pool.test.ts
│   │
│   ├── integration/
│   │   └── orders.test.ts
│   │
│   └── unit/
│       ├── OrderService.test.ts
│       └── PaymentProcessorFactory.test.ts
│
├── prisma/
│   └── schema.prisma
│
├── docs/
│   ├── architecture.md
│   ├── concurrency.md
│   └── design-patterns.md
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

# 🔌 API

## Criar pedido

```http
POST /orders
```

Exemplo:

```json
{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "payment": {
    "type": "PIX"
  }
}
```

---

## Buscar pedido

```http
GET /orders/:id
```

---

## Processar pedido

```http
POST /orders/:id/process
```

---

## Processar pedidos em lote

```http
POST /orders/batch/process
```

Permite enviar múltiplos pedidos para processamento concorrente.

---

## Status dos Workers

```http
GET /workers/status
```

Exemplo:

```json
{
  "workers": 4,
  "busy": 2,
  "idle": 2,
  "queueSize": 17
}
```

---

## Teste de concorrência

```http
POST /test/concurrency
```

Endpoint destinado exclusivamente aos experimentos de concorrência.

Exemplo:

```json
{
  "initialStock": 10,
  "requests": 100,
  "successfulOrders": 10,
  "failedOrders": 90,
  "finalStock": 0
}
```

---

# 🧪 Testes

O projeto possui três categorias principais.

### Unit Tests

Testam componentes isoladamente.

```text
PaymentProcessorFactory
OrderService
```

### Integration Tests

Testam a interação entre:

```text
API
 ↓
Service
 ↓
Repository
 ↓
PostgreSQL
```

### Concurrency Tests

Testam especificamente:

```text
Race Conditions
Worker Pool
Task Queue
Stock Reservation
Concurrent Orders
```

Um dos principais testes será:

```text
100 concurrent requests
          ↓
     Stock = 10
          ↓
   ┌──────┴──────┐
   │             │
  10 SUCCESS   90 FAILED
   │
   ▼
Stock = 0
```

---

# 🛠️ Tecnologias

| Tecnologia     | Utilização          |
| -------------- | ------------------- |
| TypeScript     | Linguagem principal |
| Node.js        | Runtime             |
| Fastify        | HTTP API            |
| PostgreSQL     | Banco de dados      |
| Prisma         | ORM                 |
| Worker Threads | Concorrência        |
| Vitest         | Testes              |
| Docker         | Ambiente            |
| Git            | Versionamento       |

---

# 📚 Conceitos estudados

Este projeto foi desenvolvido para explorar conceitos de engenharia de software além de CRUD.

### Design Patterns

* Factory Pattern
* Strategy Pattern
* Repository Pattern
* Dependency Injection

### Concorrência

* Event Loop
* Async/Await
* Promise Concurrency
* Worker Threads
* Worker Pool
* Task Queue
* Race Conditions
* Shared State

### Banco de dados

* Transactions
* Atomic Updates
* Row-Level Locking
* Optimistic Locking
* Constraints
* Isolation Levels
* Consistência

### Backend

* REST
* HTTP
* Clean Architecture
* Separation of Concerns
* Error Handling
* Automated Testing

---

# 📊 Experimentos

Uma das metas do projeto é comparar diferentes estratégias de processamento.

```text
Sequential Processing
        │
        ▼
Promise.all
        │
        ▼
Worker Pool
```

As métricas serão coletadas durante a execução real.

Exemplo de benchmark:

```text
┌──────────────────────┬──────────┐
│ Strategy             │ Time     │
├──────────────────────┼──────────┤
│ Sequential           │   --     │
│ Promise.all          │   --     │
│ Worker Pool (4)      │   --     │
│ Worker Pool (8)      │   --     │
└──────────────────────┴──────────┘
```

> Os valores serão preenchidos a partir dos benchmarks executados no ambiente real.

---

# 🚀 Executando o projeto

Clone o repositório:

```bash
git clone <repository-url>
cd forgeflow
```

Instale as dependências:

```bash
npm install
```

Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Gere o Prisma Client:

```bash
npm run prisma:generate
```

Execute as migrations:

```bash
npm run prisma:migrate
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

---

# 🐳 Docker

O projeto também possui configuração para execução através do Docker.

```bash
docker compose up -d
```

Para acompanhar os containers:

```bash
docker compose logs -f
```

---

# 🗺️ Roadmap

* [x] Estrutura inicial do projeto
* [ ] Configuração do TypeScript
* [ ] Configuração do Fastify
* [ ] Modelagem PostgreSQL
* [ ] Prisma
* [ ] CRUD de pedidos
* [ ] Factory Pattern
* [ ] Payment Processors
* [ ] Processamento concorrente
* [ ] Task Queue
* [ ] Worker Threads
* [ ] Worker Pool
* [ ] Controle de estoque
* [ ] Race Condition Test
* [ ] Database Transactions
* [ ] Optimistic/Pessimistic Locking
* [ ] Integration Tests
* [ ] Concurrency Tests
* [ ] Benchmark
* [ ] Docker
* [ ] Documentação da arquitetura

---

# 🎓 O que este projeto demonstra

O ForgeFlow não foi criado apenas para demonstrar que é possível construir uma API REST.

Ele busca demonstrar a capacidade de:

```text
                 SOFTWARE ENGINEERING
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Architecture      Concurrency       Database
        │                │                │
        ▼                ▼                ▼
      Factory        Worker Pool       Transactions
      Strategy       Race Conditions   Locking
      Repository     Task Queue        Consistency
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  Production API
```

O foco principal é entender **como diferentes partes de um sistema distribuído/concurrente interagem e quais problemas aparecem quando múltiplas operações modificam o mesmo estado simultaneamente.**

---

# 📖 Documentação

Documentação adicional:

* `docs/architecture.md` — arquitetura da aplicação
* `docs/concurrency.md` — estratégias de concorrência
* `docs/design-patterns.md` — Design Patterns utilizados

---

# 📜 License

Este projeto é desenvolvido para fins de estudo, experimentação e portfólio.

---

<p align="center">
  <strong>ForgeFlow</strong><br>
  Concurrent systems are easy — until they aren't.
</p>
