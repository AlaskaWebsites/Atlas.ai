# ADR 003: Processamento Cognitivo Distribuído (MapReduce)

## Status
Aceito

## Contexto
O Atlas.ai precisa avaliar centenas de vagas de emprego usando LLMs como "Avaliador de Currículo". O desafio técnico crítico é:

- **Context Rot:** LLMs perdem precisão quando processam muitos itens em uma única janela de contexto
- **Token Burn:** Custos e latência escalam quadraticamente com volume
- **Rate Limits:** APIs de LLM bloqueiam requisições massivas simultâneas
- **Qualidade:** Avaliações no meio do contexto são menos precisas

## Decisão
Adotar **Padrão MapReduce** para processamento cognitivo distribuído:

### Map Stage: Micro-Lotes
- **Função:** Fracionar vagas em blocos de 5 itens
- **Implementação:** `src/core/use-cases/map-jobs.ts`
- **Saída:** Múltiplos jobs na `evaluation-queue`
- **Racional:** 5 vagas = ~2000-3000 tokens (dentro de janela ótima)

### LLM Avaliador
- **Papel:** "Avaliador de Currículo" estrito
- **Input:** 5 vagas + stack esperada (Node.js, React, Vue, TS)
- **Output:** JSON estrito com:
  ```typescript
  {
    jobId: string;
    score: number;        // 0-100
    reasoning: string;
    matchedTechStack: string[];
    missingTechStack: string[];
  }
  ```
- **Implementação:** `src/infrastructure/ai/job-evaluator.ts`

### Reduce Stage: Agregação
- **Função:** Consolidar relatórios parciais
- **Implementação:** `src/core/use-cases/reduce-jobs.ts`
- **Operações:**
  - Ordenar por fit score decrescente
  - Remover duplicatas
  - Retornar top N matches (ex: top 10)
- **Saída:** `FinalRecommendation[]`

### Integração com BullMQ
```typescript
// Map: Enfileira micro-lotes
for (const batch of chunk(jobs, 5)) {
  await evaluationQueue.add('evaluate-batch', {
    jobId: hash(batch),
    normalizedJobs: batch,
    batchSize: 5
  });
}

// Reduce: Agrega resultados após conclusão
const results = await evaluationQueue.getCompleted();
const topMatches = reduceJobs(results);
```

## Consequências

### Positivas
- **Qualidade consistente:** Cada avaliação tem contexto ótimo
- **Resiliência:** Falha em um lote não afeta outros
- **Escalabilidade:** Fácil paralelizar workers
- **Custo controlado:** Token burn previsível por lote

### Negativas
- **Latência:** Múltiplas chamadas de LLM aumentam tempo total
- **Complexidade:** Orquestração Map/Reduce adiciona complexidade
- **Estado:** Precisa rastrear jobs parciais para agregação
- **Erro handling:** Falhas parciais requerem lógica de retry

## Referências
- .cursorrules (seção 4)
- docs/roadmap.md (Fase 4)
- docs/deepresearch.md (seção MapReduce)

## Data
2026-08-19
