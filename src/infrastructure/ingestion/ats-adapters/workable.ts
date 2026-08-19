import { RawJob } from '../../../core/domain';

/**
 * Workable ATS Adapter
 * Fetches jobs from Workable public API
 * Reference: https://apply.workable.com/api/v3/accounts/{slug}/jobs
 */

export interface WorkableConfig {
  accountSlug: string;
}

export class WorkableAdapter {
  async fetchJobs(config: WorkableConfig): Promise<RawJob[]> {
    try {
      const url = `https://apply.workable.com/api/v3/accounts/${config.accountSlug}/jobs`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch Workable jobs`);
      }

      const data = await response.json();
      return this.parseWorkableResponse(data);
    } catch (error) {
      console.error(`❌ Workable ingestion failed for ${config.accountSlug}:`, error);
      throw error;
    }
  }

  private parseWorkableResponse(data: any): RawJob[] {
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((job: any) => ({
      source: 'ats-workable' as const,
      externalId: job.id,
      title: job.title,
      company: this.extractCompany(job),
      description: job.description || job.short_description || '',
      publishedAt: job.published_on ? new Date(job.published_on) : new Date(),
      url: job.url,
      location: this.extractLocation(job),
      type: this.extractLocationType(job),
    }));
  }

  private extractCompany(job: any): string {
    return job.company?.name || 'Unknown';
  }

  private extractLocation(job: any): string | undefined {
    const location = job.location?.name;
    if (location) {
      return location;
    }
    
    const locationObj = job.location;
    if (locationObj && typeof locationObj === 'object') {
      const parts = [
        locationObj.city,
        locationObj.region,
        locationObj.country
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : undefined;
    }
    
    return undefined;
  }

  private extractLocationType(job: any): 'remote' | 'hybrid' | 'onsite' | undefined {
    const location = job.location?.name?.toLowerCase() || '';
    const locationType = job.location?.type?.toLowerCase() || '';
    
    if (location.includes('remote') || locationType.includes('remote')) {
      return 'remote';
    }
    if (location.includes('hybrid') || locationType.includes('hybrid')) {
      return 'hybrid';
    }
    if (location.includes('onsite') || location.includes('office') || locationType.includes('onsite')) {
      return 'onsite';
    }
    
    return undefined;
  }
}
