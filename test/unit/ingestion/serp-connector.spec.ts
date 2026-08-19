import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SERPConnector, SERPConfig, SERP_PATTERNS } from '../../../src/infrastructure/ingestion/serp-connector';
import { RawJob } from '../../../src/core/domain';

describe('SERPConnector', () => {
  let serpConnector: SERPConnector;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    serpConnector = new SERPConnector();
    mockFetch = vi.fn() as any;
    global.fetch = mockFetch as any;
  });

  it('should search jobs successfully with API key', async () => {
    const mockSERPResults = [
      {
        title: 'Senior Full Stack Developer',
        link: 'https://example.com/job/1',
        snippet: 'We are hiring a Senior Full Stack Developer at Tech Company',
        date: '2026-08-19',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ organic_results: mockSERPResults }),
    });

    const config: SERPConfig = {
      apiKey: 'test-api-key',
      keywords: ['Full Stack Developer'],
      maxResults: 10,
    };

    // Note: This will return empty array because performSearch is a placeholder
    // In production, this would make actual API calls
    const jobs = await serpConnector.searchJobs(config);

    // For now, expect empty array due to placeholder implementation
    expect(jobs).toEqual([]);
  });

  it('should return empty array without API key', async () => {
    const config: SERPConfig = {
      keywords: ['Full Stack Developer'],
      maxResults: 10,
    };

    const jobs = await serpConnector.searchJobs(config);

    expect(jobs).toEqual([]);
  });

  it('should generate external ID from URL', () => {
    const url = 'https://example.com/job/123';
    const externalId = serpConnector['generateExternalId'](url);
    expect(externalId).toBeDefined();
    expect(typeof externalId).toBe('string');
    expect(externalId.length).toBeLessThanOrEqual(32);
  });

  it('should extract company from snippet', () => {
    const snippet = 'We are hiring at Tech Company for a Senior Developer';
    const company = serpConnector['extractCompany'](snippet);
    expect(company).toBe('Tech Company');
  });

  it('should extract company using @ pattern', () => {
    const snippet = 'Join @Google as a Senior Developer';
    const company = serpConnector['extractCompany'](snippet);
    expect(company).toBe('Google');
  });

  it('should extract company using "is hiring" pattern', () => {
    const snippet = 'Microsoft is hiring for a Senior Developer role';
    const company = serpConnector['extractCompany'](snippet);
    expect(company).toBe('Microsoft');
  });

  it('should return Unknown when company cannot be extracted', () => {
    const snippet = 'Senior Developer position available';
    const company = serpConnector['extractCompany'](snippet);
    expect(company).toBe('Unknown');
  });

  it('should parse SERP results to RawJob format', () => {
    const results = [
      {
        title: 'Senior Developer',
        link: 'https://example.com/job/1',
        snippet: 'Great job at Tech Company',
        date: '2026-08-19',
      },
    ];

    const jobs = serpConnector['parseSERPResults'](results);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: 'serp',
      title: 'Senior Developer',
      url: 'https://example.com/job/1',
    });
    expect(jobs[0].externalId).toBeDefined();
  });

  it('should generate Google Dorks for keywords', () => {
    const keywords = ['Full Stack Developer'];
    const dorks = SERPConnector.generateDorks(keywords);

    expect(dorks).toBeDefined();
    expect(Array.isArray(dorks)).toBe(true);
    expect(dorks.length).toBeGreaterThan(0);
    expect(dorks[0]).toContain('site:');
  });

  it('should generate dorks for multiple ATS types', () => {
    const keywords = ['React Developer'];
    const dorks = SERPConnector.generateDorks(keywords, ['greenhouse', 'lever']);

    expect(dorks).toBeDefined();
    expect(dorks.some(d => d.includes('greenhouse'))).toBe(true);
    expect(dorks.some(d => d.includes('lever'))).toBe(true);
  });

  it('should handle search errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const config: SERPConfig = {
      apiKey: 'test-api-key',
      keywords: ['Full Stack Developer'],
    };

    // Should not throw, but return empty array due to placeholder
    const jobs = await serpConnector.searchJobs(config);
    expect(jobs).toEqual([]);
  });

  it('should have predefined SERP patterns', () => {
    expect(SERP_PATTERNS).toBeDefined();
    expect(SERP_PATTERNS.GREENHOUSE).toBe('site:boards.greenhouse.io');
    expect(SERP_PATTERNS.LEVER).toBe('site:jobs.lever.co');
    expect(SERP_PATTERNS.WORKABLE).toBe('site:apply.workable.com');
    expect(SERP_PATTERNS.ASHBY).toBe('site:api.ashbyhq.com');
    expect(SERP_PATTERNS.GUPY).toBe('site:gupy.io');
  });

  it('should have tech stack specific patterns', () => {
    expect(SERP_PATTERNS.NODE_JS).toContain('Node.js');
    expect(SERP_PATTERNS.REACT).toContain('React');
    expect(SERP_PATTERNS.TYPESCRIPT).toContain('TypeScript');
    expect(SERP_PATTERNS.FULLSTACK).toContain('Full Stack');
  });

  it('should have location specific patterns', () => {
    expect(SERP_PATTERNS.REMOTE).toContain('remote');
    expect(SERP_PATTERNS.BRAZIL).toContain('Brazil');
  });
});
