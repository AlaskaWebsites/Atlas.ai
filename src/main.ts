#!/usr/bin/env node
/**
 * Atlas.ai - Autonomous Recruitment Agent
 * Entry point for MCP server and daemon initialization
 */

import { IngestJobsUseCase } from './core/application/use-cases';
import { IngestionAdapter } from './infrastructure/adapters';

async function main() {
  console.log('🚀 Atlas.ai initializing...');
  console.log('📍 Environment: NODE_ENV =', process.env.NODE_ENV || 'development');
  console.log('🎯 Phase: Fase 1 - Ingestão Passiva');
  
  // Initialize ingestion adapter and use case
  const ingestionAdapter = new IngestionAdapter();
  const ingestJobsUseCase = new IngestJobsUseCase(ingestionAdapter);
  
  // Demonstrate Phase 1 functionality
  try {
    console.log('\n📡 Testing Phase 1 - Passive Ingestion...');
    
    // Test RSS ingestion (default feeds)
    console.log('\n1️⃣ Testing RSS ingestion...');
    const rssResults = await ingestJobsUseCase.execute({
      sources: ['rss'],
    });
    
    const rssSuccess = rssResults.filter(r => r.success);
    const rssTotalJobs = rssSuccess.reduce((acc, r) => acc + r.jobs.length, 0);
    
    console.log(`✅ RSS: ${rssSuccess.length}/${rssResults.length} sources successful`);
    console.log(`📊 Total jobs from RSS: ${rssTotalJobs}`);
    
    // Test ATS adapters (would require valid config in production)
    console.log('\n2️⃣ ATS adapters ready (Greenhouse, Lever, Ashby, Workable)');
    console.log('⚠️ Note: ATS adapters require valid board tokens/client names');
    
    console.log('\n3️⃣ SERP connector ready (requires API key)');
    console.log('⚠️ Note: SERP requires SerpApi or similar service key');
    
    console.log('\n✅ Phase 1 - Ingestão Passiva completed successfully!');
    console.log('🎯 Next: Implement Phase 2 (Normalização & Zod) and Phase 3 (BullMQ/Redis)');
    
  } catch (error) {
    console.error('❌ Error during Phase 1 demonstration:', error);
  }
  
  // TODO: Initialize Redis connection (Phase 3)
  // TODO: Initialize BullMQ queues (Phase 3)
  // TODO: Initialize MCP Server (Phase 5)
  // TODO: Start workers for ingestion, normalization, evaluation
  
  console.log('\n✅ Atlas.ai is ready!');
}

main().catch((error) => {
  console.error('❌ Fatal error during initialization:', error);
  process.exit(1);
});
