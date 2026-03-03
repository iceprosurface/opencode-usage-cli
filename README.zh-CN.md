[English](README.md) | [中文](README.zh-CN.md)

# OpenCode Usage

一个用于分析 OpenCode 会话使用情况和成本的 CLI 工具，类似于 ccusage。

## 功能特性

- 📊 跨会话分析 token 使用情况
- 💰 按模型和会话追踪成本
- 📅 每日和每月使用报告
- 📈 带紧凑模式的响应式表格
- 🔍 按时间范围、模型和项目路径过滤
- 🎯 特定目录的精确路径匹配
- 🏗️ 按项目/实例分组使用情况
- 📋 导出结果为 JSON 或 CSV 格式
- 🎯 查看详细的会话明细

## 安装

### 通过 npm 全局安装

```bash
npm install -g opencode-usage-cli
```

### 或本地安装

```bash
npm install opencode-usage-cli
```

## 使用方法

两种入口命令现已统一为等价用法：

- 无需安装：`npx --yes opencode-usage-cli <command> [options]`
- 全局安装（推荐）：`opencode-usage <command> [options]`
- 兼容 fallback：全局安装后也支持 `opencode-usage-cli <command> [options]`

### 分析使用情况（最近 7 天）

```bash
npx --yes opencode-usage-cli analyze
```

### 按时间范围过滤

```bash
# 最近 30 天
npx --yes opencode-usage-cli analyze -d 30

# 最近 90 天
npx --yes opencode-usage-cli analyze --days 90
```

### 按模型过滤

```bash
# 仅 Claude Sonnet
npx --yes opencode-usage-cli analyze -m sonnet

# 仅 Haiku
npx --yes opencode-usage-cli analyze --model haiku
```

### 按项目路径过滤

```bash
# 模式匹配（默认）- 匹配包含该模式的任何路径
npx --yes opencode-usage-cli analyze -p github
npx --yes opencode-usage-cli analyze --project my-app

# 精确路径匹配 - 匹配特定的目录路径
npx --yes opencode-usage-cli analyze -p /Users/yourname/projects/my-app --exact-path
npx --yes opencode-usage-cli analyze -p ~/projects/my-app --exact-path

# 与实例结合使用查看明细
npx --yes opencode-usage-cli analyze -p ~/projects/my-app --exact-path --instances
```

### 按当前工作目录过滤

```bash
# 仅显示当前工作目录的会话
npx --yes opencode-usage-cli analyze --current-only
npx --yes opencode-usage-cli daily --current-only
npx --yes opencode-usage-cli monthly --current-only

# 与时间范围结合使用
npx --yes opencode-usage-cli analyze -d 30 --current-only
```

### 显示会话明细

```bash
npx --yes opencode-usage-cli analyze --sessions
```

### 按路径/实例分组

```bash
# 分析命令 - 按项目路径显示使用情况明细
npx --yes opencode-usage-cli analyze --instances

# 每日报告 - 按项目路径显示使用情况明细
npx --yes opencode-usage-cli daily --instances

# 每月报告 - 按项目路径显示使用情况明细
npx --yes opencode-usage-cli monthly --instances

# 与其他过滤器结合使用
npx --yes opencode-usage-cli analyze -d 30 -m sonnet --instances

# 与精确路径匹配结合使用
npx --yes opencode-usage-cli analyze -p /Users/yourname/projects/my-app --exact-path --instances
```

### 导出格式

```bash
# JSON 输出
npx --yes opencode-usage-cli analyze --json > usage.json

# CSV 输出
npx --yes opencode-usage-cli analyze --csv > usage.csv
```

### 每日报告

```bash
# 最近 7 天（默认）
npx --yes opencode-usage-cli daily

# 最近 30 天
npx --yes opencode-usage-cli daily -d 30

# 按模型分组
npx --yes opencode-usage-cli daily --breakdown

# 按项目/实例分组
npx --yes opencode-usage-cli daily --instances
```

### 每月报告

```bash
# 最近 30 天（默认）
npx --yes opencode-usage-cli monthly

# 最近 90 天
npx --yes opencode-usage-cli monthly -d 90

# 按模型分组
npx --yes opencode-usage-cli monthly --breakdown

# 按项目/实例分组
npx --yes opencode-usage-cli monthly --instances
```

### 总体摘要

```bash
npx --yes opencode-usage-cli summary -d 30
```

### 使用热力图（GitHub 风格）

```bash
# 终端热力图（默认一年）
npx --yes opencode-usage-cli heatmap

# 最近 30 天
npx --yes opencode-usage-cli heatmap -d 30

# 导出为 SVG
npx --yes opencode-usage-cli heatmap --svg heatmap.svg

# 导出为 PNG（需要：npm install sharp）
npx --yes opencode-usage-cli heatmap --png heatmap.png

# 按指标过滤（tokens, cost, messages）
npx --yes opencode-usage-cli heatmap --metric cost

# JSON 输出
npx --yes opencode-usage-cli heatmap --json
```

### 反向排序（从最旧到最新）

```bash
npx --yes opencode-usage-cli analyze --reverse
```

### 帮助

```bash
npx --yes opencode-usage-cli --help
```

## 示例输出

### 摘要报告
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

### 每日报告（表格格式）
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

### 每日报告（紧凑模式 - 窄终端）
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

### 每日报告（按路径分组 - 使用 --instances）
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
│ 2026-01-07              │ - haiku-3-5                           │ 12,567  │  18,234  │   1,234  │  40,123  │  72,158  │   $0.89  │
├─────────────────────────┼───────────────────────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Total                   │                                       │  27,801  │  43,690  │   3,357  │  90,357  │ 165,205  │   $2.12  │
└─────────────────────────┴───────────────────────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 使用热力图（GitHub 风格）

终端输出显示彩色方块：

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

SVG 导出（`--svg heatmap.svg`）生成 GitHub 风格的贡献图，可嵌入文档或分享。

## 数据来源

本工具自动检测并支持新旧两种 OpenCode 数据格式：

### 新格式（SQLite）- 推荐
- 数据库：`~/.local/share/opencode/opencode.db`
- 用于 OpenCode v2.0+（2026年2月及以后）
- SQLite 索引加速查询，性能更好
- 单一数据库文件

### 旧格式（JSON）- 向后兼容
- 消息：`~/.local/share/opencode/storage/message/`
- 会话：`~/.local/share/opencode/storage/session/`
- 用于旧版 OpenCode

工具会自动优先使用 SQLite，如果不存在则回退到 JSON 文件。

## OpenCode 集成

你可以将此工具集成为 OpenCode skill，方便随时调用。

### 快速配置

1. 创建 skill 目录：

```bash
mkdir -p ~/.config/opencode/skills/opencode-usage
```

2. 创建 `SKILL.md` 文件：

```bash
cat > ~/.config/opencode/skills/opencode-usage/SKILL.md << 'EOF'
---
name: opencode-usage
description: 显示 OpenCode 使用统计和成本分析
license: MIT
---

## 功能

分析 OpenCode 会话 token 使用量和成本：
- 总体摘要（analyze）
- 每日报告（daily）
- 每月报告（monthly）

## 使用场景

当用户询问以下内容时使用此 skill：
- 使用统计
- token 消耗
- 成本分析
- 模型使用情况

## 命令

```bash
npx --yes opencode-usage-cli <command> --json [options]
```

> **重要**：作为 AI 调用时，**必须始终使用 `--json` 参数**，以便获得结构化数据，便于解析和展示。

| 命令 | 说明 |
|------|------|
| analyze --json | 总体摘要（默认 7 天） |
| daily --json | 每日报告 |
| monthly --json | 每月报告 |

| 选项 | 说明 |
|------|------|
| --json | **AI 调用时必须** - JSON 格式输出，便于解析 |
| -d, --days <n> | 时间范围（天） |
| -m, --model <pattern> | 按模型过滤 |
| --breakdown | 显示模型明细 |
| --instances | 按项目分组 |
| --current-only | 仅当前目录 |

## 示例

```bash
# 7 天摘要（AI 调用）
npx --yes opencode-usage-cli analyze --json

# 30 天摘要
npx --yes opencode-usage-cli analyze --json -d 30

# 每日报告 + 模型明细
npx --yes opencode-usage-cli daily --json --breakdown

# 按项目分组
npx --yes opencode-usage-cli daily --json --instances
```
EOF
```

3. 重启 OpenCode 或开始新会话。

4. 现在可以直接用自然语言询问：
   - "查看使用统计"
   - "今天用了多少 token"
   - "这个月的成本分析"
   - "Show usage report"

OpenCode 会自动加载 skill 并执行相应命令。

## 许可证

MIT
