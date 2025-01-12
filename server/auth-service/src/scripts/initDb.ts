// src/scripts/initDb.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

async function initializeDatabase() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  try {
    console.log('Starting database initialization...');

    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Read migrations
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).sort();

    for (const migrationFile of migrationFiles) {
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        // Check if migration was already executed
        const { rows } = await client.query(
          'SELECT name FROM migrations WHERE name = $1',
          [migrationFile]
        );

        if (rows.length === 0) {
          console.log(`Executing migration: ${migrationFile}`);
          const migrationPath = path.join(migrationsDir, migrationFile);
          const migrationSql = fs.readFileSync(migrationPath, 'utf8');

          await client.query(migrationSql);
          
          // Record migration
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migrationFile]
          );

          await client.query('COMMIT');
          console.log(`Successfully executed migration: ${migrationFile}`);
        } else {
          console.log(`Skipping already executed migration: ${migrationFile}`);
          await client.query('COMMIT');
        }
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error executing migration ${migrationFile}:`, error);
        throw error;
      } finally {
        client.release();
      }
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };