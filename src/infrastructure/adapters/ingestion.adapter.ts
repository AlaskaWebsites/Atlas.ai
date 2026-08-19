import { IIngestionPort } from '../../core/application/ports/ingestion.port';
import { RawJob } from '../../core/domain';
import { 
  RSSClient, 
  RSSFeedConfig, 
  RSS_FEEDS,
  GreenhouseAdapter, 
  GreenhouseConfig,
  LeverAdapter, 
  LeverConfig,
  AshbyAdapter,
  AshbyConfig,
  WorkableAdapter,
  WorkableConfig,
  SERPConnector,
  SERPConfig
} from '../ingestion';
import { getEnv } from '../config/env';

/**
 * Ingestion Adapter
 * Implements IIngestionPort using concrete infrastructure implementations
 * Following Hexagonal Architecture - adapters implement ports
 */

export class IngestionAdapter implements IIngestionPort {
  private rssClient: RSSClient;
  private greenhouseAdapter: GreenhouseAdapter;
  private leverAdapter: LeverAdapter;
  private ashbyAdapter: AshbyAdapter;
  private workableAdapter: WorkableAdapter;
  private serpConnector: SERPConnector;

  constructor() {
    this.rssClient = new RSSClient();
    this.greenhouseAdapter = new GreenhouseAdapter();
    this.leverAdapter = new LeverAdapter();
    this.ashbyAdapter = new AshbyAdapter();
    this.workableAdapter = new WorkableAdapter();
    this.serpConnector = new SERPConnector();
  }

  async ingestRSS(config?: RSSFeedConfig): Promise<RawJob[]> {
    if (config) {
      return await this.rssClient.fetchFeed(config);
    }
    
    // Default: fetch from all configured RSS feeds
    const allJobs: RawJob[] = [];
    for (const feedConfig of RSS_FEEDS) {
      try {
        const jobs = await this.rssClient.fetchFeed(feedConfig);
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Failed to fetch RSS feed: ${feedConfig.url}`, error);
      }
    }
    return allJobs;
  }

  async ingestGreenhouse(config?: GreenhouseConfig): Promise<RawJob[]> {
    if (!config) {
      throw new Error('Greenhouse config (boardToken) is required');
    }
    return await this.greenhouseAdapter.fetchJobs(config);
  }

  async ingestLever(config?: LeverConfig): Promise<RawJob[]> {
    if (!config) {
      throw new Error('Lever config (clientName) is required');
    }
    return await this.leverAdapter.fetchJobs(config);
  }

  async ingestAshby(config?: AshbyConfig): Promise<RawJob[]> {
    if (!config) {
      throw new Error('Ashby config (clientName) is required');
    }
    return await this.ashbyAdapter.fetchJobs(config);
  }

  async ingestWorkable(config?: WorkableConfig): Promise<RawJob[]> {
    if (!config) {
      throw new Error('Workable config (accountSlug) is required');
    }
    return await this.workableAdapter.fetchJobs(config);
  }

  async ingestSERP(config?: SERPConfig): Promise<RawJob[]> {
    if (!config) {
      throw new Error('SERP config (keywords) is required');
    }

    // Use API key from environment if not provided in config
    const env = getEnv();
    const serpConfig: SERPConfig = {
      ...config,
      apiKey: config.apiKey || env.SERPAPI_KEY,
    };

    return await this.serpConnector.searchJobs(serpConfig);
  }
}
