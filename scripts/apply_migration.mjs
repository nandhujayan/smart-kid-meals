import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Client } = pg;
const connectionString = process.env.SUPABASE_DB_URL;

async function applyMigration() {
  if (!connectionString) {
    console.error("❌ SUPABASE_DB_URL is not set in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    console.log("🚀 Connecting to database...");
    await client.connect();

    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20240415_update_meal_library.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      return;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log("🔨 Applying migration...");
    await client.query(sql);
    console.log("✅ Migration applied successfully.");

  } catch (err) {
    console.error("❌ Error applying migration:", err.message);
  } finally {
    await client.end();
  }
}

applyMigration();
