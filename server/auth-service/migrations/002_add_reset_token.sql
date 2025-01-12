-- migrations/002_add_reset_token.sql
ALTER TABLE users
ADD COLUMN reset_token VARCHAR(255),
ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;