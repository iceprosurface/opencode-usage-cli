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

The two entry commands are now unified and equivalent:

- No install: `npx --yes opencode-usage-cli <command> [options]`
- Global install (recommended): `opencode-usage <command> [options]`
- Fallback alias after global install: `opencode-usage-cli <command> [options]`

### Analyze Usage (Last 7 days)

```bash
npx --yes opencode-usage-cli analyze
```

### Filter by Time Range

```bash
# Last 30 days
npx --yes opencode-usage-cli analyze -d 30

# Last 90 days
npx --yes opencode-usage-cli analyze --days 90
```

### Filter by Model

```bash
# Only Claude Sonnet
npx --yes opencode-usage-cli analyze -m sonnet

# Only Haiku
npx --yes opencode-usage-cli analyze --model haiku
```

### Filter by Project Path

```bash
# Pattern match (default) - matches any path containing the pattern
npx --yes opencode-usage-cli analyze -p github
npx --yes opencode-usage-cli analyze --project my-app

# Exact path match - matches the specific directory path
npx --yes opencode-usage-cli analyze -p /Users/yourname/projects/my-app --exact-path
npx --yes opencode-usage-cli analyze -p ~/projects/my-app --exact-path

# Use with instances to see breakdown
npx --yes opencode-usage-cli analyze -p ~/projects/my-app --exact-path --instances
```

### Filter by Current Working Directory

```bash
# Only show sessions from current working directory
npx --yes opencode-usage-cli analyze --current-only
npx --yes opencode-usage-cli daily --current-only
npx --yes opencode-usage-cli monthly --current-only

# Combine with time range
npx --yes opencode-usage-cli analyze -d 30 --current-only
```

### Show Session Breakdown

```bash
npx --yes opencode-usage-cli analyze --sessions
```

### Group by Path/Instance

```bash
# Analyze command - show usage breakdown by project path
npx --yes opencode-usage-cli analyze --instances

# Daily report - show usage breakdown by project path
npx --yes opencode-usage-cli daily --instances

# Monthly report - show usage breakdown by project path
npx --yes opencode-usage-cli monthly --instances

# Combine with other filters
npx --yes opencode-usage-cli analyze -d 30 -m sonnet --instances

# Combine with exact path matching
npx --yes opencode-usage-cli analyze -p /Users/yourname/projects/my-app --exact-path --instances
```

### Export Formats

```bash
# JSON output
npx --yes opencode-usage-cli analyze --json > usage.json

# CSV output
npx --yes opencode-usage-cli analyze --csv > usage.csv
```

### Daily Report

```bash
# Last 7 days (default)
npx --yes opencode-usage-cli daily

# Last 30 days
npx --yes opencode-usage-cli daily -d 30

# With model breakdown
npx --yes opencode-usage-cli daily --breakdown

# Group by project/instance
npx --yes opencode-usage-cli daily --instances
```

### Monthly Report

```bash
# Last 30 days (default)
npx --yes opencode-usage-cli monthly

# Last 90 days
npx --yes opencode-usage-cli monthly -d 90

# With model breakdown
npx --yes opencode-usage-cli monthly --breakdown

# Group by project/instance
npx --yes opencode-usage-cli monthly --instances
```

### Overall Summary

```bash
npx --yes opencode-usage-cli summary -d 30
```

### Usage Heatmap (GitHub-style)

```bash
# Terminal heatmap (last year)
npx --yes opencode-usage-cli heatmap

# Last 30 days
npx --yes opencode-usage-cli heatmap -d 30

# Export as SVG
npx --yes opencode-usage-cli heatmap --svg heatmap.svg

# Export as PNG (requires: npm install sharp)
npx --yes opencode-usage-cli heatmap --png heatmap.png

# Filter by metric (tokens, cost, messages)
npx --yes opencode-usage-cli heatmap --metric cost

# JSON output
npx --yes opencode-usage-cli heatmap --json
```

### Reverse Sort (Oldest First)

```bash
npx --yes opencode-usage-cli analyze --reverse
```

### Help

```bash
npx --yes opencode-usage-cli --help
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

### Usage Heatmap (GitHub-style)

Terminal output with colored blocks:

```
📊 OpenCode Usage Heatmap

    Jan   Feb   Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec   Jan   Feb
Sun                                                                                    
Mon                                                                                    
Tue                                                                                    
Wed                                                                                    
Thu                                                                                    
Fri                                                                                    
Sat                                                                                    

Less       More

Summary:
  Total Tokens: 1.9B
  Date Range: 2025-02-14 to 2026-02-14
  Active Days: 39
```

SVG export (`--svg heatmap.svg`) generates a GitHub-style contribution graph that can be embedded in documentation or shared.

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
npx --yes opencode-usage-cli <command> --json [options]
```

> **Important**: Always use `--json` flag when calling as AI, to get structured data for easy parsing.

| Command | Description |
|---------|-------------|
| analyze --json | Overall summary (default 7 days) |
| daily --json | Daily report |
| monthly --json | Monthly report |

| Option | Description |
|--------|-------------|
| --json | **Required for AI** - JSON output for easy parsing |
| -d, --days <n> | Time range in days |
| -m, --model <pattern> | Filter by model |
| --breakdown | Show model breakdown |
| --instances | Group by project |
| --current-only | Current directory only |

## Examples

```bash
# 7-day summary (AI call)
npx --yes opencode-usage-cli analyze --json

# 30-day summary
npx --yes opencode-usage-cli analyze --json -d 30

# Daily with model breakdown
npx --yes opencode-usage-cli daily --json --breakdown

# By project
npx --yes opencode-usage-cli daily --json --instances
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
