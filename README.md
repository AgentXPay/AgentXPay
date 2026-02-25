<div align="center">

# AgentXPay

### AI Agent 原生支付基础设施

**让 AI Agent 在 Monad 区块链上自主发现、支付和消费 AI 服务，全程无需人工干预**

[![English](https://img.shields.io/badge/lang-English-blue)](./README_EN.md) · [架构设计](./docs/architecture.md) · [开发手册](./docs/development-guide.md) · [OpenClaw 集成](./docs/openclaw-integration.md)

</div>

---

## 项目简介

AgentXPay 是构建在 [Monad](https://www.monad.xyz/) 高性能 EVM 区块链上的 **AI-to-AI 支付协议栈**，核心实现了 **x402 协议** —— 基于 HTTP 402 状态码的自动化链上支付标准。

它为 AI Agent 经济体提供了从**服务注册、自动支付、订阅管理到资金托管**的完整闭环，让 AI Agent 自主发现、支付和消费 AI 服务，全程无需人工干预。

**相关链接**

- 项目仓库：https://github.com/AgentXPay
- SDK：https://www.npmjs.com/package/@agentxpay/sdk
- 中间件：https://www.npmjs.com/package/@agentxpay/middleware
- OpenClaw Skill：https://clawhub.ai/JasonRUAN/agentxpay
- 体验地址：https://agent-x-pay.vercel.app/

---

## 核心特性

- **x402 自动支付协议** — AI Agent 发送 HTTP 请求 → 收到 `402 Payment Required` → 自动链上支付 → 携带交易凭证重试 → 获取服务响应，全程零人工干预
- **链上服务市场** — 服务提供商在链上注册 AI 服务，Agent 可自主发现和选择最优服务
- **五种支付模式** — **按次付费、批量支付、预存余额、订阅包月、资金托管** — 覆盖全场景
- **Agent 智能钱包** — 支持每日消费限额的智能合约钱包，让 Agent 在预算内自主消费
- **即插即用集成** — Provider 只需添加一行中间件即可接入，Agent 只需引入 SDK 即可自动支付
- **多平台 Skill 支持** — 兼容 OpenAI Function Calling、MCP 工具协议和 OpenClaw Agent Skills 标准

---

## 架构总览

AgentXPay 围绕 **x402 协议** 实现 AI Agent 自主支付闭环，分为四层：

- **链上协议层**：6 个 Solidity 智能合约构成完整支付协议栈
- **管控面层**：后端事件索引器实时监听链上事件并落库，前端管理面板提供服务管理、账单查询和数据可视化
- **AI 服务提供方**：一行代码集成中间件，将任意 API 转为付费接口，中间件负责返回 402、校验链上支付凭证并放行请求
- **AI Agent 消费方**：通过集成 SDK 或 Skill 工具包发起服务调用，SDK 内置 x402 感知能力，自动完成 **"请求 → 402 → 支付 → 重试"** 全流程

```mermaid
graph TB
    subgraph "<b>AI Agent 消费方</b>"
        Agent["🤖 OpenClaw / Other AI Agent"]
        SDK["@agentxpay/sdk<br/>AgentXPayClient"]
        Skill["@agentxpay/skill<br/>7 个 AI Tool"]
        Agent --> SDK
        Agent --> Skill
        Skill --> SDK
    end

    subgraph "<b>AI 服务提供方</b>"
        Server["Express Server"]
        MW["@agentxpay/middleware<br/>x402 Payment Gate"]
        BIZ["业务逻辑<br/>/api/chat, /api/image..."]
        Server --> MW
        MW --> BIZ
    end

    subgraph "<b>链上协议层</b>"
        SR["ServiceRegistry<br/>服务注册表"]
        PM["PaymentManager<br/>支付管理器"]
        SM["SubscriptionManager<br/>订阅管理器"]
        ES["Escrow<br/>资金托管"]
        AWF["AgentWalletFactory<br/>钱包工厂"]
        AW["AgentWallet<br/>智能钱包实例"]
        AWF --> AW
    end

    subgraph "<b>管控面层</b>"
        IDX["@agentxpay/indexer<br/>事件索引器"]
        DB[("PostgreSQL<br/>事件存储")]
        FE["@agentxpay/frontend<br/>管理面板"]
        IDX --> DB
        FE --> DB
    end

    SDK -->|"① HTTP 请求"| MW
    MW -->|"② 402 + 支付信息"| SDK
    SDK -->|"③ 链上支付"| PM
    SDK -->|"④ 携带 TxHash 重试"| MW
    MW -->|"⑤ 链上验证"| PM
    MW -->|"⑥ 返回 AI 响应"| SDK

    SDK --> SR
    SDK --> SM
    SDK --> ES
    SDK --> AWF

    IDX -->|"监听事件"| PM
    IDX -->|"监听事件"| SM

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

## x402 协议

x402 协议是 AgentXPay 的核心创新，基于 HTTP 402（Payment Required）状态码实现自动化链上支付，支持多链和多币种：

```mermaid
sequenceDiagram
    participant Agent as 🤖 AI Agent<br/>(SDK/Skill)
    participant Server as 🌐 AI 服务<br/>(Middleware)
    participant Chain as ⛓️ Monad<br/>区块链

    Note over Agent,Chain: 第一次请求 — 触发支付

    Agent->>Server: POST /api/chat {"prompt":"Hello"}
    Server->>Server: paymentGate 中间件<br/>检查无 X-Payment-TxHash

    Server-->>Agent: HTTP 402 Payment Required<br/>X-Payment-Address: 0x...<br/>X-Payment-Amount: 10000000000000000<br/>X-Payment-ServiceId: 1<br/>X-Payment-ChainId: 10143

    Note over Agent,Chain: SDK 自动处理链上支付

    Agent->>Agent: 解析 402 响应中的支付信息
    Agent->>Chain: payPerUse(serviceId=1, 0.01 MON)
    Chain-->>Agent: txHash: 0xabc...

    Note over Agent,Chain: 第二次请求 — 携带支付凭证

    Agent->>Server: POST /api/chat {"prompt":"Hello"}<br/>X-Payment-TxHash: 0xabc...<br/>X-Payment-ChainId: 10143

    Server->>Chain: verifyPayment(txHash)
    Chain-->>Server: ✅ 交易有效

    Server-->>Agent: HTTP 200 OK<br/>{"choices":[{"message":{"content":"..."}}]}

    Note over Agent,Chain: 全程无需人工干预 ✨
```

### x402 HTTP Headers 规范

| Header | 方向 | 说明 |
|--------|------|------|
| `X-Payment-Address` | Server → Agent | PaymentManager 合约地址 |
| `X-Payment-Amount` | Server → Agent | 所需金额（Wei） |
| `X-Payment-Token` | Server → Agent | 代币类型（`native`） |
| `X-Payment-ServiceId` | Server → Agent | 链上服务 ID |
| `X-Payment-ChainId` | Server → Agent | 链 ID（10143） |
| `X-Payment-TxHash` | Agent → Server | 链上支付交易哈希 |
| `X-Subscription-Address` | Agent → Server | 订阅者地址（用于订阅免付费访问） |

---

## 智能合约

基于 Solidity 0.8.20 + Foundry + OpenZeppelin 构建的链上协议，由 6 个合约组成：

```mermaid
graph LR
    subgraph "核心合约"
        SR["ServiceRegistry<br/>━━━━━━━━━━━<br/>· 服务注册与发现<br/>· 分类与过滤<br/>· 订阅计划管理"]
        PM["PaymentManager<br/>━━━━━━━━━━━<br/>· 按次付费<br/>· 批量付费<br/>· 余额预充值/提取<br/>· 平台手续费"]
        SM["SubscriptionManager<br/>━━━━━━━━━━━<br/>· 订阅/取消/续期<br/>· 自动续期<br/>· 访问权限检查"]
        ES["Escrow<br/>━━━━━━━━━━━<br/>· 创建资金托管<br/>· 释放/退款<br/>· 争议仲裁"]
    end

    subgraph "Agent 钱包"
        AWF["AgentWalletFactory<br/>━━━━━━━━━━━<br/>· 部署钱包实例"]
        AW["AgentWallet<br/>━━━━━━━━━━━<br/>· 每日消费限额<br/>· 授权 Agent 执行<br/>· Owner 风控"]
    end

    PM -->|"读取服务价格"| SR
    SM -->|"读取订阅计划"| SR
    AWF -->|"部署"| AW
    AW -->|"调用"| PM
    AW -->|"调用"| SM

    style SR fill:#6366F1,stroke:#4F46E5,color:#fff
    style PM fill:#3B82F6,stroke:#2563EB,color:#fff
    style SM fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style ES fill:#F59E0B,stroke:#D97706,color:#000
    style AWF fill:#22C55E,stroke:#16A34A,color:#fff
    style AW fill:#34D399,stroke:#10B981,color:#000
```

| 合约 | 功能 | 关键函数 |
|------|------|---------|
| **ServiceRegistry** | 服务注册、发现、分类、订阅计划管理 | `registerService()`, `getService()`, `addSubscriptionPlan()` |
| **PaymentManager** | 按次/批量/余额支付，手续费抽成 | `payPerUse()`, `batchPay()`, `deposit()`, `withdraw()` |
| **SubscriptionManager** | 订阅管理和访问权限检查 | `subscribe()`, `cancel()`, `renew()`, `checkAccess()` |
| **Escrow** | 资金托管、争议仲裁 | `createEscrow()`, `release()`, `dispute()`, `refund()` |
| **AgentWalletFactory** | 部署 Agent 钱包实例 | `createWallet()` |
| **AgentWallet** | 每日限额控制的智能钱包 | `execute()`, `setDailyLimit()`, `authorizeAgent()` |

---

## AI Agent Skill

`@agentxpay/skill` 让 LLM Agent 通过 Function Calling 自主使用支付能力，提供 **7 个 AI Tool**：

| Tool | 功能 |
|------|------|
| `agentxpay_smart_call` | 智能一步到位：发现 → 选择 → 付费 → 调用 |
| `agentxpay_discover_services` | 链上服务发现 |
| `agentxpay_pay_and_call` | x402 自动付费调用 |
| `agentxpay_manage_wallet` | Agent 钱包管理（创建/充值/限额） |
| `agentxpay_subscribe` | 订阅服务计划 |
| `agentxpay_create_escrow` | 创建资金托管 |
| `agentxpay_get_agent_info` | 查询 Agent 状态 |

### 多平台兼容

Skill 同时支持三种主流集成方式：

```mermaid
graph LR
    Skill["@agentxpay/skill"]
    OAI["OpenAI<br/>Function Calling"]
    MCP["MCP<br/>工具协议"]
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

## 五种支付模式

AgentXPay 支持五种支付模式，覆盖不同使用场景：

```mermaid
graph TB
    subgraph "托管"
        P5["锁定资金<br/>完成任务后释放"]
    end

    subgraph "订阅"
        P4["按月/年付费<br/>周期内无限访问"]
    end

    subgraph "预存余额"
        P3["先充值<br/>后从余额扣费"]
    end

    subgraph "批量支付"
        P2["多次调用<br/>一笔交易结算"]
    end

    subgraph "按次付费 (x402)"
        P1["每次 API 调用<br/>自动触发支付"]
    end

    style P1 fill:#3B82F6,stroke:#2563EB,color:#fff
    style P2 fill:#22C55E,stroke:#16A34A,color:#fff
    style P3 fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style P4 fill:#F59E0B,stroke:#D97706,color:#000
    style P5 fill:#EF4444,stroke:#DC2626,color:#fff
```

| 模式 | 适用场景 | 实现方式 |
|------|----------|----------|
| **按次付费 (x402)** | 低频调用、首次使用 | `client.fetch()` → 402 → `payPerUse()` → 重试 |
| **批量支付** | 已知多次调用 | `payments.batchPay(serviceIds[], totalAmount)` |
| **预存余额** | 高频使用 | `payments.deposit()` → `payments.payFromBalance()` |
| **订阅** | 固定周期大量使用 | `subscriptions.subscribe()` → 中间件 `checkAccess()` 放行 |
| **托管** | 定制化任务 | `escrow.createEscrow()` → 完成后 `releaseEscrow()` |

---

## 中间件工作流

`@agentxpay/middleware` 让任何 Express 服务一行代码变成付费 API，内部处理流程：

```mermaid
flowchart TD
    REQ["收到 HTTP 请求"]
    MATCH{"路由匹配？<br/>Facilitator"}
    SKIP["跳过 → next()<br/>（免费端点）"]
    SUB{"有订阅 Header？"}
    CHECK_SUB["链上验证订阅<br/>checkAccess()"]
    SUB_OK{"订阅有效？"}
    SUB_PASS["✅ 放行<br/>type: subscription"]
    SUB_FAIL["❌ 403 Subscription<br/>Inactive"]
    HAS_TX{"有 X-Payment-TxHash？"}
    RET_402["返回 HTTP 402<br/>+ 支付信息 Headers"]
    VERIFY["PaymentVerifier<br/>链上验证交易"]
    USED{"TxHash 已使用？"}
    REJECT["❌ 402 TxHash<br/>Already Used"]
    VALID{"交易有效？"}
    FAIL["❌ 402 Payment<br/>Verification Failed"]
    PASS["✅ 放行<br/>type: payment"]

    REQ --> MATCH
    MATCH -->|否| SKIP
    MATCH -->|是| SUB
    SUB -->|是| CHECK_SUB
    CHECK_SUB --> SUB_OK
    SUB_OK -->|是| SUB_PASS
    SUB_OK -->|否| SUB_FAIL
    SUB -->|否| HAS_TX
    HAS_TX -->|否| RET_402
    HAS_TX -->|是| VERIFY
    VERIFY --> USED
    USED -->|是| REJECT
    USED -->|否| VALID
    VALID -->|否| FAIL
    VALID -->|是| PASS

    style SKIP fill:#94A3B8,stroke:#64748B,color:#fff
    style RET_402 fill:#F59E0B,stroke:#D97706,color:#000
    style PASS fill:#22C55E,stroke:#16A34A,color:#fff
    style SUB_PASS fill:#22C55E,stroke:#16A34A,color:#fff
    style REJECT fill:#EF4444,stroke:#DC2626,color:#fff
    style FAIL fill:#EF4444,stroke:#DC2626,color:#fff
    style SUB_FAIL fill:#EF4444,stroke:#DC2626,color:#fff
```

---

## 项目结构

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

## 合约地址

> 当前已发布到：`Monad Testnet`
>
> - Chain ID：10143
>
> - RPC: `https://testnet-rpc.monad.xyz/`

| 合约 | 地址 |
|------|------|
| ServiceRegistry | `0x6F9679BdF5F180a139d01c598839a5df4860431b` |
| PaymentManager | `0xf4AE7E15B1012edceD8103510eeB560a9343AFd3` |
| SubscriptionManager | `0x0bF7dE8d71820840063D4B8653Fd3F0618986faF` |
| Escrow | `0xc981ec845488b8479539e6B22dc808Fb824dB00a` |
| AgentWalletFactory | `0x5E5713a0d915701F464DEbb66015adD62B2e6AE9` |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **区块链** | Monad Testnet (chainId 10143), Solidity 0.8.20, Foundry, OpenZeppelin |
| **SDK** | TypeScript, ethers.js v6, tsup |
| **中间件** | TypeScript, Express.js, LRU Cache |
| **索引器** | TypeScript, PostgreSQL 16, Express.js |
| **前端** | Next.js 14, React 18, wagmi, viem, RainbowKit, Tailwind CSS, shadcn/ui |
| **Skill** | TypeScript, OpenAI Function Calling / MCP / OpenClaw 兼容 |
| **构建** | pnpm workspaces, Turborepo |

---

## 详细文档

| 文档 | 说明 |
|------|------|
| [架构设计](./docs/architecture.md) | 完整架构、x402 协议、合约设计、各组件详解 |
| [SDK & 中间件开发手册](./docs/development-guide.md) | Agent 集成 SDK + Provider 集成 Middleware 完整指南 |
| [OpenClaw 集成手册](./docs/openclaw-integration.md) | 将 AgentXPay Skill 接入 OpenClaw 平台 |

