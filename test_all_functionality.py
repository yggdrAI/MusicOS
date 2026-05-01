#!/usr/bin/env python3
"""
Comprehensive test suite for DeepTrack AI (MusicOS)
Tests all functionality of the microservices architecture
"""
import requests
import json
import time
import sys
from typing import Dict, Any
import base64

# Configuration
API_BASE_URL = "http://localhost:8000"
JWT_SECRET = "supersecret"
TEST_AUDIO_FILE = "test_audio.wav"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_section(title: str):
    """Print a section header"""
    print(f"\n{BLUE}{'='*60}")
    print(f"{title}")
    print(f"{'='*60}{RESET}")

def print_success(msg: str):
    """Print success message"""
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg: str):
    """Print error message"""
    print(f"{RED}✗ {msg}{RESET}")

def print_warning(msg: str):
    """Print warning message"""
    print(f"{YELLOW}⚠ {msg}{RESET}")

def print_info(msg: str):
    """Print info message"""
    print(f"{BLUE}ℹ {msg}{RESET}")

def create_jwt_token() -> str:
    """Create a test JWT token"""
    import jwt
    payload = {"sub": "test_user", "iat": int(time.time())}
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def test_api_connectivity() -> bool:
    """Test if API Gateway is accessible"""
    print_section("Testing API Connectivity")
    
    try:
        response = requests.get(f"{API_BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print_success("API Gateway is accessible")
            return True
        else:
            print_error(f"API returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to API Gateway at localhost:8000")
        print_info("Make sure Docker Compose services are running")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_database_connectivity() -> bool:
    """Test if database is accessible"""
    print_section("Testing Database Connectivity")
    
    try:
        import psycopg2
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            user="user",
            password="password",
            database="deeptrack"
        )
        conn.close()
        print_success("PostgreSQL database is accessible")
        return True
    except Exception as e:
        print_error(f"Cannot connect to PostgreSQL: {str(e)}")
        return False

def test_redis_connectivity() -> bool:
    """Test if Redis is accessible"""
    print_section("Testing Redis Connectivity")
    
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print_success("Redis is accessible")
        return True
    except Exception as e:
        print_error(f"Cannot connect to Redis: {str(e)}")
        return False

def test_minio_connectivity() -> bool:
    """Test if MinIO is accessible"""
    print_section("Testing MinIO Connectivity")
    
    try:
        response = requests.get("http://localhost:9000/minio/health/live", timeout=5)
        if response.status_code == 200:
            print_success("MinIO S3 storage is accessible")
            return True
        else:
            print_warning(f"MinIO returned status code {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to MinIO: {str(e)}")
        return False

def test_file_upload() -> bool:
    """Test file upload functionality"""
    print_section("Testing File Upload")
    
    # Create a simple test audio file
    try:
        # Create a minimal WAV file
        import wave
        import os
        
        # Check if test file exists
        if os.path.exists(TEST_AUDIO_FILE):
            print_info(f"Using existing test file: {TEST_AUDIO_FILE}")
        else:
            print_info("Creating test audio file...")
            # Create a minimal valid WAV file
            with wave.open(TEST_AUDIO_FILE, 'wb') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 2 bytes per sample
                wav_file.setframerate(44100)  # 44.1 kHz
                wav_file.writeframes(b'\x00\x00' * 44100)  # 1 second of silence
        
        # Test upload endpoint
        token = create_jwt_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(TEST_AUDIO_FILE, 'rb') as f:
            files = {'file': (TEST_AUDIO_FILE, f, 'audio/wav')}
            response = requests.post(
                f"{API_BASE_URL}/upload",
                files=files,
                headers=headers,
                timeout=30
            )
        
        if response.status_code == 200:
            print_success("File upload successful")
            return True
        else:
            print_error(f"Upload failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"File upload test failed: {str(e)}")
        return False

def test_audio_analysis() -> bool:
    """Test audio analysis functionality"""
    print_section("Testing Audio Analysis")
    
    try:
        import os
        
        # Create test audio if needed
        if not os.path.exists(TEST_AUDIO_FILE):
            import wave
            with wave.open(TEST_AUDIO_FILE, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(44100)
                wav_file.writeframes(b'\x00\x00' * 44100)
        
        token = create_jwt_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(TEST_AUDIO_FILE, 'rb') as f:
            files = {'file': (TEST_AUDIO_FILE, f, 'audio/wav')}
            response = requests.post(
                f"{API_BASE_URL}/analyze",
                files=files,
                headers=headers,
                timeout=60
            )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Audio analysis completed")
            print_info(f"Analysis results: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Analysis failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Audio analysis test failed: {str(e)}")
        return False

def test_lyrics_extraction() -> bool:
    """Test lyrics extraction functionality"""
    print_section("Testing Lyrics Extraction")
    
    try:
        import os
        
        # Create test audio if needed
        if not os.path.exists(TEST_AUDIO_FILE):
            import wave
            with wave.open(TEST_AUDIO_FILE, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(44100)
                wav_file.writeframes(b'\x00\x00' * 44100)
        
        token = create_jwt_token()
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(TEST_AUDIO_FILE, 'rb') as f:
            files = {'file': (TEST_AUDIO_FILE, f, 'audio/wav')}
            response = requests.post(
                f"{API_BASE_URL}/lyrics",
                files=files,
                headers=headers,
                timeout=60
            )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Lyrics extraction completed")
            print_info(f"Extraction results: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Extraction failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Lyrics extraction test failed: {str(e)}")
        return False

def test_metadata_operations() -> bool:
    """Test metadata save and retrieve operations"""
    print_section("Testing Metadata Operations")
    
    try:
        token = create_jwt_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Test save metadata
        metadata = {
            "song_id": "test_song_001",
            "title": "Test Song",
            "artist": "Test Artist",
            "album": "Test Album",
            "duration": 180,
            "analysis": {
                "bpm": 120,
                "key": "C",
                "energy": 0.8
            }
        }
        
        response = requests.post(
            f"{API_BASE_URL}/metadata",
            json=metadata,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Metadata saved successfully")
        else:
            print_error(f"Metadata save failed with status {response.status_code}")
            return False
        
        # Test retrieve metadata
        response = requests.get(
            f"{API_BASE_URL}/metadata/test_song_001",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Metadata retrieved successfully")
            print_info(f"Retrieved: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"Metadata retrieval failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Metadata operations test failed: {str(e)}")
        return False

def test_frontend_accessibility() -> bool:
    """Test if frontend is accessible"""
    print_section("Testing Frontend Accessibility")
    
    try:
        response = requests.get("http://localhost:3000", timeout=10)
        if response.status_code == 200:
            print_success("Frontend is accessible at http://localhost:3000")
            return True
        else:
            print_warning(f"Frontend returned status code {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot access frontend: {str(e)}")
        return False

def run_all_tests() -> Dict[str, bool]:
    """Run all tests and return results"""
    print(f"\n{BLUE}{'='*60}")
    print("DeepTrack AI - Comprehensive Functionality Test")
    print(f"{'='*60}{RESET}")
    
    results = {}
    
    # Basic connectivity tests
    results['api_connectivity'] = test_api_connectivity()
    
    if not results['api_connectivity']:
        print_warning("Skipping remaining tests - API is not accessible")
        return results
    
    results['database'] = test_database_connectivity()
    results['redis'] = test_redis_connectivity()
    results['minio'] = test_minio_connectivity()
    results['frontend'] = test_frontend_accessibility()
    
    # Functional tests (only if API is accessible)
    results['upload'] = test_file_upload()
    results['analysis'] = test_audio_analysis()
    results['lyrics'] = test_lyrics_extraction()
    results['metadata'] = test_metadata_operations()
    
    return results

def print_summary(results: Dict[str, bool]):
    """Print test summary"""
    print_section("Test Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "PASSED" if result else "FAILED"
        color = GREEN if result else RED
        print(f"{color}{status}{RESET}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("All tests passed! ✓")
        return True
    else:
        print_error(f"{total - passed} test(s) failed")
        return False

if __name__ == "__main__":
    results = run_all_tests()
    success = print_summary(results)
    sys.exit(0 if success else 1)
