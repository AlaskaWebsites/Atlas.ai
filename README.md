# 🤖 Atlas.ai - Agente Recrutador Autônomo

**Atlas.ai** é um motor de recrutamento autônomo e de alta performance, projetado para operar como um daemon inteligente em segundo plano. O sistema automatiza a varredura, triagem e avaliação de oportunidades de engenharia de software na web, unindo arquitetura de backend resiliente e inteligência artificial distribuída.

## 🎯 Objetivos Centrais

- **Ingestão Passiva (Zero Headless Browsers):** Extração de vagas via RSS/Atom, APIs públicas de ATS (Greenhouse, Lever, Ashby, Workable) e OSINT (Google Dorks).
- **Normalização e Validação:** Schemas estritos com Zod, higienização automática de dados e fail-fast em entradas inválidas.
- **Orquestração Resiliente:** Filas assíncronas com BullMQ, Redis persistente, rate limiting e exponential backoff.
- **Processamento Cognitivo Distribuído:** Padrão MapReduce para mitigar Context Rot, avaliação de fit score (0-100) contra stack técnica.
- **Exposição Universal:** Model Context Protocol (MCP) para integração com LLMs e IDEs de código.

## 🏗️ Arquitetura (Clean Architecture)

```
Atlas.ai/
├── .cursorrules                          # Regras maestras para IAs assistivas
├── docker-compose.yml                    # Redis + configuração local
├── package.json & tsconfig.json
├── vitest.config.ts
├── docs/
│   ├── roadmap.md                       # Plano de 5 fases
│   ├── infrastructure.md                 # Detalhes de infraestrutura
│   └── adrs/                            # Architecture Decision Records
└── src/
    ├── core/
    │   ├── domain/                      # Entidades puras (Job, FitScore, etc)
    │   └── use-cases/                   # Casos de uso (IngestJobs, EvaluateFit, etc)
    ├── infrastructure/
    │   ├── config/                      # Zod schemas para variáveis de ambiente
    │   ├── ingestion/                   # Adaptadores RSS, ATS APIs, SERP/Dorks
    │   ├── queues/                      # BullMQ producers/consumers/workers
    │   ├── ai/                          # Integração LLM, prompts, validação
    │   └── mcp/                         # Servidor MCP, registro de tools
    └── main.ts                          # Ponto de entrada / inicialização MCP
```

## 📋 Fases de Desenvolvimento

### Fase 1: Ingestão Passiva de Dados
- [ ] Feeds RSS/Atom (We Work Remotely, backend-br/vagas)
- [ ] APIs de ATS (Greenhouse, Lever, Ashby, Workable)
- [ ] Conector SERP + Google Dorks com restrição temporal semanal

### Fase 2: Normalização & Fail-Fast (Zod)
- [ ] Schemas unificados para vagas
- [ ] Higienização de HTML e descarte imediato de inválidas

### Fase 3: Orquestração Resiliente (Redis + BullMQ)
- [ ] docker-compose.yml com Redis
- [ ] Filas com deduplicação criptográfica
- [ ] Rate limiting, concorrência controlada e exponential backoff

### Fase 4: Processamento Cognitivo (MapReduce)
- [ ] Map Stage: Micro-lotes de 5 vagas → LLM Avaliador
- [ ] Cálculo de Fit Score (0-100)
- [ ] Reduce Stage: Agregação determinística

### Fase 5: Exposição via MCP
- [ ] Servidor MCP com SDK oficial
- [ ] Ferramentas registradas (`search_ats_dorks`, `evaluate_jobs`, `get_top_matches`)
- [ ] Transporte de E/S padrão e HTTP streaming

## 🚀 Começando

### Pré-requisitos
- Node.js 22+
- npm 10+
- Docker & Docker Compose (opcional, para Redis local)

### Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/AlaskaWebsites/Atlas.ai.git
cd Atlas.ai

# Checkout da branch develop
git checkout develop

# Instale as dependências
npm install

# Crie a estrutura de pastas (macOS/Linux)
mkdir -p src/core/domain src/core/use-cases src/infrastructure/config src/infrastructure/ingestion src/infrastructure/queues src/infrastructure/ai src/infrastructure/mcp docs/adrs

# Ou no Windows PowerShell:
# mkdir src\core\domain, src\core\use-cases, src\infrastructure\config, src\infrastructure\ingestion, src\infrastructure\queues, src\infrastructure\ai, src\infrastructure\mcp, docs\adrs
```

### Executar em Desenvolvimento

```bash
# Inicia o Redis via Docker Compose (opcional)
docker-compose up -d redis

# Roda o servidor MCP em watch mode
npm run dev

# Executa os testes
npm run test

# Gera relatório de cobertura
npm run test:cov
```

## 📚 Documentação Adicional

- **[docs/roadmap.md](./docs/roadmap.md)** - Plano técnico detalhado de 5 fases
- **[docs/infrastructure.md](./docs/infrastructure.md)** - Padrões de infraestrutura e resiliência
- **[docs/adrs/](./docs/adrs/)** - Architecture Decision Records (ADRs)

## 🔧 Padrões de Codificação

1. **Clean Architecture Estrita:** Domínio puro, casos de uso agnósticos e adaptadores isolados.
2. **Validação com Zod:** Todos os inputs/configs passam por schemas Zod com fail-fast.
3. **Testes com Vitest:** Unitários para use-cases, integração com mocks para adaptadores.
4. **BullMQ + Redis:** Filas resilientes com deduplicação e rate limiting.
5. **MCP para Exposição:** Ferramentas registradas e validadas com Zod.

## 📝 Fluxo GitFlow

- `main`: Produção estável (recebe PRs apenas de `develop`)
- `develop`: Integração contínua (branch de trabalho principal)
- Feature branches: `feature/nome-da-feature` → PR para `develop`

## 📞 Suporte

Para dúvidas arquiteturais, consulte os `.cursorrules` e `/docs/adrs/`. Para questões técnicas, abra uma issue ou discussion.

---

**Mantido por:** [@AlaskaWebsites](https://github.com/AlaskaWebsites)  
**Licença:** UNLICENSED  
**Última atualização:** 2026-08-19
