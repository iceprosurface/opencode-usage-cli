import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENCODE_STORAGE_PATH = path.join(process.env.HOME || '', '.local', 'share', 'opencode', 'storage');

export interface AnalysisResult {
  totalSessions: number;
  totalMessages: number;
  dateRange: DateRange;
  tokens: TokenData;
  cost: CostData;
  models: ModelData[];
  sessions?: SessionData[];
}

export interface DateRange {
  start: string;
  end: string;
}

export interface TokenData {
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
}

interface RawTokenData {
  input?: number;
  output?: number;
  reasoning?: number;
  cache?: {
    read?: number;
    write?: number;
  };
}

export interface CostData {
  total: number;
  avgPerSession: number;
  avgPerMessage: number;
}

export interface ModelData {
  name: string;
  tokens: number;
  cost: number;
  sessions: number;
}

export interface SessionData {
  id: string;
  title: string;
  directory?: string;
  startTime: string;
  endTime: string;
  messages: number;
  tokens: number;
  cost: number;
  model: string;
}

interface InternalSessionData {
  id: string;
  messages: Array<{
    id: string;
    model?: string;
    provider?: string;
    agent?: string;
    tokens: number;
    cost: number;
    created: number;
  }>;
  tokens: number;
  cost: number;
  models: Record<string, { tokens: number; cost: number; messages: number }>;
  startTime: number;
  endTime: number;
  title: string;
  directory?: string;
  rawMessageData: Record<string, { tokens?: RawTokenData }>;
}

export interface DailyData {
  date: string;
  project?: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
}

export interface MonthlyData {
  month: string;
  project?: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
}

export interface ModelBreakdown {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface AnalyzeOptions {
  days?: number;
  model?: string;
  project?: string;
  projectExact?: boolean;
  summary?: boolean;
  reverse?: boolean;
  groupByProject?: boolean;
  instances?: boolean;
  currentOnly?: boolean;
  currentPath?: string;
}

export async function analyzeUsage(options: AnalyzeOptions = {}): Promise<AnalysisResult> {
  const { days = 7, model, project, projectExact = false, summary = false, reverse = false, currentOnly = false, currentPath } = options;

  const sessions = [];
  const messageDir = path.join(OPENCODE_STORAGE_PATH, 'message');
  const sessionDir = path.join(OPENCODE_STORAGE_PATH, 'session');

  const sessionDirs = fs.readdirSync(messageDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

  for (const sessionId of sessionDirs) {
    const sessionPath = path.join(messageDir, sessionId);
    const messageFiles = fs.readdirSync(sessionPath)
      .filter(f => f.endsWith('.json'));

    if (messageFiles.length === 0) continue;

    const sessionData: InternalSessionData = {
      id: sessionId,
      messages: [],
      tokens: 0,
      cost: 0,
      models: {},
      startTime: Infinity,
      endTime: 0,
      title: '',
      rawMessageData: {}
    };

    const sessionMetadata = findSessionMetadata(sessionDir, sessionId);
    if (sessionMetadata) {
      sessionData.title = sessionMetadata.title || 'Untitled';
      sessionData.directory = sessionMetadata.directory;
    } else {
      sessionData.title = 'Untitled';
    }

    for (const messageFile of messageFiles) {
      const messagePath = path.join(sessionPath, messageFile);
      try {
        const message: MessageRecord = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
        const createdTime = message.time?.created || 0;
        const completedTime = message.time?.completed || 0;

        sessionData.rawMessageData[message.id] = { tokens: message.tokens };

        if (createdTime < cutoffTime) continue;

        sessionData.startTime = Math.min(sessionData.startTime, createdTime);
        sessionData.endTime = Math.max(sessionData.endTime, completedTime);

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
          const msgTokens = (message.tokens?.input || 0) +
                           (message.tokens?.output || 0) +
                           (message.tokens?.reasoning || 0) +
                           (message.tokens?.cache?.read || 0) +
                           (message.tokens?.cache?.write || 0);

          const msgCost = message.cost || 0;

          sessionData.messages.push({
            id: message.id,
            model: message.modelID,
            provider: message.providerID,
            agent: message.agent,
            tokens: msgTokens,
            cost: msgCost,
            created: createdTime
          });

          sessionData.tokens += msgTokens;
          sessionData.cost += msgCost;

          if (message.modelID) {
            if (!sessionData.models[message.modelID]) {
              sessionData.models[message.modelID] = { tokens: 0, cost: 0, messages: 0 };
            }
            sessionData.models[message.modelID].tokens += msgTokens;
            sessionData.models[message.modelID].cost += msgCost;
            sessionData.models[message.modelID].messages++;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (sessionData.messages.length > 0) {
      sessions.push(sessionData);
    }
  }

  sessions.sort((a, b) => {
    return reverse ? a.startTime - b.startTime : b.startTime - a.startTime;
  });

  const totalSessions = sessions.length;
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
  const totalTokens = sessions.reduce((sum, s) => sum + s.tokens, 0);
  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);

  const modelAggregates: Record<string, { tokens: number; cost: number; sessions: number }> = {};
  sessions.forEach(session => {
    Object.entries(session.models).forEach(([modelName, data]) => {
      if (!modelAggregates[modelName]) {
        modelAggregates[modelName] = { tokens: 0, cost: 0, sessions: 0 };
      }
      modelAggregates[modelName].tokens += data.tokens;
      modelAggregates[modelName].cost += data.cost;
      modelAggregates[modelName].sessions++;
    });
  });

  const models = Object.entries(modelAggregates)
    .map(([name, data]) => ({
      name,
      tokens: data.tokens,
      cost: data.cost,
      sessions: data.sessions
    }))
    .sort((a, b) => b.cost - a.cost);

  const allTimes = sessions.flatMap(s => [s.startTime, s.endTime]);
  const minTime = allTimes.length > 0 ? Math.min(...allTimes) : 0;
  const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : 0;

  return {
    totalSessions,
    totalMessages,
    dateRange: {
      start: formatTimestamp(minTime),
      end: formatTimestamp(maxTime)
    },
    tokens: {
      input: sessions.reduce((sum, s) =>
        sum + s.messages.reduce((mSum, m) =>
          mSum + (findMessageTokenData(s, m.id)?.input || 0), 0), 0),
      output: sessions.reduce((sum, s) =>
        sum + s.messages.reduce((mSum, m) =>
          mSum + (findMessageTokenData(s, m.id)?.output || 0), 0), 0),
      reasoning: sessions.reduce((sum, s) =>
        sum + s.messages.reduce((mSum, m) =>
          mSum + (findMessageTokenData(s, m.id)?.reasoning || 0), 0), 0),
      cacheRead: sessions.reduce((sum, s) =>
        sum + s.messages.reduce((mSum, m) =>
          mSum + (findMessageTokenData(s, m.id)?.cache?.read || 0), 0), 0),
      cacheWrite: sessions.reduce((sum, s) =>
        sum + s.messages.reduce((mSum, m) =>
          mSum + (findMessageTokenData(s, m.id)?.cache?.write || 0), 0), 0)
    },
    cost: {
      total: totalCost,
      avgPerSession: totalSessions > 0 ? totalCost / totalSessions : 0,
      avgPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0
    },
    models,
    sessions: summary ? undefined : sessions.map(s => ({
      id: s.id,
      title: s.title,
      directory: s.directory,
      startTime: formatTimestamp(s.startTime),
      endTime: formatTimestamp(s.endTime),
      messages: s.messages.length,
      tokens: s.tokens,
      cost: s.cost,
      model: getPrimaryModel(s)
    }))
  };
}

export async function analyzeDailyUsage(options: AnalyzeOptions = {}): Promise<DailyData[]> {
  const { days = 7, model, project, projectExact = false, currentOnly = false, currentPath } = options;

  const sessions = [];
  const messageDir = path.join(OPENCODE_STORAGE_PATH, 'message');
  const sessionDir = path.join(OPENCODE_STORAGE_PATH, 'session');

  const sessionDirs = fs.readdirSync(messageDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

  const dailyData = new Map<string, DailyData>();

  for (const sessionId of sessionDirs) {
    const sessionPath = path.join(messageDir, sessionId);
    const messageFiles = fs.readdirSync(sessionPath)
      .filter(f => f.endsWith('.json'));

    if (messageFiles.length === 0) continue;

    const sessionMetadata = findSessionMetadata(sessionDir, sessionId);
    const projectName = sessionMetadata?.directory || 'unknown';

    for (const messageFile of messageFiles) {
      const messagePath = path.join(sessionPath, messageFile);
      try {
        const message = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
        const createdTime = message.time?.created || 0;

        if (createdTime < cutoffTime) continue;

        if (model && message.modelID && !message.modelID.toLowerCase().includes(model.toLowerCase())) {
          continue;
        }

        if (project && message.path?.root && !message.path.root.toLowerCase().includes(project.toLowerCase())) {
          continue;
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
          const dateKey = formatTimestamp(createdTime);
          const cacheCreate = message.tokens?.cache?.write || 0;
          const cacheRead = message.tokens?.cache?.read || 0;
          const input = message.tokens?.input || 0;
          const output = message.tokens?.output || 0;
          const cost = message.cost || 0;

          if (!dailyData.has(dateKey)) {
            dailyData.set(dateKey, {
              date: dateKey,
              project: options.groupByProject ? projectName : undefined,
              inputTokens: 0,
              outputTokens: 0,
              cacheCreationTokens: 0,
              cacheReadTokens: 0,
              totalCost: 0,
              modelsUsed: [],
              modelBreakdowns: []
            });
          }

          const dayData = dailyData.get(dateKey)!;
          dayData.inputTokens += input;
          dayData.outputTokens += output;
          dayData.cacheCreationTokens += cacheCreate;
          dayData.cacheReadTokens += cacheRead;
          dayData.totalCost += cost;

          if (message.modelID && !dayData.modelsUsed.includes(message.modelID)) {
            dayData.modelsUsed.push(message.modelID);
          }

          if (message.modelID) {
            let breakdown = dayData.modelBreakdowns.find(b => b.modelName === message.modelID);
            if (!breakdown) {
              breakdown = {
                modelName: message.modelID,
                inputTokens: 0,
                outputTokens: 0,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                cost: 0
              };
              dayData.modelBreakdowns.push(breakdown);
            }
            breakdown.inputTokens += input;
            breakdown.outputTokens += output;
            breakdown.cacheCreationTokens += cacheCreate;
            breakdown.cacheReadTokens += cacheRead;
            breakdown.cost += cost;
          }
        }
      } catch (error) {
        continue;
      }
    }
  }

  return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function analyzeMonthlyUsage(options: AnalyzeOptions = {}): Promise<MonthlyData[]> {
  const { days = 30, model, project, projectExact = false, currentOnly = false, currentPath } = options;

  const sessions = [];
  const messageDir = path.join(OPENCODE_STORAGE_PATH, 'message');
  const sessionDir = path.join(OPENCODE_STORAGE_PATH, 'session');

  const sessionDirs = fs.readdirSync(messageDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

  const monthlyData = new Map<string, MonthlyData>();

  for (const sessionId of sessionDirs) {
    const sessionPath = path.join(messageDir, sessionId);
    const messageFiles = fs.readdirSync(sessionPath)
      .filter(f => f.endsWith('.json'));

    if (messageFiles.length === 0) continue;

    const sessionMetadata = findSessionMetadata(sessionDir, sessionId);
    const projectName = sessionMetadata?.directory || 'unknown';

    for (const messageFile of messageFiles) {
      const messagePath = path.join(sessionPath, messageFile);
      try {
        const message = JSON.parse(fs.readFileSync(messagePath, 'utf8'));
        const createdTime = message.time?.created || 0;

        if (createdTime < cutoffTime) continue;

        if (model && message.modelID && !message.modelID.toLowerCase().includes(model.toLowerCase())) {
          continue;
        }

        if (project && message.path?.root && !message.path.root.toLowerCase().includes(project.toLowerCase())) {
          continue;
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
          const date = new Date(createdTime);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          const cacheCreate = message.tokens?.cache?.write || 0;
          const cacheRead = message.tokens?.cache?.read || 0;
          const input = message.tokens?.input || 0;
          const output = message.tokens?.output || 0;
          const cost = message.cost || 0;

          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
              month: monthKey,
              project: options.groupByProject ? projectName : undefined,
              inputTokens: 0,
              outputTokens: 0,
              cacheCreationTokens: 0,
              cacheReadTokens: 0,
              totalCost: 0,
              modelsUsed: [],
              modelBreakdowns: []
            });
          }

          const monthData = monthlyData.get(monthKey)!;
          monthData.inputTokens += input;
          monthData.outputTokens += output;
          monthData.cacheCreationTokens += cacheCreate;
          monthData.cacheReadTokens += cacheRead;
          monthData.totalCost += cost;

          if (message.modelID && !monthData.modelsUsed.includes(message.modelID)) {
            monthData.modelsUsed.push(message.modelID);
          }

          if (message.modelID) {
            let breakdown = monthData.modelBreakdowns.find(b => b.modelName === message.modelID);
            if (!breakdown) {
              breakdown = {
                modelName: message.modelID,
                inputTokens: 0,
                outputTokens: 0,
                cacheCreationTokens: 0,
                cacheReadTokens: 0,
                cost: 0
              };
              monthData.modelBreakdowns.push(breakdown);
            }
            breakdown.inputTokens += input;
            breakdown.outputTokens += output;
            breakdown.cacheCreationTokens += cacheCreate;
            breakdown.cacheReadTokens += cacheRead;
            breakdown.cost += cost;
          }
        }
      } catch (error) {
        continue;
      }
    }
  }

  return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function findSessionMetadata(sessionDir: string, sessionId: string): SessionMetadata | null {
  const projectDirs = fs.readdirSync(sessionDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const projectDir of projectDirs) {
    const sessionFile = path.join(sessionDir, projectDir, `${sessionId}.json`);
    if (fs.existsSync(sessionFile)) {
      try {
        return JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      } catch (error) {
        continue;
      }
    }
  }
  return null;
}

interface SessionMetadata {
  title?: string;
  directory?: string;
}

interface MessageRecord {
  id: string;
  role: string;
  modelID?: string;
  providerID?: string;
  agent?: string;
  tokens?: RawTokenData;
  cost?: number;
  time?: {
    created?: number;
    completed?: number;
  };
  path?: {
    root?: string;
  };
}

function findMessageTokenData(session: InternalSessionData, messageId: string): RawTokenData | undefined {
  return session.rawMessageData[messageId]?.tokens;
}

function getPrimaryModel(session: InternalSessionData): string {
  if (!session.messages || session.messages.length === 0) return 'N/A';

  const modelCounts: Record<string, number> = {};
  session.messages.forEach((msg) => {
    if (msg.model) {
      modelCounts[msg.model] = (modelCounts[msg.model] || 0) + 1;
    }
  });

  const sortedModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]);
  return sortedModels.length > 0 ? sortedModels[0][0] : 'N/A';
}

function formatTimestamp(timestamp: number): string {
  if (timestamp === Infinity || timestamp === 0) return 'N/A';
  return new Date(timestamp).toISOString().split('T')[0];
}
