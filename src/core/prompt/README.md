# Frontend Workflow Debugging System

## Overview

This system provides **AI-assisted debugging prompts** with **token optimization** for identifying and fixing critical frontend workflow issues. It includes:

- 📋 **8 Critical Challenge Categories** with symptoms, root causes, and fixes
- 🎯 **Token-Optimized Prompts** (max 4000 tokens context)
- 🔗 **Prompt Chaining** for complex issues
- 🔄 **Workflow Resume** capabilities
- ⚡ **Component-Specific Optimization** recommendations

## Quick Start

### 1. Identify Your Issue

Check console errors and match to challenge categories:

| Symptom | Challenge Key | Priority |
|---------|--------------|----------|
| Component not initializing | `component_initialization` | CRITICAL |
| 401/API errors | `api_service_integration` | CRITICAL |
| UI not updating | `state_management_sync` | HIGH |
| Map not showing | `map_initialization_failures` | HIGH |
| QR scanner issues | `qr_scanner_issues` | MEDIUM |
| Event handler leaks | `event_listener_leaks` | MEDIUM |
| Race conditions | `async_operation_race_conditions` | HIGH |
| Form submission fails | `form_validation_and_submission` | MEDIUM |

### 2. Generate Debug Prompt

```javascript
import { generateDebugPrompt } from './core/prompt/prompt-helper.js';

// For component initialization issue
const prompt = generateDebugPrompt('component_initialization', {
    component_name: 'ButtonComponent',
    error_message: 'Cannot read property appendChild of null',
    parent_component: 'HomePage',
    dom_element_selector: '#button-container'
});

console.log(prompt.user_prompt);
// Send to AI: Claude, ChatGPT, etc.
```

### 3. Validate Token Usage

```javascript
import { validateTokenUsage } from './core/prompt/prompt-helper.js';

const validation = validateTokenUsage(prompt);
if (!validation.valid) {
    console.warn(`Token limit exceeded: ${validation.percentage}%`);
    console.log('Suggestions:', validation.suggestions);
}
```

### 4. Apply Fix

Use the `fix_template` from the prompt response to implement the solution.

## Critical Challenges Explained

### 1. Component Initialization (CRITICAL)

**When it happens:** Components fail during `init()` lifecycle hook.

**Common causes:**
- DOM elements not ready
- Async operations out of order
- Missing error handling

**Quick fix pattern:**
```javascript
async init() {
    try {
        if (!this.element) await this.createElement();
        await Promise.all([this.setupData(), this.setupEventListeners()]);
        await this.render();
    } catch (error) {
        this.logError('Initialization failed', error);
        throw error;
    }
}
```

**Prompt:**
```javascript
generateDebugPrompt('component_initialization', {
    component_name: 'YourComponent',
    error_message: 'Error message from console'
});
```

### 2. API Service Integration (CRITICAL)

**When it happens:** API calls return 401, timeout, or parse errors.

**Common causes:**
- Token not in headers
- Base URL misconfigured
- Response format mismatch

**Quick fix pattern:**
```javascript
async request(endpoint, options = {}) {
    const token = appStore.getState().user.token;
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    // ... rest of request
}
```

**Prompt:**
```javascript
generateDebugPrompt('api_service_integration', {
    endpoint: '/api/toilet/map',
    error_type: '401 Unauthorized',
    error_message: 'Token not found',
    method: 'GET'
});
```

### 3. State Management Sync (HIGH)

**When it happens:** UI doesn't update after state changes.

**Common causes:**
- Observers not subscribed
- Immutable updates not used
- Observers not cleaned up

**Quick fix pattern:**
```javascript
setupStateObservers() {
    const unsubscribe = appStore.subscribe('state:changed', (event, data) => {
        if (data.changes['data.toilets']) {
            this.update({ toilets: data.changes['data.toilets'].to });
        }
    });
    this.unsubscribers.push(unsubscribe);
}

cleanupStateObservers() {
    this.unsubscribers.forEach(fn => fn());
}
```

**Prompt:**
```javascript
generateDebugPrompt('state_management_sync', {
    state_path: 'data.toilets',
    expected_value: 'array of toilets',
    component: 'HomePage'
});
```

### 4. Map Initialization Failures (HIGH)

**When it happens:** Leaflet map doesn't render, markers missing.

**Common causes:**
- Leaflet library not loaded
- Container has no dimensions
- Invalid coordinates

**Quick fix pattern:**
```javascript
async initializeMap() {
    if (typeof L === 'undefined') throw new Error('Leaflet not loaded');
    const mapElement = $('#map');
    mapElement.style.height = '500px';
    this.map = L.map(mapElement, config);
    setTimeout(() => this.map.invalidateSize(), 100);
}
```

**Prompt:**
```javascript
generateDebugPrompt('map_initialization_failures', {
    page_name: 'home',
    error_message: 'Map container not found',
    container_selector: '#map'
});
```

## Prompt Chaining

For complex issues, break into steps:

```javascript
import { createPromptChain } from './core/prompt/prompt-helper.js';

const chain = createPromptChain('component_initialization', {
    component_name: 'ButtonComponent',
    error_message: 'Element not found',
    symptom: 'Component not rendering'
});

// Execute chain sequentially:
// Step 1: Diagnosis
// Step 2: Solution  
// Step 3: Verification
```

## Workflow Resume

After an error interrupts workflow:

```javascript
import { generateResumePrompt } from './core/prompt/prompt-helper.js';

const checkpoint = {
    component: 'HomePage',
    state: 'failed',
    error: 'Map initialization failed',
    next_step: 'load toilets'
};

const resumePrompt = generateResumePrompt(checkpoint, checkpoint.error);
// Use resumePrompt to continue debugging
```

## Token Optimization

The system automatically optimizes prompts to stay under 4000 tokens:

**Included:**
- Error message (essential)
- Component/file name
- Relevant line numbers
- Expected vs actual behavior

**Excluded:**
- Full file contents
- Complete stack traces
- All console.log statements
- Unrelated errors

**Use compression:**
```javascript
import { compressContext } from './core/prompt/prompt-helper.js';

const fullContext = {
    error_message: '...',
    full_file_content: '...', // Will be excluded
    component_name: '...',
    // ...
};

const compressed = compressContext(fullContext);
// Only essential fields included
```

## Component Optimization

Get optimization recommendations:

```javascript
import { getOptimizations } from './core/prompt/prompt-helper.js';

const optimizations = getOptimizations('BaseComponent');
// Returns: {issues: [...], optimizations: [...]}
```

## Simultaneous Calls

Debug multiple unrelated issues in parallel:

```javascript
// Issue 1: Component init
const prompt1 = generateDebugPrompt('component_initialization', {...});

// Issue 2: API auth (independent)
const prompt2 = generateDebugPrompt('api_service_integration', {...});

// Both can be sent to AI simultaneously
// Merge fixes after resolution
```

## File Structure

```
src/core/prompt/
├── workflow-challenges.json    # Main challenge definitions
├── prompt-helper.js            # Utility functions
├── QUICK_REFERENCE.md          # Quick lookup guide
└── README.md                   # This file
```

## Usage in Different Environments

### Browser (ES Modules)
```javascript
import { generateDebugPrompt } from './core/prompt/prompt-helper.js';

// Load JSON separately if needed
const response = await fetch('./core/prompt/workflow-challenges.json');
const workflowChallenges = await response.json();
```

### Node.js
```javascript
const { generateDebugPrompt } = require('./core/prompt/prompt-helper.js');
const workflowChallenges = require('./core/prompt/workflow-challenges.json');
```

### With Bundler (Webpack/Vite)
```javascript
// JSON imports work directly
import workflowChallenges from './core/prompt/workflow-challenges.json';
```

## Example Workflow

1. **Error occurs:** `ButtonComponent initialization failed`

2. **Generate prompt:**
```javascript
const prompt = generateComponentPrompt(
    'ButtonComponent',
    'Cannot read property appendChild of null',
    { file_path: 'src/components/ui/button.component.js:46' }
);
```

3. **Validate tokens:**
```javascript
const validation = validateTokenUsage(prompt);
// Should be under 4000 tokens
```

4. **Send to AI** (Claude/ChatGPT)

5. **Apply fix** from AI response

6. **Resume workflow** from checkpoint if needed

## Tips

- ✅ Start with symptom identification
- ✅ Use challenge-specific prompts (better context)
- ✅ Validate token usage before sending
- ✅ Break complex issues into prompt chains
- ✅ Use compression for large contexts
- ✅ Save checkpoints for workflow resume

## Contributing

To add new challenges:

1. Edit `workflow-challenges.json`
2. Add entry to `critical_challenges` object
3. Include: priority, symptoms, root_causes, debug_prompt, fix_template
4. Test with `generateDebugPrompt()` helper

## License

Part of the Toilet Review System frontend architecture.

