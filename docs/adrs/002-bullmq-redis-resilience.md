# ADR 002: BullMQ + Redis para Resiliência de Filas

## Status
Aceito

## Contexto
O Atlas.ai precisa processar grandes volumes de vagas de forma contínua (ciclos horários), comunicar-se com APIs de LLM (com rate limits estritos), e garantir que o processamento não falhe devido a:

- **Rate Limits (HTTP 429):** APIs de LLM bloqueiam requisições excessivas
- **Context Rot:** Processar muitas vagas em uma única chamada de LLM degrada qualidade
- **Falhas de rede:** Conexões intermitentes com APIs externas
- **Duplicação:** Re-processamento das mesmas vagas em ciclos subsequentes

## Decisão
Adotar **BullMQ + Redis** como infraestrutura de filas assíncronas com as seguintes políticas:

### Configuração Redis
- **Persistência:** AOF (Append Only File) com fsync everysec
- **Eviction policy:** noeviction (nunca remover dados)
- **Healthcheck:** Ping a cada 5s
- **Docker:** Serviço configurado em docker-compose.yml

### Filas BullMQ
- **ingestion-queue:** Jobs de coleta de dados (RSS, ATS, SERP)
- **normalize-queue:** Jobs de normalização e validação Zod
- **evaluation-queue:** Jobs de avaliação com LLM (MapReduce)

### Rate Limiting & Concurrency
```typescript
{
  limiter: {
    max: 10,        // máximo 10 jobs por minuto
    duration: 60000 // janela de 60 segundos
  },
  concurrency: 5    // máximo 5 workers simultâneos
}
```

### Exponential Backoff para Erros 429
```typescript
{
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000 // inicial 2s, dobra a cada tentativa
  }
}
```

### Deduplicação Criptográfica
- **jobId:** Hash SHA256 de `source + externalId + publishedAt`
- **Verificação:** Antes de enfileirar, verificar se jobId existe em Redis set
- **Benefício:** Evita processamento duplicado e re-processamento de vagas antigas

### Estrutura de Jobs
```typescript
interface IngestionJob {
  jobId: string;      // Hash para deduplicação
  source: string;     // 'rss', 'ats-greenhouse', 'serp'
  timestamp: number;
  attempt: number;
}

interface EvaluationJob {
  jobId: string;
  normalizedJobs: NormalizedJob[];
  batchSize: number;  // 5 vagas por lote (MapReduce)
  timestamp: number;
}
```

## Consequências

### Positivas
- **Resiliência:** Sistema tolera falhas de rede e rate limits
- **Idempotência:** Vagas duplicadas são automaticamente descartadas
- **Escalabilidade:** Fácil adicionar mais workers horizontalmente
- **Observabilidade:** BullMQ fornece métricas de jobs, retries, falhas

### Negativas
- **Complexidade:** Requer infraestrutura Redis adicional
- **Latência:** Processamento assíncrono adiciona delay ao pipeline
- **Debugging:** Jobs em fila podem ser difíceis de debugar em tempo real
- **Custo:** Redis persistente consome recursos (memória/disco)

## Referências
- .cursorrules (seção 3)
- docs/roadmap.md (Fase 3)
- docs/deepresearch.md (seção BullMQ)
- docker-compose.yml (configuração Redis)

## Data
2026-08-19
