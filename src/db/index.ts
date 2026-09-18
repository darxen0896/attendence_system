import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export function getDbConfig(): DbConfig {
  let host = process.env.DB_HOST || "127.0.0.1";
  let port = parseInt(process.env.DB_PORT || "3306", 10);
  let user = process.env.DB_USER || "root";
  let password = process.env.DB_PASSWORD || "";
  let database = process.env.DB_NAME || "attendance_db";

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      if (parsed.hostname) host = parsed.hostname;
      if (parsed.port) port = parseInt(parsed.port, 10);
      if (parsed.username) user = decodeURIComponent(parsed.username);
      if (parsed.password) password = decodeURIComponent(parsed.password);
      if (parsed.pathname && parsed.pathname.length > 1) {
        database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
      }
    } catch {
      console.warn("[Database] Failed to parse DATABASE_URL as URL, using individual env configs");
    }
  }

  // Individual env variables take precedence if explicitly set
  if (process.env.DB_USER) user = process.env.DB_USER;
  if (process.env.DB_PASSWORD !== undefined) password = process.env.DB_PASSWORD;
  if (process.env.DB_HOST) host = process.env.DB_HOST;
  if (process.env.DB_PORT) port = parseInt(process.env.DB_PORT, 10);
  if (process.env.DB_NAME) database = process.env.DB_NAME;

  return { host, port, user, password, database };
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Automatically creates the database and required tables if they don't exist yet.
 * If they already exist, this does nothing.
 */
export async function ensureDatabaseAndTables(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const config = getDbConfig();
    let rootConn: mysql.Connection | null = null;
    try {
      const isRemote = config.host !== "127.0.0.1" && config.host !== "localhost";
      const sslConfig = isRemote ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined;

      // 1. Connect without selecting a database first
      rootConn = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        ssl: sslConfig,
      });

      // 2. Create the database if it doesn't already exist
      await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
      await rootConn.query(`USE \`${config.database}\`;`);

      // 3. Create members table if not exists
      await rootConn.query(`
        CREATE TABLE IF NOT EXISTS members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(20),
          age INT,
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      // 4. Create attendance table if not exists
      await rootConn.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          member_id INT NOT NULL,
          date DATE NOT NULL,
          status VARCHAR(20) NOT NULL,
          marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
        );
      `);

      // 5. Create users table if not exists
      await rootConn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'admin',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      // 6. Seed default admin if users table is empty
      const [existingUsers]: any = await rootConn.query("SELECT id FROM users LIMIT 1;");
      if (!existingUsers || existingUsers.length === 0) {
        await rootConn.query(
          "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?);",
          [
            "Mandal Admin",
            "admin@myyuvakmandal.org",
            "$2b$10$VY3ebtQZlTCrf3dRkqsnN.R.LRs2LUDnD3b2u1yxUpz0Qj1O0Z042",
            "admin",
          ]
        );
        console.log("[Database] Seeded initial admin account: admin@myyuvakmandal.org");
      }

      isInitialized = true;
      console.log(`[Database] Database '${config.database}' and tables verified successfully.`);
    } catch (err: any) {
      console.error(`[Database] Error ensuring database/tables: ${err?.message || err}`);
      initPromise = null; // allow retry on next attempt
      throw err;
    } finally {
      if (rootConn) {
        try {
          await rootConn.end();
        } catch {
          // ignore cleanup error
        }
      }
    }
  })();

  return initPromise;
}

const globalForDb = globalThis as typeof globalThis & {
  __mysqlPool?: ReturnType<typeof mysql.createPool>;
};

const config = getDbConfig();
const isRemote = config.host !== "127.0.0.1" && config.host !== "localhost";

export const pool =
  globalForDb.__mysqlPool ??
  mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: isRemote ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__mysqlPool = pool;
}

// Hook query and getConnection to automatically ensure database and tables exist on first use
const originalQuery = pool.query.bind(pool);
pool.query = (async (...args: any[]) => {
  await ensureDatabaseAndTables();
  return (originalQuery as any)(...args);
}) as any;

const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = (async (...args: any[]) => {
  await ensureDatabaseAndTables();
  return (originalGetConnection as any)(...args);
}) as any;

export const db = drizzle(pool);

// Attempt initialization immediately on module load
ensureDatabaseAndTables().catch((err) => {
  console.warn(`[Database] Background auto-initialization pending connection: ${err.message}`);
});
