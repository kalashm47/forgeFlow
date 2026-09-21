# ⚙️ ForgeFlow

> **Concurrent Order Processing API built with TypeScript, Node.js, and PostgreSQL.**

**ForgeFlow** is an order processing API designed to explore, in practice, **Design Patterns, concurrency, Worker Threads, inventory control, and transactional consistency**.

The project simulates an order processing system capable of handling multiple simultaneous operations, using an architecture designed for concurrent processing and multiple payment strategies.

---

## 🧠 About the Project

Imagine an e-commerce platform receiving hundreds of orders simultaneously.

The system needs to:

* process different payment methods;
* execute independent operations concurrently;
* distribute tasks across Workers;
* manage shared inventory;
* prevent overselling;
* avoid inconsistencies caused by concurrent requests;
* maintain database consistency;
* allow new payment methods to be added without modifying the core processing logic.

ForgeFlow was created to study and demonstrate these challenges.

---

# 🏗️ Architecture

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

# 🎯 Objectives

The main goal of the project is to study how to build a backend capable of handling **concurrent processing and shared state**.

### Design Pattern

The **Factory Pattern** is used to create payment processors.

```text
PaymentProcessor
       │
       ├── PixProcessor
       ├── CreditCardProcessor
       ├── BankTransferProcessor
       └── CryptoProcessor
```

The application does not need to know which concrete implementation should be instantiated.

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

# ⚡ Concurrency

One of the project's main goals is to explore concurrency in Node.js.

ForgeFlow uses:

* `Promise.all`
* Worker Threads
* Worker Pool
* Task Queue
* concurrent processing
* resource management

Tasks are distributed across workers:

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

The number of Workers is limited to prevent uncontrolled thread creation.

---

# 🧨 Race Conditions

The project includes a dedicated scenario for demonstrating **race conditions**.

Imagine:

```text
Stock = 1

Request A ──────┐
                │
Request B ──────┼──► same product
                │
Request C ──────┘
```

Without proper protection, multiple requests may observe the same inventory level before one of them updates the database.

Result:

```text
❌ Overselling
❌ Inconsistent inventory
❌ Invalid orders
```

The system must ensure that concurrent operations respect the actual available inventory.

---

# 🔒 Consistency

PostgreSQL acts as the source of truth for the system's state.

Critical operations use mechanisms such as:

```text
Database Transactions
Atomic Updates
Row-Level Locking
Optimistic Locking
Constraints
```

The goal is to guarantee:

```text
100 concurrent requests
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

# 💳 Payment Processing

The system supports multiple payment strategies:

| Type          | Processor               |
| ------------- | ----------------------- |
| PIX           | `PixProcessor`          |
| Credit Card   | `CreditCardProcessor`   |
| Bank Transfer | `BankTransferProcessor` |
| Crypto        | `CryptoProcessor`       |

The Factory is responsible for creating the appropriate processor.

This makes it possible to add a new strategy:

```text
PIX
CREDIT_CARD
BANK_TRANSFER
CRYPTO
PAYPAL
      ↓
Factory
```

without modifying the entire order processing logic.

---

# 🗄️ Database

The system uses:

**PostgreSQL + Prisma**

Conceptual model:

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

The model separates:

* customer identity;
* orders;
* order items;
* products;
* inventory;
* payments;
* processing attempts.

---

# 📁 Project Structure

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

## Create Order

```http
POST /orders
```

Example:

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

## Get Order

```http
GET /orders/:id
```

---

## Process Order

```http
POST /orders/:id/process
```

---

## Process Orders in Batch

```http
POST /orders/batch/process
```

Allows multiple orders to be submitted for concurrent processing.

---

## Worker Status

```http
GET /workers/status
```

Example:

```json
{
  "workers": 4,
  "busy": 2,
  "idle": 2,
  "queueSize": 17
}
```

---

## Concurrency Test

```http
POST /test/concurrency
```

Endpoint dedicated exclusively to concurrency experiments.

Example:

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

# 🧪 Testing

The project has three main testing categories.

### Unit Tests

Test individual components in isolation.

```text
PaymentProcessorFactory
OrderService
```

### Integration Tests

Test the interaction between:

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

Specifically test:

```text
Race Conditions
Worker Pool
Task Queue
Stock Reservation
Concurrent Orders
```

One of the main scenarios is:

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

# 🛠️ Technologies

| Technology     | Purpose          |
| -------------- | ---------------- |
| TypeScript     | Primary language |
| Node.js        | Runtime          |
| Fastify        | HTTP API         |
| PostgreSQL     | Database         |
| Prisma         | ORM              |
| Worker Threads | Concurrency      |
| Vitest         | Testing          |
| Docker         | Environment      |
| Git            | Version control  |

---

# 📚 Concepts Studied

This project was developed to explore software engineering concepts beyond basic CRUD applications.

### Design Patterns

* Factory Pattern
* Strategy Pattern
* Repository Pattern
* Dependency Injection

### Concurrency

* Event Loop
* Async/Await
* Promise Concurrency
* Worker Threads
* Worker Pool
* Task Queue
* Race Conditions
* Shared State

### Database

* Transactions
* Atomic Updates
* Row-Level Locking
* Optimistic Locking
* Constraints
* Isolation Levels
* Consistency

### Backend

* REST
* HTTP
* Clean Architecture
* Separation of Concerns
* Error Handling
* Automated Testing

---

# 📊 Experiments

One of the project's goals is to compare different processing strategies.

```text
Sequential Processing
        │
        ▼
Promise.all
        │
        ▼
Worker Pool
```

Metrics will be collected through actual benchmark runs.

Example:

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

> Values will be populated based on benchmarks executed in the actual environment.

---

# 🚀 Running the Project

Clone the repository:

```bash
git clone <repository-url>
cd forgeflow
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Generate the Prisma Client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Start the development environment:

```bash
npm run dev
```

---

# 🐳 Docker

The project also includes Docker configuration.

```bash
docker compose up -d
```

To follow container logs:

```bash
docker compose logs -f
```

---

# 🗺️ Roadmap

* [x] Initial project structure
* [ ] TypeScript configuration
* [ ] Fastify configuration
* [ ] PostgreSQL modeling
* [ ] Prisma
* [ ] Order CRUD
* [ ] Factory Pattern
* [ ] Payment Processors
* [ ] Concurrent processing
* [ ] Task Queue
* [ ] Worker Threads
* [ ] Worker Pool
* [ ] Inventory control
* [ ] Race Condition Test
* [ ] Database Transactions
* [ ] Optimistic/Pessimistic Locking
* [ ] Integration Tests
* [ ] Concurrency Tests
* [ ] Benchmark
* [ ] Docker
* [ ] Architecture documentation

---

# 🎓 What This Project Demonstrates

ForgeFlow was not created simply to demonstrate how to build a REST API.

It aims to demonstrate the ability to reason about:

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

The main focus is understanding **how different parts of a concurrent system interact and what problems emerge when multiple operations modify the same state simultaneously.**

---

# 📖 Documentation

Additional documentation:

* `docs/architecture.md` — application architecture
* `docs/concurrency.md` — concurrency strategies
* `docs/design-patterns.md` — Design Patterns used

---

# 📜 License

This project was developed for learning, experimentation, and portfolio purposes.

---

<p align="center">
  <strong>ForgeFlow</strong><br>
  Concurrent systems are easy — until they aren't.
</p>
