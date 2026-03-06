#!/bin/bash

# Login and get token
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Login failed:"
  echo $LOGIN_RES
  exit 1
fi

echo "Got Token: ${TOKEN:0:10}..."

# Test PUT Profile
echo "Testing PUT /api/users/profile..."
curl -v -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"privacy_settings": {"share_library": true, "library_name": "Updated Lib Name"}}'

echo ""
echo "Testing GET /api/admin/libraries (Crash Check)..."
curl -v http://localhost:3000/api/admin/libraries \
  -H "Authorization: Bearer $TOKEN"

