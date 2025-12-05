import chalk from 'chalk';
import { configManager } from '../config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const LOG_COLORS: Record<LogLevel, (text: string) => string> = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red
};

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    const currentLevel = configManager.getConfig().logLevel;
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = this.getTimestamp();
    const levelText = level.toUpperCase().padEnd(5);
    const coloredLevel = LOG_COLORS[level](levelText);
    
    const argsString = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';

    return `${chalk.gray(timestamp)} ${coloredLevel} ${message}${argsString}`;
  }

  public debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, ...args));
    }
  }

  public info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, ...args));
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, ...args));
    }
  }

  public error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, ...args));
    }
  }

  public success(message: string, ...args: unknown[]): void {
    console.log(chalk.green('✓ ' + message), ...args);
  }

  public failure(message: string, ...args: unknown[]): void {
    console.log(chalk.red('✗ ' + message), ...args);
  }
}

export const logger = new Logger();