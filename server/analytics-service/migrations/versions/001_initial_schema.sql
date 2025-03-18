-- migrations/versions/001_initial_schema.sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Health Metrics Table (Time-series data)
CREATE TABLE health_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    heart_rate FLOAT,
    blood_pressure_systolic FLOAT,
    blood_pressure_diastolic FLOAT,
    temperature FLOAT,
    oxygen_saturation FLOAT,
    respiratory_rate FLOAT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to hypertable
SELECT create_hypertable('health_metrics', 'timestamp');

-- Patient Analytics Table
CREATE TABLE patient_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    risk_score FLOAT,
    condition_count INTEGER,
    last_visit TIMESTAMPTZ,
    readmission_risk FLOAT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Department Performance Metrics
CREATE TABLE department_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    patient_count INTEGER,
    avg_wait_time INTERVAL,
    utilization_rate FLOAT,
    staff_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to hypertable
SELECT create_hypertable('department_metrics', 'timestamp');

-- Treatment Outcomes
CREATE TABLE treatment_outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    diagnosis_code VARCHAR(50),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    success_rating INTEGER,
    complications TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_health_metrics_patient ON health_metrics(patient_id, timestamp DESC);
CREATE INDEX idx_patient_analytics_score ON patient_analytics(risk_score);
CREATE INDEX idx_department_metrics_time ON department_metrics(timestamp DESC, department_id);
CREATE INDEX idx_treatment_diagnosis ON treatment_outcomes(diagnosis_code);

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW daily_department_stats AS
SELECT 
    department_id,
    date_trunc('day', timestamp) as day,
    avg(patient_count) as avg_daily_patients,
    avg(utilization_rate) as avg_utilization,
    max(patient_count) as peak_patients
FROM department_metrics
GROUP BY department_id, date_trunc('day', timestamp)
WITH DATA;

CREATE MATERIALIZED VIEW patient_risk_trends AS
SELECT 
    patient_id,
    date_trunc('week', updated_at) as week,
    avg(risk_score) as avg_risk_score,
    max(risk_score) as max_risk_score,
    min(risk_score) as min_risk_score
FROM patient_analytics
GROUP BY patient_id, date_trunc('week', updated_at)
WITH DATA;