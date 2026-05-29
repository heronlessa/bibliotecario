import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path   from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
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
