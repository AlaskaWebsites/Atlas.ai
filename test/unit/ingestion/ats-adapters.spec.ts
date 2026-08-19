import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GreenhouseAdapter, GreenhouseConfig } from '../../../src/infrastructure/ingestion/ats-adapters/greenhouse';
import { LeverAdapter, LeverConfig } from '../../../src/infrastructure/ingestion/ats-adapters/lever';
import { AshbyAdapter, AshbyConfig } from '../../../src/infrastructure/ingestion/ats-adapters/ashby';
import { WorkableAdapter, WorkableConfig } from '../../../src/infrastructure/ingestion/ats-adapters/workable';

describe('ATS Adapters', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn() as any;
    global.fetch = mockFetch as any;
  });

  describe('GreenhouseAdapter', () => {
    it('should initialize without errors', () => {
      const adapter = new GreenhouseAdapter();
      expect(adapter).toBeDefined();
    });

    it('should fetch jobs from Greenhouse API', async () => {
      const mockResponse = {
        jobs: [
          {
            id: 123,
            title: 'Senior Developer',
            updated_at: '2026-08-19T00:00:00Z',
            absolute_url: 'https://example.com/job/123',
            location: { name: 'Remote' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const adapter = new GreenhouseAdapter();
      const config: GreenhouseConfig = { boardToken: 'example' };
      const jobs = await adapter.fetchJobs(config);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].source).toBe('ats-greenhouse');
      expect(jobs[0].title).toBe('Senior Developer');
    });
  });

  describe('LeverAdapter', () => {
    it('should initialize without errors', () => {
      const adapter = new LeverAdapter();
      expect(adapter).toBeDefined();
    });

    it('should fetch jobs from Lever API', async () => {
      const mockResponse = [
        {
          id: '123',
          text: 'Full Stack Developer',
          createdAt: '2026-08-19T00:00:00Z',
          descriptionPlain: 'Great opportunity',
          categories: { location: 'Remote' },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const adapter = new LeverAdapter();
      const config: LeverConfig = { clientName: 'example' };
      const jobs = await adapter.fetchJobs(config);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].source).toBe('ats-lever');
      expect(jobs[0].title).toBe('Full Stack Developer');
    });
  });

  describe('AshbyAdapter', () => {
    it('should initialize without errors', () => {
      const adapter = new AshbyAdapter();
      expect(adapter).toBeDefined();
    });

    it('should fetch jobs from Ashby API', async () => {
      const mockResponse = {
        jobs: [
          {
            id: '123',
            title: 'Backend Developer',
            publishedDate: '2026-08-19T00:00:00Z',
            url: 'https://example.com/job/123',
            companyName: 'Tech Corp',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const adapter = new AshbyAdapter();
      const config: AshbyConfig = { clientName: 'example' };
      const jobs = await adapter.fetchJobs(config);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].source).toBe('ats-ashby');
      expect(jobs[0].title).toBe('Backend Developer');
    });
  });

  describe('WorkableAdapter', () => {
    it('should initialize without errors', () => {
      const adapter = new WorkableAdapter();
      expect(adapter).toBeDefined();
    });

    it('should fetch jobs from Workable API', async () => {
      const mockResponse = {
        results: [
          {
            id: '123',
            title: 'Frontend Developer',
            published_on: '2026-08-19T00:00:00Z',
            url: 'https://example.com/job/123',
            company: { name: 'Startup Inc' },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const adapter = new WorkableAdapter();
      const config: WorkableConfig = { accountSlug: 'example' };
      const jobs = await adapter.fetchJobs(config);

      expect(jobs).toHaveLength(1);
      expect(jobs[0].source).toBe('ats-workable');
      expect(jobs[0].title).toBe('Frontend Developer');
    });
  });
});
