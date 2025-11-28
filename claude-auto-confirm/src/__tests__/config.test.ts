import { ConfigManager } from '../config';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ConfigManager', () => {
  let configPath: string;
  let configManager: ConfigManager;

  beforeEach(() => {
    configPath = path.join(os.tmpdir(), 'test-config.json');
    configManager = new ConfigManager(configPath);
  });

  afterEach(() => {
    if (fs.existsSync(configPath)) {
      fs.removeSync(configPath);
    }
  });

  describe('configuration management', () => {
    it('should load default configuration', () => {
      const config = configManager.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.alwaysConfirmPatterns).toContain('file operations');
      expect(config.neverConfirmPatterns).toContain('delete system files');
      expect(config.maxConfirmationsPerMinute).toBe(60);
      expect(config.timeoutMs).toBe(1000);
    });

    it('should update configuration', () => {
      configManager.updateConfig({
        enabled: false,
        maxConfirmationsPerMinute: 30
      });

      const config = configManager.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.maxConfirmationsPerMinute).toBe(30);
    });

    it('should persist configuration to file', () => {
      configManager.updateConfig({ enabled: false });
      
      // Create new instance to test persistence
      const newConfigManager = new ConfigManager(configPath);
      const config = newConfigManager.getConfig();
      
      expect(config.enabled).toBe(false);
    });

    it('should handle invalid config file gracefully', () => {
      // Write invalid JSON
      fs.writeFileSync(configPath, 'invalid json');
      
      const newConfigManager = new ConfigManager(configPath);
      const config = newConfigManager.getConfig();
      
      // Should fall back to defaults
      expect(config.enabled).toBe(true);
    });

    it('should reset configuration', () => {
      configManager.updateConfig({ enabled: false });
      expect(configManager.getConfig().enabled).toBe(false);
      
      configManager.resetConfig();
      expect(configManager.getConfig().enabled).toBe(true);
    });
  });

  describe('environment variable integration', () => {
    it('should load from environment variables', () => {
      process.env.AUTO_CONFIRM_ENABLED = 'false';
      process.env.MAX_CONFIRMATIONS_PER_MINUTE = '120';
      process.env.LOG_LEVEL = 'debug';
      
      const newConfigManager = new ConfigManager();
      const config = newConfigManager.getConfig();
      
      expect(config.enabled).toBe(false);
      expect(config.maxConfirmationsPerMinute).toBe(120);
      expect(config.logLevel).toBe('debug');
      
      // Cleanup
      delete process.env.AUTO_CONFIRM_ENABLED;
      delete process.env.MAX_CONFIRMATIONS_PER_MINUTE;
      delete process.env.LOG_LEVEL;
    });
  });
});