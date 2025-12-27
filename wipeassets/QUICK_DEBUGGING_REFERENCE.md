# 🚨 Quick Debugging Reference Guide

## 📋 **PROJECT SUMMARY**
**Toilet Review System** - Hybrid public/private toilet management with real-time API data ingestion, map integration, and admin dashboard.

---

## 🔧 **KEY FILE RESPONSIBILITIES**

### **Backend Core**
| File | Purpose | Key Functions |
|------|---------|---------------|
| `server.js` | Main server entry | Route mounting, middleware setup, error handling |
| `storage.js` | In-memory database | CRUD operations, indexing, performance monitoring |
| `Toilet.js` | Data model | Validation, save/remove, find operations |

### **API Routes**
| File | Key Endpoints | Purpose |
|------|---------------|---------|
| `toilets.js` | `/map`, `/sync-public`, `/stats` | Toilet CRUD, map data, public sync |
| `maximumData.js` | `/ingest/maximum`, `/stats/maximum` | High-volume data ingestion |
| `auth.js` | `/login`, `/register` | User authentication |
| `reviews.js` | `/toilet/:id`, `/review` | Review management |

### **Services & Middleware**
| File | Purpose | Key Features |
|------|---------|--------------|
| `PublicToiletService.js` | Public toilet data fetching | Regional APIs, rate management |
| `PublicToiletExternalDataIngestionAgent.js` | Advanced data ingestion | Multi-source, deduplication |
| `auth.js` | JWT authentication | protect, admin middleware |
| `rateLimiter.js` | API throttling | authLimiter, apiLimiter, syncLimiter |

---

## 🚨 **MOST COMMON ISSUES & QUICK FIXES**

### **1. "Cannot find module" Errors**
```bash
# Check dependencies
npm list

# Reinstall dependencies
npm install

# Check import paths
# Example: const Toilet = require('../models/Toilet');
```

### **2. API Endpoints Returning 404**
```javascript
// Check route mounting in server.js
app.use('/api/toilet', apiLimiter, toiletRoutes);
app.use('/api/maximum', apiLimiter, maximumDataRoutes);

// Restart server after route changes
pkill -f "node server.js" && npm start
```

### **3. No Data Showing on Map**
```bash
# Test API endpoint
curl "http://localhost:3000/api/toilet/map?showPublic=true"

# Check database
curl "http://localhost:3000/api/toilet/debug/all"

# Check storage initialization in server.js logs
```

### **4. Data Sync Not Working**
```bash
# Test maximum data ingestion
curl -X POST "http://localhost:3000/api/maximum/ingest/maximum" \
  -H "Content-Type: application/json" \
  -d '{"cities": ["mumbai"], "targetCount": 10}'

# Check server logs for ingestion errors
# Look for: [INGESTION] Starting comprehensive ingestion
```

### **5. Authentication Failures**
```bash
# Check JWT secret
echo $JWT_SECRET

# Test login endpoint
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## 📊 **DEBUGGING ENDPOINTS**

### **Database State**
```bash
# Get all toilets
curl "http://localhost:3000/api/toilet/debug/all"

# Get toilet statistics
curl "http://localhost:3000/api/toilet/stats"

# Get maximum data statistics
curl "http://localhost:3000/api/maximum/stats/maximum"
```

### **System Performance**
```bash
# Get SLO metrics
curl "http://localhost:3000/api/slo/metrics"

# Get cache statistics
curl "http://localhost:3000/api/cache/stats"
```

### **Map Data**
```bash
# Get map-ready data
curl "http://localhost:3000/api/toilet/map?showPublic=true&limit=100"

# Get maximum map data (up to 10k records)
curl "http://localhost:3000/api/maximum/map/maximum?limit=5000"
```

---

## 🔍 **LOG ANALYSIS**

### **Server Startup Logs**
```bash
# Look for these success indicators
[SERVER] ✓ Toilet Review System server is running on port 3000
[INIT] System ready for dynamic API data fetching!
[CACHE] Cache warming completed
```

### **API Request Logs**
```bash
# Request/response logging
[REQUEST] GET /api/toilet/map - IP: ::1
[RESPONSE] GET /map - Status: 200 - Duration: 1ms

# Data ingestion logs
[INGESTION] Starting comprehensive ingestion for mumbai...
[INGESTION] OSM Overpass: 100 records processed
[MAX-DATA] mumbai: ✅ 50 toilets in 3000ms
```

### **Error Logs**
```bash
# Common error patterns
[MAX-DATA] Stats error: TypeError: Toilet.countDocuments is not a function
[PUBLIC-API] Regional API error: request failed
[SLO] API GET /api/toilet/map: 500ms (500)
```

---

## 🛠️ **DEBUGGING COMMANDS**

### **Check Server Status**
```bash
# Is server running?
ps aux | grep "node server.js"

# Check port usage
netstat -tlnp | grep 3000

# Restart server
pkill -f "node server.js"
cd /home/sanket/Abrick/backend && npm start
```

### **Test Database**
```bash
# Check storage module
node -e "const storage = require('./models/storage'); console.log('Toilets:', storage.toilets.find().length);"

# Test Toilet model
node -e "const Toilet = require('./models/Toilet'); Toilet.find().then(t => console.log('Found:', t.length));"
```

### **Test External APIs**
```bash
# Test Overpass API
curl -X POST "https://overpass-api.de/api/interpreter" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data=[out:json];node[\"amenity\"=\"toilets\"](18.8,72.7,19.3,73.0);out;"

# Test government API
curl "https://www.data.gov.in/api/3/action/package_search?q=toilet&rows=5"
```

---

## 📈 **PERFORMANCE MONITORING**

### **Success Metrics**
- **API Response Time**: < 500ms (95th percentile)
- **Map Load Time**: < 2000ms
- **Data Ingestion**: 1000+ toilets per minute
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 1%

### **Resource Usage**
```bash
# Memory usage
ps -o pid,ppid,cmd,%mem,%cpu -p $(pgrep -f "node server.js")

# Database size
echo "Toilets in storage: $(curl -s http://localhost:3000/api/toilet/debug/all | jq '.metadata.total')"
```

---

## 🎯 **QUICK DIAGNOSTIC FLOW**

### **Issue: Map Not Loading Toilets**
1. **Check API**: `curl /api/toilet/map` → 200 OK?
2. **Check Data**: `curl /api/toilet/debug/all` → Data exists?
3. **Check Console**: Browser F12 → JavaScript errors?
4. **Check CORS**: Network tab → Cross-origin blocked?

### **Issue: Data Sync Failing**
1. **Check Agent**: Test `/api/maximum/ingest/maximum` → Response?
2. **Check Logs**: Look for `[INGESTION]` messages
3. **Check APIs**: External API connectivity
4. **Check Rate Limits**: Are we being throttled?

### **Issue: Admin Functions Not Working**
1. **Check Auth**: `curl /api/auth/login` → Token returned?
2. **Check Middleware**: Auth headers present?
3. **Check Roles**: Admin role assigned?
4. **Check JWT**: Secret configured correctly?

---

## 📞 **EMERGENCY TROUBLESHOOTING**

### **Server Won't Start**
```bash
# Check syntax errors
node -c server.js

# Check dependencies
npm install

# Check port conflicts
lsof -i :3000

# Check environment variables
echo $JWT_SECRET
```

### **Database Corruption**
```bash
# Restart server (reloads storage)
pkill -f "node server.js"
npm start

# Clear cache manually
curl -X POST "http://localhost:3000/api/cache/invalidate" \
  -H "Content-Type: application/json" \
  -d '{"type": "toilets"}'
```

### **Complete Reset**
```bash
# Stop server
pkill -f "node server.js"

# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Restart
npm start
```

---

## 💡 **PRO TIPS**

1. **Always check server logs first** - Most errors are logged there
2. **Use the debug endpoints** - `/api/toilet/debug/all` is your friend
3. **Test APIs with curl** - Isolate frontend vs backend issues
4. **Monitor performance metrics** - Use `/api/slo/metrics`
5. **Check rate limits** - Don't hammer external APIs
6. **Validate inputs** - Check query parameters and request bodies

---

## 📋 **FILE PRIORITY FOR DEBUGGING**

1. **server.js** - Core configuration issues
2. **storage.js** - Data layer problems  
3. **routes/** - API endpoint issues
4. **middleware/** - Auth/validation problems
5. **services/** - Business logic issues

This quick reference should help you rapidly identify and resolve most issues in the Toilet Review System!