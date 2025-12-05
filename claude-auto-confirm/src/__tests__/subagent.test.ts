import { AutoConfirmSubagent } from '../subagent';
import { ConfirmationRequest } from '../types';

describe('AutoConfirmSubagent', () => {
  let subagent: AutoConfirmSubagent;

  beforeEach(() => {
    subagent = new AutoConfirmSubagent();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await subagent.initialize();
      
      const status = subagent.getStatus();
      expect(status.initialized).toBe(true);
    });

    it('should handle multiple initialization calls', async () => {
      await subagent.initialize();
      await subagent.initialize(); // Second call should be safe
      
      const status = subagent.getStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('confirmation handling', () => {
    beforeEach(async () => {
      await subagent.initialize();
    });

    it('should handle confirmation requests', async () => {
      const request: ConfirmationRequest = {
        id: 'test-subagent-1',
        message: 'Test confirmation message',
        action: 'test action',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      };

      const response = await subagent.handleConfirmation(request);
      
      expect(response.id).toBe(request.id);
      expect(response.approved).toBe(true);
      expect(typeof response.timestamp).toBe('number');
    });

    it('should handle Claude Code integration', async () => {
      const result = await subagent.interceptClaudeConfirmation('Building project', 'build command');
      
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Should auto-confirm build operations
    });

    it('should handle errors gracefully', async () => {
      // Create a malformed request that might cause issues
      const request = {
        id: 'test-error',
        message: '',
        action: '',
        timestamp: Date.now(),
        source: 'test',
        severity: 'low'
      } as ConfirmationRequest;

      const response = await subagent.handleConfirmation(request);
      
      expect(response.id).toBe(request.id);
      expect(typeof response.approved).toBe('boolean');
    });
  });

  describe('status reporting', () => {
    it('should report status correctly', () => {
      const status = subagent.getStatus();
      
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('metrics');
      expect(typeof status.initialized).toBe('boolean');
    });
  });
});