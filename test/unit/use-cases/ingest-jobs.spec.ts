import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IngestJobsUseCase, IngestJobsInput } from '../../../src/core/application/use-cases/ingest-jobs';
import { IngestionAdapter } from '../../../src/infrastructure/adapters/ingestion.adapter';
import { RawJob } from '../../../src/core/domain';

describe('IngestJobsUseCase', () => {
  let useCase: IngestJobsUseCase;
  let mockAdapter: IngestionAdapter;

  beforeEach(() => {
    mockAdapter = new IngestionAdapter();
    useCase = new IngestJobsUseCase(mockAdapter);
  });

  it('should initialize without errors', () => {
    expect(useCase).toBeDefined();
  });

  it('should ingest jobs from single source', async () => {
    const input: IngestJobsInput = {
      sources: ['rss'],
    };

    const results = await useCase.execute(input);

    expect(results).toHaveLength(1);
    expect(results[0].source).toBe('rss');
    expect(results[0].timestamp).toBeInstanceOf(Date);
  });

  it('should ingest jobs from multiple sources', async () => {
    const input: IngestJobsInput = {
      sources: ['rss', 'greenhouse', 'lever'],
    };

    const results = await useCase.execute(input);

    expect(results).toHaveLength(3);
    expect(results.map(r => r.source)).toEqual(['rss', 'greenhouse', 'lever']);
  });

  it('should handle errors gracefully', async () => {
    const input: IngestJobsInput = {
      sources: ['greenhouse'],
      configs: {
        greenhouse: { boardToken: 'invalid' },
      },
    };

    const results = await useCase.execute(input);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toBeDefined();
  });

  it('should return empty jobs array on failure', async () => {
    const input: IngestJobsInput = {
      sources: ['greenhouse'],
      configs: {
        greenhouse: { boardToken: 'invalid' },
      },
    };

    const results = await useCase.execute(input);

    expect(results[0].jobs).toEqual([]);
  });
});
