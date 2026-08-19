import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RSSClient, RSSFeedConfig } from '../../../src/infrastructure/ingestion/rss-client';
import { RawJob } from '../../../src/core/domain';

describe('RSSClient', () => {
  let rssClient: RSSClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rssClient = new RSSClient();
    mockFetch = vi.fn() as any;
    global.fetch = mockFetch as any;
  });

  it('should fetch and parse RSS feed successfully', async () => {
    const mockRSS = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Senior Developer</title>
            <link>https://example.com/job/1</link>
            <description>Great job opportunity</description>
            <pubDate>Mon, 19 Aug 2026 00:00:00 GMT</pubDate>
            <author>Tech Company</author>
          </item>
        </channel>
      </rss>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockRSS),
    });

    const config: RSSFeedConfig = {
      url: 'https://example.com/feed.rss',
      source: 'rss',
    };

    const jobs = await rssClient.fetchFeed(config);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      source: 'rss',
      title: 'Senior Developer',
      company: 'Tech Company',
      description: 'Great job opportunity',
      url: 'https://example.com/job/1',
    });
    expect(jobs[0].externalId).toBeDefined();
  });

  it('should handle HTTP errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const config: RSSFeedConfig = {
      url: 'https://example.com/feed.rss',
      source: 'rss',
    };

    await expect(rssClient.fetchFeed(config)).rejects.toThrow('HTTP 404');
  });

  it('should strip HTML from descriptions', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const text = rssClient['stripHTML'](html);
    expect(text).toBe('Hello World');
  });

  it('should generate external ID from URL', () => {
    const url = 'https://example.com/job/123';
    const externalId = rssClient['generateExternalId'](url);
    expect(externalId).toBeDefined();
    expect(typeof externalId).toBe('string');
    expect(externalId.length).toBeLessThanOrEqual(32);
  });

  it('should handle empty RSS feed', async () => {
    const mockRSS = `
      <?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
        </channel>
      </rss>
    `;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockRSS),
    });

    const config: RSSFeedConfig = {
      url: 'https://example.com/feed.rss',
      source: 'rss',
    };

    const jobs = await rssClient.fetchFeed(config);
    expect(jobs).toHaveLength(0);
  });
});
