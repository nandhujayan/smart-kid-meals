import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@localhost:5432/postgres"; // Fallback URL was in their screenshot: postgresql://postgres.ahrvcatkqijysujobzlo:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

async function createTable() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log("🚀 Connecting to database...");
    await client.connect();
    
    const query = `
      CREATE TABLE IF NOT EXISTS public.meal_library (
        id BIGSERIAL PRIMARY KEY,
        age_group TEXT NOT NULL,
        diet_type TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        goal TEXT NOT NULL,
        meal_name TEXT NOT NULL,
        meal_data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_meal_library_category ON public.meal_library (age_group, diet_type, meal_type, goal);
    `;

    console.log("🔨 Creating table 'meal_library'...");
    await client.query(query);
    console.log("✅ Table 'meal_library' is ready.");

  } catch (err) {
    console.error("❌ Error creating table:", err.message);
    if (err.message.includes("password")) {
      console.log("💡 TIP: You might need to add the database password to your SUPABASE_DB_URL in .env");
    }
  } finally {
    await client.end();
  }
}

createTable();
