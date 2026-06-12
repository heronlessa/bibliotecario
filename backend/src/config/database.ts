import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './init-db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const driver = process.env.DB_DRIVER ?? 'mysql';

function createSqlitePool() {
  const dbPath = path.resolve(__dirname, '../../data/biblioteca.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initDatabase(db);

  return {
    execute<T>(sql: string, params: unknown[] = []): Promise<[T, unknown[]]> {
      return new Promise((resolve, reject) => {
        try {
          const comando = sql.trim().split(/\s+/)[0].toUpperCase();
          if (comando === 'SELECT') {
            resolve([db.prepare(sql).all(...params) as T, []]);
            return;
          }
          const info = db.prepare(sql).run(...params);
          resolve([{ affectedRows: info.changes, insertId: Number(info.lastInsertRowid) } as T, []]);
        } catch (e) {
          reject(e);
        }
      });
    },
    query<T>(sql: string, params: unknown[] = []): Promise<[T, unknown[]]> {
      return this.execute<T>(sql, params);
    },
  };
}

const pool = driver === 'sqlite'
  ? createSqlitePool()
  : mysql.createPool({
      host:               process.env.DB_HOST     ?? 'localhost',
      port:               Number(process.env.DB_PORT ?? 3306),
      database:           process.env.DB_NAME     ?? 'biblioteca',
      user:               process.env.DB_USER     ?? 'root',
      password:           process.env.DB_PASS     ?? '',
      charset:            'utf8mb4',
      waitForConnections: true,
      connectionLimit:    10,
    });

export default pool;
