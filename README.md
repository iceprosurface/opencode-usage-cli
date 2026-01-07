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

After global installation, the `opencode-usage` command will be available.

### Analyze Usage (Last 7 days)

```bash
opencode-usage analyze
```

### Filter by Time Range

```bash
# Last 30 days
opencode-usage analyze -d 30

# Last 90 days
opencode-usage analyze --days 90
```

### Filter by Model

```bash
# Only Claude Sonnet
opencode-usage analyze -m sonnet

# Only Haiku
opencode-usage analyze --model haiku
```

### Filter by Project Path

```bash
# Pattern match (default) - matches any path containing the pattern
opencode-usage analyze -p github
opencode-usage analyze --project my-app

# Exact path match - matches the specific directory path
opencode-usage analyze -p /Users/yourname/projects/my-app --exact-path
opencode-usage analyze -p ~/projects/my-app --exact-path

# Use with instances to see breakdown
opencode-usage analyze -p ~/projects/my-app --exact-path --instances
```

### Filter by Current Working Directory

```bash
# Only show sessions from current working directory
opencode-usage analyze --current-only
opencode-usage daily --current-only
opencode-usage monthly --current-only

# Combine with time range
opencode-usage analyze -d 30 --current-only
```

### Show Session Breakdown

```bash
opencode-usage analyze --sessions
```

### Group by Path/Instance

```bash
# Analyze command - show usage breakdown by project path
opencode-usage analyze --instances

# Daily report - show usage breakdown by project path
opencode-usage daily --instances

# Monthly report - show usage breakdown by project path
opencode-usage monthly --instances

# Combine with other filters
opencode-usage analyze -d 30 -m sonnet --instances

# Combine with exact path matching
opencode-usage analyze -p /Users/yourname/projects/my-app --exact-path --instances
```

### Export Formats

```json
# JSON output
opencode-usage analyze --json > usage.json

# CSV output
opencode-usage analyze --csv > usage.csv
```

### Daily Report

```bash
# Last 7 days (default)
opencode-usage daily

# Last 30 days
opencode-usage daily -d 30

# With model breakdown
opencode-usage daily --breakdown

# Group by project/instance
opencode-usage daily --instances
```

### Monthly Report

```bash
# Last 30 days (default)
opencode-usage monthly

# Last 90 days
opencode-usage monthly -d 90

# With model breakdown
opencode-usage monthly --breakdown

# Group by project/instance
opencode-usage monthly --instances
```

### Overall Summary

```bash
opencode-usage summary -d 30
```

### Reverse Sort (Oldest First)

```bash
opencode-usage analyze --reverse
```

### Help

```bash
opencode-usage --help
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

## Data Source

The tool reads OpenCode session data from:
- Messages: `~/.local/share/opencode/storage/message/`
- Sessions: `~/.local/share/opencode/storage/session/`

## OpenCode Integration

You can create a custom slash command in OpenCode to view usage statistics directly.

### Quick Setup

1. Create the global command directory:

```bash
mkdir -p ~/.config/opencode/command
```

2. Create an `opencode-usage.md` file with the following content:

```bash
cat > ~/.config/opencode/command/opencode-usage.md << 'EOF'
---
description: Show OpenCode usage statistics
arguments: $1 (days, optional) $2 (current-only, optional)
---

!\`opencode-usage-cli analyze -d $1 --current-only=$2\`
EOF
```

3. Now you can use the `/opencode-usage` command directly in OpenCode TUI!

```
/opencode-usage              # Show last 7 days (default)
/opencode-usage 30           # Show last 30 days
/opencode-usage 90           # Show last 90 days
/opencode-usage 30 true      # Show last 30 days, current directory only
```
/opencode-usage       # Show last 7 days (default)
/opencode-usage 30    # Show last 30 days
```



## License

MIT
