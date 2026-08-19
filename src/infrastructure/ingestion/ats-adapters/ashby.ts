import { RawJob } from '../../../core/domain';

/**
 * Ashby ATS Adapter
 * Fetches jobs from Ashby public job board API
 * Reference: https://api.ashbyhq.com/posting-api/job-board/{clientname}
 */

export interface AshbyConfig {
  clientName: string;
}

export class AshbyAdapter {
  async fetchJobs(config: AshbyConfig): Promise<RawJob[]> {
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${config.clientName}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch Ashby jobs`);
      }

      const data = await response.json();
      return this.parseAshbyResponse(data);
    } catch (error) {
      console.error(`❌ Ashby ingestion failed for ${config.clientName}:`, error);
      throw error;
    }
  }

  private parseAshbyResponse(data: any): RawJob[] {
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs.map((job: any) => ({
      source: 'ats-ashby' as const,
      externalId: job.id,
      title: job.title,
      company: this.extractCompany(job),
      description: job.description || '',
      publishedAt: job.publishedDate ? new Date(job.publishedDate) : new Date(),
      url: job.url,
      location: this.extractLocation(job),
      type: this.extractLocationType(job),
    }));
  }

  private extractCompany(job: any): string {
    return job.companyName || 'Unknown';
  }

  private extractLocation(job: any): string | undefined {
    const location = job.location?.name;
    if (location) {
      return location;
    }
    
    const locationObj = job.location;
    if (locationObj && typeof locationObj === 'object') {
      return `${locationObj.city || ''}, ${locationObj.state || ''} ${locationObj.country || ''}`.trim();
    }
    
    return undefined;
  }

  private extractLocationType(job: any): 'remote' | 'hybrid' | 'onsite' | undefined {
    const location = job.location?.name?.toLowerCase() || '';
    
    if (location.includes('remote')) {
      return 'remote';
    }
    if (location.includes('hybrid')) {
      return 'hybrid';
    }
    if (location.includes('onsite') || location.includes('office')) {
      return 'onsite';
    }
    
    return undefined;
  }
}
