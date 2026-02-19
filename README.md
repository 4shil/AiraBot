# 🤖 AiraBot

**Next-Generation AI Assistant with Personality, Proactive Intelligence & Kerala Features**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Same%20as%20OpenClaw-lightgrey)](https://github.com/openclaw/openclaw)
[![Made in Kerala](https://img.shields.io/badge/Made%20in-Kerala%20🌴-orange)](https://en.wikipedia.org/wiki/Kerala)

AiraBot is a powerful fork of [OpenClaw](https://github.com/openclaw/openclaw) enhanced with emotional intelligence, proactive learning, productivity tools, and Kerala-specific features. Built for developers who want an assistant that *understands* them.

---

## ✨ What Makes AiraBot Special?

### 🎭 **Emotion & Personality Engine**
- Detects emotions from your messages (excited, frustrated, tired, happy)
- Adapts personality based on time of day (energetic mornings, empathetic nights)
- Evolves based on your interactions and feedback
- Authentic **Manglish** integration for Kerala users
- Mood tracking with pattern analysis

### 🔮 **Proactive Intelligence**
- **Learns your work patterns** - coding hours, break times, meeting schedules
- **Suggests breaks** after 60+ minutes of focused work
- **Detects debugging marathons** and offers help
- **Git monitoring** - reminds you to commit uncommitted changes
- **Predictive scheduling** - anticipates your needs before you ask
- **Feedback learning** - improves suggestions based on your reactions

### 📋 **Smart Clipboard**
- AI-powered categorization: `code`, `link`, `text`, `command`, `json`, `credential`
- Semantic search: *"that React component from yesterday"*
- Auto-expires sensitive data (passwords, tokens) after 1 hour
- Auto-tags with tech keywords (react, docker, api, etc.)
- Search by category, tags, or meaning

### 📊 **Daily Standup Generator**
- Analyzes git commits automatically
- Generates "Yesterday" summary from actual work
- Predicts "Today" tasks based on patterns
- Detects blockers (reverts, errors, WIP commits)
- Formats for Slack, Discord, or plain text
- Saves history for tracking progress

### 🧠 **Knowledge Base (Second Brain)**
- RAG-powered semantic search across all your notes
- Auto-links related concepts
- Stores: notes, terminal outputs, error solutions, snippets
- Smart tagging from content
- Exports to Obsidian/Notion format
- *"What did I learn about Docker networking last month?"*

### ⏱️ **Smart Task Time Estimator**
- Learns from your actual vs estimated time
- Tracks accuracy by task type (coding, debugging, meetings)
- *"You usually take 120% of estimated time for debugging"*
- Shows current progress percentage for active tasks
- Improves predictions over time

### 🇮🇳 **Kerala/India Specific Features**
- **IST-aware scheduling** - "Call mom at 8 PM IST"
- **Kerala festival calendar** - Onam, Vishu, Thiruvathira reminders
- **Manglish translation** - Understands Malayalam in English script
- **Authentic Manglish responses** - "Machane, commit code cheyyada, seri?"
- **Malayalam month names** and cultural context

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/4shil/AiraBot.git
cd AiraBot

# Install dependencies
pnpm install

# Build
pnpm build

# Install globally
npm install -g .
```

### Usage

```bash
# Start the gateway
airabot gateway start

# Check status
airabot gateway status

# Stop the gateway
airabot gateway stop
```

### Quick API Example

```typescript
import { initializeAiraBot, ist, festivals } from 'airabot';

// Initialize all features
const { personality, proactive, features } = await initializeAiraBot();

// Smart Clipboard
const clipId = await features.addToClipboard("const foo = 'bar'", "vscode");
const results = features.searchClipboard("react hook");

// Daily Standup
const standup = await features.generateStandup(1, "slack");
console.log(standup);

// Knowledge Base
await features.addKnowledge({
  title: "Docker Networking",
  content: "Bridge networks allow containers to communicate...",
  type: "note",
  tags: ["docker", "networking"]
});

// Task Estimation
const prediction = await features.estimateTask({
  type: "debugging",
  complexity: "medium",
  baseEstimate: 60
});
console.log(prediction.predicted); // 72 minutes

// Kerala Features
const now = ist.now();
console.log(ist.format(new Date())); // "8:30 PM IST"

const upcoming = festivals.upcoming(30);
console.log(upcoming[0].name); // "Onam"
```

---

## 📦 Architecture

```
AiraBot/
├── personality/       # Emotion & personality engine (10 modules)
│   ├── emotion-types.ts
│   ├── emotion-state.ts
│   ├── emotion-detector.ts
│   ├── response-modulator.ts
│   ├── mood-tracker.ts
│   ├── personality-traits.ts
│   ├── time-based-shifts.ts
│   ├── emotion-logger.ts
│   ├── interaction-learner.ts
│   └── index.ts
├── proactive/         # Pattern detection & intelligence (10 modules)
│   ├── pattern-detector.ts
│   ├── activity-tracker.ts
│   ├── suggestion-engine.ts
│   ├── context-analyzer.ts
│   ├── predictive-scheduler.ts
│   ├── notification-manager.ts
│   ├── feedback-learner.ts
│   ├── proactive-monitor.ts
│   ├── heartbeat-integration.ts
│   └── index.ts
├── clipboard/         # Smart clipboard history
│   └── smart-clipboard.ts
├── standup/          # Git-based standup generator
│   └── standup-generator.ts
├── knowledge/        # Personal knowledge base (RAG)
│   └── knowledge-base.ts
├── estimator/        # Task time predictions
│   └── task-estimator.ts
├── kerala/           # Kerala-specific utilities
│   └── kerala-utils.ts
├── features/         # Integration layer
│   └── integration.ts
├── airabot.ts        # Main exports
├── FEATURES.md       # Detailed feature documentation
└── README.md         # This file
```

---

## 🎯 Use Cases

### For Developers
- ✅ Auto-generate daily standups from git history
- ✅ Track task estimation accuracy over time
- ✅ Store error solutions in searchable knowledge base
- ✅ Smart clipboard for code snippets with semantic search
- ✅ Break reminders during long coding sessions
- ✅ Git status monitoring (uncommitted changes alerts)

### For Kerala Users
- ✅ IST-aware scheduling (no more timezone confusion!)
- ✅ Festival reminders (Onam prep, Vishu shopping)
- ✅ Authentic Manglish interaction
- ✅ Malayalam-friendly formatting
- ✅ Cultural context understanding

### For Everyone
- ✅ Emotional intelligence in responses
- ✅ Learns your work patterns
- ✅ Proactive suggestions based on behavior
- ✅ Personal knowledge management
- ✅ Time tracking and estimation

---

## 🔧 Configuration

Create `~/.airabot/config.json`:

```json
{
  "personality": {
    "enabled": true,
    "adaptability": 60,
    "emotionalRange": ["excited", "empathetic", "playful", "focused"],
    "manglishMode": true
  },
  "proactive": {
    "enabled": true,
    "checkIntervalMinutes": 30,
    "quietHours": {
      "start": 23,
      "end": 7
    },
    "breakReminderMinutes": 60,
    "gitMonitoring": true
  },
  "features": {
    "enableClipboard": true,
    "enableStandup": true,
    "enableKnowledge": true,
    "enableEstimator": true,
    "enableKerala": true
  }
}
```

---

## 📊 Feature Comparison

| Feature | OpenClaw | AiraBot |
|---------|----------|---------|
| Core AI Assistant | ✅ | ✅ |
| Emotion Detection | ❌ | ✅ |
| Personality Evolution | ❌ | ✅ |
| Proactive Intelligence | ❌ | ✅ |
| Smart Clipboard | ❌ | ✅ |
| Standup Generator | ❌ | ✅ |
| Knowledge Base | ❌ | ✅ |
| Task Estimator | ❌ | ✅ |
| Kerala Features | ❌ | ✅ |
| Manglish Support | ❌ | ✅ |
| Usage Metrics Tracking | ✅ | ❌ (Removed) |

---

## 📖 Documentation

- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation with code examples
- **[OpenClaw Docs](https://docs.openclaw.ai)** - Original OpenClaw documentation

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build
pnpm build

# Run tests (if added)
pnpm test

# Lint
pnpm lint
```

---

## 📝 Commit History

**32 Total Commits:**

- **Commits 1-5:** OpenClaw → AiraBot rebranding
- **Commits 6-15:** Personality & Emotion Engine (10 modules)
- **Commits 16-25:** Proactive Intelligence (10 modules)
- **Commit 26:** Smart Clipboard
- **Commit 27:** Daily Standup Generator
- **Commit 28:** Knowledge Base
- **Commit 29:** Task Time Estimator
- **Commit 30:** Kerala Features
- **Commit 31:** Integration Layer
- **Commit 32:** Complete Documentation

Clean git history, single author (4shil), no old contributors.

---

## 🤝 Contributing

Contributions welcome! Fork the repo, create a feature branch, and submit a PR.

**Guidelines:**
- Keep commits clean and descriptive
- Follow existing code style
- Add tests for new features
- Update documentation

---

## 🙏 Credits

Built on top of [OpenClaw](https://github.com/openclaw/openclaw) by the OpenClaw team.

**Enhanced with:**
- AI personality engine
- Proactive intelligence
- Productivity tools
- Kerala-specific features
- Live updates (RSS + trends placeholders)

**By:** [4shil](https://github.com/4shil)

---

## 📜 License

Same as OpenClaw (check [original repo](https://github.com/openclaw/openclaw))

---

## 🌟 Star this repo if you find it useful!

---

<div align="center">

**Made with ❤️ in Kerala** 🌴

*Machane, build poli aayitund! Pinneallee!* 🚀

[GitHub](https://github.com/4shil/AiraBot) • [Issues](https://github.com/4shil/AiraBot/issues)

</div>
