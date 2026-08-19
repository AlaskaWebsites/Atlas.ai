import { Job } from 'bullmq';
import { BullMQClient } from './bull-mq-client';
import { RawJob } from '../../core/domain';

/**
 * Queue Producers
 * Following ADR 002: BullMQ & Redis Resilience
 */

export interface IngestionJobData {
  source: string;
  config?: any;
  timestamp: number;
}

export class IngestionProducer {
  constructor(private bullMQClient: BullMQClient) {}

  async addIngestionJob(data: IngestionJobData): Promise<Job<IngestionJobData>> {
    const queue = this.bullMQClient.getQueue('ingestion-queue');
    
    if (!queue) {
      throw new Error('Ingestion queue not found');
    }

    const jobId = this.generateJobId(data);
    
    return await queue.add('ingest', data, {
      jobId,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 50,
      },
    });
  }

  private generateJobId(data: IngestionJobData): string {
    // Cryptographic hash for deduplication
    const hash = btoa(`${data.source}-${data.timestamp}-${JSON.stringify(data.config)}`);
    return hash.substring(0, 32);
  }
}

export class NormalizationProducer {
  constructor(private bullMQClient: BullMQClient) {}

  async addNormalizationJob(jobs: RawJob[]): Promise<Job> {
    const queue = this.bullMQClient.getQueue('normalization-queue');
    
    if (!queue) {
      throw new Error('Normalization queue not found');
    }

    return await queue.add('normalize', { jobs }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}

export class EvaluationProducer {
  constructor(private bullMQClient: BullMQClient) {}

  async addEvaluationJob(jobs: RawJob[], batchSize: number = 5): Promise<Job> {
    const queue = this.bullMQClient.getQueue('evaluation-queue');
    
    if (!queue) {
      throw new Error('Evaluation queue not found');
    }

    return await queue.add('evaluate', { jobs, batchSize }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    });
  }
}
