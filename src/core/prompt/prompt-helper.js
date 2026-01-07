/**
 * Prompt Helper Utilities
 * Utilities for generating optimized prompts and managing workflow debugging
 * Token-efficient prompt generation for AI-assisted debugging
 */

/**
 * Load workflow challenges data
 * Supports multiple import methods for different environments
 */
let workflowChallenges = null;

// Try to load JSON - adapt based on your environment
async function loadWorkflowChallenges() {
    if (workflowChallenges) return workflowChallenges;
    
    try {
        // Method 1: Fetch for browser
        const response = await fetch('/src/core/prompt/workflow-challenges.json');
        if (response.ok) {
            workflowChallenges = await response.json();
            return workflowChallenges;
        }
    } catch (e) {
        // Method 2: Try require for Node.js (if available)
        try {
            if (typeof require !== 'undefined') {
                workflowChallenges = require('./workflow-challenges.json');
                return workflowChallenges;
            }
        } catch (e2) {
            console.warn('[PROMPT] Could not load workflow-challenges.json');
        }
    }
    
    // Return empty object if all methods fail
    return {};
}

// Export function to load challenges
export async function getWorkflowChallenges() {
    return await loadWorkflowChallenges();
}

/**
 * Generate debug prompt for a specific challenge
 * @param {string} challengeKey - Key from workflow-challenges.json
 * @param {object} context - Context data for the prompt
 * @returns {object} Optimized prompt object
 */
export async function generateDebugPrompt(challengeKey, context = {}) {
    const challenges = await getWorkflowChallenges();
    if (!challenges.critical_challenges) {
        throw new Error('Workflow challenges not loaded. Call getWorkflowChallenges() first.');
    }
    const challenge = challenges.critical_challenges[challengeKey];
    if (!challenge) {
        throw new Error(`Challenge not found: ${challengeKey}`);
    }

    const { debug_prompt } = challenge;
    const { user_prompt_template, required_context } = debug_prompt;

    // Build prompt by replacing placeholders
    let prompt = user_prompt_template;
    Object.entries(context).forEach(([key, value]) => {
        prompt = prompt.replace(`{${key}}`, value);
    });

    // Validate required context
    const missing = required_context.filter(req => !context[req.toLowerCase().replace(/\s+/g, '_')]);
    if (missing.length > 0) {
        console.warn(`Missing context for prompt: ${missing.join(', ')}`);
    }

    return {
        system_context: debug_prompt.system_context,
        user_prompt: prompt,
        challenge_key: challengeKey,
        priority: challenge.priority,
        optimization_hints: debug_prompt.optimization_hints,
        fix_template: challenge.fix_template
    };
}

/**
 * Compress context for token optimization
 * @param {object} context - Full context object
 * @returns {object} Compressed context
 */
export async function compressContext(context) {
    const challenges = await getWorkflowChallenges();
    const guidelines = challenges.prompt_guidelines?.token_optimization?.context_compression || {
        include: ['error_message', 'component_name', 'file_path', 'line_range', 'expected_value'],
        exclude: ['full_file_content', 'complete_stack_trace', 'all_console_logs']
    };
    
    const compressed = {};
    guidelines.include.forEach(key => {
        if (context[key]) {
            compressed[key] = context[key];
        }
    });

    return compressed;
}

/**
 * Generate component-specific debug prompt
 * @param {string} componentName - Component class name
 * @param {string} errorMessage - Error message
 * @param {object} additionalContext - Additional context
 * @returns {object} Optimized prompt
 */
export async function generateComponentPrompt(componentName, errorMessage, additionalContext = {}) {
    const challenges = await getWorkflowChallenges();
    const template = challenges.prompt_guidelines?.component_specific_prompts?.template || {
        header: `Debug ${componentName} component issue`,
        optimization_needs: [
            "Check init() lifecycle hook",
            "Verify DOM element attachment",
            "Ensure event listener cleanup",
            "Validate state subscriptions",
            "Check async operation completion"
        ],
        expected_output: "Fixed component code with proper lifecycle management"
    };
    
    const context = {
        component_name: componentName,
        error_message: errorMessage,
        ...additionalContext
    };

    const prompt = `
Debug ${componentName} component issue.

Component class: ${componentName}
Error: ${errorMessage}
${additionalContext.file_path ? `File: ${additionalContext.file_path}` : ''}
${additionalContext.line_range ? `Lines: ${additionalContext.line_range}` : ''}

${template.optimization_needs.map(need => `- ${need}`).join('\n')}
`.trim();

    return {
        system_context: template.header,
        user_prompt: prompt,
        optimization_needs: template.optimization_needs,
        expected_output: template.expected_output
    };
}

/**
 * Generate workflow resume prompt
 * @param {object} checkpoint - Checkpoint data
 * @param {string} errorMessage - Error that occurred
 * @returns {string} Resume prompt
 */
export async function generateResumePrompt(checkpoint, errorMessage) {
    const challenges = await getWorkflowChallenges();
    const template = challenges.prompt_guidelines?.error_recovery_prompts?.resume_template || 
        "Workflow interrupted at {step}. Error: {error}. Current state: {state}. Resume from: {resume_point}. Fix error and continue.";
    
    return template
        .replace('{step}', checkpoint.next_step || 'unknown')
        .replace('{error}', errorMessage)
        .replace('{state}', checkpoint.state || 'unknown')
        .replace('{resume_point}', checkpoint.component || 'beginning');
}

/**
 * Create prompt chain for complex issues
 * @param {string} challengeKey - Challenge key
 * @param {object} initialContext - Initial context
 * @returns {Array} Array of prompt steps
 */
export async function createPromptChain(challengeKey, initialContext = {}) {
    const challenges = await getWorkflowChallenges();
    const chainTemplate = challenges.prompt_guidelines?.prompt_chaining?.chain_template || [
        {
            step: 1,
            type: "diagnosis",
            prompt: "Identify the issue: {symptom}. Check {relevant_files}. What is the root cause?",
            expected_output: "Root cause analysis with file:line references"
        },
        {
            step: 2,
            type: "solution",
            prompt: "Based on diagnosis: {root_cause}, provide fix for {component/file}. Include error handling.",
            expected_output: "Complete code fix with context"
        },
        {
            step: 3,
            type: "verification",
            prompt: "Verify fix for {component} handles edge cases: {edge_cases}. Add tests if needed.",
            expected_output: "Edge case handling and test suggestions"
        }
    ];
    
    return chainTemplate.map((step, index) => {
        let prompt = step.prompt;
        
        // Replace placeholders with context
        Object.entries(initialContext).forEach(([key, value]) => {
            prompt = prompt.replace(`{${key}}`, value);
        });

        return {
            step: index + 1,
            type: step.type,
            prompt: prompt,
            expected_output: step.expected_output,
            depends_on: index > 0 ? index : null
        };
    });
}

/**
 * Estimate token count for prompt
 * @param {string} prompt - Prompt text
 * @returns {number} Estimated token count (rough estimate: 1 token ≈ 4 characters)
 */
export function estimateTokens(prompt) {
    return Math.ceil(prompt.length / 4);
}

/**
 * Validate prompt fits within token limits
 * @param {object} promptObj - Prompt object with user_prompt
 * @returns {object} Validation result
 */
export async function validateTokenUsage(promptObj) {
    const challenges = await getWorkflowChallenges();
    const limits = challenges.prompt_guidelines?.token_optimization || {
        max_context_tokens: 4000,
        max_response_tokens: 2000
    };
    const totalTokens = estimateTokens(promptObj.user_prompt || '');
    
    return {
        valid: totalTokens <= limits.max_context_tokens,
        tokens: totalTokens,
        limit: limits.max_context_tokens,
        percentage: Math.round((totalTokens / limits.max_context_tokens) * 100),
        suggestions: totalTokens > limits.max_context_tokens ? [
            'Reduce file paths to relative paths only',
            'Remove unnecessary console logs',
            'Focus on specific error lines only',
            'Remove full stack traces (keep first 3 lines)'
        ] : []
    };
}

/**
 * List available challenges with priorities
 * @returns {Array} Array of challenge summaries
 */
export async function listChallenges() {
    const challenges = await getWorkflowChallenges();
    if (!challenges.critical_challenges) return [];
    return Object.entries(challenges.critical_challenges).map(([key, challenge]) => ({
        key,
        priority: challenge.priority,
        frequency: challenge.frequency,
        description: challenge.description,
        affected_files: challenge.affected_files.length
    })).sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}

/**
 * Get optimization recommendations for a component
 * @param {string} componentName - Component name
 * @returns {object} Optimization recommendations
 */
export async function getOptimizations(componentName) {
    const challenges = await getWorkflowChallenges();
    const recommendations = challenges.optimization_recommendations?.components || {};
    const key = componentName.toLowerCase().replace('component', '').replace('page', '') + '_component";
    
    return recommendations[key] || recommendations[componentName.toLowerCase()] || null;
}

// Export default for convenience
export default {
    getWorkflowChallenges,
    generateDebugPrompt,
    generateDebugPromptSync,
    compressContext,
    generateComponentPrompt,
    generateResumePrompt,
    createPromptChain,
    estimateTokens,
    validateTokenUsage,
    listChallenges,
    getOptimizations
};

