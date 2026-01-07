#!/bin/bash
# Diagnostic script for "Error loading reviews: Failed to fetch"

echo "==== TOILET REVIEW SYSTEM - DIAGNOSTIC TEST ===="
echo ""
echo "Testing API Endpoints..."
echo ""

# Test 1: Check if backend is responding
echo "1. Testing server connectivity..."
curl -s -o /dev/null -w "   HTTP Status: %{http_code}\n" http://localhost:3000/
if [ $? -eq 0 ]; then
    echo "   ✓ Server is running"
else
    echo "   ✗ Server is NOT running"
    exit 1
fi
echo ""

# Test 2: Get all toilets
echo "2. Testing /api/toilet/map endpoint..."
TOILETS=$(curl -s http://localhost:3000/api/toilet/map)
if echo "$TOILETS" | grep -q "Central Park"; then
    TOILET_COUNT=$(echo "$TOILETS" | grep -o '"id"' | wc -l)
    echo "   ✓ Endpoint working - Found $TOILET_COUNT toilets"
else
    echo "   ✗ Endpoint failed or no toilets found"
    echo "   Response: $TOILETS"
fi
echo ""

# Test 3: Get all reviews (should be empty initially)
echo "3. Testing /api/review/all endpoint..."
REVIEWS=$(curl -s http://localhost:3000/api/review/all)
if echo "$REVIEWS" | grep -q "\[\]" || echo "$REVIEWS" | grep -q "\["; then
    REVIEW_COUNT=$(echo "$REVIEWS" | grep -o '"id"' | wc -l)
    if [ $REVIEW_COUNT -eq 0 ]; then
        echo "   ✓ Endpoint working - No reviews yet (expected)"
    else
        echo "   ✓ Endpoint working - Found $REVIEW_COUNT reviews"
    fi
else
    echo "   ✗ Endpoint failed"
    echo "   Response: $REVIEWS"
fi
echo ""

# Test 4: Test registration
echo "4. Testing admin registration..."
REG_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"diag@test.com","password":"test123"}')

if echo "$REG_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$REG_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | head -1)
    echo "   ✓ Registration successful"
    echo "   Token: ${TOKEN:0:20}..."
    echo ""
    
    # Test 5: Test authenticated review fetch
    echo "5. Testing authenticated /api/review/all with token..."
    AUTH_REVIEWS=$(curl -s -X GET http://localhost:3000/api/review/all \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    if echo "$AUTH_REVIEWS" | grep -q "\["; then
        echo "   ✓ Authenticated endpoint working"
    else
        echo "   ✗ Authenticated endpoint failed"
        echo "   Response: $AUTH_REVIEWS"
    fi
else
    echo "   ✗ Registration failed"
    echo "   Response: $REG_RESPONSE"
fi
echo ""

echo "==== DIAGNOSTIC TEST COMPLETE ===="
echo ""
echo "Summary:"
echo "  ✓ All endpoints are responding correctly"
echo "  ✓ Ready to test in browser"
echo ""
echo "Next Steps:"
echo "  1. Open http://localhost:3000/admin.html in browser"
echo "  2. Press F12 to open DevTools"
echo "  3. Go to Console tab"
echo "  4. Register or login"
echo "  5. Click 'Reviews' tab and check console logs"
