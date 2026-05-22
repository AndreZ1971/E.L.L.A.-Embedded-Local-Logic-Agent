import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host:             env.db.host,
  port:             env.db.port,
  database:         env.db.name,
  user:             env.db.user,
  password:         env.db.password,
  waitForConnections: true,
  connectionLimit:  10,
});
