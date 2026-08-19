import { RawJob } from '../../core/domain';

/**
 * SERP Connector for Google Dorks
 * Ingests job listings using Google search operators without headless browsers
 * Reference: Integration with SerpApi or similar service
 */

export interface SERPConfig {
  apiKey?: string; // SerpApi key or alternative service
  keywords: string[];
  maxResults?: number;
  timeRange?: 'd' | 'w' | 'm' | 'y'; // day, week, month, year
}

export interface SERPResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
}

export class SERPConnector {
  async searchJobs(config: SERPConfig): Promise<RawJob[]> {
    try {
      const results = await this.performSearch(config);
      return this.parseSERPResults(results);
    } catch (error) {
      console.error(`❌ SERP search failed for keywords:`, config.keywords, error);
      return [];
    }
  }

  private async performSearch(config: SERPConfig): Promise<SERPResult[]> {
    if (!config.apiKey) {
      console.warn('⚠️ No SERP API key provided, skipping search');
      return [];
    }

    try {
      // Build search query from keywords
      const query = config.keywords.join(' ');
      
      // Build SerpApi URL for Google Jobs
      const params = new URLSearchParams({
        engine: 'google_jobs',
        q: query,
        api_key: config.apiKey,
      });

      if (config.maxResults) {
        params.append('num', String(config.maxResults));
      }

      if (config.timeRange) {
        params.append('tbs', `qdr:${config.timeRange}`);
      }

      const url = `https://serpapi.com/search?${params.toString()}`;
      
      console.log(`🔍 Searching SERP for: "${query}"`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch SERP results`);
      }

      const data = await response.json();
      
      // Parse SerpApi Google Jobs response
      if (!data.jobs_results || !Array.isArray(data.jobs_results)) {
        console.warn('⚠️ No jobs results found in SERP response');
        return [];
      }

      // Convert SerpApi format to internal SERPResult format
      return data.jobs_results.map((job: any) => ({
        title: job.title || '',
        link: job.share_link || job.apply_options?.[0]?.link || '',
        snippet: job.description || '',
        date: job.detected_extensions?.posted_at || undefined,
      }));
    } catch (error) {
      console.error(`❌ SERP API call failed:`, error);
      throw error;
    }
  }

  private parseSERPResults(results: SERPResult[]): RawJob[] {
    return results.map((result) => ({
      source: 'serp' as const,
      externalId: this.generateExternalId(result.link),
      title: result.title,
      company: this.extractCompany(result.snippet),
      description: result.snippet,
      publishedAt: result.date ? new Date(result.date) : new Date(),
      url: result.link,
    }));
  }

  private generateExternalId(url: string): string {
    return btoa(url).substring(0, 32);
  }

  private extractCompany(snippet: string): string {
    // Simple extraction from snippet - in production would use NLP
    const companyPatterns = [
      /\bat\s+([A-Z][A-Za-z0-9&.]+(?:\s+[A-Z][A-Za-z0-9&.]+)*)/,
      /@([A-Z][A-Za-z0-9]+)/,
      /([A-Z][A-Za-z0-9&.]+)\s+is hiring/i,
    ];

    for (const pattern of companyPatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'Unknown';
  }

  /**
   * Generate Google Dorks for job search
   */
  static generateDorks(keywords: string[], atsTypes: string[] = ['greenhouse', 'lever', 'workable', 'ashby', 'gupy']): string[] {
    const dorks: string[] = [];
    
    for (const keyword of keywords) {
      for (const ats of atsTypes) {
        dorks.push(`site:${ats}.com "${keyword}" jobs`);
        dorks.push(`site:boards.greenhouse.io "${keyword}"`);
        dorks.push(`site:jobs.lever.co "${keyword}"`);
        dorks.push(`inurl:"${ats}" "${keyword}" developer`);
      }
    }

    return dorks;
  }
}

/**
 * Pre-configured SERP search patterns for common job sources
 */
export const SERP_PATTERNS = {
  GREENHOUSE: 'site:boards.greenhouse.io',
  LEVER: 'site:jobs.lever.co',
  WORKABLE: 'site:apply.workable.com',
  ASHBY: 'site:api.ashbyhq.com',
  GUPY: 'site:gupy.io',
  
  // Tech stack specific
  NODE_JS: 'site:boards.greenhouse.io "Node.js" OR "nodejs"',
  REACT: 'site:jobs.lever.co "React" OR "React.js"',
  TYPESCRIPT: 'site:apply.workable.com "TypeScript" OR "TS"',
  FULLSTACK: 'site:boards.greenhouse.io "Full Stack" OR "Fullstack"',
  
  // Location specific
  REMOTE: 'site:jobs.lever.co "remote" developer',
  BRAZIL: 'site:boards.greenhouse.io "Brazil" OR "Brasil" developer',
};
