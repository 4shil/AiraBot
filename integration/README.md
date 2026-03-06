# AiraBot Integration Guide

## Quick Start

```typescript
import { createAiraBot } from "./integration";

// Create bot instance
const bot = createAiraBot("user123", 25); // userId, age

// Query anything in Manglish
const response = await bot.query("Kochi il mazha undo?");
console.log(response.text);
// Output: "Kochi weather: 28°C, rainy"

// Quick methods
await bot.checkWeather("Idukki");
await bot.orderFood("biriyani");
await bot.getFestivalInfo();
```

## Features by Age Group

### Teens (13-19)
- Social media (Instagram, Snapchat, Discord)
- Gaming (BGMI stats, game deals)
- AI tools (homework, essays)
- Music & entertainment
- Shopping deals

### Tech (20-39)
- Dev tools (Git, automation)
- Home automation
- Privacy & security
- Crypto tracking
- Tech news

### Elder (40+)
- Health & wellness
- Family & social
- Daily assistance (prayer times, bills)
- WhatsApp enhanced

### Universal (All Ages)
- Festival calendar
- Weather
- Food delivery
- Travel & tourism
- News & media
- Voice assistant

## Auto Mode Detection

AiraBot auto-detects personality mode based on:
1. Age (if provided)
2. Query vocabulary & topics
3. Interaction history

Modes automatically switch for optimal experience.

## Manglish Support

All features support Manglish queries:
- "Onam engane?" → Festival info
- "Idukki il mazha undo?" → Weather check
- "Order biriyani" → Food delivery
- "Git status kanikk" → Dev command

## Integration with Existing Systems

AiraBot enhances existing AiraBot with:
- Personality engine (already in repo)
- Proactive intelligence (already in repo)
- Kerala/Malayali features
- Age-appropriate feature routing

All 25 feature modules are modular - enable/disable as needed.
