import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB
});

async function runMigrations(force = false) {
  console.log('Starting database migrations...');
  const client = await pool.connect();
  
  try {
    console.log('Creating migrations table if it does not exist...');
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    console.log(`Reading migration files from ${migrationsDir}...`);
    
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration files: ${files.join(', ')}`);

    // Get executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations'
    );
    const executedMigrationNames = executedMigrations.map(row => row.name);
    console.log(`Already executed migrations: ${executedMigrationNames.join(', ') || 'none'}`);

    // Run pending migrations
    for (const file of files) {
      if (force || !executedMigrationNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(
          path.join(migrationsDir, file),
          'utf8'
        );
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          
          // Only insert into migrations table if not already there
          if (!executedMigrationNames.includes(file)) {
            await client.query(
              'INSERT INTO migrations (name) VALUES ($1)',
              [file]
            );
          }
          
          await client.query('COMMIT');
          console.log(`Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error in migration ${file}:`, error);
          throw error;
        }
      } else {
        console.log(`Skipping already executed migration: ${file}`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const force = process.argv.includes('--force');
  console.log(`Running migrations with force=${force}`);
  
  runMigrations(force)
    .then(() => {
      console.log('Migration process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runMigrations; 