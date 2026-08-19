import { z } from 'zod';

/**
 * Zod Schemas for validation and fail-fast
 * Following ADR 002: Clean Architecture - validation layer in infrastructure
 */

export const RawJobSchema = z.object({
  source: z.enum(['rss', 'ats-greenhouse', 'ats-lever', 'ats-ashby', 'ats-workable', 'serp']),
  externalId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.date(),
  url: z.string().url(),
  location: z.string().optional(),
  type: z.enum(['remote', 'hybrid', 'onsite']).optional(),
});

export const NormalizedJobSchema = z.object({
  id: z.string().uuid(),
  source: z.string(),
  externalId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  type: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  publishedAt: z.date(),
  url: z.string().url(),
  techStack: z.array(z.string()),
  validatedAt: z.date(),
});

export const FitScoreSchema = z.object({
  jobId: z.string(),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  matchedTechStack: z.array(z.string()),
  missingTechStack: z.array(z.string()),
  evaluatedAt: z.date(),
});

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  SERPAPI_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export type RawJob = z.infer<typeof RawJobSchema>;
export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;
export type FitScore = z.infer<typeof FitScoreSchema>;
export type Env = z.infer<typeof EnvSchema>;
