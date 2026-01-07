#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { analyzeUsage, analyzeDailyUsage, analyzeMonthlyUsage, type DailyData, type MonthlyData, type AnalysisResult } from './analyzer.js';
import {
  createUsageReportTable,
  formatUsageDataRow,
  formatTotalsRow,
  addEmptySeparatorRow,
  pushBreakdownRows,
  type UsageData
} from './table.js';

const program = new Command();

program
  .name('opencode-usage')
  .description('Analyze OpenCode session usage and costs')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze session usage (overall summary)')
  .option('-d, --days <n>', 'Filter sessions from last N days', '7')
  .option('-m, --model <pattern>', 'Filter by model pattern (e.g., "sonnet")')
  .option('-p, --project <pattern>', 'Filter by project path pattern')
  .option('--exact-path', 'Use exact path matching instead of pattern matching')
  .option('-i, --instances', 'Show usage breakdown by project/instance')
  .option('--json', 'Output in JSON format')
  .option('--csv', 'Output in CSV format')
  .option('-s, --sessions', 'Show session breakdown')
  .option('-r, --reverse', 'Reverse sort order (oldest first)')
  .action(async (options) => {
    try {
      const result = await analyzeUsage({ ...options, groupByProject: options.instances, projectExact: options.exactPath });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else if (options.csv) {
        printCSV(result);
      } else {
        printSummary(result, options);
      }
    } catch (error) {
      console.error(pc.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('daily')
  .description('Show usage report grouped by date')
  .option('-d, --days <n>', 'Filter sessions from last N days', '7')
  .option('-m, --model <pattern>', 'Filter by model pattern (e.g., "sonnet")')
  .option('-p, --project <pattern>', 'Filter by project path pattern')
  .option('--exact-path', 'Use exact path matching instead of pattern matching')
  .option('-i, --instances', 'Show usage breakdown by project/instance')
  .option('--json', 'Output in JSON format')
  .option('--breakdown', 'Show model breakdown')
  .action(async (options) => {
    try {
      const dailyData = await analyzeDailyUsage({ ...options, groupByProject: options.instances, projectExact: options.exactPath });

      if (dailyData.length === 0) {
        console.warn('No usage data found.');
        return;
      }

      if (options.json) {
        const jsonOutput = options.instances && dailyData.some(d => d.project)
          ? {
              projects: groupByProject(dailyData),
              totals: calculateTotals(dailyData)
            }
          : {
              daily: dailyData,
              totals: calculateTotals(dailyData)
            };
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        printDailyReport(dailyData, options);
      }
    } catch (error) {
      console.error(pc.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('monthly')
  .description('Show usage report grouped by month')
  .option('-d, --days <n>', 'Filter sessions from last N days', '30')
  .option('-m, --model <pattern>', 'Filter by model pattern (e.g., "sonnet")')
  .option('-p, --project <pattern>', 'Filter by project path pattern')
  .option('--exact-path', 'Use exact path matching instead of pattern matching')
  .option('-i, --instances', 'Show usage breakdown by project/instance')
  .option('--json', 'Output in JSON format')
  .option('--breakdown', 'Show model breakdown')
  .action(async (options) => {
    try {
      const monthlyData = await analyzeMonthlyUsage({ ...options, groupByProject: options.instances, projectExact: options.exactPath });

      if (monthlyData.length === 0) {
        console.warn('No usage data found.');
        return;
      }

      if (options.json) {
        const jsonOutput = options.instances && monthlyData.some(d => d.project)
          ? {
              projects: groupByProject(monthlyData),
              totals: calculateTotals(monthlyData)
            }
          : {
              monthly: monthlyData,
              totals: calculateTotals(monthlyData)
            };
        console.log(JSON.stringify(jsonOutput, null, 2));
      } else {
        printMonthlyReport(monthlyData, options);
      }
    } catch (error) {
      console.error(pc.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('summary')
  .description('Show overall usage summary')
  .option('-d, --days <n>', 'Filter sessions from last N days', '30')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const result = await analyzeUsage({ ...options, summary: true });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printSummary(result, options);
      }
    } catch (error) {
      console.error(pc.red(`Error: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program.parse();

function printSummary(result: AnalysisResult, options: { sessions?: boolean; instances?: boolean }) {
  console.log('');
  console.log(pc.bold(pc.cyan('📊 OpenCode Usage Analysis')));
  console.log('');

  console.log(pc.bold('Summary:'));
  console.log(`  Total Sessions: ${result.totalSessions}`);
  console.log(`  Total Messages: ${result.totalMessages}`);
  console.log(`  Date Range: ${result.dateRange.start} to ${result.dateRange.end}`);
  console.log('');
  console.log(pc.bold('Token Usage:'));
  console.log(`  Input: ${formatNumber(result.tokens.input)}`);
  console.log(`  Output: ${formatNumber(result.tokens.output)}`);
  console.log(`  Reasoning: ${formatNumber(result.tokens.reasoning)}`);
  console.log(`  Cache Read: ${formatNumber(result.tokens.cacheRead)}`);
  console.log(`  Cache Write: ${formatNumber(result.tokens.cacheWrite)}`);
  console.log('');
  console.log(pc.bold('Costs:'));
  console.log(`  Total Cost: $${result.cost.total.toFixed(4)}`);
  console.log(`  Avg Cost per Session: $${result.cost.avgPerSession.toFixed(4)}`);
  console.log(`  Avg Cost per Message: $${result.cost.avgPerMessage.toFixed(4)}`);

  if (result.models && result.models.length > 0) {
    console.log('');
    console.log(pc.bold('By Model:'));
    result.models.forEach((model) => {
      const percentage = ((model.cost / result.cost.total) * 100).toFixed(1);
      console.log(`  ${pc.cyan(model.name)}: $${model.cost.toFixed(4)} (${percentage}%) - ${formatNumber(model.tokens)} tokens`);
    });
  }

  if (options.sessions && result.sessions && result.sessions.length > 0) {
    console.log('');
    console.log(pc.bold('Top Sessions:'));
    result.sessions.slice(0, 10).forEach((session) => {
      console.log(`  ${session.id.substring(0, 25)}...`);
      console.log(`    Title: ${session.title.substring(0, 40)}...`);
      console.log(`    Model: ${session.model}`);
      console.log(`    Messages: ${session.messages}, Tokens: ${formatNumber(session.tokens)}, Cost: $${session.cost.toFixed(4)}`);
    });
  }

  if (options.instances && result.sessions && result.sessions.length > 0) {
    console.log('');
    console.log(pc.bold('By Path:'));
    const pathGroups = new Map<string, Array<typeof result.sessions[0]>>();

    result.sessions.forEach((session) => {
      const path = session.directory || 'unknown';
      if (!pathGroups.has(path)) {
        pathGroups.set(path, []);
      }
      pathGroups.get(path)!.push(session);
    });

    pathGroups.forEach((sessions, path) => {
      const pathSessions = sessions.length;
      const pathTokens = sessions.reduce((sum, s) => sum + s.tokens, 0);
      const pathCost = sessions.reduce((sum, s) => sum + s.cost, 0);
      const percentage = result.cost.total > 0 ? ((pathCost / result.cost.total) * 100).toFixed(1) : '0.0';

      console.log(`  ${pc.cyan(path)}: ${pathSessions} sessions, ${formatNumber(pathTokens)} tokens, $${pathCost.toFixed(4)} (${percentage}%)`);
    });
  }

  console.log('');
}

function printDailyReport(dailyData: DailyData[], options: any) {
  console.log('');
  console.log(pc.bold(pc.cyan('📊 OpenCode Usage Report - Daily')));
  console.log('');

  const tableConfig = {
    firstColumnName: 'Date',
    forceCompact: options.forceCompact
  };
  const table = createUsageReportTable(tableConfig);

  if (options.instances && dailyData.some(d => d.project)) {
    const projectGroups = groupByProject(dailyData);

    let isFirstProject = true;
    for (const [projectName, projectData] of Object.entries(projectGroups)) {
      if (!isFirstProject) {
        addEmptySeparatorRow(table, 8);
      }

      table.push([
        pc.cyan(`Project: ${projectName}`),
        '', '', '', '', '', '', ''
      ]);

      for (const data of projectData as DailyData[]) {
        const row = formatUsageDataRow(data.date, {
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          cacheCreationTokens: data.cacheCreationTokens,
          cacheReadTokens: data.cacheReadTokens,
          totalCost: data.totalCost,
          modelsUsed: data.modelsUsed
        });
        table.push(row);

        if (options.breakdown) {
          pushBreakdownRows(table, data.modelBreakdowns);
        }
      }

      isFirstProject = false;
    }
  } else {
    for (const data of dailyData) {
      const row = formatUsageDataRow(data.date, {
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cacheCreationTokens: data.cacheCreationTokens,
        cacheReadTokens: data.cacheReadTokens,
        totalCost: data.totalCost,
        modelsUsed: data.modelsUsed
      });
      table.push(row);

      if (options.breakdown) {
        pushBreakdownRows(table, data.modelBreakdowns);
      }
    }
  }

  addEmptySeparatorRow(table, 8);

  const totals = calculateTotals(dailyData);
  const totalsRow = formatTotalsRow({
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    cacheCreationTokens: totals.cacheCreationTokens,
    cacheReadTokens: totals.cacheReadTokens,
    totalCost: totals.totalCost
  });
  table.push(totalsRow);

  console.log(table.toString());

  if (table.isCompactMode()) {
    console.log('');
    console.log(pc.gray('Running in Compact Mode'));
    console.log(pc.gray('Expand terminal width to see cache metrics and total tokens'));
  }

  console.log('');
}

function printMonthlyReport(monthlyData: MonthlyData[], options: any) {
  console.log('');
  console.log(pc.bold(pc.cyan('📊 OpenCode Usage Report - Monthly')));
  console.log('');

  const tableConfig = {
    firstColumnName: 'Month',
    forceCompact: options.forceCompact
  };
  const table = createUsageReportTable(tableConfig);

  if (options.instances && monthlyData.some(d => d.project)) {
    const projectGroups = groupByProject(monthlyData);

    let isFirstProject = true;
    for (const [projectName, projectData] of Object.entries(projectGroups)) {
      if (!isFirstProject) {
        addEmptySeparatorRow(table, 8);
      }

      table.push([
        pc.cyan(`Project: ${projectName}`),
        '', '', '', '', '', '', ''
      ]);

      for (const data of projectData as MonthlyData[]) {
        const row = formatUsageDataRow(data.month, {
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          cacheCreationTokens: data.cacheCreationTokens,
          cacheReadTokens: data.cacheReadTokens,
          totalCost: data.totalCost,
          modelsUsed: data.modelsUsed
        });
        table.push(row);

        if (options.breakdown) {
          pushBreakdownRows(table, data.modelBreakdowns);
        }
      }

      isFirstProject = false;
    }
  } else {
    for (const data of monthlyData) {
      const row = formatUsageDataRow(data.month, {
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cacheCreationTokens: data.cacheCreationTokens,
        cacheReadTokens: data.cacheReadTokens,
        totalCost: data.totalCost,
        modelsUsed: data.modelsUsed
      });
      table.push(row);

      if (options.breakdown) {
        pushBreakdownRows(table, data.modelBreakdowns);
      }
    }
  }

  addEmptySeparatorRow(table, 8);

  const totals = calculateTotals(monthlyData);
  const totalsRow = formatTotalsRow({
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    cacheCreationTokens: totals.cacheCreationTokens,
    cacheReadTokens: totals.cacheReadTokens,
    totalCost: totals.totalCost
  });
  table.push(totalsRow);

  console.log(table.toString());

  if (table.isCompactMode()) {
    console.log('');
    console.log(pc.gray('Running in Compact Mode'));
    console.log(pc.gray('Expand terminal width to see cache metrics and total tokens'));
  }

  console.log('');
}

function groupByProject(data: Array<DailyData | MonthlyData>): Record<string, Array<DailyData | MonthlyData>> {
  const groups: Record<string, Array<DailyData | MonthlyData>> = {};

  for (const item of data) {
    const projectName = item.project || 'unknown';

    if (!groups[projectName]) {
      groups[projectName] = [];
    }

    groups[projectName].push(item);
  }

  return groups;
}

function calculateTotals(data: Array<DailyData | MonthlyData>): UsageData {
  return data.reduce((acc, item) => ({
    inputTokens: acc.inputTokens + item.inputTokens,
    outputTokens: acc.outputTokens + item.outputTokens,
    cacheCreationTokens: acc.cacheCreationTokens + item.cacheCreationTokens,
    cacheReadTokens: acc.cacheReadTokens + item.cacheReadTokens,
    totalCost: acc.totalCost + item.totalCost,
    modelsUsed: []
  }), {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    totalCost: 0,
    modelsUsed: []
  });
}

function printCSV(result: AnalysisResult) {
  console.log('Category,Metric,Value');

  console.log(`Summary,Total Sessions,${result.totalSessions}`);
  console.log(`Summary,Total Messages,${result.totalMessages}`);
  console.log(`Summary,Date Range,${result.dateRange.start} to ${result.dateRange.end}`);

  console.log(`Tokens,Input,${result.tokens.input}`);
  console.log(`Tokens,Output,${result.tokens.output}`);
  console.log(`Tokens,Reasoning,${result.tokens.reasoning}`);
  console.log(`Tokens,Cache Read,${result.tokens.cacheRead}`);
  console.log(`Tokens,Cache Write,${result.tokens.cacheWrite}`);

  console.log(`Costs,Total,${result.cost.total}`);
  console.log(`Costs,Avg per Session,${result.cost.avgPerSession}`);
  console.log(`Costs,Avg per Message,${result.cost.avgPerMessage}`);

  if (result.models) {
    result.models.forEach((model) => {
      console.log(`Model,${model.name},${model.cost},${model.tokens}`);
    });
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
