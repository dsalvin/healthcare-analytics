#!/bin/bash

# Create necessary directories
mkdir -p monitoring/prometheus
mkdir -p server/ml-service/models

# Generate environment files
echo "Creating .env files..."

# Client .env
cat > client/.env.local << EOL
VITE_API_URL=http://localhost:4000
EOL

# API Gateway .env
cat > server/api-gateway/.env << EOL
NODE_ENV=development
PORT=4000
AUTH_SERVICE_URL=http://auth-service:4001
ML_SERVICE_URL=http://ml-service:4002
ANALYTICS_SERVICE_URL=http://analytics-service:4003
EOL

# Auth Service .env
cat > server/auth-service/.env << EOL
NODE_ENV=development
PORT=4001
POSTGRES_URL=postgres://user:password@postgres:5432/healthcare
REDIS_URL=redis://redis:6379
EOL

# Generate Prometheus config
cat > monitoring/prometheus/prometheus.yml << EOL
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:4000']
  
  - job_name: 'ml-service'
    static_configs:
      - targets: ['ml-service:4002']
EOL

# Make all scripts executable
chmod +x scripts/*

echo "Setup complete! You can now run: docker-compose up"