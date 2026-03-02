#!/usr/bin/env node
/**
 * AiraBot CLI Entry Point
 * Commander-based CLI for AiraBot productivity commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { homedir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';

const program = new Command();

program
  .name('airabot')
  .description('AiraBot — your Malayali AI productivity companion')
  .version('1.0.0');

// ─── chat ─────────────────────────────────────────────────────────────────────
program
  .command('chat <message>')
  .description('Chat with AiraBot')
  .action(async (message: string) => {
    console.log(chalk.cyan('AiraBot:'), chalk.white('Enthu parayunnu?'));
    console.log(chalk.dim(`(Message received: "${message}")`));
    console.log(chalk.green('Machane, I heard you! Full LLM integration coming soon 🚀'));
  });

// ─── standup ─────────────────────────────────────────────────────────────────
program
  .command('standup')
  .description('Generate daily standup report')
  .option('-f, --format <format>', 'Output format: slack|discord|plain', 'plain')
  .option('-d, --days <n>', 'Look back N days', '1')
  .action(async (opts) => {
    const { StandupGenerator } = await import('./standup/standup-generator.js');
    const gen = new StandupGenerator();
    const report = await gen.generateForAllRepos({
      format: opts.format as 'slack' | 'discord' | 'plain',
      days: parseInt(opts.days, 10),
    });
    console.log(report);
  });

// ─── clip ─────────────────────────────────────────────────────────────────────
const clip = program.command('clip').description('Smart clipboard management');

clip
  .command('search <query>')
  .description('Search clipboard history')
  .action(async (query: string) => {
    const { SmartClipboard } = await import('./clipboard/smart-clipboard.js');
    const cb = new SmartClipboard();
    await cb.load();
    const results = cb.search(query);
    if (results.length === 0) {
      console.log(chalk.yellow('No matching clips found.'));
    } else {
      results.forEach((r, i) => {
        console.log(chalk.cyan(`[${i + 1}]`), r.content.substring(0, 100));
      });
    }
  });

clip
  .command('add <text>')
  .description('Add text to clipboard history')
  .action(async (text: string) => {
    const { SmartClipboard } = await import('./clipboard/smart-clipboard.js');
    const cb = new SmartClipboard();
    await cb.load();
    cb.add(text);
    await cb.save();
    console.log(chalk.green('Added to clipboard history!'));
  });

clip
  .command('list')
  .description('List recent clipboard entries')
  .action(async () => {
    const { SmartClipboard } = await import('./clipboard/smart-clipboard.js');
    const cb = new SmartClipboard();
    await cb.load();
    const items = cb.list();
    if (items.length === 0) {
      console.log(chalk.yellow('Clipboard history is empty.'));
    } else {
      items.slice(0, 20).forEach((r, i) => {
        console.log(chalk.cyan(`[${i + 1}]`), r.content.substring(0, 80));
      });
    }
  });

clip
  .command('clear')
  .description('Clear clipboard history')
  .action(async () => {
    const { SmartClipboard } = await import('./clipboard/smart-clipboard.js');
    const cb = new SmartClipboard();
    cb.clear();
    await cb.save();
    console.log(chalk.green('Clipboard history cleared!'));
  });

// ─── kb ───────────────────────────────────────────────────────────────────────
const kb = program.command('kb').description('Knowledge base management');

kb
  .command('add')
  .description('Add entry to knowledge base')
  .requiredOption('-t, --title <title>', 'Entry title')
  .requiredOption('-c, --content <content>', 'Entry content')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (opts) => {
    const { KnowledgeBase } = await import('./knowledge/knowledge-base.js');
    const base = new KnowledgeBase();
    await base.load();
    const id = base.addEntry({
      title: opts.title,
      content: opts.content,
      tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : [],
    });
    await base.save();
    console.log(chalk.green(`Added entry: ${id}`));
  });

kb
  .command('search <query>')
  .description('Search knowledge base')
  .option('-n, --limit <n>', 'Max results', '5')
  .action(async (query: string, opts) => {
    const { KnowledgeBase } = await import('./knowledge/knowledge-base.js');
    const base = new KnowledgeBase();
    await base.load();
    const results = base.search(query, parseInt(opts.limit, 10));
    if (results.length === 0) {
      console.log(chalk.yellow('No results found.'));
    } else {
      results.forEach((r, i) => {
        console.log(chalk.cyan(`[${i + 1}] ${r.entry.title}`), chalk.dim(`(score: ${r.score.toFixed(3)})`));
        console.log(chalk.white(r.entry.content.substring(0, 150)));
        console.log();
      });
    }
  });

// ─── task ─────────────────────────────────────────────────────────────────────
const task = program.command('task').description('Task estimation and tracking');

task
  .command('estimate')
  .description('Estimate task time')
  .requiredOption('--type <type>', 'Task type (feature|bug|refactor|test|docs)')
  .requiredOption('--complexity <complexity>', 'Complexity: low|medium|high')
  .requiredOption('--base <minutes>', 'Base estimate in minutes')
  .action(async (opts) => {
    const { TaskEstimator } = await import('./estimator/task-estimator.js');
    const estimator = new TaskEstimator();
    await estimator.load();
    const result = estimator.estimate({
      type: opts.type,
      complexity: opts.complexity as 'low' | 'medium' | 'high',
      baseMinutes: parseInt(opts.base, 10),
    });
    console.log(chalk.cyan('Task Estimate:'));
    console.log(chalk.white(`  ID: ${result.id}`));
    console.log(chalk.white(`  Estimated: ${result.estimatedMinutes} minutes`));
    console.log(chalk.white(`  Range: ${result.rangeMin}–${result.rangeMax} minutes`));
    console.log(chalk.dim(`  Confidence: ${result.confidence}%`));
  });

task
  .command('done <id>')
  .description('Mark task as complete with actual time')
  .requiredOption('--actual <minutes>', 'Actual time spent in minutes')
  .action(async (id: string, opts) => {
    const { TaskEstimator } = await import('./estimator/task-estimator.js');
    const estimator = new TaskEstimator();
    await estimator.load();
    await estimator.completeTask(id, parseInt(opts.actual, 10));
    console.log(chalk.green(`Task ${id} marked complete!`));
  });

task
  .command('report')
  .description('Show estimation accuracy report')
  .action(async () => {
    const { TaskEstimator } = await import('./estimator/task-estimator.js');
    const estimator = new TaskEstimator();
    await estimator.load();
    const report = estimator.getAccuracyReport();
    console.log(chalk.cyan('Accuracy Report:'));
    console.log(chalk.white(`  Overall accuracy: ${(report.overall * 100).toFixed(1)}%`));
    Object.entries(report.byType).forEach(([type, acc]) => {
      console.log(chalk.white(`  ${type}: ${((acc as number) * 100).toFixed(1)}%`));
    });
  });

// ─── setup ────────────────────────────────────────────────────────────────────
program
  .command('setup')
  .description('Run interactive onboarding wizard')
  .action(async () => {
    const { runOnboarding } = await import('./setup/onboarding.js');
    await runOnboarding();
  });

// ─── gateway ─────────────────────────────────────────────────────────────────
const gateway = program.command('gateway').description('AiraBot gateway management');

gateway
  .command('start')
  .description('Start the AiraBot daemon')
  .action(async () => {
    const { startDaemon } = await import('./daemon/aira-daemon.js');
    await startDaemon();
  });

gateway
  .command('stop')
  .description('Stop the AiraBot daemon')
  .action(async () => {
    const { stopDaemon } = await import('./daemon/aira-daemon.js');
    await stopDaemon();
  });

gateway
  .command('status')
  .description('Check daemon status')
  .action(async () => {
    const { getDaemonStatus } = await import('./daemon/aira-daemon.js');
    const status = await getDaemonStatus();
    console.log(status);
  });

// ─── remind ──────────────────────────────────────────────────────────────────
program
  .command('remind <message> <time>')
  .description('Schedule a reminder (e.g. airabot remind "call mom" "8pm")')
  .action(async (message: string, time: string) => {
    const { scheduleReminder } = await import('./kerala/kerala-utils.js');
    await scheduleReminder(message, time);
    console.log(chalk.green(`Reminder scheduled: "${message}" at ${time}`));
  });

// ─── daemon ──────────────────────────────────────────────────────────────────
const daemon = program.command('daemon').description('Background daemon management');

daemon.command('start').action(async () => {
  const { startDaemon } = await import('./daemon/aira-daemon.js');
  await startDaemon();
});
daemon.command('stop').action(async () => {
  const { stopDaemon } = await import('./daemon/aira-daemon.js');
  await stopDaemon();
});
daemon.command('status').action(async () => {
  const { getDaemonStatus } = await import('./daemon/aira-daemon.js');
  console.log(await getDaemonStatus());
});

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
