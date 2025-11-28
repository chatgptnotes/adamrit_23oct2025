import { ConfirmationRequest, ConfirmationResponse, ConfirmationMetrics } from '../types';
import { configManager } from '../config';
import { logger } from '../utils/logger';

export class ConfirmationEngine {
  private metrics: ConfirmationMetrics;
  private recentConfirmations: number[];
  private responseTimings: number[];

  constructor() {
    this.metrics = {
      totalRequests: 0,
      autoConfirmed: 0,
      manualConfirmed: 0,
      denied: 0,
      timeouts: 0,
      averageResponseTime: 0
    };
    this.recentConfirmations = [];
    this.responseTimings = [];
  }

  public async processConfirmation(request: ConfirmationRequest): Promise<ConfirmationResponse> {
    const startTime = Date.now();
    const config = configManager.getConfig();

    logger.debug('Processing confirmation request', { id: request.id, message: request.message });

    // Update metrics
    this.metrics.totalRequests++;

    // Check if auto-confirmation is enabled
    if (!config.enabled) {
      logger.debug('Auto-confirmation disabled, returning manual confirmation required');
      return this.createResponse(request.id, false, startTime, false, 'Auto-confirmation disabled');
    }

    // Rate limiting check
    if (!this.checkRateLimit()) {
      logger.warn('Rate limit exceeded, denying confirmation');
      this.metrics.denied++;
      return this.createResponse(request.id, false, startTime, false, 'Rate limit exceeded');
    }

    // Pattern matching
    const shouldAutoConfirm = this.evaluatePatterns(request);
    
    if (shouldAutoConfirm === null) {
      // No specific pattern match, use default auto-confirm behavior
      logger.info('Auto-confirming request (default behavior)', { id: request.id });
      this.metrics.autoConfirmed++;
      this.recordConfirmation();
      return this.createResponse(request.id, true, startTime, true, 'Default auto-confirmation');
    }

    if (shouldAutoConfirm) {
      logger.info('Auto-confirming request (pattern match)', { id: request.id });
      this.metrics.autoConfirmed++;
      this.recordConfirmation();
      return this.createResponse(request.id, true, startTime, true, 'Matched always-confirm pattern');
    } else {
      logger.warn('Denying request (pattern match)', { id: request.id });
      this.metrics.denied++;
      return this.createResponse(request.id, false, startTime, true, 'Matched never-confirm pattern');
    }
  }

  private evaluatePatterns(request: ConfirmationRequest): boolean | null {
    const config = configManager.getConfig();
    const message = request.message.toLowerCase();
    const action = request.action.toLowerCase();
    const fullText = `${message} ${action}`;

    // Check never-confirm patterns first (higher priority)
    for (const pattern of config.neverConfirmPatterns) {
      const regex = new RegExp(pattern.toLowerCase(), 'i');
      if (regex.test(fullText)) {
        logger.debug('Matched never-confirm pattern', { pattern, request: request.id });
        return false;
      }
    }

    // Check always-confirm patterns
    for (const pattern of config.alwaysConfirmPatterns) {
      const regex = new RegExp(pattern.toLowerCase(), 'i');
      if (regex.test(fullText)) {
        logger.debug('Matched always-confirm pattern', { pattern, request: request.id });
        return true;
      }
    }

    // No pattern matched
    return null;
  }

  private checkRateLimit(): boolean {
    const config = configManager.getConfig();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old confirmations
    this.recentConfirmations = this.recentConfirmations.filter(time => time > oneMinuteAgo);

    return this.recentConfirmations.length < config.maxConfirmationsPerMinute;
  }

  private recordConfirmation(): void {
    this.recentConfirmations.push(Date.now());
  }

  private createResponse(
    id: string,
    approved: boolean,
    startTime: number,
    autoConfirmed: boolean,
    reason?: string
  ): ConfirmationResponse {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Update response time metrics
    this.responseTimings.push(responseTime);
    if (this.responseTimings.length > 100) {
      this.responseTimings = this.responseTimings.slice(-100); // Keep last 100 timings
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimings.reduce((sum, time) => sum + time, 0) / this.responseTimings.length;

    return {
      id,
      approved,
      timestamp: endTime,
      autoConfirmed,
      reason
    };
  }

  public getMetrics(): ConfirmationMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      autoConfirmed: 0,
      manualConfirmed: 0,
      denied: 0,
      timeouts: 0,
      averageResponseTime: 0
    };
    this.recentConfirmations = [];
    this.responseTimings = [];
  }
}

export const confirmationEngine = new ConfirmationEngine();