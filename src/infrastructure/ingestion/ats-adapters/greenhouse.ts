import { RawJob } from '../../../core/domain';

/**
 * Greenhouse ATS Adapter
 * Fetches jobs from Greenhouse public boards API
 * Reference: https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true
 */

export interface GreenhouseConfig {
  boardToken: string;
}

export class GreenhouseAdapter {
  async fetchJobs(config: GreenhouseConfig): Promise<RawJob[]> {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${config.boardToken}/jobs?content=true`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch Greenhouse jobs`);
      }

      const data = await response.json();
      return this.parseGreenhouseResponse(data);
    } catch (error) {
      console.error(`❌ Greenhouse ingestion failed for ${config.boardToken}:`, error);
      throw error;
    }
  }

  private parseGreenhouseResponse(data: any): RawJob[] {
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    return data.jobs.map((job: any) => ({
      source: 'ats-greenhouse' as const,
      externalId: String(job.id),
      title: job.title,
      company: this.extractCompany(job),
      description: job.content || job.description || '',
      publishedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
      url: job.absolute_url || job.url,
      location: this.extractLocation(job),
      type: this.extractLocationType(job),
    }));
  }

  private extractCompany(job: any): string {
    // Greenhouse jobs often don't include company name in the response
    // It's typically derived from the board token or URL
    return job.company?.name || 'Unknown';
  }

  private extractLocation(job: any): string | undefined {
    const location = job.location?.name;
    if (location) {
      return location;
    }
    
    // Fallback to offices if available
    const offices = job.offices;
    if (offices && offices.length > 0) {
      return offices.map((office: any) => office.name).join(', ');
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
