/**
 * Port: Ingestion Port
 * Interface for job ingestion adapters
 * Following Hexagonal Architecture - ports define contracts
 */

import { RawJob } from '../../domain/entities/job';

export interface IIngestionPort {
  ingestRSS(config?: any): Promise<RawJob[]>;
  ingestGreenhouse(config?: any): Promise<RawJob[]>;
  ingestLever(config?: any): Promise<RawJob[]>;
  ingestAshby(config?: any): Promise<RawJob[]>;
  ingestWorkable(config?: any): Promise<RawJob[]>;
  ingestSERP(config?: any): Promise<RawJob[]>;
}
