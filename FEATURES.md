# 🤖 AiraBot - Next-Generation AI Assistant

**AiraBot** is an intelligent fork of OpenClaw with advanced personality, proactive intelligence, and Kerala-specific features.

## 🌟 Key Features

### 1. **Emotion & Personality Engine**
- 🎭 Detects emotions from user messages
- ⏰ Time-based personality shifts (tired at night, energetic morning)
- 📊 Mood tracking and pattern analysis
- 🧬 Evolves based on user interactions
- 💬 Context-aware response modulation with authentic Manglish

**Usage:**
```typescript
import { getPersonalityEngine } from './personality';

const engine = getPersonalityEngine();
await engine.initialize();

const result = await engine.handleHeartbeat();
// Returns personalized responses based on current emotional state
```

### 2. **Proactive Intelligence**
- 🔍 Learns your work patterns (coding hours, break times)
- 💡 Suggests breaks after 60+ minutes of coding
- 🔄 Detects debugging marathons and offers help
- 📅 Schedules reminders based on your habits
- 📈 Learns from feedback (positive/negative reactions)

**Usage:**
```typescript
import { getProactiveEngine } from './proactive';

const engine = getProactiveEngine();
await engine.initialize();

const suggestions = await engine.getSuggestions();
// ["Time for a break?", "You usually commit around this time"]
```

### 3. **Smart Clipboard**
- 📋 AI-powered categorization (code, link, text, credential)
- 🔍 Semantic search: "that React component from yesterday"
- 🔒 Auto-expires sensitive data (passwords, tokens)
- 🏷️ Auto-tags: detects tech keywords

**Usage:**
```typescript
import { getSmartClipboard } from './clipboard';

const clipboard = await getSmartClipboard();
await clipboard.add("const foo = 'bar'", "vscode");

const results = clipboard.search("react hook");
// Returns matching clipboard entries with context
```

### 4. **Daily Standup Generator**
- 📊 Analyzes git commits automatically
- ✅ Generates "Yesterday" summary from commits
- 🎯 Predicts "Today" tasks based on patterns
- 🚧 Detects blockers (reverts, errors, WIP)
- 💬 Formats for Slack/Discord/Text

**Usage:**
```typescript
import { getStandupGenerator } from './standup';

const generator = getStandupGenerator();
const standup = await generator.generate(1); // Yesterday
const formatted = await generator.format(standup, "slack");

console.log(formatted);
// "Yesterday: Fixed 3 bugs, added feature X..."
```

### 5. **Knowledge Base (Second Brain)**
- 🧠 RAG-powered semantic search
- 🔗 Auto-links related concepts
- 🏷️ Smart tagging from content
- 📤 Export to Obsidian/Notion format
- 🔍 "What did I learn about Docker last month?"

**Usage:**
```typescript
import { getKnowledgeBase } from './knowledge';

const kb = await getKnowledgeBase();
await kb.add({
  title: "Docker Networking",
  content: "Bridge networks allow...",
  type: "note",
  tags: ["docker", "networking"]
});

const results = kb.search("docker bridge");
// Returns relevant knowledge entries with excerpts
```

### 6. **Smart Task Time Estimator**
- ⏱️ Learns from actual vs estimated time
- 📊 Tracks accuracy by task type
- 🎯 "You usually take 120% of estimated time for debugging"
- 📈 Improves predictions over time
- 📉 Shows current progress percentage

**Usage:**
```typescript
import { getTaskEstimator } from './estimator';

const estimator = await getTaskEstimator();
const prediction = estimator.predictTime({
  type: "debugging",
  complexity: "medium",
  baseEstimate: 60
});

console.log(prediction);
// { predicted: 72, confidence: 85, reasoning: "Based on 15 similar tasks..." }
```

### 7. **Kerala/India Specific Features**
- 🇮🇳 IST-aware scheduling ("Call mom at 8 PM IST")
- 🎉 Kerala festival calendar (Onam, Vishu, etc.)
- 🗣️ Malayalam Manglish translation
- 💬 Authentic Manglish reminders
- 📅 Malayalam month names

**Usage:**
```typescript
import { ist, festivals, manglish } from './kerala';

// IST time
const now = ist.now();
console.log(ist.format(new Date())); // "8:30 PM IST"

// Festivals
const upcoming = festivals.upcoming(30);
console.log(upcoming); // [{ name: "Onam", date: ... }]

// Manglish
const translated = manglish.translate("entha machane cheyyada");
// "what dude do it"

const reminder = manglish.remind("commit code");
// "Machane, commit code cheyyada, seri?"
```

## 🚀 Quick Start

```bash
# Install
git clone https://github.com/4shil/AiraBot
cd AiraBot
pnpm install

# Build
pnpm build

# Install globally
npm install -g .

# Run
airabot gateway start
```

## 📊 Architecture

```
AiraBot/
├── personality/       # Emotion & personality engine
├── proactive/        # Pattern detection & suggestions
├── clipboard/        # Smart clipboard history
├── standup/          # Git-based standup generator
├── knowledge/        # Personal knowledge base
├── estimator/        # Task time predictions
├── kerala/           # Kerala-specific utilities
└── features/         # Integration layer
```

## 🎯 Use Cases

**For Developers:**
- Auto-generate daily standups from git
- Track task estimation accuracy
- Store error solutions in knowledge base
- Smart clipboard for code snippets

**For Kerala Users:**
- IST-aware scheduling
- Festival reminders (Onam prep!)
- Authentic Manglish interaction
- Malayalam-friendly formatting

**For Everyone:**
- Emotional intelligence in responses
- Proactive break reminders
- Pattern-based suggestions
- Learning from interactions

## 🔧 Configuration

Edit `~/.airabot/config.json`:

```json
{
  "personality": {
    "adaptability": 60,
    "emotionalRange": ["excited", "empathetic", "playful"]
  },
  "proactive": {
    "enabled": true,
    "checkIntervalMinutes": 30,
    "quietHours": { "start": 23, "end": 7 }
  },
  "features": {
    "enableClipboard": true,
    "enableKnowledge": true,
    "enableKerala": true
  }
}
```

## 📝 Commit History (32 Total)

1-5: OpenClaw → AiraBot rebranding  
6-15: Personality & Emotion Engine  
16-25: Proactive Intelligence  
26: Smart Clipboard  
27: Daily Standup Generator  
28: Knowledge Base  
29: Task Time Estimator  
30: Kerala Features  
31: Integration Layer  
32: Documentation (this file)

## 🤝 Contributing

Fork, feature branch, PR. Keep commits clean and descriptive.

## 📜 License

Same as OpenClaw (check original repo)

## 🙏 Credits

Built on top of [OpenClaw](https://github.com/openclaw/openclaw) by the OpenClaw team.

Enhanced with AI personality, proactive intelligence, and Kerala features by 4shil.

---

**Made with ❤️ in Kerala** 🌴

*Machane, build poli aayitund! Pinneallee!* 🚀
