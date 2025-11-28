import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { config as dotenvConfig } from 'dotenv';
import { AutoConfirmConfig } from '../types';

dotenvConfig();

const DEFAULT_CONFIG: AutoConfirmConfig = {
  enabled: true,
  alwaysConfirmPatterns: [
    'file operations',
    'code changes', 
    'build operations',
    'test execution',
    'package installation'
  ],
  neverConfirmPatterns: [
    'delete system files',
    'format drive',
    'rm -rf /',
    'destroy database'
  ],
  maxConfirmationsPerMinute: 60,
  timeoutMs: 1000,
  logLevel: 'info',
  metricsEnabled: true
};

export class ConfigManager {
  private configPath: string;
  private config: AutoConfirmConfig;

  constructor(configPath?: string) {
    this.configPath = configPath || 
      process.env.CONFIG_FILE_PATH || 
      path.join(os.homedir(), '.claude-auto-confirm.json');
    
    this.config = this.loadConfig();
  }

  private loadConfig(): AutoConfirmConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileConfig = fs.readJsonSync(this.configPath);
        return { ...DEFAULT_CONFIG, ...fileConfig };
      }
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}:`, error);
    }

    // Load from environment variables
    const envConfig: Partial<AutoConfirmConfig> = {
      enabled: process.env.AUTO_CONFIRM_ENABLED === 'true',
      maxConfirmationsPerMinute: parseInt(process.env.MAX_CONFIRMATIONS_PER_MINUTE || '60'),
      timeoutMs: parseInt(process.env.CONFIRMATION_TIMEOUT_MS || '1000'),
      logLevel: (process.env.LOG_LEVEL as AutoConfirmConfig['logLevel']) || 'info',
      metricsEnabled: process.env.METRICS_ENABLED !== 'false'
    };

    if (process.env.ALWAYS_CONFIRM_PATTERNS) {
      envConfig.alwaysConfirmPatterns = process.env.ALWAYS_CONFIRM_PATTERNS.split(',');
    }

    if (process.env.NEVER_CONFIRM_PATTERNS) {
      envConfig.neverConfirmPatterns = process.env.NEVER_CONFIRM_PATTERNS.split(',');
    }

    return { ...DEFAULT_CONFIG, ...envConfig };
  }

  public getConfig(): AutoConfirmConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<AutoConfirmConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public saveConfig(): void {
    try {
      fs.ensureFileSync(this.configPath);
      fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
    } catch (error) {
      console.error(`Failed to save config to ${this.configPath}:`, error);
    }
  }

  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
  }
}

export const configManager = new ConfigManager();