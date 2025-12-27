# 🔧 AI Debugging Prompt - Toilet Review System

## 🎯 **SYSTEM UNDERSTANDING**

You are debugging a **Toilet Review System** - a comprehensive web application with hybrid public/private toilet management, real-time API data ingestion, interactive map integration, and admin dashboard capabilities.

**Project Scope**: 
- Backend: Express.js server with in-memory storage
- Frontend: HTML/CSS/JavaScript with Leaflet.js maps
- Capacity: 21,000-54,000 toilets across 5 major Indian cities
- Architecture: Multi-source API integration with regional intelligence

---

## 📚 **DEBUGGING RESOURCES**

Use these three documentation files as your primary references:

### **1. PROJECT_WORKFLOW_DOCUMENTATION.md**
**Purpose**: Complete project understanding
**Contains**: 
- File-by-file architecture explanations
- End-to-end data flow diagrams
- API workflow examples with real requests/responses
- Component interaction patterns

### **2. QUICK_DEBUGGING_REFERENCE.md**
**Purpose**: Rapid issue resolution
**Contains**:
- Common error patterns and quick fixes
- Diagnostic commands for immediate problem identification
- Debug endpoints for system monitoring
- Emergency troubleshooting procedures

### **3. README_COMPLETE_PROJECT_OVERVIEW.md**
**Purpose**: Project scope and capabilities
**Contains**:
- System architecture overview
- Performance targets and monitoring
- Feature breakdown and development roadmap
- Security and scalability information

---

## 🚨 **DEBUGGING METHODOLOGY**

### **Step 1: Problem Identification**
When given a debugging request, follow this systematic approach:

1. **Understand the Issue**
   - What specific problem is occurring?
   - Which component is affected (frontend, backend, database, APIs)?
   - When does the issue occur (startup, runtime, specific actions)?

2. **Access Documentation**
   - Check PROJECT_WORKFLOW_DOCUMENTATION.md for architecture understanding
   - Review QUICK_DEBUGGING_REFERENCE.md for similar issues
   - Consult README_COMPLETE_PROJECT_OVERVIEW.md for system capabilities

3. **Gather Diagnostic Information**
   - Request relevant debug endpoint outputs
   - Ask for server logs and error messages
   - Check system status using provided commands

### **Step 2: Systematic Investigation**
Use the following diagnostic sequence:

```bash
# 1. Server Status Check
ps aux | grep "node server.js"

# 2. Database State
curl "http://localhost:3000/api/toilet/debug/all"

# 3. System Metrics
curl "http://localhost:3000/api/slo/metrics"

# 4. Cache Status
curl "http://localhost:3000/api/cache/stats"

# 5. Test Core Endpoints
curl "http://localhost:3000/api/toilet/map"
curl "http://localhost:3000/api/maximum/stats/maximum"
```

### **Step 3: Issue Classification**
Categorize problems using these patterns:

#### **A. Server Issues**
- **Symptoms**: Server won't start, crashes, high CPU/memory
- **Files to Check**: `server.js`, `package.json`, environment variables
- **Documentation**: Look in PROJECT_WORKFLOW_DOCUMENTATION.md → "server.js" section

#### **B. API Endpoint Issues**
- **Symptoms**: 404 errors, 500 errors, timeout issues
- **Files to Check**: `routes/*.js`, middleware configuration
- **Documentation**: PROJECT_WORKFLOW_DOCUMENTATION.md → "API ROUTE FILES" section

#### **C. Database Issues**
- **Symptoms**: No data showing, missing records, storage errors
- **Files to Check**: `storage.js`, `Toilet.js`, data ingestion services
- **Documentation**: PROJECT_WORKFLOW_DOCUMENTATION.md → "models/" section

#### **D. Frontend Issues**
- **Symptoms**: Map not loading, JavaScript errors, UI problems
- **Files to Check**: `index.html`, `admin.html`, `js/*.js`
- **Documentation**: PROJECT_WORKFLOW_DOCUMENTATION.md → "frontend files" section

#### **E. Data Integration Issues**
- **Symptoms**: Sync failures, API errors, missing data sources
- **Files to Check**: `PublicToiletExternalDataIngestionAgent.js`, `PublicToiletService.js`
- **Documentation**: PROJECT_WORKFLOW_DOCUMENTATION.md → "services/" section

---

## 🔧 **COMMON DEBUGGING SCENARIOS**

### **Scenario 1: "No toilets showing on map"**

**Investigation Steps**:
1. **Check API Response**
   ```bash
   curl "http://localhost:3000/api/toilet/map?showPublic=true"
   ```
   
2. **Verify Database State**
   ```bash
   curl "http://localhost:3000/api/toilet/debug/all"
   ```
   
3. **Check Browser Console**
   - Open browser developer tools
   - Look for JavaScript errors
   - Check network tab for failed requests

**Expected Solutions**:
- API returning 404: Check route mounting in `server.js`
- Empty database: Trigger data ingestion via `/api/maximum/ingest/maximum`
- Frontend errors: Check JavaScript console for Leaflet.js issues

**Documentation References**:
- PROJECT_WORKFLOW_DOCUMENTATION.md → "Example 1: Map Data Loading"
- QUICK_DEBUGGING_REFERENCE.md → "Issue 3: No Toilets Showing on Map"

### **Scenario 2: "Data sync not working"**

**Investigation Steps**:
1. **Test Ingestion Endpoint**
   ```bash
   curl -X POST "http://localhost:3000/api/maximum/ingest/maximum" \
     -H "Content-Type: application/json" \
     -d '{"cities": ["mumbai"], "targetCount": 10}'
   ```
   
2. **Check Server Logs**
   - Look for `[INGESTION]` messages
   - Check for API timeout errors
   - Verify external API connectivity

3. **Test External APIs Directly**
   ```bash
   curl -X POST "https://overpass-api.de/api/interpreter" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "data=[out:json];node[\"amenity\"=\"toilets\"](18.8,72.7,19.3,73.0);out;"
   ```

**Expected Solutions**:
- API 504 errors: Check rate limiting, try again later
- API 403 errors: Verify API keys and authentication
- No data returned: Check query parameters and bounds

**Documentation References**:
- PROJECT_WORKFLOW_DOCUMENTATION.md → "Example 2: Data Ingestion Process"
- QUICK_DEBUGGING_REFERENCE.md → "Issue 2: Data Sync Not Working"

### **Scenario 3: "Admin authentication failing"**

**Investigation Steps**:
1. **Test Login Endpoint**
   ```bash
   curl -X POST "http://localhost:3000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
   ```
   
2. **Check Environment Variables**
   ```bash
   echo $JWT_SECRET
   ```
   
3. **Verify Middleware Configuration**
   - Check `middleware/auth.js` implementation
   - Verify route protection in `server.js`

**Expected Solutions**:
- JWT errors: Check JWT_SECRET environment variable
- 401 responses: Verify credentials and token expiration
- Route 404: Check admin route mounting

**Documentation References**:
- QUICK_DEBUGGING_REFERENCE.md → "Issue 5: Authentication Failures"
- PROJECT_WORKFLOW_DOCUMENTATION.md → "middleware/auth.js" section

---

## 🛠️ **ADVANCED DEBUGGING TECHNIQUES**

### **Performance Analysis**
```bash
# Check system metrics
curl "http://localhost:3000/api/slo/metrics"

# Monitor cache performance
curl "http://localhost:3000/api/cache/stats"

# Check memory usage
ps -o pid,ppid,cmd,%mem,%cpu -p $(pgrep -f "node server.js")
```

### **Database Deep Dive**
```bash
# Access storage module directly
node -e "const storage = require('./models/storage'); console.log('Toilets:', storage.toilets.find().length);"

# Test Toilet model
node -e "const Toilet = require('./models/Toilet'); Toilet.find().then(t => console.log('Found:', t.length));"
```

### **External API Testing**
```bash
# Test Overpass API connectivity
curl -X POST "https://overpass-api.de/api/interpreter" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data=[out:json];node[\"amenity\"=\"toilets\"](18.8,72.7,19.3,73.0);out;"

# Test government API
curl "https://www.data.gov.in/api/3/action/package_search?q=toilet&rows=5"
```

---

## 📊 **SYSTEM MONITORING**

### **Health Check Endpoints**
- `GET /api/slo/metrics` - Performance monitoring
- `GET /api/cache/stats` - Cache performance
- `GET /api/maximum/stats/maximum` - Data ingestion analytics
- `GET /api/toilet/debug/all` - Database state

### **Key Performance Indicators**
- **API Response Time**: < 500ms (95th percentile)
- **Map Load Time**: < 2000ms
- **Data Freshness**: < 24 hours
- **System Availability**: > 99.9%
- **Error Rate**: < 1%

---

## 🚨 **EMERGENCY PROCEDURES**

### **Complete System Reset**
```bash
# Stop server
pkill -f "node server.js"

# Clear dependencies
rm -rf node_modules package-lock.json
npm install

# Restart
npm start
```

### **Database Corruption Recovery**
```bash
# Restart server (reloads storage)
pkill -f "node server.js"
npm start

# Clear cache
curl -X POST "http://localhost:3000/api/cache/invalidate" \
  -H "Content-Type: application/json" \
  -d '{"type": "toilets"}'
```

---

## 💡 **PRO DEBUGGING TIPS**

1. **Always start with server logs** - Most errors are logged there
2. **Use the debug endpoints** - `/api/toilet/debug/all` reveals database state
3. **Test APIs with curl** - Isolates frontend vs backend issues
4. **Check rate limits** - Don't hammer external APIs
5. **Monitor performance metrics** - Use `/api/slo/metrics` for insights
6. **Validate inputs** - Check query parameters and request bodies

---

## 🎯 **EXPECTED OUTCOMES**

When properly using this prompt with the three documentation files, you should be able to:

1. **Rapidly identify** the root cause of any system issue
2. **Apply targeted solutions** following documented patterns
3. **Monitor system health** using built-in metrics
4. **Extend functionality** using established architecture
5. **Scale the system** following documented best practices

**Remember**: The three documentation files contain comprehensive information about every aspect of the system. Use them as your primary reference for all debugging activities.

---

## 📋 **USAGE INSTRUCTIONS**

When someone presents a debugging issue:

1. **Ask for the specific problem** and which component is affected
2. **Guide them through the diagnostic sequence** using the commands provided
3. **Reference the appropriate documentation sections** based on the issue type
4. **Provide targeted solutions** following the documented patterns
5. **Suggest preventive measures** based on the system architecture

This prompt, combined with the three documentation files, provides complete coverage for debugging the entire Toilet Review System project.