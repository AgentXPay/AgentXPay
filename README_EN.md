<div align="center">

# AgentXPay

### AI Agent Native Payment Infrastructure

**Enable AI Agents to autonomously discover, pay for, and consume AI services on Monad blockchain — zero human intervention**

[![中文](https://img.shields.io/badge/lang-中文-red)](./README.md) · [Architecture](./docs/architecture.md) · [Dev Guide](./docs/development-guide.md) · [OpenClaw Integration](./docs/openclaw-integration.md)

</div>

---

## Overview

AgentXPay is an **AI-to-AI payment protocol stack** built on [Monad](https://www.monad.xyz/) high-performance EVM blockchain. At its core is the **x402 Protocol** — an automated on-chain payment standard based on the HTTP 402 status code.

It provides a complete closed-loop for the AI Agent economy — from **service registration, automatic payment, subscription management to fund escrow** — enabling AI Agents to autonomously discover, pay for, and consume AI services with zero human intervention.

**Links**

- Repository: https://github.com/AgentXPay
- SDK: https://www.npmjs.com/package/@agentxpay/sdk
- Middleware: https://www.npmjs.com/package/@agentxpay/middleware
- OpenClaw Skill: https://clawhub.ai/JasonRUAN/agentxpay
- Demo: https://agent-x-pay.vercel.app/

---

## Key Features

- **x402 Auto-Payment Protocol** — Agent sends HTTP request → receives `402 Payment Required` → auto on-chain payment → retries with tx proof → gets response, all with zero human intervention
- **On-Chain Service Marketplace** — Providers register AI services on-chain; Agents autonomously discover and select optimal services
- **Five Payment Modes** — **Pay-per-use, Batch payment, Pre-deposited balance, Subscription, Escrow** — covering all scenarios
- **Agent Smart Wallet** — Smart contract wallet with daily spending limits for autonomous Agent consumption within budget
- **Plug-and-Play Integration** — One-line middleware for Providers, SDK import for Agents
- **Multi-Platform Skill Support** — Compatible with OpenAI Function Calling, MCP Tool Protocol, and OpenClaw Agent Skills

---

## Architecture Overview

AgentXPay implements an AI Agent autonomous payment loop around the **x402 Protocol**, consisting of four layers:

- **On-Chain Protocol Layer**: 6 Solidity smart contracts forming a complete payment protocol stack
- **Control Plane Layer**: Backend event indexer monitoring on-chain events in real-time, frontend dashboard for service management, billing, and data visualization
- **AI Service Provider**: One-line middleware integration turns any API into a paid endpoint; the middleware handles 402 responses, on-chain payment verification, and request forwarding
- **AI Agent Consumer**: Integrates SDK or Skill toolkit to call services; SDK has built-in x402 awareness, automatically completing the **"Request → 402 → Pay → Retry"** flow

```mermaid
graph TB
    subgraph "<b>AI Agent Consumer</b>"
        Agent["🤖 OpenClaw / Other AI Agent"]
        SDK["@agentxpay/sdk<br/>AgentXPayClient"]
        Skill["@agentxpay/skill<br/>7 AI Tools"]
        Agent --> SDK
        Agent --> Skill
        Skill --> SDK
    end

    subgraph "<b>AI Service Provider</b>"
        Server["Express Server"]
        MW["@agentxpay/middleware<br/>x402 Payment Gate"]
        BIZ["Business Logic<br/>/api/chat, /api/image..."]
        Server --> MW
        MW --> BIZ
    end

    subgraph "<b>On-Chain Protocol Layer</b>"
        SR["ServiceRegistry<br/>Service Registry"]
        PM["PaymentManager<br/>Payment Manager"]
        SM["SubscriptionManager<br/>Subscription Manager"]
        ES["Escrow<br/>Fund Escrow"]
        AWF["AgentWalletFactory<br/>Wallet Factory"]
        AW["AgentWallet<br/>Smart Wallet Instance"]
        AWF --> AW
    end

    subgraph "<b>Control Plane</b>"
        IDX["@agentxpay/indexer<br/>Event Indexer"]
        DB[("PostgreSQL<br/>Event Storage")]
        FE["@agentxpay/frontend<br/>Dashboard"]
        IDX --> DB
        FE --> DB
    end

    SDK -->|"① HTTP Request"| MW
    MW -->|"② 402 + Payment Info"| SDK
    SDK -->|"③ On-chain Payment"| PM
    SDK -->|"④ Retry with TxHash"| MW
    MW -->|"⑤ On-chain Verification"| PM
    MW -->|"⑥ Return AI Response"| SDK

    SDK --> SR
    SDK --> SM
    SDK --> ES
    SDK --> AWF

    IDX -->|"Listen Events"| PM
    IDX -->|"Listen Events"| SM

    FE --> SR
    FE --> PM

    style Agent fill:#6366F1,stroke:#4F46E5,color:#fff
    style SDK fill:#EC4899,stroke:#DB2777,color:#fff
    style Skill fill:#EC4899,stroke:#DB2777,color:#fff
    style Server fill:#22C55E,stroke:#16A34A,color:#fff
    style MW fill:#EC4899,stroke:#DB2777,color:#fff
    style PM fill:#3B82F6,stroke:#2563EB,color:#fff
    style SR fill:#3B82F6,stroke:#2563EB,color:#fff
    style AW fill:#3B82F6,stroke:#2563EB,color:#fff
    style SM fill:#3B82F6,stroke:#2563EB,color:#fff
    style ES fill:#3B82F6,stroke:#2563EB,color:#fff
    style AWF fill:#3B82F6,stroke:#2563EB,color:#fff
    style FE fill:#EC4899,stroke:#DB2777,color:#fff
    style IDX fill:#EC4899,stroke:#DB2777,color:#fff
```

---

## x402 Protocol

The x402 Protocol is the core innovation of AgentXPay, implementing automated on-chain payment based on the HTTP 402 (Payment Required) status code, with multi-chain and multi-token support:

```mermaid
sequenceDiagram
    participant Agent as 🤖 AI Agent<br/>(SDK/Skill)
    participant Server as 🌐 AI Service<br/>(Middleware)
    participant Chain as ⛓️ Monad<br/>Blockchain

    Note over Agent,Chain: First Request — Trigger Payment

    Agent->>Server: POST /api/chat {"prompt":"Hello"}
    Server->>Server: paymentGate middleware<br/>No X-Payment-TxHash found

    Server-->>Agent: HTTP 402 Payment Required<br/>X-Payment-Address: 0x...<br/>X-Payment-Amount: 10000000000000000<br/>X-Payment-ServiceId: 1<br/>X-Payment-ChainId: 10143

    Note over Agent,Chain: SDK auto-handles on-chain payment

    Agent->>Agent: Parse payment info from 402 response
    Agent->>Chain: payPerUse(serviceId=1, 0.01 MON)
    Chain-->>Agent: txHash: 0xabc...

    Note over Agent,Chain: Second Request — With Payment Proof

    Agent->>Server: POST /api/chat {"prompt":"Hello"}<br/>X-Payment-TxHash: 0xabc...<br/>X-Payment-ChainId: 10143

    Server->>Chain: verifyPayment(txHash)
    Chain-->>Server: ✅ Transaction Valid

    Server-->>Agent: HTTP 200 OK<br/>{"choices":[{"message":{"content":"..."}}]}

    Note over Agent,Chain: Zero human intervention throughout ✨
```

### x402 HTTP Headers

| Header | Direction | Description |
|--------|-----------|-------------|
| `X-Payment-Address` | Server → Agent | PaymentManager contract address |
| `X-Payment-Amount` | Server → Agent | Required amount (Wei) |
| `X-Payment-Token` | Server → Agent | Token type (`native`) |
| `X-Payment-ServiceId` | Server → Agent | On-chain service ID |
| `X-Payment-ChainId` | Server → Agent | Chain ID (10143) |
| `X-Payment-TxHash` | Agent → Server | On-chain payment tx hash |
| `X-Subscription-Address` | Agent → Server | Subscriber address (for subscription-based free access) |

---

## Smart Contracts

On-chain protocol built with Solidity 0.8.20 + Foundry + OpenZeppelin, consisting of 6 contracts:

```mermaid
graph LR
    subgraph "Core Contracts"
        SR["ServiceRegistry<br/>━━━━━━━━━━━<br/>· Service registration<br/>· Category & filtering<br/>· Subscription plans"]
        PM["PaymentManager<br/>━━━━━━━━━━━<br/>· Pay-per-use<br/>· Batch payment<br/>· Balance deposit/withdraw<br/>· Platform fees"]
        SM["SubscriptionManager<br/>━━━━━━━━━━━<br/>· Subscribe/Cancel/Renew<br/>· Auto-renewal<br/>· Access control"]
        ES["Escrow<br/>━━━━━━━━━━━<br/>· Create escrow<br/>· Release/Refund<br/>· Dispute arbitration"]
    end

    subgraph "Agent Wallet"
        AWF["AgentWalletFactory<br/>━━━━━━━━━━━<br/>· Deploy wallet instances"]
        AW["AgentWallet<br/>━━━━━━━━━━━<br/>· Daily spending limit<br/>· Authorize Agent<br/>· Owner risk control"]
    end

    PM -->|"Read service price"| SR
    SM -->|"Read subscription plan"| SR
    AWF -->|"Deploy"| AW
    AW -->|"Call"| PM
    AW -->|"Call"| SM

    style SR fill:#6366F1,stroke:#4F46E5,color:#fff
    style PM fill:#3B82F6,stroke:#2563EB,color:#fff
    style SM fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style ES fill:#F59E0B,stroke:#D97706,color:#000
    style AWF fill:#22C55E,stroke:#16A34A,color:#fff
    style AW fill:#34D399,stroke:#10B981,color:#000
```

| Contract | Function | Key Methods |
|----------|----------|-------------|
| **ServiceRegistry** | Service registration, discovery, categorization | `registerService()`, `getService()`, `addSubscriptionPlan()` |
| **PaymentManager** | Per-use/Batch/Balance payment, fee collection | `payPerUse()`, `batchPay()`, `deposit()`, `withdraw()` |
| **SubscriptionManager** | Subscription management and access control | `subscribe()`, `cancel()`, `renew()`, `checkAccess()` |
| **Escrow** | Fund escrow, dispute arbitration | `createEscrow()`, `release()`, `dispute()`, `refund()` |
| **AgentWalletFactory** | Deploy Agent wallet instances | `createWallet()` |
| **AgentWallet** | Daily-limit smart wallet | `execute()`, `setDailyLimit()`, `authorizeAgent()` |

---

## AI Agent Skill

`@agentxpay/skill` enables LLM Agents to autonomously use payment capabilities via Function Calling, providing **7 AI Tools**:

| Tool | Function |
|------|----------|
| `agentxpay_smart_call` | All-in-one: Discover → Select → Pay → Call |
| `agentxpay_discover_services` | On-chain service discovery |
| `agentxpay_pay_and_call` | x402 auto-payment call |
| `agentxpay_manage_wallet` | Agent wallet management (create/fund/limit) |
| `agentxpay_subscribe` | Subscribe to service plans |
| `agentxpay_create_escrow` | Create fund escrow |
| `agentxpay_get_agent_info` | Query Agent status |

### Multi-Platform Compatibility

Skill supports three mainstream integration methods:

```mermaid
graph LR
    Skill["@agentxpay/skill"]
    OAI["OpenAI<br/>Function Calling"]
    MCP["MCP<br/>Tool Protocol"]
    OC["OpenClaw<br/>Agent Skills"]

    Skill -->|"toOpenAIFunctions()"| OAI
    Skill -->|"toMCPToolsList()"| MCP
    Skill -->|"SKILL.md + CLI"| OC

    style Skill fill:#6366F1,stroke:#4F46E5,color:#fff
    style OAI fill:#22C55E,stroke:#16A34A,color:#fff
    style MCP fill:#3B82F6,stroke:#2563EB,color:#fff
    style OC fill:#F59E0B,stroke:#D97706,color:#000
```

---

## Five Payment Modes

AgentXPay supports five payment modes covering different usage scenarios:

```mermaid
graph TB
    subgraph "Escrow"
        P5["Lock funds<br/>Release on completion"]
    end

    subgraph "Subscription"
        P4["Monthly/Yearly payment<br/>Unlimited access in period"]
    end

    subgraph "Pre-deposited Balance"
        P3["Deposit first<br/>Deduct from balance"]
    end

    subgraph "Batch Payment"
        P2["Multiple calls<br/>Single transaction"]
    end

    subgraph "Pay-per-use (x402)"
        P1["Each API call<br/>Auto-triggers payment"]
    end

    style P1 fill:#3B82F6,stroke:#2563EB,color:#fff
    style P2 fill:#22C55E,stroke:#16A34A,color:#fff
    style P3 fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style P4 fill:#F59E0B,stroke:#D97706,color:#000
    style P5 fill:#EF4444,stroke:#DC2626,color:#fff
```

| Mode | Use Case | Implementation |
|------|----------|----------------|
| **Pay-per-use (x402)** | Low-frequency, first use | `client.fetch()` → 402 → `payPerUse()` → retry |
| **Batch Payment** | Known multiple calls | `payments.batchPay(serviceIds[], totalAmount)` |
| **Pre-deposited Balance** | High-frequency usage | `payments.deposit()` → `payments.payFromBalance()` |
| **Subscription** | Fixed-period heavy use | `subscriptions.subscribe()` → middleware `checkAccess()` pass |
| **Escrow** | Custom tasks | `escrow.createEscrow()` → `releaseEscrow()` on completion |

---

## Middleware Workflow

`@agentxpay/middleware` turns any Express service into a paid API with one line of code. Internal processing flow:

```mermaid
flowchart TD
    REQ["Receive HTTP Request"]
    MATCH{"Route Match?<br/>Facilitator"}
    SKIP["Skip → next()<br/>(Free Endpoint)"]
    SUB{"Has Subscription<br/>Header?"}
    CHECK_SUB["On-chain verify<br/>checkAccess()"]
    SUB_OK{"Subscription<br/>Valid?"}
    SUB_PASS["✅ Pass<br/>type: subscription"]
    SUB_FAIL["❌ 403 Subscription<br/>Inactive"]
    HAS_TX{"Has X-Payment<br/>-TxHash?"}
    RET_402["Return HTTP 402<br/>+ Payment Headers"]
    VERIFY["PaymentVerifier<br/>On-chain verify tx"]
    USED{"TxHash<br/>Already Used?"}
    REJECT["❌ 402 TxHash<br/>Already Used"]
    VALID{"Transaction<br/>Valid?"}
    FAIL["❌ 402 Payment<br/>Verification Failed"]
    PASS["✅ Pass<br/>type: payment"]

    REQ --> MATCH
    MATCH -->|No| SKIP
    MATCH -->|Yes| SUB
    SUB -->|Yes| CHECK_SUB
    CHECK_SUB --> SUB_OK
    SUB_OK -->|Yes| SUB_PASS
    SUB_OK -->|No| SUB_FAIL
    SUB -->|No| HAS_TX
    HAS_TX -->|No| RET_402
    HAS_TX -->|Yes| VERIFY
    VERIFY --> USED
    USED -->|Yes| REJECT
    USED -->|No| VALID
    VALID -->|No| FAIL
    VALID -->|Yes| PASS

    style SKIP fill:#94A3B8,stroke:#64748B,color:#fff
    style RET_402 fill:#F59E0B,stroke:#D97706,color:#000
    style PASS fill:#22C55E,stroke:#16A34A,color:#fff
    style SUB_PASS fill:#22C55E,stroke:#16A34A,color:#fff
    style REJECT fill:#EF4444,stroke:#DC2626,color:#fff
    style FAIL fill:#EF4444,stroke:#DC2626,color:#fff
    style SUB_FAIL fill:#EF4444,stroke:#DC2626,color:#fff
```

---

## Project Structure

```
AgentXPay/
├── contracts/                          # Solidity 智能合约 (Foundry + OpenZeppelin)
│   ├── src/
│   │   ├── interfaces/                 # 合约接口定义
│   │   │   ├── IAgentWallet.sol
│   │   │   ├── IEscrow.sol
│   │   │   ├── IPaymentManager.sol
│   │   │   ├── IServiceRegistry.sol
│   │   │   └── ISubscriptionManager.sol
│   │   ├── libraries/
│   │   │   └── PaymentLib.sol          # 支付工具库
│   │   ├── AgentWallet.sol             # Agent 智能钱包
│   │   ├── AgentWalletFactory.sol      # 钱包工厂
│   │   ├── Escrow.sol                  # 资金托管
│   │   ├── PaymentManager.sol          # 支付管理器
│   │   ├── ServiceRegistry.sol         # 服务注册表
│   │   └── SubscriptionManager.sol     # 订阅管理器
│   ├── script/
│   │   └── Deploy.s.sol                # 部署脚本
│   ├── test/                           # 合约测试
│   ├── deployments.json                # 已部署合约地址
│   └── foundry.toml
│
├── AgentXPay/                          # pnpm monorepo + Turborepo
│   ├── sdk/                            # @agentxpay/sdk — 核心客户端库
│   │   └── src/
│   │       ├── abi/                    # 合约 ABI (6 个 JSON)
│   │       ├── modules/                # 功能模块
│   │       │   ├── escrow.ts           # 资金托管
│   │       │   ├── payments.ts         # 支付（按次/批量/余额）
│   │       │   ├── services.ts         # 服务发现与注册
│   │       │   ├── subscriptions.ts    # 订阅管理
│   │       │   └── wallet.ts           # Agent 钱包
│   │       ├── types/
│   │       ├── utils/
│   │       ├── AgentXPayClient.ts      # 主客户端入口
│   │       └── index.ts
│   │
│   ├── middleware/                      # @agentxpay/middleware — x402 Express 中间件
│   │   └── src/
│   │       ├── facilitator.ts          # 路由匹配与支付信息
│   │       ├── paymentGate.ts          # x402 支付网关中间件
│   │       ├── verifier.ts             # 链上交易验证
│   │       ├── server.ts               # Express 服务入口
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   ├── indexer/                         # @agentxpay/indexer — 链上事件索引器 + REST API
│   │   └── src/
│   │       ├── indexer.ts              # 事件监听与索引
│   │       ├── api.ts                  # REST API 服务
│   │       ├── db.ts                   # PostgreSQL 数据库
│   │       ├── config.ts
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   ├── frontend/                        # @agentxpay/frontend — Next.js 管理面板
│   │   └── src/
│   │       ├── app/
│   │       │   ├── dashboard/
│   │       │   │   ├── agent/          # Agent 钱包管理
│   │       │   │   ├── billing/        # 账单与支付记录
│   │       │   │   ├── playground/     # API 调试面板
│   │       │   │   └── services/       # 服务管理
│   │       │   ├── layout.tsx
│   │       │   └── page.tsx
│   │       ├── components/
│   │       │   ├── layout/             # Header, Sidebar
│   │       │   ├── ui/                 # shadcn/ui 组件 (12 个)
│   │       │   └── TryServiceDialog.tsx
│   │       ├── hooks/                  # 12 个自定义 Hooks
│   │       ├── abi/                    # 合约 ABI
│   │       ├── constants/              # 合约地址与配置
│   │       ├── lib/                    # monadChain, utils
│   │       └── providers/              # Web3Provider (wagmi + RainbowKit)
│   │
│   ├── docs/                           # 项目文档
│   │   ├── architecture.md             # 架构设计
│   │   ├── development-guide.md        # 开发手册
│   │   └── openclaw-integration.md     # OpenClaw 集成指南
│   │
│   ├── pnpm-workspace.yaml
│   └── turbo.json
│
├── skills/                             # AI Agent Skill
│   └── agentxpay/                      # @agentxpay/skill — 7 个 AI Tool
│       ├── src/
│       │   ├── runtime.ts              # 工具运行时
│       │   ├── schemas.ts             # 工具参数定义
│       │   ├── types.ts
│       │   └── index.ts
│       ├── scripts/
│       │   └── run-tool.ts            # CLI 运行脚本
│       ├── references/                 # 参考文档
│       │   ├── sdk-api.md
│       │   └── x402-protocol.md
│       └── SKILL.md                   # OpenClaw Skill 描述
│
├── examples/                           # 示例项目
│   └── provider-demo/                  # AI 服务提供方示例
│       └── src/
│           └── server.ts               # Express + x402 中间件示例
│
├── docker-run.sh                       # Docker 运行脚本
└── tee-docker-compose.yml              # TEE Docker 编排
```

---

## Contract Addresses (Monad Testnet · Chain ID 10143)

| Contract | Address |
|----------|---------|
| ServiceRegistry | `0x6F9679BdF5F180a139d01c598839a5df4860431b` |
| PaymentManager | `0xf4AE7E15B1012edceD8103510eeB560a9343AFd3` |
| SubscriptionManager | `0x0bF7dE8d71820840063D4B8653Fd3F0618986faF` |
| Escrow | `0xc981ec845488b8479539e6B22dc808Fb824dB00a` |
| AgentWalletFactory | `0x5E5713a0d915701F464DEbb66015adD62B2e6AE9` |

> RPC: `https://testnet-rpc.monad.xyz/`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Monad Testnet (chainId 10143), Solidity 0.8.20, Foundry, OpenZeppelin |
| **SDK** | TypeScript, ethers.js v6, tsup |
| **Middleware** | TypeScript, Express.js, LRU Cache |
| **Indexer** | TypeScript, PostgreSQL 16, Express.js |
| **Frontend** | Next.js 14, React 18, wagmi, viem, RainbowKit, Tailwind CSS, shadcn/ui |
| **Skill** | TypeScript, OpenAI Function Calling / MCP / OpenClaw compatible |
| **Build** | pnpm workspaces, Turborepo |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/architecture.md) | Full architecture, x402 protocol, contract design, component details |
| [SDK & Middleware Dev Guide](./docs/development-guide.md) | Agent SDK integration + Provider Middleware integration guide |
| [OpenClaw Integration](./docs/openclaw-integration.md) | Integrating AgentXPay Skill into the OpenClaw platform |
