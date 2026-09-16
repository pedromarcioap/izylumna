/**
 * Core Types for Robust Voting Error Handling & Response Protocol
 * Standardizes backend responses, error classification, and vote payloads.
 */

export type ErrorCategory =
  | 'RLS_PERMISSION'     // Row Level Security / Auth access denied
  | 'AUTH_SESSION'       // Expired or missing user / voter session
  | 'UNIQUE_CONSTRAINT'  // Duplicate vote attempt (Postgres 23505)
  | 'FOREIGN_KEY'        // Referenced photo/gallery does not exist (Postgres 23503)
  | 'RACE_CONDITION'     // Concurrent update collision or JSON lock conflict
  | 'NETWORK_TIMEOUT'    // Transient transport or connection timeout
  | 'VALIDATION_ERROR'   // Malformed payload or missing parameters
  | 'DATABASE_CRITICAL'; // Unhandled PostgreSQL internal failure

export interface StandardErrorPayload {
  timestamp: string;
  category: ErrorCategory;
  code: string;           // e.g. "23505", "42501", "PGRST301", "VOTE_TIMEOUT"
  userMessage: string;    // User-facing localized text suitable for Toast UI
  technicalDetails: string;
  payload: Record<string, any>; // Incoming request data that produced the failure
  requestId?: string;     // Unique trace ID for telemetry correlation
}

export interface VotePayload {
  galleryId: string;
  photoId: string;
  voterId: string;
  voterName: string;
  action: 'add' | 'remove' | 'toggle';
  clientTimestamp?: string;
}

export interface VoteResult {
  photoId: string;
  voterId: string;
  totalVotesCount: number;
  hasVoted: boolean;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: StandardErrorPayload;
}

export type VoteStateStatus = 'idle' | 'loading' | 'success' | 'error' | 'retrying';
