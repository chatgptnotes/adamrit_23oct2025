import { ConfirmationRequest, ConfirmationResponse } from '../types';
import { confirmationEngine } from '../core/confirmation-engine';
import { configManager } from '../config';
import { logger } from '../utils/logger';

export class AutoConfirmSubagent {
  private isInitialized = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    logger.info('Initializing Auto-Confirm Subagent');
    
    // Setup process handlers
    this.setupProcessHandlers();
    
    // Initialize configuration
    const config = configManager.getConfig();
    logger.info('Configuration loaded', {
      enabled: config.enabled,
      patterns: {
        always: config.alwaysConfirmPatterns.length,
        never: config.neverConfirmPatterns.length
      }
    });

    this.isInitialized = true;
    logger.success('Auto-Confirm Subagent initialized successfully');
  }

  public async handleConfirmation(request: ConfirmationRequest): Promise<ConfirmationResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    logger.debug('Received confirmation request', {
      id: request.id,
      source: request.source,
      severity: request.severity
    });

    try {
      const response = await confirmationEngine.processConfirmation(request);
      
      logger.info('Confirmation processed', {
        id: request.id,
        approved: response.approved,
        autoConfirmed: response.autoConfirmed,
        reason: response.reason
      });

      return response;
    } catch (error) {
      logger.error('Failed to process confirmation', error);
      
      // Fallback: deny the request
      return {
        id: request.id,
        approved: false,
        timestamp: Date.now(),
        autoConfirmed: false,
        reason: `Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public async interceptClaudeConfirmation(message: string, action: string = ''): Promise<boolean> {
    const request: ConfirmationRequest = {
      id: `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      action,
      timestamp: Date.now(),
      source: 'claude-code',
      severity: 'medium',
      metadata: {
        userAgent: process.env.USER_AGENT || 'unknown',
        sessionId: process.env.SESSION_ID || 'unknown'
      }
    };

    const response = await this.handleConfirmation(request);
    return response.approved;
  }

  public getStatus(): {
    initialized: boolean;
    enabled: boolean;
    metrics: ReturnType<typeof confirmationEngine.getMetrics>;
  } {
    return {
      initialized: this.isInitialized,
      enabled: configManager.getConfig().enabled,
      metrics: confirmationEngine.getMetrics()
    };
  }

  private setupProcessHandlers(): void {
    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));

    // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.shutdown('uncaughtException');
    });

    // Unhandled promise rejection
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection:', { reason, promise });
    });
  }

  private shutdown(signal: string): void {
    logger.info(`Received ${signal}, shutting down gracefully`);
    
    // Save any pending metrics or state
    const metrics = confirmationEngine.getMetrics();
    if (metrics.totalRequests > 0) {
      logger.info('Final metrics', metrics);
    }

    process.exit(0);
  }
}

// Global instance
export const autoConfirmSubagent = new AutoConfirmSubagent();

// Export convenience function for Claude Code integration
export async function shouldAutoConfirm(message: string, action?: string): Promise<boolean> {
  return autoConfirmSubagent.interceptClaudeConfirmation(message, action || '');
}