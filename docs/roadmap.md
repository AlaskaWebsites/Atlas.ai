# 🗺️ Roadmap de Engenharia: Atlas.ai (Agente Recrutador Autônomo)

O **Atlas.ai** é um agente autônomo de inteligência de vagas projetado para monitorar, extrair passivamente (sem headless browsers), filtrar e avaliar oportunidades para Desenvolvedores Fullstack (Node.js, React, Vue, TypeScript) com arquitetura distribuída e exposição universal via Model Context Protocol (MCP).

---

## 🎯 Visão Geral

Este roadmap detalha as **5 fases principais** de desenvolvimento, estruturadas em torno de:

1. **Ingestão Passiva:** RSS, APIs públicas de ATS e OSINT (Google Dorks)
2. **Normalização:** Validação com Zod, fail-fast e higienização automática
3. **Resiliência:** Redis + BullMQ, rate limiting e exponential backoff
4. **Processamento Cognitivo:** MapReduce distribuído com LLM Avaliador
5. **Exposição Universal:** Model Context Protocol (MCP) para integração com IAs

---

## 📋 Fase 1: Ingestão Passiva de Dados (Sem Headless Browsers)

**Objetivo:** Construir adaptadores de ingestão que coletam vagas automaticamente via feeds públicos, APIs REST e OSINT, sem desencadear proteções anti-bot (WAF, CAPTCHA, CAPTCHAs).

### Tarefas

- [ ] **RSS/Atom Feeds**
  - [ ] We Work Remotely (Fullstack + Programming)
  - [ ] GitHub Backend-BR Issues (`backend-br/vagas`)
  - [ ] StackOverflow Jobs Feed
  - [ ] Trampos.co RSS Feed
  - Implementar: `src/infrastructure/ingestion/rss-client.ts`
  - Testes: `src/infrastructure/ingestion/rss-client.spec.ts`

- [ ] **APIs de ATS Públicas**
  - [ ] Greenhouse: `boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true`
  - [ ] Lever: `api.lever.co/v0/postings/{clientname}?mode=json`
  - [ ] Ashby: `api.ashbyhq.com/posting-api/job-board/{clientname}`
  - [ ] Workable: `apply.workable.com/api/v3/accounts/{slug}/jobs`
  - Implementar: `src/infrastructure/ingestion/ats-adapters/`
  - Testes: Mocks das respostas JSON

- [ ] **Conector SERP & Google Dorks**
  - [ ] Integração com SerpApi ou alternativa
  - [ ] Operadores: `site:`, `inurl:`, `tbs=qdr:w` (última semana)
  - [ ] Padrões para Gupy, Greenhouse, Lever, Workable
  - Implementar: `src/infrastructure/ingestion/serp-connector.ts`
  - Testes: Mocks de respostas SERP

### Artefatos de Saída

```typescript
// RawJob (saída bruta da ingestão)
interface RawJob {
  source: 'rss' | 'ats-greenhouse' | 'ats-lever' | 'ats-ashby' | 'serp';
  externalId: string;
  title: string;
  company: string;
  description: string; // HTML ou texto puro
  publishedAt: Date;
  url: string;
}
```

---

## 📋 Fase 2: Normalização e Blindagem com Zod

**Objetivo:** Validar rigorosamente todos os dados brutos, higienizar HTML redundante e descartar imediatamente entradas corrompidas ou fora do escopo técnico.

### Tarefas

- [ ] **Schemas Zod para Validação**
  - [ ] `RawJobSchema` (entrada bruta)
  - [ ] `NormalizedJobSchema` (saída normalizada)
  - [ ] `TechStackSchema` (pilha técnica esperada)
  - Implementar: `src/infrastructure/config/schemas.ts`

- [ ] **Poda e Higienização**
  - [ ] Remover blocos de CSS/JS inline
  - [ ] Limpar HTML tags desnecessárias
  - [ ] Normalizar espaçamento e quebras de linha
  - Implementar: `src/core/use-cases/normalize-job.ts`

- [ ] **Fail-Fast & Descarte**
  - [ ] Validação estrita no bootstrap
  - [ ] Rejeição automática de vagas sem título/empresa/descrição
  - [ ] Logging de erros de validação
  - Testes: casos de falha esperados

### Artefatos de Saída

```typescript
// NormalizedJob (após validação e limpeza)
interface NormalizedJob {
  id: string; // UUID
  source: string;
  externalId: string;
  title: string;
  company: string;
  description: string; // HTML limpo
  location?: string;
  type?: 'remote' | 'hybrid' | 'onsite';
  publishedAt: Date;
  url: string;
  techStack: string[]; // Extraído da descrição via NLP ou regex
  validatedAt: Date;
}
```

---

## 📋 Fase 3: Orquestração e Resiliência com BullMQ & Redis

**Objetivo:** Construir uma infraestrutura de filas assíncronas com tolerância a falhas, rate limiting e deduplicação criptográfica.

### Tarefas

- [ ] **Configuração do Redis**
  - [ ] `docker-compose.yml` com Redis persistente (AOF, noeviction)
  - [ ] Variáveis de ambiente (host, port, password)
  - Implementar: `docker-compose.yml`

- [ ] **BullMQ Producers & Consumers**
  - [ ] Fila de ingestão (`ingestion-queue`)
  - [ ] Fila de normalização (`normalize-queue`)
  - [ ] Fila de avaliação (`evaluation-queue`)
  - Implementar: `src/infrastructure/queues/`
  - Testes: Mocks de Redis

- [ ] **Rate Limiting & Concurrency**
  - [ ] Limiter global para chamadas de LLM (ex: 10 req/min)
  - [ ] Concorrência máxima (ex: 5 workers simultâneos)
  - [ ] Configuração via Zod schema
  - Implementar: `src/infrastructure/queues/limiter-config.ts`

- [ ] **Exponential Backoff & 429 Handling**
  - [ ] Retry policy com backoff exponencial
  - [ ] Máximo de 5 tentativas por job
  - [ ] Logging de bloqueios temporários
  - Testes: Simulação de 429 responses

- [ ] **Deduplicação Criptográfica**
  - [ ] Hash do jobId baseado em `source + externalId + publishedAt`
  - [ ] Verificação antes de enfilar
  - [ ] Persistência em Redis set
  - Implementar: `src/infrastructure/queues/deduplication.ts`

### Artefatos de Saída

```typescript
// BullMQ Job Structure
interface IngestionJob {
  jobId: string; // Hash criptográfico para deduplicação
  source: string;
  timestamp: number;
  attempt: number;
}

interface EvaluationJob {
  jobId: string;
  normalizedJobs: NormalizedJob[];
  batchSize: number; // MapReduce batch
  timestamp: number;
}
```

---

## 📋 Fase 4: Processamento Cognitivo Distribuído (MapReduce)

**Objetivo:** Fracionar a massa de vagas em micro-lotes, processar com LLM Avaliador e agregar resultados de forma determinística.

### Tarefas

- [ ] **Map Stage: Micro-Lotes**
  - [ ] Divisão em blocos de 5 vagas
  - [ ] Enfileiramento de sub-tarefas na `evaluation-queue`
  - Implementar: `src/core/use-cases/map-jobs.ts`

- [ ] **LLM Avaliador**
  - [ ] Prompt estruturado: "Avaliador de Currículo"
  - [ ] Input: Vaga + Stack esperada (Node.js, React, Vue, TS)
  - [ ] Output: JSON com fit score (0-100) + justificativa
  - Implementar: `src/infrastructure/ai/job-evaluator.ts`
  - Testes: Mock de respostas LLM

- [ ] **Reduce Stage: Agregação**
  - [ ] Consolidação de relatórios parciais
  - [ ] Ordenação por fit score decrescente
  - [ ] Descarte de duplicatas
  - [ ] Saída final: Top N matches (ex: top 10)
  - Implementar: `src/core/use-cases/reduce-jobs.ts`

### Artefatos de Saída

```typescript
// FitScore (resultado da avaliação)
interface FitScore {
  jobId: string;
  score: number; // 0-100
  reasoning: string;
  matchedTechStack: string[];
  missingTechStack: string[];
  evaluatedAt: Date;
}

// FinalRecommendation (após reduce)
interface FinalRecommendation {
  job: NormalizedJob;
  fitScore: FitScore;
  rank: number;
}
```

---

## 📋 Fase 5: Exposição Universal via Model Context Protocol (MCP)

**Objetivo:** Criar um servidor MCP que exponha as ferramentas do Atlas.ai para integração com LLMs e IDEs de código.

### Tarefas

- [ ] **Servidor MCP**
  - [ ] Inicialização com `@modelcontextprotocol/sdk`
  - [ ] Transporte de E/S padrão (`StdioServerTransport`)
  - Implementar: `src/infrastructure/mcp/server.ts`

- [ ] **Registro de Ferramentas (Tools)**
  - [ ] `search_ats_dorks(keywords, maxResults)` → Promise<Recommendation[]>
  - [ ] `evaluate_jobs(jobs)` → Promise<FitScore[]>
  - [ ] `get_top_matches(limit)` → Promise<Recommendation[]>
  - Validação de inputs com Zod
  - Implementar: `src/infrastructure/mcp/tools.ts`

- [ ] **Integração com LLM Cliente**
  - [ ] Testes de comunicação via stdio
  - [ ] Documentação de uso
  - Testes E2E: Cliente MCP mock

### Artefatos de Saída

```typescript
// MCP Tool Definition (Zod validated)
interface MCPTool {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  handler: (input: any) => Promise<any>;
}
```

---

## 📋 Fase 6: Qualidade e Testes (Vitest)

**Objetivo:** Cobertura abrangente de testes unitários e E2E com Vitest.

### Tarefas

- [ ] **Testes Unitários**
  - [ ] `src/core/use-cases/*.spec.ts` (casos de uso puros)
  - [ ] `src/infrastructure/config/*.spec.ts` (validação Zod)
  - [ ] Meta: >80% de cobertura

- [ ] **Testes de Integração**
  - [ ] Mocks de Redis e BullMQ
  - [ ] Mocks de APIs ATS
  - [ ] Mocks de LLM responses
  - Implementar: `test/integration/*.spec.ts`

- [ ] **Testes E2E**
  - [ ] Cenário completo: Ingestão → Normalização → Filas → Avaliação → MCP
  - [ ] Validação de saída final
  - Implementar: `test/e2e/*.spec.ts`

- [ ] **CI/CD Pipeline**
  - [ ] GitHub Actions para Vitest no PR
  - [ ] Coverage report
  - [ ] Lint check

---

## 🏁 Marcos Principais

| Fase | Título | Status | ETA |
|------|--------|--------|-----|
| 1 | Ingestão Passiva | ⬜ TODO | T+2w |
| 2 | Normalização & Zod | ⬜ TODO | T+1w |
| 3 | Redis & BullMQ | ⬜ TODO | T+2w |
| 4 | MapReduce & LLM | ⬜ TODO | T+3w |
| 5 | MCP Exposure | ⬜ TODO | T+1w |
| 6 | Testes & CI/CD | ⬜ TODO | T+2w |

---

## 📚 Estrutura de Pastas Final

```
Atlas.ai/
├── .cursorrules
├── .gitignore
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── docs/
│   ├── roadmap.md (este arquivo)
│   ├── infrastructure.md
│   └── adrs/
│       ├── 001-clean-architecture.md
│       ├── 002-bullmq-redis-resilience.md
│       └── 003-mapreduce-cognitive-processing.md
├── src/
│   ├── core/
│   │   ├── domain/
│   │   │   ├── job.ts
│   │   │   ├── fit-score.ts
│   │   │   └── index.ts
│   │   └── use-cases/
│   │       ├── ingest-jobs.ts
│   │       ├── normalize-job.ts
│   │       ├── map-jobs.ts
│   │       ├── evaluate-fit.ts
│   │       └── reduce-jobs.ts
│   ├── infrastructure/
│   │   ├── config/
│   │   │   ├── env.ts (Zod validation)
│   │   │   ├── schemas.ts
│   │   │   └── index.ts
│   │   ├── ingestion/
│   │   │   ├── rss-client.ts
│   │   │   ├── ats-adapters/
│   │   │   │   ├── greenhouse.ts
│   │   │   │   ├── lever.ts
│   │   │   │   └── ashby.ts
│   │   │   ├── serp-connector.ts
│   │   │   └── index.ts
│   │   ├── queues/
│   │   │   ├── bull-mq-client.ts
│   │   │   ├── producers.ts
│   │   │   ├── consumers.ts
│   │   │   ├── deduplication.ts
│   │   │   └── index.ts
│   │   ├── ai/
│   │   │   ├── llm-client.ts
│   │   │   ├── job-evaluator.ts
│   │   │   ├── prompts.ts
│   │   │   └── index.ts
│   │   └── mcp/
│   │       ├── server.ts
│   │       ├── tools.ts
│   │       └── index.ts
│   └── main.ts (Entry point)
└── test/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🚀 Próximos Passos

1. ✅ Clonar repositório e criar branch `develop`
2. ⬜ Implementar Fase 1: Ingestão Passiva
3. ⬜ Implementar Fase 2: Normalização
4. ⬜ Implementar Fase 3: Filas Resilientes
5. ⬜ Implementar Fase 4: MapReduce + LLM
6. ⬜ Implementar Fase 5: MCP
7. ⬜ Cobertura de Testes Abrangente

---

**Última atualização:** 2026-08-19  
**Mantido por:** [@AlaskaWebsites](https://github.com/AlaskaWebsites)
