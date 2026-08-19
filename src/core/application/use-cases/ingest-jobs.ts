import { IIngestionPort } from '../ports/ingestion.port';
import { RawJob } from '../../domain';

/**
 * Ingest Jobs Use Case
 * Orchestrates job ingestion from multiple sources
 * Following Clean Architecture - application layer
 */

export interface IngestJobsInput {
  sources: Array<'rss' | 'greenhouse' | 'lever' | 'ashby' | 'workable' | 'serp'>;
  configs?: Record<string, any>;
}

export interface IngestJobsOutput {
  jobs: RawJob[];
  source: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class IngestJobsUseCase {
  constructor(private ingestionPort: IIngestionPort) {}

  async execute(input: IngestJobsInput): Promise<IngestJobsOutput[]> {
    const results: IngestJobsOutput[] = [];

    for (const source of input.sources) {
      try {
        const jobs = await this.ingestFromSource(source, input.configs);
        results.push({
          jobs,
          source,
          timestamp: new Date(),
          success: true,
        });
      } catch (error) {
        results.push({
          jobs: [],
          source,
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async ingestFromSource(
    source: string,
    configs?: Record<string, any>
  ): Promise<RawJob[]> {
    switch (source) {
      case 'rss':
        return await this.ingestionPort.ingestRSS(configs?.rss);
      case 'greenhouse':
        return await this.ingestionPort.ingestGreenhouse(configs?.greenhouse);
      case 'lever':
        return await this.ingestionPort.ingestLever(configs?.lever);
      case 'ashby':
        return await this.ingestionPort.ingestAshby(configs?.ashby);
      case 'workable':
        return await this.ingestionPort.ingestWorkable(configs?.workable);
      case 'serp':
        return await this.ingestionPort.ingestSERP(configs?.serp);
      default:
        throw new Error(`Unknown source: ${source}`);
    }
  }
}
