#!/bin/bash

# Create directories if they don't exist
mkdir -p server/analytics-service
mkdir -p server/auth-service
mkdir -p server/ml-service

# Copy Dockerfiles
echo "# Analytics Service Dockerfile.dev
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Start development server
CMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"4003\", \"--reload\"]" > server/analytics-service/Dockerfile.dev

echo "# Auth Service Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Start development server
CMD [\"npm\", \"run\", \"dev\"]" > server/auth-service/Dockerfile.dev

echo "# ML Service Dockerfile.dev
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Start development server
CMD [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"4002\", \"--reload\"]" > server/ml-service/Dockerfile.dev

# Create requirements.txt for Python services
echo "fastapi==0.105.0
uvicorn==0.24.0
pandas==2.1.3
numpy==1.26.2
scikit-learn==1.3.2
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pydantic==2.5.2
httpx==0.25.2
pytest==7.4.3
pytest-asyncio==0.21.1" > server/analytics-service/requirements.txt

cp server/analytics-service/requirements.txt server/ml-service/requirements.txt

# Create package.json for auth service
echo '{
  "name": "auth-service",
  "version": "1.0.0",
  "description": "Authentication service for healthcare analytics platform",
  "main": "src/index.ts",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "pg": "^8.11.3",
    "redis": "^4.6.11"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.4",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/pg": "^8.10.9",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.10",
    "ts-jest": "^29.1.1"
  }
}' > server/auth-service/package.json

# Make the files executable
chmod +x server/analytics-service/Dockerfile.dev
chmod +x server/auth-service/Dockerfile.dev
chmod +x server/ml-service/Dockerfile.dev

echo "Service setup complete!"