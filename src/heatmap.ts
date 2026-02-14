import fs from 'fs';
import path from 'path';
import pc from 'picocolors';
import chalk from 'chalk';
import {
  hasNewDbFormat,
  hasOldJsonFormat,
  getSessionMap,
  getMessagesByTimeRange,
  parseMessageData,
  OPENCODE_STORAGE_PATH
} from './db.js';

chalk.level = 3;

export interface HeatmapDay {
  date: string;
  value: number;
  level: number;
}

export interface HeatmapData {
  days: HeatmapDay[];
  metric: string;
  total: number;
  maxValue: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface HeatmapOptions {
  days?: number;
  model?: string;
  project?: string;
  projectExact?: boolean;
  currentOnly?: boolean;
  currentPath?: string;
  metric?: 'tokens' | 'cost' | 'messages';
}

const LEVEL_COLORS = [
  () => chalk.bgHex('#161b22')('  '),
  () => chalk.bgHex('#0e4429')('  '),
  () => chalk.bgHex('#006d32')('  '),
  () => chalk.bgHex('#26a641')('  '),
  () => chalk.bgHex('#39d353')('  '),
];

const SVG_COLORS = [
  '#161b22',
  '#0e4429',
  '#006d32',
  '#26a641',
  '#39d353',
];

export async function analyzeHeatmapData(options: HeatmapOptions = {}): Promise<HeatmapData> {
  if (hasNewDbFormat()) {
    return analyzeHeatmapFromSqlite(options);
  }
  if (hasOldJsonFormat()) {
    return analyzeHeatmapFromJson(options);
  }
  throw new Error('No OpenCode data found. Please run OpenCode first to create session data.');
}

async function analyzeHeatmapFromSqlite(options: HeatmapOptions): Promise<HeatmapData> {
  const { 
    days = 365, 
    model, 
    project, 
    projectExact = false, 
    currentOnly = false, 
    currentPath,
    metric = 'tokens'
  } = options;

  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);
  
  const sessionMap = getSessionMap();
  const messages = getMessagesByTimeRange(startTime, endTime);

  const dailyData = new Map<string, { tokens: number; cost: number; messages: number }>();

  for (const msgRow of messages) {
    const msgData = parseMessageData(msgRow);
    const sessionId = msgRow.session_id;
    const sessionInfo = sessionMap.get(sessionId);

    if (!sessionInfo) continue;

    const createdTime = msgData.time?.created || msgRow.time_created;

    if (createdTime < startTime) continue;

    if (model && msgData.modelID && !msgData.modelID.toLowerCase().includes(model.toLowerCase())) {
      continue;
    }

    if (project && msgData.path?.root) {
      const projectPattern = project.toLowerCase();
      const projectPath = msgData.path.root.toLowerCase();
      if (projectExact) {
        if (projectPath !== projectPattern && !projectPath.endsWith(projectPattern + '/') && !projectPattern.startsWith(projectPath + '/')) {
          continue;
        }
      } else {
        if (!projectPath.includes(projectPattern)) {
          continue;
        }
      }
    }

    if (currentOnly && msgData.path?.root) {
      const workingDir = (currentPath || process.cwd()).toLowerCase();
      const msgPath = msgData.path.root.toLowerCase();
      const workingDirWithSlash = workingDir.endsWith('/') ? workingDir : workingDir + '/';
      const msgPathWithSlash = msgPath.endsWith('/') ? msgPath : msgPath + '/';

      if (!msgPathWithSlash.startsWith(workingDirWithSlash) &&
          !workingDirWithSlash.startsWith(msgPathWithSlash)) {
        continue;
      }
    }

    if (msgData.role === 'assistant') {
      const dateKey = formatDateKey(createdTime);
      
      const tokens = (msgData.tokens?.input || 0) +
                     (msgData.tokens?.output || 0) +
                     (msgData.tokens?.cache?.read || 0) +
                     (msgData.tokens?.cache?.write || 0);
      const cost = msgData.cost || 0;

      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { tokens: 0, cost: 0, messages: 0 });
      }

      const dayData = dailyData.get(dateKey)!;
      dayData.tokens += tokens;
      dayData.cost += cost;
      dayData.messages += 1;
    }
  }

  return buildHeatmapData(dailyData, startTime, endTime, metric);
}

async function analyzeHeatmapFromJson(options: HeatmapOptions): Promise<HeatmapData> {
  const { 
    days = 365, 
    model, 
    project, 
    projectExact = false, 
    currentOnly = false, 
    currentPath,
    metric = 'tokens'
  } = options;

  const endTime = Date.now();
  const startTime = endTime - (days * 24 * 60 * 60 * 1000);

  const messageDir = path.join(OPENCODE_STORAGE_PATH, 'message');

  if (!fs.existsSync(messageDir)) {
    return buildHeatmapData(new Map(), startTime, endTime, metric);
  }

  const sessionDirs = fs.readdirSync(messageDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const dailyData = new Map<string, { tokens: number; cost: number; messages: number }>();

  for (const sessionId of sessionDirs) {
    const sessionPath = path.join(messageDir, sessionId);
    const messageFiles = fs.readdirSync(sessionPath)
      .filter(f => f.endsWith('.json'));

    for (const messageFile of messageFiles) {
      const messagePath = path.join(sessionPath, messageFile);
      try {
        const message = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
        const createdTime = message.time?.created || 0;

        if (createdTime < startTime) continue;

        if (model && message.modelID && !message.modelID.toLowerCase().includes(model.toLowerCase())) {
          continue;
        }

        if (project && message.path?.root) {
          const projectPattern = project.toLowerCase();
          const projectPath = message.path.root.toLowerCase();
          if (projectExact) {
            if (projectPath !== projectPattern && !projectPath.endsWith(projectPattern + '/') && !projectPattern.startsWith(projectPath + '/')) {
              continue;
            }
          } else {
            if (!projectPath.includes(projectPattern)) {
              continue;
            }
          }
        }

        if (currentOnly && message.path?.root) {
          const workingDir = (currentPath || process.cwd()).toLowerCase();
          const messagePath = message.path.root.toLowerCase();
          const workingDirWithSlash = workingDir.endsWith('/') ? workingDir : workingDir + '/';
          const messagePathWithSlash = messagePath.endsWith('/') ? messagePath : messagePath + '/';

          if (!messagePathWithSlash.startsWith(workingDirWithSlash) &&
              !workingDirWithSlash.startsWith(messagePathWithSlash)) {
            continue;
          }
        }

        if (message.role === 'assistant') {
          const dateKey = formatDateKey(createdTime);
          
          const tokens = (message.tokens?.input || 0) +
                         (message.tokens?.output || 0) +
                         (message.tokens?.cache?.read || 0) +
                         (message.tokens?.cache?.write || 0);
          const cost = message.cost || 0;

          if (!dailyData.has(dateKey)) {
            dailyData.set(dateKey, { tokens: 0, cost: 0, messages: 0 });
          }

          const dayData = dailyData.get(dateKey)!;
          dayData.tokens += tokens;
          dayData.cost += cost;
          dayData.messages += 1;
        }
      } catch {
        continue;
      }
    }
  }

  return buildHeatmapData(dailyData, startTime, endTime, metric);
}

function buildHeatmapData(
  dailyData: Map<string, { tokens: number; cost: number; messages: number }>,
  startTime: number,
  endTime: number,
  metric: 'tokens' | 'cost' | 'messages'
): HeatmapData {
  const days: HeatmapDay[] = [];
  let maxValue = 0;
  let total = 0;

  const startDate = new Date(startTime);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(endTime);
  endDate.setHours(0, 0, 0, 0);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(d.getTime());
    const dayValue = dailyData.get(dateKey);
    const value = dayValue ? dayValue[metric] : 0;
    
    if (value > maxValue) maxValue = value;
    total += value;

    days.push({
      date: dateKey,
      value,
      level: 0
    });
  }

  for (const day of days) {
    day.level = calculateLevel(day.value, maxValue);
  }

  return {
    days,
    metric,
    total,
    maxValue,
    dateRange: {
      start: formatDateKey(startTime),
      end: formatDateKey(endTime)
    }
  };
}

function calculateLevel(value: number, maxValue: number): number {
  if (value === 0) return 0;
  if (maxValue === 0) return 0;
  
  const ratio = value / maxValue;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

function formatDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

export function renderHeatmapTerminal(data: HeatmapData): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push(pc.bold(pc.cyan('📊 OpenCode Usage Heatmap')));
  lines.push('');
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  
  if (data.days.length > 0) {
    const firstDate = new Date(data.days[0].date);
    const firstDayOfWeek = firstDate.getDay();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', value: 0, level: 0 });
    }
  }
  
  for (const day of data.days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const monthFirstWeek: Map<number, number> = new Map();
  weeks.forEach((week, weekIndex) => {
    for (const day of week) {
      if (day.date) {
        const month = new Date(day.date).getMonth();
        if (!monthFirstWeek.has(month)) {
          monthFirstWeek.set(month, weekIndex);
        }
      }
    }
  });

  const sortedMonths = Array.from(monthFirstWeek.entries())
    .sort((a, b) => a[1] - b[1]);

  let monthLine = '    ';
  let lastPos = 0;
  
  for (const [month, weekIndex] of sortedMonths) {
    const targetPos = weekIndex * 2;
    const padding = Math.max(0, targetPos - lastPos);
    monthLine += ' '.repeat(padding) + months[month];
    lastPos = targetPos + 3;
  }
  lines.push(monthLine);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    let line = pc.gray(dayLabels[dayOfWeek].padEnd(3)) + ' ';
    
    for (const week of weeks) {
      const day = week[dayOfWeek];
      if (day && day.date) {
        line += LEVEL_COLORS[day.level]();
      } else {
        line += LEVEL_COLORS[0]();
      }
    }
    
    lines.push(line);
  }

  lines.push('');
  lines.push(pc.gray('Less ') + 
    LEVEL_COLORS[0]() + ' ' +
    LEVEL_COLORS[1]() + ' ' +
    LEVEL_COLORS[2]() + ' ' +
    LEVEL_COLORS[3]() + ' ' +
    LEVEL_COLORS[4]() + ' ' +
    pc.gray(' More'));
  
  lines.push('');
  lines.push(pc.bold('Summary:'));
  const metricLabel = data.metric === 'tokens' ? 'Tokens' : data.metric === 'cost' ? 'Cost' : 'Messages';
  
  if (data.metric === 'cost') {
    lines.push(`  Total ${metricLabel}: $${data.total.toFixed(2)}`);
  } else if (data.metric === 'tokens') {
    lines.push(`  Total ${metricLabel}: ${formatNumber(data.total)}`);
  } else {
    lines.push(`  Total ${metricLabel}: ${data.total.toLocaleString()}`);
  }
  lines.push(`  Date Range: ${data.dateRange.start} to ${data.dateRange.end}`);
  lines.push(`  Active Days: ${data.days.filter(d => d.value > 0).length}`);
  lines.push('');

  return lines.join('\n');
}

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function generateHeatmapSvg(data: HeatmapData, options: { width?: number; title?: string } = {}): string {
  const { width = 800, title } = options;
  const cellSize = 12;
  const cellGap = 3;
  const leftMargin = 50;
  const topMargin = 50;
  const bottomMargin = 30;
  
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  
  if (data.days.length > 0) {
    const firstDate = new Date(data.days[0].date);
    const firstDayOfWeek = firstDate.getDay();
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', value: 0, level: 0 });
    }
  }
  
  for (const day of data.days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const svgWidth = Math.max(width, leftMargin + weeks.length * (cellSize + cellGap) + 20);
  const svgHeight = topMargin + 7 * (cellSize + cellGap) + bottomMargin;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <style>
    .title { font: bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: #c9d1d9; }
    .month-label { font: 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: #8b949e; }
    .day-label { font: 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: #8b949e; }
    .cell { rx: 2; ry: 2; }
    .legend-text { font: 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: #8b949e; }
    .summary { font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; fill: #c9d1d9; }
  </style>
  
  <rect width="100%" height="100%" fill="#0d1117"/>
`;

  const titleText = title || 'OpenCode Usage Heatmap';
  svg += `  <text x="${svgWidth / 2}" y="25" class="title" text-anchor="middle">${escapeXml(titleText)}</text>\n`;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;
  
  weeks.forEach((week, weekIndex) => {
    for (const day of week) {
      if (day.date) {
        const month = new Date(day.date).getMonth();
        if (month !== lastMonth) {
          const x = leftMargin + weekIndex * (cellSize + cellGap);
          svg += `  <text x="${x}" y="${topMargin - 5}" class="month-label">${months[month]}</text>\n`;
          lastMonth = month;
        }
      }
    }
  });

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  dayLabels.forEach((label, i) => {
    if (label) {
      svg += `  <text x="${leftMargin - 5}" y="${topMargin + i * (cellSize + cellGap) + cellSize - 2}" class="day-label" text-anchor="end">${label}</text>\n`;
    }
  });

  weeks.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      if (day.date) {
        const x = leftMargin + weekIndex * (cellSize + cellGap);
        const y = topMargin + dayIndex * (cellSize + cellGap);
        const color = SVG_COLORS[day.level];
        const tooltip = `${day.date}: ${day.value.toLocaleString()} ${data.metric}`;
        
        svg += `  <rect class="cell" x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${color}"><title>${tooltip}</title></rect>\n`;
      }
    });
  });

  const legendY = topMargin + 7 * (cellSize + cellGap) + 10;
  const legendX = svgWidth - 200;
  
  svg += `  <text x="${legendX}" y="${legendY + 10}" class="legend-text">Less</text>\n`;
  SVG_COLORS.forEach((color, i) => {
    const x = legendX + 35 + i * (cellSize + cellGap);
    svg += `  <rect class="cell" x="${x}" y="${legendY}" width="${cellSize}" height="${cellSize}" fill="${color}"/>\n`;
  });
  svg += `  <text x="${legendX + 35 + 5 * (cellSize + cellGap)}" y="${legendY + 10}" class="legend-text">More</text>\n`;

  svg += '</svg>';
  
  return svg;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function saveHeatmapSvg(data: HeatmapData, filePath: string, options?: { width?: number; title?: string }): void {
  const svg = generateHeatmapSvg(data, options);
  fs.writeFileSync(filePath, svg, 'utf-8');
}

export async function generateHeatmapPng(data: HeatmapData, filePath: string, options?: { width?: number; title?: string }): Promise<void> {
  try {
    const sharp = await import('sharp');
    const svg = generateHeatmapSvg(data, options);
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filePath);
  } catch {
    throw new Error('PNG generation requires the "sharp" package. Install it with: npm install sharp');
  }
}
