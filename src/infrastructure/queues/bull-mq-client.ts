import { Queue, Worker, Job, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

/**
 * BullMQ Client Configuration
 * Following ADR 002: BullMQ & Redis Resilience
 */

export interface QueueConfig {
  name: string;
  connection: Redis;
  options?: QueueOptions;
}

export class BullMQClient {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private connection: Redis;

  constructor(redisHost: string = 'localhost', redisPort: number = 6379) {
    // Use ioredis for BullMQ compatibility
    this.connection = new Redis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.connection.on('error', (err: Error) => {
      console.error('❌ Redis connection error:', err);
    });

    this.connection.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  async createQueue(config: QueueConfig): Promise<Queue> {
    if (this.queues.has(config.name)) {
      return this.queues.get(config.name)!;
    }

    const queue = new Queue(config.name, {
      connection: this.connection,
      ...config.options,
    });

    this.queues.set(config.name, queue);
    console.log(`✅ Queue '${config.name}' created`);
    return queue;
  }

  async createWorker(
    queueName: string,
    processor: (job: Job) => Promise<void>,
    options?: any
  ): Promise<Worker> {
    if (this.workers.has(queueName)) {
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(queueName, processor, {
      connection: this.connection,
      concurrency: 5,
      ...options,
    });

    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed in queue '${queueName}'`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed in queue '${queueName}':`, err.message);
    });

    this.workers.set(queueName, worker);
    console.log(`✅ Worker for queue '${queueName}' created`);
    return worker;
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }

  async closeAll(): Promise<void> {
    console.log('🔄 Closing all queues and workers...');
    
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    
    await this.connection.quit();
    
    this.workers.clear();
    this.queues.clear();
    
    console.log('✅ All queues and workers closed');
  }

  getConnection(): Redis {
    return this.connection;
  }
}
