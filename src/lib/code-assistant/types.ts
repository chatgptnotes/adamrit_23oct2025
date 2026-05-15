// Shared types for the Code Assistant feature (frontend).

export type FieldError = { code: string; message: string };

export type ErrorView = {
  code: string;
  title: string;
  message: string;
  hint?: string;
  details?: Record<string, unknown>;
  actions?: Array<{ label: string; onClick: () => void }>;
};

export type ProposedFile = {
  path: string;
  action: 'modify' | 'create';
  new_content: string;
  old_content: string;
  additions: number;
  deletions: number;
};

export type GenerationResult = {
  ok: true;
  generation_id: string;
  plan: string;
  files: ProposedFile[];
  warnings: string[];
  branch_name: string;
  commit_sha: string;
  estimated_cost_usd: number;
  provider_used: string;
  preview_url: string | null;
};

export type GenerationError = {
  ok: false;
  generation_id?: string;
  error: ErrorView;
};

export type GenerationResponse = GenerationResult | GenerationError;

export type Stage =
  | 'validating-payload'
  | 'checking-rate-limit'
  | 'loading-context'
  | 'calling-deepseek'
  | 'parsing-response'
  | 'validating-response'
  | 'committing-to-github'
  | 'preview-pending'
  | 'preview-ready';

export const STAGE_LABELS: Record<Stage, string> = {
  'validating-payload':   'Validating',
  'checking-rate-limit':  'Rate-check',
  'loading-context':      'Context',
  'calling-deepseek':     'DeepSeek',
  'parsing-response':     'Parsing',
  'validating-response':  'Checking',
  'committing-to-github': 'Committing',
  'preview-pending':      'Building preview',
};
