# Logging Setup - Toilet Review System

## Overview
Comprehensive logging has been added to all essential backend and frontend files to facilitate debugging and monitoring of the system.

## Backend Logging

### Server (`backend/server.js`)
**Features:**
- Configuration logging (PORT, JWT_SECRET status, NODE_ENV)
- Request/Response middleware logging with timestamps and duration
- Request body logging for POST/PUT operations
- Comprehensive error handling with stack traces
- Sample data initialization logging

**Example Output:**
```
[CONFIG] PORT: 3000
[CONFIG] JWT_SECRET: ***configured***
[REQUEST] POST /api/auth/login - IP: ::1
[REQUEST] Body: { "email": "admin@example.com", "password": "..." }
[RESPONSE] POST /api/auth/login - Status: 200 - Duration: 45ms
```

### Authentication Routes (`backend/routes/auth.js`)
**Logged Events:**
- Registration attempts with email
- Login attempts with email
- Password validation failures
- Token creation success/failure
- User lookup failures
- All errors with context

**Example Output:**
```
[AUTH] Register attempt with email: admin@example.com
[AUTH] Register failed: User already exists: admin@example.com
[AUTH] Login attempt with email: admin@example.com
[AUTH] Login successful: admin@example.com
```

### Toilet Routes (`backend/routes/toilets.js`)
**Logged Events:**
- Toilet fetch requests (map view)
- Toilet count and details
- Toilet add requests with validation
- Toilet delete requests with confirmation
- Coordinate validation
- All errors with context

**Example Output:**
```
[TOILET] Fetching all toilets for map
[TOILET] Found 5 toilets
[TOILET] Add toilet request: Central Park Restroom
[TOILET] Successfully added toilet: Central Park Restroom with ID: 123
[TOILET] Delete request for toilet ID: 123
```

### Review Routes (`backend/routes/reviews.js`)
**Logged Events:**
- Review submission requests
- Rating validation (1-5 scale)
- Toilet existence verification
- Review statistics updates
- Review fetch requests
- All errors with context

**Example Output:**
```
[REVIEW] Submit review request for toilet ID: 123 Rating: 5
[REVIEW] Successfully submitted review for toilet: Central Park Restroom
[REVIEW] Updated toilet stats - Average Rating: 4.5 Total Reviews: 10
[REVIEW] Fetching all reviews
[REVIEW] Found 42 reviews
```

## Frontend Logging

### Logger Utility (`js/logger.js`)
**Purpose:** Centralized, formatted logging across all frontend components
**Features:**
- Structured logging with timestamps and color coding
- Multiple log levels: INFO, WARN, ERROR, DEBUG, SUCCESS
- Category-based organization
- Formatted console output with colors and proper nesting
- API request/response tracking
- Event logging
- Form submission tracking

**Example Output:**
```
[HH:MM:SS.ms] [INFO] [AUTH] ✓ Login successful
[HH:MM:SS.ms] [ERROR] [API] Error calling /api/toilet/add
[HH:MM:SS.ms] [SUCCESS] [REVIEW] Review submitted successfully
```

### Admin Dashboard (`admin.html`)
**Integration:**
- Uses Logger utility for all console output
- Tracks admin initialization
- API URL configuration logging
- Token presence checking
- Dashboard state transitions

**Logged Events:**
```
Logger.info('ADMIN', 'Admin panel JavaScript starting...');
Logger.auth('Admin panel initializing, token exists', { hasToken: true });
Logger.success('AUTH', 'Login successful');
Logger.error('API', 'Failed to add toilet', error);
```

## How to Use Logging for Debugging

### 1. **Monitor Backend in Real-time**
```bash
cd /home/sanket/Abrick/backend
npm start
```
Watch console for:
- REQUEST/RESPONSE pairs to identify slow endpoints
- AUTH failures to debug login issues
- TOILET operation logs to verify CRUD operations
- REVIEW logs to track data consistency

### 2. **Monitor Frontend in Browser**
Open browser DevTools (F12) and check Console tab for:
- [ADMIN] prefixed logs for admin panel activity
- [API] prefixed logs for fetch operations
- [AUTH] prefixed logs for authentication flows
- [FORM] prefixed logs for form submissions
- [EVENT] prefixed logs for user interactions

### 3. **Common Debugging Scenarios**

#### Login Not Working
**Backend Logs to Check:**
```
[AUTH] Login attempt with email: ...
[AUTH] Login failed: User not found: ...
[AUTH] Login failed: Invalid password for user: ...
```

**Frontend Logs to Check:**
- Check Network tab for API response
- Check Console for Logger.error('API', ...) messages

#### Toilet Not Adding
**Backend Logs to Check:**
```
[TOILET] Add toilet request: ...
[TOILET] Add failed: Missing required fields
[TOILET] Add failed: Invalid coordinates
```

**Frontend Logs to Check:**
- Check form validation: Logger.form() output
- Check API response: Logger.apiResponse() output
- Check coordinate validation errors

#### Reviews Not Showing
**Backend Logs to Check:**
```
[REVIEW] Fetching all reviews
[REVIEW] Found X reviews
[REVIEW] Submit review request for toilet ID: ...
```

**Frontend Logs to Check:**
- Check review filter: Logger.info() on filter changes
- Check API calls for review endpoints
- Check review rendering: Logger.dom() messages

### 4. **Log Analysis Commands**

#### Filter Backend Logs by Category
```bash
# Only AUTH logs
npm start | grep "\[AUTH\]"

# Only ERRORS
npm start | grep "\[ERROR\]"

# Only TOILET operations
npm start | grep "\[TOILET\]"
```

#### Find Slow Requests (> 50ms)
```bash
# Backend timing analysis
npm start | grep "Duration:" | grep -oE "[0-9]+ms" | sort -n | tail -20
```

## Logging Configuration

### Backend Environment Variables
Located in `backend/.env`:
```
PORT=3000
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

When NODE_ENV=development, more verbose logging is enabled.

### Frontend Console Settings
To increase verbosity in frontend, add this to browser console:
```javascript
// Enable all logs (already enabled by default)
Logger.levels.DEBUG = 'DEBUG';
```

## Performance Impact

- **Backend:** Minimal (~1-2ms per request for logging)
- **Frontend:** Negligible, only logs when events occur
- **Storage:** No persistent logs (all console-based)

## Security Considerations

⚠️ **Important:**
- JWT tokens are NOT logged in requests (security)
- Passwords are NOT logged (only email)
- Sensitive data is masked in output (e.g., JWT_SECRET shows as ***configured***)
- API URLs are logged for debugging connectivity issues

## Next Steps

1. Run backend: `cd backend && npm start`
2. Monitor the logging output
3. Open http://localhost:3000/admin.html in browser
4. Open DevTools (F12) → Console tab
5. Perform actions (login, add toilet, submit review)
6. Review logs to verify system operation

## Troubleshooting Quick Reference

| Issue | Where to Look |
|-------|---------------|
| **Server won't start** | [CONFIG], [SERVER] logs |
| **Can't login** | [AUTH] logs in backend |
| **API calls failing** | [REQUEST/RESPONSE] in backend, [API] in frontend |
| **Toilet not saving** | [TOILET] in backend, check coordinates validation |
| **Reviews not showing** | [REVIEW] in backend, check toilet ID matching |
| **Map not loading** | Browser DevTools Console for leaflet errors |
| **QR codes not generating** | Check /api/toilet/map response, verify toilet IDs |

---

**Last Updated:** December 26, 2025
**Version:** 1.0
