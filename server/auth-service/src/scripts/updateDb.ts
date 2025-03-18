// src/scripts/updateDb.ts
import { Pool } from 'pg';
import { config } from '../config';

async function updateDatabase() {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  });

  try {
    console.log('Starting database updates...');
    
    // Add profile fields to users table
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS specialization VARCHAR(255),
      ADD COLUMN IF NOT EXISTS department VARCHAR(255),
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
    `);
    
    // Create medical_staff table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_staff (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        license_number VARCHAR(255),
        years_of_experience INTEGER,
        certifications TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_id UNIQUE (user_id)
      );
    `);

    // Create update trigger for medical_staff if it doesn't exist
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add trigger if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM pg_trigger 
          WHERE tgname = 'update_medical_staff_updated_at'
        ) THEN
          CREATE TRIGGER update_medical_staff_updated_at
            BEFORE UPDATE ON medical_staff
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END$$;
    `);

    console.log('Successfully updated database schema');
  } catch (error) {
    console.error('Error updating database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  updateDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to update database:', error);
      process.exit(1);
    });
}

export { updateDatabase };