[English](README.md) | [中文](README.zh-CN.md)

# OpenCode Usage

A CLI tool for analyzing OpenCode session usage and costs, similar to ccusage.

## Features

- 📊 Analyze token usage across sessions
- 💰 Track costs by model and session
- 📅 Daily and monthly usage reports
- 📈 Responsive tables with compact mode
- 🔍 Filter by time range, model, and project path
- 🎯 Exact path matching for specific directories
- 🏗️ Group usage by project/instance
- 📋 Export results to JSON or CSV
- 🎯 View detailed session breakdowns

## Installation

### Install globally via npm

```bash
npm install -g opencode-usage-cli
```

### Or install locally

```bash
npm install opencode-usage-cli
```

## Usage

Using `npx opencode-usage-cli` (no installation required) or globally installed `opencode-usage` command.

### Analyze Usage (Last 7 days)

```bash
npx opencode-usage-cli analyze
```

### Filter by Time Range

```bash
# Last 30 days
npx opencode-usage-cli analyze -d 30

# Last 90 days
npx opencode-usage-cli analyze --days 90
```

### Filter by Model

```bash
# Only Claude Sonnet
npx opencode-usage-cli analyze -m sonnet

# Only Haiku
npx opencode-usage-cli analyze --model haiku
```

### Filter by Project Path

```bash
# Pattern match (default) - matches any path containing the pattern
npx opencode-usage-cli analyze -p github
npx opencode-usage-cli analyze --project my-app

# Exact path match - matches the specific directory path
npx opencode-usage-cli analyze -p /Users/yourname/projects/my-app --exact-path
npx opencode-usage-cli analyze -p ~/projects/my-app --exact-path

# Use with instances to see breakdown
npx opencode-usage-cli analyze -p ~/projects/my-app --exact-path --instances
```

### Filter by Current Working Directory

```bash
# Only show sessions from current working directory
npx opencode-usage-cli analyze --current-only
npx opencode-usage-cli daily --current-only
npx opencode-usage-cli monthly --current-only

# Combine with time range
npx opencode-usage-cli analyze -d 30 --current-only
```

### Show Session Breakdown

```bash
npx opencode-usage-cli analyze --sessions
```

### Group by Path/Instance

```bash
# Analyze command - show usage breakdown by project path
npx opencode-usage-cli analyze --instances

# Daily report - show usage breakdown by project path
npx opencode-usage-cli daily --instances

# Monthly report - show usage breakdown by project path
npx opencode-usage-cli monthly --instances

# Combine with other filters
npx opencode-usage-cli analyze -d 30 -m sonnet --instances

# Combine with exact path matching
npx opencode-usage-cli analyze -p /Users/yourname/projects/my-app --exact-path --instances
```

### Export Formats

```bash
# JSON output
npx opencode-usage-cli analyze --json > usage.json

# CSV output
npx opencode-usage-cli analyze --csv > usage.csv
```

### Daily Report

```bash
# Last 7 days (default)
npx opencode-usage-cli daily

# Last 30 days
npx opencode-usage-cli daily -d 30

# With model breakdown
npx opencode-usage-cli daily --breakdown

# Group by project/instance
npx opencode-usage-cli daily --instances
```

### Monthly Report

```bash
# Last 30 days (default)
npx opencode-usage-cli monthly

# Last 90 days
npx opencode-usage-cli monthly -d 90

# With model breakdown
npx opencode-usage-cli monthly --breakdown

# Group by project/instance
npx opencode-usage-cli monthly --instances
```

### Overall Summary

```bash
npx opencode-usage-cli summary -d 30
```

### Reverse Sort (Oldest First)

```bash
npx opencode-usage-cli analyze --reverse
```

### Help

```bash
npx opencode-usage-cli --help
```

## Example Output

### Summary Report
```
📊 OpenCode Usage Analysis

Summary:
  Total Sessions: 45
  Total Messages: 312
  Date Range: 2026-01-01 to 2026-01-07

Token Usage:
  Input: 150.5K
  Output: 250.8K
  Reasoning: 50.2K
  Cache Read: 500.1K
  Cache Write: 25.3K

Costs:
  Total Cost: $5.2341
  Avg Cost per Session: $0.1163
  Avg Cost per Message: $0.0168

 By Model:
   claude-sonnet-4-5-20250929: $3.1234 (59.7%) - 350.2K tokens
   claude-3-5-haiku-20241022: $1.2345 (23.6%) - 450.5K tokens
   claude-opus-4-5: $0.8762 (16.7%) - 156.2K tokens

By Path (when using --instances):
   /Users/yourname/projects/my-app: 20 sessions, 250.3K tokens, $3.1234 (59.7%)
   /Users/yourname/projects/another-app: 15 sessions, 150.2K tokens, $1.2345 (23.6%)
   /Users/yourname/projects/experiment: 10 sessions, 156.2K tokens, $0.8762 (16.7%)
```

### Daily Report (Table Format)
```
📊 OpenCode Usage Report - Daily

┌────────────┬─────────────────┬──────────┬─────────┬───────────┬───────────┬────────────┬───────────┐
│ Date      │ Models          │ Input    │ Output  │ Cache Cre.│ Cache Read│ Total Tkn.│ Cost (USD)│
├────────────┼─────────────────┼──────────┼─────────┼───────────┼───────────┼────────────┼───────────┤
│ 2026-01-07│ sonnet-4-5     │ 15,234   │ 25,456  │ 2,123     │ 50,234    │ 93,047     │ $1.23     │
│ 2026-01-06│ haiku-3-5       │ 12,567   │ 18,234  │ 1,234     │ 40,123    │ 72,158     │ $0.89     │
├────────────┼─────────────────┼──────────┼─────────┼───────────┼───────────┼────────────┼───────────┤
│ Total     │                 │ 27,801   │ 43,690  │ 3,357     │ 90,357    │ 165,205    │ $2.12     │
└────────────┴─────────────────┴──────────┴─────────┴───────────┴───────────┴────────────┴───────────┘
```

### Daily Report (Compact Mode - narrow terminal)
```
📊 OpenCode Usage Report - Daily

┌────────────┬─────────────────┬──────────┬─────────┬───────────┐
│ Date      │ Models          │ Input    │ Output  │ Cost (USD)│
├────────────┼─────────────────┼──────────┼─────────┼───────────┤
│ 2026-01-07│ sonnet-4-5     │ 15,234   │ 25,456  │ $1.23     │
│ 2026-01-06│ haiku-3-5       │ 12,567   │ 18,234  │ $0.89     │
├────────────┼─────────────────┼──────────┼─────────┼───────────┤
│ Total     │                 │ 27,801   │ 43,690  │ $2.12     │
└────────────┴─────────────────┴──────────┴─────────┴───────────┘

 Running in Compact Mode
 Expand terminal width to see cache metrics and total tokens
```

### Daily Report (Group by Path - using --instances)
```
📊 OpenCode Usage Report - Daily

┌─────────────────────────┬───────────────────────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Date                    │ Models                                │    Input │   Output │    Cache │    Cache │    Total │     Cost │
│                         │                                       │          │          │   Create │     Read │   Tokens │    (USD) │
├─────────────────────────┼───────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Project:                │                                       │          │          │          │          │          │          │
│ /Users/yourname/proj1   │                                       │          │          │          │          │          │          │
├─────────────────────────┼───────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 2026-01-07              │ - sonnet-4-5                          │  15,234  │  25,456  │   2,123  │  50,234  │  93,047  │   $1.23  │
├─────────────────────────┼───────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Project:                │                                       │          │          │          │          │          │          │
│ /Users/yourname/proj2   │                                       │          │          │          │          │          │          │
├─────────────────────────┼───────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 2026-01-07              │ - haiku-3-5                           │  12,567  │  18,234  │   1,234  │  40,123  │  72,158  │   $0.89  │
├─────────────────────────┼───────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Total                   │                                       │  27,801  │  43,690  │   3,357  │  90,357  │ 165,205  │   $2.12  │
└─────────────────────────┴───────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

## Data Source

This tool automatically detects and supports both new and old OpenCode data formats:

### New Format (SQLite) - Recommended
- Database: `~/.local/share/opencode/opencode.db`
- Used by OpenCode v2.0+ (February 2026+)
- Faster queries with SQLite indexes
- Single database file

### Legacy Format (JSON) - Backward Compatible
- Messages: `~/.local/share/opencode/storage/message/`
- Sessions: `~/.local/share/opencode/storage/session/`
- Used by older OpenCode versions

The tool will automatically use SQLite if available, falling back to JSON files otherwise.

## OpenCode Integration

You can integrate this tool as an OpenCode skill for easy access.

### Quick Setup

1. Create the skill directory:

```bash
mkdir -p ~/.config/opencode/skills/opencode-usage
```

2. Create `SKILL.md` file:

```bash
cat > ~/.config/opencode/skills/opencode-usage/SKILL.md << 'EOF'
---
name: opencode-usage
description: Show OpenCode usage statistics and cost analysis
license: MIT
---

## What I do

Analyze OpenCode session token usage and costs:
- Overall summary (analyze)
- Daily breakdown (daily)
- Monthly breakdown (monthly)

## When to use me

Use this skill when the user asks about:
- Usage statistics
- Token consumption
- Cost analysis
- Model usage breakdown

## Commands

```bash
npx opencode-usage-cli <command> [options]
```

| Command | Description |
|---------|-------------|
| analyze | Overall summary (default 7 days) |
| daily | Daily report |
| monthly | Monthly report |

| Option | Description |
|--------|-------------|
| -d, --days <n> | Time range in days |
| -m, --model <pattern> | Filter by model |
| --breakdown | Show model breakdown |
| --instances | Group by project |
| --current-only | Current directory only |

## Examples

```bash
# 7-day summary
npx opencode-usage-cli analyze

# 30-day summary
npx opencode-usage-cli analyze -d 30

# Daily with model breakdown
npx opencode-usage-cli daily --breakdown

# By project
npx opencode-usage-cli daily --instances
```
EOF
```

3. Restart OpenCode or start a new session.

4. Now you can simply ask:
   - "查看使用统计"
   - "今天用了多少 token"
   - "Show usage report"
   - "Cost analysis for this month"

OpenCode will automatically load the skill and execute the appropriate commands.

## License

MIT
