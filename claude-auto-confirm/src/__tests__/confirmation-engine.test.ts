import { ConfirmationEngine } from '../core/confirmation-engine';
import { ConfirmationRequest } from '../types';
import { ConfigManager } from '../config';

describe('ConfirmationEngine', () => {
  let engine: ConfirmationEngine;
  let configManager: ConfigManager;

  beforeEach(() => {
    engine = new ConfirmationEngine();
    configManager = new ConfigManager();
  });

  describe('processConfirmation', () => {
    it('should auto-confirm when enabled with default behavior', async () => {
      const request: ConfirmationRequest = {
        id: 'test-1',
        message: 'Test confirmation',
        action: 'test action',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      };

      const response = await engine.processConfirmation(request);

      expect(response.id).toBe('test-1');
      expect(response.approved).toBe(true);
      expect(response.autoConfirmed).toBe(true);
      expect(response.reason).toContain('Default auto-confirmation');
    });

    it('should deny confirmation when disabled', async () => {
      // Disable auto-confirmation
      configManager.updateConfig({ enabled: false });

      const request: ConfirmationRequest = {
        id: 'test-2',
        message: 'Test confirmation',
        action: 'test action',
        timestamp: Date.now(),
        source: 'test',
        severity: 'medium'
      };

      const response = await engine.processConfirmation(request);

      expect(response.approved).toBe(false);
      expect(response.autoConfirmed).toBe(false);
      expect(response.reason).toContain('Auto-confirmation disabled');
    });

    it('should match always-confirm patterns', async () => {
      const request: ConfirmationRequest = {
        id: 'test-3',
        message: 'Building the project',
        action: 'build operations',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      };

      const response = await engine.processConfirmation(request);

      expect(response.approved).toBe(true);
      expect(response.autoConfirmed).toBe(true);
      expect(response.reason).toContain('always-confirm pattern');
    });

    it('should match never-confirm patterns', async () => {
      const request: ConfirmationRequest = {
        id: 'test-4',
        message: 'About to delete system files',
        action: 'dangerous operation',
        timestamp: Date.now(),
        source: 'test',
        severity: 'critical'
      };

      const response = await engine.processConfirmation(request);

      expect(response.approved).toBe(false);
      expect(response.autoConfirmed).toBe(true);
      expect(response.reason).toContain('never-confirm pattern');
    });

    it('should respect rate limiting', async () => {
      // Set very low rate limit
      configManager.updateConfig({ maxConfirmationsPerMinute: 1 });

      const request1: ConfirmationRequest = {
        id: 'test-5',
        message: 'First request',
        action: 'test',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      };

      const request2: ConfirmationRequest = {
        id: 'test-6',
        message: 'Second request',
        action: 'test',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      };

      const response1 = await engine.processConfirmation(request1);
      const response2 = await engine.processConfirmation(request2);

      expect(response1.approved).toBe(true);
      expect(response2.approved).toBe(false);
      expect(response2.reason).toContain('Rate limit exceeded');
    });
  });

  describe('metrics', () => {
    it('should track metrics correctly', async () => {
      const request: ConfirmationRequest = {
        id: 'test-metrics',
        message: 'Test request',
        action: 'test',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      };

      await engine.processConfirmation(request);
      
      const metrics = engine.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.autoConfirmed).toBe(1);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should reset metrics', () => {
      const initialMetrics = engine.getMetrics();
      expect(initialMetrics.totalRequests).toBe(0);

      engine.resetMetrics();
      
      const resetMetrics = engine.getMetrics();
      expect(resetMetrics.totalRequests).toBe(0);
      expect(resetMetrics.autoConfirmed).toBe(0);
    });
  });
});