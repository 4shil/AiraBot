/**
 * Interactive Onboarding Wizard
 * Guides the user through AiraBot setup with Manglish flair
 */

import { createInterface } from 'readline';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { simpleGit } from 'simple-git';

const AIRABOT_DIR = join(homedir(), '.airabot');
const CONFIG_PATH = join(AIRABOT_DIR, 'config.json');

interface AiraBotConfig {
  userName: string;
  language: 'english' | 'manglish' | 'mixed';
  workHoursStart: string;
  workHoursEnd: string;
  breakIntervalMins: number;
  monitoredRepos: string[];
  daemonEnabled: boolean;
  openrouterApiKey?: string;
  calendarificApiKey?: string;
}

function createRL() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function ask(rl: ReturnType<typeof createRL>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function askChoice(
  rl: ReturnType<typeof createRL>,
  question: string,
  choices: string[],
  defaultIdx = 0,
): Promise<string> {
  const choiceStr = choices.map((c, i) => `${i + 1}. ${c}`).join('  ');
  const answer = await ask(rl, `${question}\n  ${choiceStr}\n  Choice [${defaultIdx + 1}]: `);
  const num = parseInt(answer, 10);
  if (!isNaN(num) && num >= 1 && num <= choices.length) {
    return choices[num - 1]!;
  }
  return choices[defaultIdx]!;
}

async function detectRepos(): Promise<string[]> {
  const codingDir = join(homedir(), 'Coding');
  const repos: string[] = [];
  try {
    const entries = await fs.readdir(codingDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const repoPath = join(codingDir, entry.name);
      try {
        const git = simpleGit(repoPath);
        if (await git.checkIsRepo()) repos.push(repoPath);
      } catch { /* skip */ }
    }
  } catch { /* no Coding dir */ }
  return repos;
}

export async function runOnboarding(): Promise<void> {
  const rl = createRL();

  console.log('\n');
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🤖  AiraBot Setup Wizard  ✨          ║');
  console.log('║   Niyamol-powered productivity AI       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log();

  // 1. Name
  const userName = await ask(rl, '👤 Ningalude peru enthannu? (Your name): ');

  // 2. Language
  const langChoice = await askChoice(
    rl,
    '🗣️  Preferred response language:',
    ['English', 'Manglish', 'Mixed'],
    2,
  );
  const language = langChoice.toLowerCase() as 'english' | 'manglish' | 'mixed';

  // 3. Work hours
  console.log('\n⏰  Work hours (e.g. "9am", "9:00")');
  const workStart = (await ask(rl, '   Start time: ')) || '9am';
  const workEnd = (await ask(rl, '   End time:   ')) || '7pm';

  // 4. Break interval
  const breakChoice = await askChoice(
    rl,
    '☕  Break reminder interval:',
    ['30 mins', '45 mins', '60 mins', '90 mins'],
    2,
  );
  const breakIntervalMins = parseInt(breakChoice.split(' ')[0]!, 10);

  // 5. Repos to monitor
  console.log('\n📁  Auto-detecting git repos in ~/Coding/ ...');
  const detectedRepos = await detectRepos();
  const monitoredRepos: string[] = [];

  if (detectedRepos.length === 0) {
    console.log('   No repos found in ~/Coding/');
  } else {
    console.log(`   Found ${detectedRepos.length} repo(s):`);
    for (const repo of detectedRepos) {
      const name = repo.split('/').pop();
      const answer = await ask(rl, `   Monitor "${name}"? [Y/n]: `);
      if (!answer || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        monitoredRepos.push(repo);
      }
    }
  }

  // 6. Daemon
  const daemonAnswer = await ask(rl, '\n🚀  Enable background daemon (proactive suggestions)? [Y/n]: ');
  const daemonEnabled = !daemonAnswer || daemonAnswer.toLowerCase() !== 'n';

  // 7. OpenRouter API key
  console.log('\n🤖  OpenRouter API key (for LLM emotion detection)');
  console.log('   Get one free at https://openrouter.ai/');
  const openrouterApiKey = await ask(rl, '   API key (optional, press Enter to skip): ');

  // 8. Calendarific API key
  console.log('\n📅  Calendarific API key (for live Kerala festival calendar)');
  console.log('   Get one at https://calendarific.com/');
  const calendarificApiKey = await ask(rl, '   API key (optional, press Enter to skip): ');

  rl.close();

  // Build config
  const config: AiraBotConfig = {
    userName,
    language,
    workHoursStart: workStart,
    workHoursEnd: workEnd,
    breakIntervalMins,
    monitoredRepos,
    daemonEnabled,
    ...(openrouterApiKey && { openrouterApiKey }),
    ...(calendarificApiKey && { calendarificApiKey }),
  };

  // Save
  await fs.mkdir(AIRABOT_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));

  // Summary
  console.log('\n');
  console.log('📋  Configuration Summary:');
  console.log('─'.repeat(40));
  console.log(`  Name:            ${config.userName}`);
  console.log(`  Language:        ${config.language}`);
  console.log(`  Work hours:      ${config.workHoursStart} – ${config.workHoursEnd}`);
  console.log(`  Break interval:  ${config.breakIntervalMins} mins`);
  console.log(`  Repos monitored: ${config.monitoredRepos.length}`);
  console.log(`  Daemon:          ${config.daemonEnabled ? 'enabled' : 'disabled'}`);
  console.log(`  OpenRouter key:  ${config.openrouterApiKey ? '✅ set' : '—'}`);
  console.log(`  Calendarific:    ${config.calendarificApiKey ? '✅ set' : '—'}`);
  console.log('─'.repeat(40));
  console.log();

  // Welcome in Manglish
  console.log(`Machane ${config.userName || 'da'}, AiraBot ready aayii! 🚀`);
  console.log('Niyamol ninte productivity partner — let\'s go! ✨\n');

  if (config.daemonEnabled) {
    console.log('💡  Run `airabot daemon start` to start the background daemon.\n');
  }
}
