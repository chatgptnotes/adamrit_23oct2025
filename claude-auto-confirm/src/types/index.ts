export interface ConfirmationRequest {
  id: string;
  message: string;
  timestamp: number;
  source: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export interface ConfirmationResponse {
  id: string;
  approved: boolean;
  timestamp: number;
  autoConfirmed: boolean;
  reason?: string;
}

export interface AutoConfirmConfig {
  enabled: boolean;
  alwaysConfirmPatterns: string[];
  neverConfirmPatterns: string[];
  maxConfirmationsPerMinute: number;
  timeoutMs: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsEnabled: boolean;
}

export interface ConfirmationMetrics {
  totalRequests: number;
  autoConfirmed: number;
  manualConfirmed: number;
  denied: number;
  timeouts: number;
  averageResponseTime: number;
}

export interface SubagentCommand {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void>;
}