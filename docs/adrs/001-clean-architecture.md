# ADR 001: Clean Architecture + DDD + Hexagonal

## Status
Aceito (Atualizado com padrões GitAgent.AI-Backend)

## Contexto
O Atlas.ai é um agente autônomo de recrutamento que precisa processar grandes volumes de dados de vagas de emprego, integrar com múltiplas APIs externas (ATS, RSS, SERP), orquestrar filas assíncronas e expor funcionalidades via MCP. A complexidade do sistema exige uma arquitetura que garanta:

- Separação clara de responsabilidades
- Testabilidade das regras de negócio
- Independência de frameworks externos na camada de domínio
- Facilidade de manutenção e evolução
- Padrões DDD para modelagem de domínio rico

## Decisão
Adotar **Clean Architecture + DDD + Hexagonal (Ports & Adapters)** com as seguintes camadas:

### Camada de Domínio (src/core/domain)
- **Responsabilidade:** Entidades de negócio puras, sem dependências externas
- **Sub-camadas DDD:**
  - `entities/`: Entidades com identidade (Job, FitScore)
  - `value-objects/`: Objetos de valor imutáveis (TechStack, Location)
- **Regra:** ZERO dependências de frameworks, bibliotecas de rede, ou banco de dados
- **Testes:** Unitários puros, sem mocks de infraestrutura

### Camada de Aplicação (src/core/application)
- **Responsabilidade:** Orquestração de lógica de negócio e definição de contratos
- **Sub-camadas Hexagonais:**
  - `ports/`: Interfaces de entrada/saída (IIngestionPort, IEvaluationPort)
  - `use-cases/`: Casos de uso concretos (IngestJobs, NormalizeJob, EvaluateJobFit)
- **Regra:** Dependem apenas da camada de domínio e definem contratos para adapters
- **Testes:** Unitários com mocks de ports

### Camada de Infraestrutura (src/infrastructure)
- **Responsabilidade:** Implementação concreta de adaptadores externos
- **Sub-camadas:**
  - `adapters/`: Implementação dos ports (RSSAdapter, GreenhouseAdapter, BullMQAdapter)
  - `framework/`: Isolamento de framework específico (para Strangler Fig)
  - `config/`: Validação de ambiente com Zod
  - `ingestion/`: RSS, ATS APIs, SERP/Dorking
  - `queues/`: BullMQ producers, consumers, workers
  - `ai/`: LLM clients, prompts, avaliadores
  - `mcp/`: Servidor MCP, registro de ferramentas
- **Regra:** Implementa interfaces definidas na camada de application
- **Testes:** Integração com mocks de serviços externos

### Ponto de Entrada (src/main.ts)
- **Responsabilidade:** Bootstrap da aplicação
- **Função:** Inicializar Redis, filas, servidor MCP e workers
- **Regra:** Mínimo código de orquestração

## Consequências

### Positivas
- **Testabilidade:** Camada de domínio testável sem dependências externas
- **Manutenibilidade:** Mudanças em infraestrutura não afetam regras de negócio
- **Escalabilidade:** Fácil adicionar novos adaptadores sem modificar domínio
- **Clareza:** Separação explícita de responsabilidades

### Negativas
- **Boilerplate inicial:** Mais arquivos e interfaces no início
- **Curva de aprendizado:** Equipe precisa entender os princípios de Clean Architecture
- **Overhead para features simples:** Operações triviais podem parecer excessivamente estruturadas

## Referências
- .cursorrules (seção 2)
- docs/roadmap.md (estrutura de pastas)
- docs/deepresearch.md (arquitetura de coleta de dados)

## Data
2026-08-19
