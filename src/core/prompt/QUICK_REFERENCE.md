# Frontend Debugging Quick Reference

## 🚨 Critical Challenges Overview

### 1. Component Initialization (CRITICAL)
**Symptoms:** `Component initialization failed`, `Element not found`
**Quick Fix:** Check DOM readiness, add null checks, ensure async operations awaited
**Prompt:** Use `generateDebugPrompt('component_initialization', {component_name, error_message})`

### 2. API Service Integration (CRITICAL)
**Symptoms:** `401 Unauthorized`, `Failed to fetch`, `Response parsing error`
**Quick Fix:** Verify token in headers, check baseUrl, handle response format
**Prompt:** Use `generateDebugPrompt('api_service_integration', {endpoint, error_type, error_message})`

### 3. State Management Sync (HIGH)
**Symptoms:** UI not updating, observers not firing
**Quick Fix:** Check observer subscriptions, use immutable updates, verify cleanup
**Prompt:** Use `generateDebugPrompt('state_management_sync', {state_path, expected_value})`

### 4. Map Initialization (HIGH)
**Symptoms:** Map not displaying, markers missing, cluster errors
**Quick Fix:** Verify Leaflet loaded, set container dimensions, call invalidateSize()
**Prompt:** Use `generateDebugPrompt('map_initialization_failures', {page_name, error_message})`

### 5. QR Scanner Issues (MEDIUM)
**Symptoms:** Scanner not starting, camera permission denied
**Quick Fix:** Check Html5Qrcode library, handle permissions, clean up on destroy
**Prompt:** Use `generateDebugPrompt('qr_scanner_issues', {page_name, error_message})`

## 📝 Prompt Generation Examples

### Component Issue
```javascript
import { generateComponentPrompt } from './prompt-helper.js';

const prompt = generateComponentPrompt(
    'ButtonComponent',
    'Cannot read property appendChild of null',
    {
        file_path: 'src/components/ui/button.component.js',
        line_range: '46-55'
    }
);
```

### API Issue
```javascript
import { generateDebugPrompt } from './prompt-helper.js';

const prompt = generateDebugPrompt('api_service_integration', {
    endpoint: '/api/toilet/map',
    error_type: '401 Unauthorized',
    error_message: 'Token not found',
    method: 'GET'
});
```

### Workflow Resume
```javascript
import { generateResumePrompt } from './prompt-helper.js';

const checkpoint = {
    component: 'HomePage',
    state: 'initialized',
    next_step: 'load toilets'
};

const prompt = generateResumePrompt(checkpoint, 'Map initialization failed');
```

## 🔧 Common Fix Patterns

### Component Initialization Fix
```javascript
async init() {
    try {
        // Wait for DOM
        if (!this.element) await this.createElement();
        
        // Parallel setup
        await Promise.all([
            this.setupData(),
            this.setupEventListeners()
        ]);
        
        // Render
        await this.render();
    } catch (error) {
        this.logError('Initialization failed', error);
        throw error;
    }
}
```

### API Request Fix
```javascript
async request(endpoint, options = {}) {
    // Add token
    const token = appStore.getState().user.token;
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    
    try {
        const response = await fetch(`${baseUrl}/api/${endpoint}`, options);
        const data = await response.json();
        
        // Handle both formats
        return data.success ? data.data : data;
    } catch (error) {
        this.handleError(error);
        throw error;
    }
}
```

### State Observer Fix
```javascript
setupStateObservers() {
    this.unsubscribers = [];
    
    const unsubscribe = appStore.subscribe('state:changed', (event, data) => {
        // Filter specific changes
        if (data.changes['data.toilets']) {
            this.update({ toilets: data.changes['data.toilets'].to });
        }
    });
    
    this.unsubscribers.push(unsubscribe);
}

cleanupStateObservers() {
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
}
```

## 🎯 Token Optimization Tips

1. **Include Only Relevant Context**
   - Error message (1-2 lines)
   - Component/file name
   - Line numbers (not full file)
   - Expected vs actual behavior

2. **Exclude**
   - Full file contents
   - Complete stack traces
   - All console.log statements
   - Unrelated error messages

3. **Use Abbreviations**
   - comp = component
   - init = initialization
   - API = baseApiService
   - Store = appStore

## 🔗 Prompt Chaining

For complex issues, break into steps:

1. **Diagnosis:** Identify root cause
2. **Solution:** Provide fix with context
3. **Verification:** Check edge cases

```javascript
import { createPromptChain } from './prompt-helper.js';

const chain = createPromptChain('component_initialization', {
    component_name: 'ButtonComponent',
    error_message: 'Element not found',
    symptom: 'Component not rendering'
});
```

## 📊 Validation

Check token usage before sending:

```javascript
import { validateTokenUsage } from './prompt-helper.js';

const validation = validateTokenUsage(prompt);
if (!validation.valid) {
    console.warn(`Prompt too long (${validation.tokens} tokens)`);
    console.log('Suggestions:', validation.suggestions);
}
```

## 🚀 Workflow Resume

After error, resume from checkpoint:

1. Identify last successful step
2. Generate resume prompt
3. Fix error
4. Continue from checkpoint

```javascript
const checkpoint = {
    checkpoint_id: 'homepage_map_init',
    component: 'HomePage',
    state: 'failed',
    error: 'Leaflet not loaded',
    next_step: 'initialize map'
};

const resumePrompt = generateResumePrompt(checkpoint, checkpoint.error);
```

## 📋 All Available Challenges

Run `listChallenges()` to see all challenges sorted by priority:

```javascript
import { listChallenges } from './prompt-helper.js';

const challenges = listChallenges();
// Returns: [{key, priority, frequency, description, affected_files}, ...]
```

## ⚡ Quick Debug Checklist

1. ✅ Check console for specific error
2. ✅ Identify challenge type from symptoms
3. ✅ Generate prompt using helper function
4. ✅ Validate token usage
5. ✅ Apply fix incrementally
6. ✅ Test minimal reproduction
7. ✅ Resume workflow from checkpoint

## 🔍 Component-Specific Optimization

Get optimization recommendations:

```javascript
import { getOptimizations } from './prompt-helper.js';

const optimizations = getOptimizations('BaseComponent');
// Returns: {issues: [...], optimizations: [...]}
```

