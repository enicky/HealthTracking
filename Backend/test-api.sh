#!/bin/bash

# test-api.sh - Simple script to test the health tracking API

BASE_URL="http://localhost:5000/api"
TENANT_ID="550e8400-e29b-41d4-a716-446655440000"
USER_ID="550e8400-e29b-41d4-a716-446655440001"

echo "=== Health Tracking API Test Script ==="
echo ""

# Test health check
echo "1. Testing Health Check Endpoint..."
curl -s -X GET "$BASE_URL/healthcheck" | jq .
echo ""

# Get ECG sessions
echo "2. Getting ECG Sessions..."
curl -s -X GET "$BASE_URL/ecg" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-User-Id: $USER_ID" | jq .
echo ""

# Create ECG session
echo "3. Creating ECG Session..."
ECG_RESPONSE=$(curl -s -X POST "$BASE_URL/ecg" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "recordedAt": "2024-03-04T10:30:00Z",
    "classification": "Normal",
    "averageHeartRate": 72,
    "samples": [
      {"time": 0, "value": 0.5},
      {"time": 1, "value": 0.6},
      {"time": 2, "value": 0.55}
    ]
  }')
echo "$ECG_RESPONSE" | jq .
ECG_ID=$(echo "$ECG_RESPONSE" | jq -r '.id // empty')
echo ""

# Get blood pressure readings
echo "4. Getting Blood Pressure Readings..."
curl -s -X GET "$BASE_URL/bloodpressure" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-User-Id: $USER_ID" | jq .
echo ""

# Create blood pressure reading
echo "5. Creating Blood Pressure Reading..."
BP_RESPONSE=$(curl -s -X POST "$BASE_URL/bloodpressure" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "recordedAt": "2024-03-04T14:20:00Z",
    "systolic": 120,
    "diastolic": 80,
    "pulse": 72
  }')
echo "$BP_RESPONSE" | jq .
BP_ID=$(echo "$BP_RESPONSE" | jq -r '.id // empty')
echo ""

# Get specific ECG session
if [ ! -z "$ECG_ID" ]; then
  echo "6. Getting specific ECG session ($ECG_ID)..."
  curl -s -X GET "$BASE_URL/ecg/$ECG_ID" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "X-User-Id: $USER_ID" | jq .
  echo ""
fi

# Get specific blood pressure reading
if [ ! -z "$BP_ID" ]; then
  echo "7. Getting specific blood pressure reading ($BP_ID)..."
  curl -s -X GET "$BASE_URL/bloodpressure/$BP_ID" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "X-User-Id: $USER_ID" | jq .
  echo ""
fi

echo "=== Test Complete ==="
