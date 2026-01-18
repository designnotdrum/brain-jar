// plugins/shared-memory/src/chess-timer/types.ts

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type WorkType = 'feature' | 'bugfix' | 'refactor' | 'docs' | 'other';
export type PauseReason = 'context_switch' | 'break' | 'end_of_day' | 'unknown';

export interface WorkSession {
  id: string;
  feature_id: string;
  feature_description: string;
  scope: string;
  status: SessionStatus;
  started_at: Date;
  completed_at: Date | null;
  total_active_seconds: number;
  satisfaction: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkSegment {
  id: string;
  session_id: string;
  started_at: Date;
  ended_at: Date | null;
  trigger_start: string;
  trigger_end: string | null;
}

export interface WorkMetrics {
  id: string;
  session_id: string;
  files_touched: number;
  lines_added: number;
  lines_removed: number;
  complexity_rating: number;
  work_type: WorkType;
  recorded_at: Date;
}

export interface StartSessionInput {
  feature_id?: string;
  description?: string;
  work_type?: WorkType;
  scope?: string;
}

export interface PauseSessionInput {
  session_id?: string;
  reason?: PauseReason;
}

export interface ResumeSessionInput {
  session_id?: string;
}

export interface CompleteSessionInput {
  session_id?: string;
  satisfaction?: number;
  notes?: string;
  metrics?: {
    files_touched?: number;
    lines_added?: number;
    lines_removed?: number;
    complexity_rating?: number;
    work_type?: WorkType;
  };
}

export interface EstimateInput {
  feature_id?: string;
  description?: string;
  work_type?: WorkType;
}

export interface ListSessionsInput {
  scope?: string;
  status?: SessionStatus;
  limit?: number;
}

export interface Estimate {
  min_seconds: number;
  max_seconds: number;
  confidence: 'low' | 'medium' | 'high';
  sample_count: number;
  similar_sessions: Array<{
    feature_id: string;
    description: string;
    duration_seconds: number;
  }>;
  message: string;
}

export interface ChessTimerConfig {
  enabled: boolean;
  auto_detect: boolean;
  include_in_pr_description: boolean;
  verbosity: 'quiet' | 'normal' | 'verbose';
}
