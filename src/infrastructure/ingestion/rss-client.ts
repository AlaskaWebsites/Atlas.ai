import { RawJob } from '../../core/domain';

/**
 * RSS/Atom Feed Client
 * Ingests job listings from RSS feeds without headless browsers
 * Following ADR 001: Clean Architecture - infrastructure layer
 */

export interface RSSFeedConfig {
  url: string;
  source: RawJob['source'];
}

export class RSSClient {
  async fetchFeed(config: RSSFeedConfig): Promise<RawJob[]> {
    try {
      const response = await fetch(config.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch RSS feed`);
      }

      const text = await response.text();
      return this.parseRSS(text, config.source);
    } catch (error) {
      console.error(`❌ RSS ingestion failed for ${config.url}:`, error);
      throw error;
    }
  }

  private parseRSS(xml: string, source: RawJob['source']): RawJob[] {
    const jobs: RawJob[] = [];
    
    // Simple XML parsing for RSS/Atom feeds
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const titleRegex = /<title>([\s\S]*?)<\/title>/i;
    const linkRegex = /<link>([\s\S]*?)<\/link>/i;
    const descriptionRegex = /<description>([\s\S]*?)<\/description>/i;
    const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/i;
    const authorRegex = /<author>([\s\S]*?)<\/author>/i;

    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = titleRegex.exec(itemContent);
      const linkMatch = linkRegex.exec(itemContent);
      const descriptionMatch = descriptionRegex.exec(itemContent);
      const pubDateMatch = pubDateRegex.exec(itemContent);
      const authorMatch = authorRegex.exec(itemContent);

      if (titleMatch && linkMatch) {
        jobs.push({
          source,
          externalId: this.generateExternalId(linkMatch[1]),
          title: this.stripHTML(titleMatch[1]),
          company: authorMatch ? this.stripHTML(authorMatch[1]) : 'Unknown',
          description: descriptionMatch ? this.stripHTML(descriptionMatch[1]) : '',
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          url: linkMatch[1],
        });
      }
    }

    return jobs;
  }

  private generateExternalId(url: string): string {
    // Simple hash using URL as base for external ID
    return btoa(url).substring(0, 32);
  }

  private stripHTML(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

/**
 * Pre-configured RSS feeds for job sources
 */
export const RSS_FEEDS: RSSFeedConfig[] = [
  {
    url: 'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
    source: 'rss',
  },
  {
    url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    source: 'rss',
  },
  {
    url: 'https://github.com/backend-br/vagas/issues.atom',
    source: 'rss',
  },
  {
    url: 'https://stackoverflow.com/jobs/feed?q=Full+Stack+Developer',
    source: 'rss',
  },
  {
    url: 'https://trampos.co/feed',
    source: 'rss',
  },
];
