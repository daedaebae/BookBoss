#!/bin/bash
# Smoke Test Script for BookBoss Config
# Usage: ./smoke_test.sh

BASE_URL="http://localhost:3000"

echo "Running Smoke Tests on $BASE_URL..."

# 1. Health Check (Root) - Expect 404 but responsive
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
echo "Root Endpoint: $HTTP_CODE (Expected 404)"

# 2. Public API (expect 401 without token)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/users/public)
echo "Protected Endpoint (No Token): $HTTP_CODE (Expected 401)"

# 3. Login Flow (Expect 200 and Token)
# Note: Password hash in schema.sql corresponds to 'admin'
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' $BASE_URL/api/login)

# Check if we got a token (this assumes /api/login endpoint exists and returns token, checking server.js next to verify)
# Wait, I didn't verify if /api/login exists in server.js! Let me check server.js again.
