import { Job } from 'bullmq';
import { BullMQClient } from './bull-mq-client';
import { IngestionAdapter } from '../adapters/ingestion.adapter';
import { IngestionProducer, NormalizationProducer } from './producers';
import { RawJob } from '../../core/domain';

/**
 * Queue Consumers
 * Following ADR 002: BullMQ & Redis Resilience
 */

export class IngestionConsumer {
  constructor(
    private bullMQClient: BullMQClient,
    private ingestionAdapter: IngestionAdapter,
    private normalizationProducer: NormalizationProducer
  ) {}

  async start(): Promise<void> {
    await this.bullMQClient.createWorker(
      'ingestion-queue',
      async (job: Job) => {
        console.log(`🔄 Processing ingestion job ${job.id}`);
        
        const data = job.data as { source: string; config?: any };
        let jobs: RawJob[] = [];

        try {
          switch (data.source) {
            case 'rss':
              jobs = await this.ingestionAdapter.ingestRSS(data.config);
              break;
            case 'greenhouse':
              jobs = await this.ingestionAdapter.ingestGreenhouse(data.config);
              break;
            case 'lever':
              jobs = await this.ingestionAdapter.ingestLever(data.config);
              break;
            case 'ashby':
              jobs = await this.ingestionAdapter.ingestAshby(data.config);
              break;
            case 'workable':
              jobs = await this.ingestionAdapter.ingestWorkable(data.config);
              break;
            case 'serp':
              jobs = await this.ingestionAdapter.ingestSERP(data.config);
              break;
            default:
              throw new Error(`Unknown source: ${data.source}`);
          }

          console.log(`✅ Ingested ${jobs.length} jobs from ${data.source}`);
          
          // Send to normalization queue
          if (jobs.length > 0) {
            await this.normalizationProducer.addNormalizationJob(jobs);
          }

        } catch (error) {
          console.error(`❌ Ingestion job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        concurrency: 5,
      }
    );
  }
}

export class NormalizationConsumer {
  constructor(private bullMQClient: BullMQClient) {}

  async start(): Promise<void> {
    await this.bullMQClient.createWorker(
      'normalization-queue',
      async (job: Job) => {
        console.log(`🔄 Processing normalization job ${job.id}`);
        
        const data = job.data as { jobs: RawJob[] };
        
        try {
          // TODO: Implement normalization logic (Phase 2)
          // For now, just pass through the jobs
          console.log(`✅ Normalized ${data.jobs.length} jobs`);
          
        } catch (error) {
          console.error(`❌ Normalization job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        concurrency: 10,
      }
    );
  }
}

export class EvaluationConsumer {
  constructor(private bullMQClient: BullMQClient) {}

  async start(): Promise<void> {
    await this.bullMQClient.createWorker(
      'evaluation-queue',
      async (job: Job) => {
        console.log(`🔄 Processing evaluation job ${job.id}`);
        
        const data = job.data as { jobs: RawJob[]; batchSize: number };
        
        try {
          // TODO: Implement evaluation logic (Phase 4)
          console.log(`✅ Evaluated ${data.jobs.length} jobs in batches of ${data.batchSize}`);
          
        } catch (error) {
          console.error(`❌ Evaluation job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        concurrency: 3,
      }
    );
  }
}
