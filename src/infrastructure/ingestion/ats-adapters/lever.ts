import { RawJob } from '../../../core/domain';

/**
 * Lever ATS Adapter
 * Fetches jobs from Lever public API
 * Reference: https://api.lever.co/v0/postings/{clientname}?mode=json
 */

export interface LeverConfig {
  clientName: string;
}

export class LeverAdapter {
  async fetchJobs(config: LeverConfig): Promise<RawJob[]> {
    try {
      const url = `https://api.lever.co/v0/postings/${config.clientName}?mode=json`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch Lever jobs`);
      }

      const data = await response.json();
      return this.parseLeverResponse(data, config.clientName);
    } catch (error) {
      console.error(`❌ Lever ingestion failed for ${config.clientName}:`, error);
      throw error;
    }
  }

  private parseLeverResponse(data: any[], clientName: string): RawJob[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((job: any) => ({
      source: 'ats-lever' as const,
      externalId: job.id,
      title: job.text,
      company: this.extractCompany(job, clientName),
      description: this.stripHTML(job.descriptionPlain || job.description || ''),
      publishedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
      url: `https://jobs.lever.co/${clientName}/${job.id}`,
      location: this.extractLocation(job),
      type: this.extractLocationType(job),
    }));
  }

  private extractCompany(job: any, clientName: string): string {
    return job.company || clientName;
  }

  private extractLocation(job: any): string | undefined {
    const categories = job.categories;
    if (categories && categories.location) {
      return categories.location;
    }
    if (categories && categories.commitment) {
      return categories.commitment;
    }
    return undefined;
  }

  private extractLocationType(job: any): 'remote' | 'hybrid' | 'onsite' | undefined {
    const categories = job.categories;
    if (!categories) return undefined;

    const location = (categories.location || '').toLowerCase();
    const commitment = (categories.commitment || '').toLowerCase();

    if (location.includes('remote') || commitment.includes('remote')) {
      return 'remote';
    }
    if (location.includes('hybrid') || commitment.includes('hybrid')) {
      return 'hybrid';
    }
    if (location.includes('onsite') || location.includes('office')) {
      return 'onsite';
    }

    return undefined;
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
