import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const OPENCODE_DATA_PATH = path.join(process.env.HOME || '', '.local', 'share', 'opencode');
const OPENCODE_DB_PATH = path.join(OPENCODE_DATA_PATH, 'opencode.db');
const OPENCODE_STORAGE_PATH = path.join(OPENCODE_DATA_PATH, 'storage');

export interface SessionRow {
  id: string;
  project_id: string;
  parent_id: string | null;
  slug: string;
  directory: string;
  title: string;
  version: string;
  share_url: string | null;
  time_created: number;
  time_updated: number;
}

export interface MessageRow {
  id: string;
  session_id: string;
  time_created: number;
  time_updated: number;
  data: string;
}

export interface MessageData {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  modelID?: string;
  providerID?: string;
  agent?: string;
  tokens?: {
    total?: number;
    input?: number;
    output?: number;
    reasoning?: number;
    cache?: {
      read?: number;
      write?: number;
    };
  };
  cost?: number;
  time?: {
    created?: number;
    completed?: number;
  };
  path?: {
    cwd?: string;
    root?: string;
  };
}

let db: Database.Database | null = null;

export function hasNewDbFormat(): boolean {
  return fs.existsSync(OPENCODE_DB_PATH);
}

export function hasOldJsonFormat(): boolean {
  return fs.existsSync(OPENCODE_STORAGE_PATH);
}

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(OPENCODE_DB_PATH)) {
      throw new Error(`OpenCode database not found at ${OPENCODE_DB_PATH}`);
    }
    db = new Database(OPENCODE_DB_PATH, { readonly: true, fileMustExist: true });
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function getAllSessions(): SessionRow[] {
  const database = getDb();
  const stmt = database.prepare<[], SessionRow>('SELECT * FROM session');
  return stmt.all();
}

export function getSessionsByTimeRange(startTime: number, endTime: number): SessionRow[] {
  const database = getDb();
  const stmt = database.prepare<[number, number], SessionRow>(
    'SELECT * FROM session WHERE time_created >= ? AND time_created <= ?'
  );
  return stmt.all(startTime, endTime);
}

export function getMessagesBySessionIds(sessionIds: string[]): MessageRow[] {
  if (sessionIds.length === 0) return [];
  
  const database = getDb();
  const placeholders = sessionIds.map(() => '?').join(',');
  const stmt = database.prepare<typeof sessionIds, MessageRow>(
    `SELECT * FROM message WHERE session_id IN (${placeholders})`
  );
  return stmt.all(...sessionIds);
}

export function getMessagesByTimeRange(startTime: number, endTime: number): MessageRow[] {
  const database = getDb();
  const stmt = database.prepare<[number, number], MessageRow>(
    'SELECT * FROM message WHERE time_created >= ? AND time_created <= ?'
  );
  return stmt.all(startTime, endTime);
}

export function parseMessageData(row: MessageRow): MessageData {
  const data = JSON.parse(row.data) as MessageData;
  return {
    ...data,
    id: row.id,
    sessionID: row.session_id,
  };
}

export function getSessionMap(): Map<string, SessionRow> {
  const sessions = getAllSessions();
  const map = new Map<string, SessionRow>();
  for (const session of sessions) {
    map.set(session.id, session);
  }
  return map;
}

export { OPENCODE_DATA_PATH, OPENCODE_DB_PATH, OPENCODE_STORAGE_PATH };
