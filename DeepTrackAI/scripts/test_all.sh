#!/bin/bash
set -e

echo "Running backend tests..."
for svc in audio_processing_service ml_inference_service nlp_analysis_service metadata_storage_service; do
  cd ../backend/$svc && pytest || exit 1
  cd -
done

echo "Running frontend tests..."
cd ../frontend && npm run test

echo "All tests passed."
