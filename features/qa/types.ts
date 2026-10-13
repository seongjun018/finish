import { z } from 'zod';

export const featureIds = ['dashboard', 'check-in', 'voting', 'judging', 'scoring', 'prize', 'export', 'event', 'auth'] as const;
export type FeatureId = typeof featureIds[number];
export const stateIds = ['success', 'loading', 'empty', 'error', 'offline'] as const;
export type ScreenState = typeof stateIds[number];
export type DataMode = 'mock' | 'live';
export type Fixture = { id: string; title: string; detail: string; status: string };
export type Scenario = { id: string; feature: FeatureId; label: string; description: string; code: string; recovery: string; retryable: boolean; recoversOnRetry?: boolean };
export type Selection = { feature: FeatureId; state: ScreenState; scenario: string; mode: DataMode };
export const selectionSchema = z.object({
  feature: z.enum(featureIds), state: z.enum(stateIds), scenario: z.string().max(80), mode: z.enum(['mock', 'live']),
});
export type QaRequest = Selection & { signal: AbortSignal; attempt: number; delayMs?: number };
export interface QaAdapter { load(request: QaRequest): Promise<Fixture[]> }
export type LoadResult = { status: ScreenState; rows: Fixture[]; code?: string; message?: string; recovery?: string; retryable?: boolean };
