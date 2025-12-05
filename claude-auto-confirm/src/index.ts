#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { AutoConfirmCommand } from './commands/auto-confirm';
import { autoConfirmSubagent, shouldAutoConfirm } from './subagent';
import { logger } from './utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';

const BANNER = `
${chalk.blue('╔══════════════════════════════════════════╗')}
${chalk.blue('║')}  ${chalk.bold.white('Claude Code Auto-Confirm Subagent')}      ${chalk.blue('║')}
${chalk.blue('║')}  ${chalk.gray('Automatically handle confirmation prompts')} ${chalk.blue('║')}
${chalk.blue('╚══════════════════════════════════════════╝')}
`;

async function main(): Promise<void> {
  const program = new Command();
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );

  program
    .name('claude-auto-confirm')
    .description('Auto-confirmation subagent and slash command for Claude Code')
    .version(packageJson.version);

  // Slash command: /auto-confirm
  program
    .command('auto-confirm')
    .description('Manage auto-confirmation settings')
    .allowUnknownOption(true)
    .action(async (...args) => {
      console.log(BANNER);
      const command = new AutoConfirmCommand();
      const unknownArgs = args[args.length - 1].args || [];
      await command.execute(unknownArgs);
    });

  // Daemon mode for continuous operation
  program
    .command('daemon')
    .description('Run as background daemon')
    .option('-p, --port <port>', 'Port for HTTP API', '3001')
    .action(async (options) => {
      console.log(BANNER);
      logger.info('Starting Auto-Confirm daemon', { port: options.port });
      await runDaemon(parseInt(options.port));
    });

  // Quick test mode
  program
    .command('test')
    .description('Test auto-confirmation with a message')
    .argument('<message>', 'Message to test')
    .option('-a, --action <action>', 'Action description', '')
    .action(async (message, options) => {
      console.log(BANNER);
      const result = await shouldAutoConfirm(message, options.action);
      console.log(`\n${result ? chalk.green('✓ APPROVED') : chalk.red('✗ DENIED')}`);
      console.log(`Message: "${message}"`);
      console.log(`Action: "${options.action}"`);
    });

  // Initialize subagent
  program
    .command('init')
    .description('Initialize the auto-confirm subagent')
    .action(async () => {
      console.log(BANNER);
      await autoConfirmSubagent.initialize();
      logger.success('Subagent initialized');
    });

  // Status check
  program
    .command('status')
    .description('Show subagent status')
    .action(() => {
      console.log(BANNER);
      const status = autoConfirmSubagent.getStatus();
      console.log(`Initialized: ${status.initialized ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`Enabled: ${status.enabled ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`Total Requests: ${status.metrics.totalRequests}`);
      console.log(`Auto-Confirmed: ${chalk.green(status.metrics.autoConfirmed)}`);
    });

  // If no command provided, show help
  if (process.argv.length <= 2) {
    console.log(BANNER);
    program.help();
  }

  await program.parseAsync(process.argv);
}

async function runDaemon(port: number): Promise<void> {
  // Simple HTTP server for integration with Claude Code
  const http = require('http');
  
  const server = http.createServer(async (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      if (req.method === 'POST' && req.url === '/confirm') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const { message, action } = JSON.parse(body);
            const result = await shouldAutoConfirm(message, action);
            
            res.writeHead(200);
            res.end(JSON.stringify({
              approved: result,
              timestamp: Date.now(),
              source: 'daemon'
            }));
          } catch (error) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid request body' }));
          }
        });
      } else if (req.method === 'GET' && req.url === '/status') {
        const status = autoConfirmSubagent.getStatus();
        res.writeHead(200);
        res.end(JSON.stringify(status));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      logger.error('Daemon request error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  server.listen(port, () => {
    logger.success(`Auto-Confirm daemon running on port ${port}`);
    logger.info('Endpoints:');
    logger.info(`  POST http://localhost:${port}/confirm - Process confirmation`);
    logger.info(`  GET  http://localhost:${port}/status  - Get status`);
  });
}

// Export main function for testing
export { main, shouldAutoConfirm };

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}