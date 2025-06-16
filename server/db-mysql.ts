import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'newsflow',
  multipleStatements: true,
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create MySQL connection pool
export const connection = mysql.createPool(mysqlConfig);

export const db = drizzle(connection, { schema, mode: "default" });