import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';
import * as schema from "@shared/schema";

// Use existing PostgreSQL connection for now (we'll adapt the queries)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set");
}

// Create MySQL connection using the existing database URL
export const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '',
  database: 'newsflow',
  multipleStatements: true
});

export const db = drizzle(connection, { schema });