/**
 * Domain Entity: Job
 * Pure business entity with no external dependencies
 */

export interface RawJob {
  source: 'rss' | 'ats-greenhouse' | 'ats-lever' | 'ats-ashby' | 'ats-workable' | 'serp';
  externalId: string;
  title: string;
  company: string;
  description: string;
  publishedAt: Date;
  url: string;
  location?: string;
  type?: 'remote' | 'hybrid' | 'onsite';
}

export interface NormalizedJob {
  id: string;
  source: string;
  externalId: string;
  title: string;
  company: string;
  description: string;
  location?: string;
  type?: 'remote' | 'hybrid' | 'onsite';
  publishedAt: Date;
  url: string;
  techStack: string[];
  validatedAt: Date;
}

export interface FitScore {
  jobId: string;
  score: number;
  reasoning: string;
  matchedTechStack: string[];
  missingTechStack: string[];
  evaluatedAt: Date;
}

export interface FinalRecommendation {
  job: NormalizedJob;
  fitScore: FitScore;
  rank: number;
}
