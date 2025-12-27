# Quick Testing & Debugging Guide

## Quick Start - See Everything Working

### Step 1: Start the Backend (in Terminal 1)
```bash
cd /home/sanket/Abrick/backend
npm start
```

**Expected Output:**
```
[CONFIG] PORT: 3000
[CONFIG] JWT_SECRET: ***configured***
[INIT] No toilets found, adding sample data...
[INIT] Added sample toilet: Central Park Restroom
[INIT] Added sample toilet: Times Square Public Toilet
...
[SERVER] ✓ Toilet Review System server is running on port 3000
```

### Step 2: Open Application (in Browser)
```
http://localhost:3000/admin.html
```

### Step 3: Monitor Logs (Both Terminal & Browser Console)

#### In Terminal - Watch for:
- `[REQUEST]` - incoming requests
- `[AUTH]` - login/registration
- `[TOILET]` - add/delete/fetch toilets
- `[REVIEW]` - review submissions
- `[RESPONSE]` - outgoing responses with duration

#### In Browser (F12 → Console) - Watch for:
- `[ADMIN]` - admin panel initialization
- `[API]` - API requests and responses
- `[AUTH]` - authentication flows
- Errors in red

## Test Scenarios

### Test 1: Admin Registration & Login

**In Browser Console:**
1. Open http://localhost:3000/admin.html
2. Open DevTools (F12)
3. Fill in registration form:
   - Email: `admin@test.com`
   - Password: `password123`
4. Click Register

**Backend Terminal Should Show:**
```
[REQUEST] POST /api/auth/register - IP: ::1
[REQUEST] Body: { "email": "admin@test.com", "password": "password123" }
[AUTH] Register attempt with email: admin@test.com
[AUTH] Register successful: New user created: admin@test.com
[RESPONSE] POST /api/auth/register - Status: 201 - Duration: XXms
```

**Browser Console Should Show:**
```
[ADMIN] Admin panel JavaScript starting...
[AUTH] Admin panel initializing, token exists: true
[SUCCESS] [AUTH] Registration successful
```

### Test 2: Add a Toilet

**In Browser:**
1. After logging in, fill in toilet form:
   - Name: "Test Bathroom"
   - Location: "Downtown"
2. Click on map to select coordinates
3. Click "Add Toilet"

**Backend Terminal Should Show:**
```
[REQUEST] POST /api/toilet/add - IP: ::1
[TOILET] Add toilet request: Test Bathroom
[TOILET] Successfully added toilet: Test Bathroom with ID: xxx
[RESPONSE] POST /api/toilet/add - Status: 201 - Duration: XXms
```

### Test 3: Fetch All Toilets

**In Browser:**
- Click "Dashboard" tab to refresh toilet list

**Backend Terminal Should Show:**
```
[REQUEST] GET /api/toilet/map - IP: ::1
[TOILET] Fetching all toilets for map
[TOILET] Found 6 toilets
[RESPONSE] GET /api/toilet/map - Status: 200 - Duration: XXms
```

### Test 4: Submit a Review

**In Browser:**
1. Go to `http://localhost:3000/review.html?id=<toilet-id>`
2. Fill in review form with ratings
3. Submit review

**Backend Terminal Should Show:**
```
[REQUEST] POST /api/review/submit - IP: ::1
[REVIEW] Submit review request for toilet ID: xxx Rating: 5
[REVIEW] Successfully submitted review for toilet: Central Park Restroom
[REVIEW] Updated toilet stats - Average Rating: 4.5 Total Reviews: 10
[RESPONSE] POST /api/review/submit - Status: 201 - Duration: XXms
```

## Debugging Specific Issues

### Issue: "API request failed"

**Check Backend Logs:**
```
[REQUEST] POST /api/...
[ERROR] POST /api/...
[ERROR] Stack: ...
[ERROR] Message: ...
```

**Action:**
- Look for validation errors in logs
- Check if toilet ID exists before submitting review
- Verify email is unique for registration

### Issue: "Map not loading"

**Check Browser Console:**
- Look for errors from Leaflet.js library
- Check if DOM element with id="map" exists
- Verify map initialization code ran

**Common Fix:**
```javascript
// In browser console, manually reinitialize map:
if (map) {
    map.remove();
}
initMap();
```

### Issue: "Reviews not showing"

**Check Backend Logs:**
```bash
# Watch for review-related logs
npm start | grep "\[REVIEW\]"
```

**Check Frontend:**
1. Verify correct toilet ID in URL
2. Check if reviews exist: `http://localhost:3000/api/review/toilet/<id>`
3. Verify review submission completed successfully

### Issue: "Token not persisting"

**Check Browser Console:**
```javascript
// Check localStorage:
localStorage.getItem('adminToken');  // Should show token
localStorage.getItem('adminEmail');  // Should show email
```

**Check Backend Logs:**
```
[AUTH] Login successful: admin@test.com
```

## Quick Debug Commands

### Check if Backend is Running
```bash
curl -s http://localhost:3000/api/toilet/map | jq . | head -20
```

**Expected:** JSON array of toilets

### Check All Users
```javascript
// In browser console:
fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
}).then(r => r.json()).then(console.log);
```

### Clear Backend Data & Restart
```bash
# Kill server (Ctrl+C in terminal)
cd /home/sanket/Abrick/backend
rm -rf data.json  # if it exists
npm start
# Backend will reinitialize with sample data
```

### Clear Browser Cache & Login
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Log Output Format Reference

```
[TIMESTAMP] [LEVEL] [CATEGORY] Message - Additional Info

Examples:
[02:30:45.123] [REQUEST] POST /api/auth/login - IP: ::1
[02:30:45.168] [AUTH] Login attempt with email: admin@test.com
[02:30:45.175] [AUTH] Login successful: admin@test.com
[02:30:45.176] [RESPONSE] POST /api/auth/login - Status: 200 - Duration: 53ms
```

## Frontend Logger Methods

Use these in browser console to debug:

```javascript
// Info messages
Logger.info('CATEGORY', 'message', dataObject);

// Error messages
Logger.error('CATEGORY', 'error message', errorObject);

// Success messages
Logger.success('CATEGORY', 'success message');

// Debug messages (detailed)
Logger.debug('CATEGORY', 'debug info', dataObject);

// API specific
Logger.apiRequest('POST', '/api/toilet/add', toiletData);
Logger.apiResponse(201, '/api/toilet/add', responseData);
Logger.apiError('/api/toilet/add', error);

// Event tracking
Logger.event('USER_LOGGED_IN', { email: 'user@test.com' });

// Form handling
Logger.form('FORM_SUBMITTED', { data: formData });
```

## Performance Check

**Watch request duration in logs:**
```bash
npm start | grep "Duration:"
```

**Healthy durations:**
- Simple reads (GET): 1-5ms
- Data writes (POST): 5-20ms
- Complex operations: 20-100ms

**If over 100ms:**
- Check if sample data is initializing
- Check for slow network connection
- Review storage operations

## Next Steps for Full Testing

1. ✅ Start backend with logging
2. ✅ Open admin.html in browser
3. ✅ Register new admin account
4. ✅ Login with admin account
5. ✅ Add 2-3 new toilets via form
6. ✅ View QR codes section
7. ✅ Submit test reviews
8. ✅ Filter reviews by toilet and rating
9. ✅ Delete a toilet
10. ✅ Verify all operations logged

---

**Need help?** Check LOGGING_SETUP.md for detailed information on all logging points.
