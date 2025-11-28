import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { configManager } from '../config';
import { confirmationEngine } from '../core/confirmation-engine';
import { logger } from '../utils/logger';
import { SubagentCommand } from '../types';

export class AutoConfirmCommand implements SubagentCommand {
  name = 'auto-confirm';
  description = 'Manage auto-confirmation settings and status';

  async execute(args: string[]): Promise<void> {
    const program = new Command();
    
    program
      .name('auto-confirm')
      .description('Manage Claude Code auto-confirmation settings')
      .version('1.0.0');

    program
      .command('status')
      .description('Show current auto-confirmation status and metrics')
      .action(() => this.showStatus());

    program
      .command('enable')
      .description('Enable auto-confirmation')
      .action(() => this.enable());

    program
      .command('disable')
      .description('Disable auto-confirmation')
      .action(() => this.disable());

    program
      .command('config')
      .description('Interactive configuration setup')
      .action(() => this.interactiveConfig());

    program
      .command('patterns')
      .description('Manage confirmation patterns')
      .action(() => this.managePatterns());

    program
      .command('metrics')
      .description('Show detailed metrics')
      .option('--reset', 'Reset metrics')
      .action((options) => this.showMetrics(options.reset));

    program
      .command('test')
      .description('Test a confirmation message')
      .argument('<message>', 'Message to test')
      .option('--action <action>', 'Action description', 'test action')
      .action((message, options) => this.testConfirmation(message, options.action));

    await program.parseAsync(['node', 'auto-confirm', ...args], { from: 'user' });
  }

  private showStatus(): void {
    const config = configManager.getConfig();
    const metrics = confirmationEngine.getMetrics();

    console.log(chalk.bold('\n📋 Auto-Confirmation Status\n'));
    
    console.log('🔧 Configuration:');
    console.log(`   Enabled: ${config.enabled ? chalk.green('✓ Yes') : chalk.red('✗ No')}`);
    console.log(`   Rate Limit: ${config.maxConfirmationsPerMinute} per minute`);
    console.log(`   Timeout: ${config.timeoutMs}ms`);
    console.log(`   Log Level: ${config.logLevel}`);
    console.log(`   Metrics: ${config.metricsEnabled ? 'Enabled' : 'Disabled'}`);

    console.log('\n📊 Quick Metrics:');
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Auto-Confirmed: ${chalk.green(metrics.autoConfirmed)}`);
    console.log(`   Denied: ${chalk.red(metrics.denied)}`);
    console.log(`   Avg Response: ${metrics.averageResponseTime.toFixed(2)}ms`);

    console.log('\n🎯 Patterns:');
    console.log(`   Always Confirm: ${config.alwaysConfirmPatterns.length} patterns`);
    console.log(`   Never Confirm: ${config.neverConfirmPatterns.length} patterns`);
  }

  private enable(): void {
    configManager.updateConfig({ enabled: true });
    logger.success('Auto-confirmation enabled');
  }

  private disable(): void {
    configManager.updateConfig({ enabled: false });
    logger.success('Auto-confirmation disabled');
  }

  private async interactiveConfig(): Promise<void> {
    const config = configManager.getConfig();

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Enable auto-confirmation?',
        default: config.enabled
      },
      {
        type: 'number',
        name: 'maxConfirmationsPerMinute',
        message: 'Maximum confirmations per minute:',
        default: config.maxConfirmationsPerMinute,
        validate: (input) => input > 0 || 'Must be greater than 0'
      },
      {
        type: 'number',
        name: 'timeoutMs',
        message: 'Confirmation timeout (ms):',
        default: config.timeoutMs,
        validate: (input) => input > 0 || 'Must be greater than 0'
      },
      {
        type: 'list',
        name: 'logLevel',
        message: 'Log level:',
        choices: ['debug', 'info', 'warn', 'error'],
        default: config.logLevel
      },
      {
        type: 'confirm',
        name: 'metricsEnabled',
        message: 'Enable metrics collection?',
        default: config.metricsEnabled
      }
    ]);

    configManager.updateConfig(answers);
    logger.success('Configuration updated successfully');
  }

  private async managePatterns(): Promise<void> {
    const config = configManager.getConfig();

    const action = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'View current patterns', value: 'view' },
          { name: 'Add always-confirm pattern', value: 'add-always' },
          { name: 'Add never-confirm pattern', value: 'add-never' },
          { name: 'Remove pattern', value: 'remove' },
          { name: 'Reset to defaults', value: 'reset' }
        ]
      }
    ]);

    switch (action.action) {
      case 'view':
        console.log('\n✅ Always Confirm Patterns:');
        config.alwaysConfirmPatterns.forEach((pattern, i) => 
          console.log(`   ${i + 1}. ${pattern}`));
        console.log('\n❌ Never Confirm Patterns:');
        config.neverConfirmPatterns.forEach((pattern, i) => 
          console.log(`   ${i + 1}. ${pattern}`));
        break;

      case 'add-always':
        const alwaysPattern = await inquirer.prompt([
          {
            type: 'input',
            name: 'pattern',
            message: 'Enter regex pattern to always confirm:',
            validate: (input) => input.trim() !== '' || 'Pattern cannot be empty'
          }
        ]);
        configManager.updateConfig({
          alwaysConfirmPatterns: [...config.alwaysConfirmPatterns, alwaysPattern.pattern]
        });
        logger.success('Always-confirm pattern added');
        break;

      case 'add-never':
        const neverPattern = await inquirer.prompt([
          {
            type: 'input',
            name: 'pattern',
            message: 'Enter regex pattern to never confirm:',
            validate: (input) => input.trim() !== '' || 'Pattern cannot be empty'
          }
        ]);
        configManager.updateConfig({
          neverConfirmPatterns: [...config.neverConfirmPatterns, neverPattern.pattern]
        });
        logger.success('Never-confirm pattern added');
        break;

      case 'reset':
        const confirm = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Reset all patterns to defaults?',
            default: false
          }
        ]);
        if (confirm.confirm) {
          configManager.resetConfig();
          logger.success('Patterns reset to defaults');
        }
        break;
    }
  }

  private showMetrics(reset: boolean): void {
    const metrics = confirmationEngine.getMetrics();

    if (reset) {
      confirmationEngine.resetMetrics();
      logger.success('Metrics reset');
      return;
    }

    console.log(chalk.bold('\n📈 Detailed Metrics\n'));
    
    console.log('📊 Confirmation Statistics:');
    console.log(`   Total Requests: ${metrics.totalRequests}`);
    console.log(`   Auto-Confirmed: ${chalk.green(metrics.autoConfirmed)} (${((metrics.autoConfirmed / metrics.totalRequests) * 100 || 0).toFixed(1)}%)`);
    console.log(`   Manual Confirmed: ${chalk.blue(metrics.manualConfirmed)} (${((metrics.manualConfirmed / metrics.totalRequests) * 100 || 0).toFixed(1)}%)`);
    console.log(`   Denied: ${chalk.red(metrics.denied)} (${((metrics.denied / metrics.totalRequests) * 100 || 0).toFixed(1)}%)`);
    console.log(`   Timeouts: ${chalk.yellow(metrics.timeouts)} (${((metrics.timeouts / metrics.totalRequests) * 100 || 0).toFixed(1)}%)`);
    
    console.log('\n⚡ Performance:');
    console.log(`   Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    
    if (metrics.totalRequests === 0) {
      console.log(chalk.dim('\n   No requests processed yet'));
    }
  }

  private async testConfirmation(message: string, action: string): Promise<void> {
    const request = {
      id: `test-${Date.now()}`,
      message,
      action,
      timestamp: Date.now(),
      source: 'test',
      severity: 'medium' as const
    };

    console.log(chalk.bold('\n🧪 Testing Confirmation\n'));
    console.log('Request:', { message, action });

    const response = await confirmationEngine.processConfirmation(request);

    console.log('\nResult:');
    console.log(`   Approved: ${response.approved ? chalk.green('✓ Yes') : chalk.red('✗ No')}`);
    console.log(`   Auto-Confirmed: ${response.autoConfirmed ? 'Yes' : 'No'}`);
    console.log(`   Reason: ${response.reason || 'None'}`);
    console.log(`   Response Time: ${Date.now() - request.timestamp}ms`);
  }
}