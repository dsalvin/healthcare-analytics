// src/scripts/addResetColumns.ts
import { Pool } from 'pg';
import { config } from '../config';

async function addResetColumns() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  try {
    console.log('Adding reset token columns...');
    
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
    `);

    console.log('Successfully added reset token columns');
  } catch (error) {
    console.error('Error adding columns:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  addResetColumns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to add columns:', error);
      process.exit(1);
    });
}

export { addResetColumns };