#!/bin/bash
set -e

echo "Setting up DeepTrack AI..."

# Copy env examples
cp ../configs/.env.example ../configs/.env
cp ../backend/audio_processing_service/.env.example ../backend/audio_processing_service/.env
cp ../backend/ml_inference_service/.env.example ../backend/ml_inference_service/.env
cp ../backend/nlp_analysis_service/.env.example ../backend/nlp_analysis_service/.env
cp ../backend/metadata_storage_service/.env.example ../backend/metadata_storage_service/.env
cp ../backend/api_gateway/.env.example ../backend/api_gateway/.env
cp ../frontend/.env.example ../frontend/.env

echo "Installing frontend dependencies..."
cd ../frontend && npm install

echo "Setup complete. Use 'docker-compose -f deployment/docker-compose.dev.yml up --build' to start."
