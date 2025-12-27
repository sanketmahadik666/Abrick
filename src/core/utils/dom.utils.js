/**
 * DOM Utilities
 * Provides safe DOM manipulation functions
 * Follows Single Responsibility Principle - only handles DOM operations
 */

import AppConfig from '../config/app.config.js';

/**
 * Safe element selector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (defaults to document)
 * @returns {Element|null} Found element or null
 */
export function $(selector, context = document) {
    try {
        return context.querySelector(selector);
    } catch (error) {
        console.warn(`[DOM] Invalid selector: ${selector}`, error);
        return null;
    }
}

/**
 * Safe element selector for multiple elements
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (defaults to document)
 * @returns {NodeList} Found elements
 */
export function $$(selector, context = document) {
    try {
        return context.querySelectorAll(selector);
    } catch (error) {
        console.warn(`[DOM] Invalid selector: ${selector}`, error);
        return [];
    }
}

/**
 * Safe element creation
 * @param {string} tagName - HTML tag name
 * @param {object} attributes - Element attributes
 * @param {string|Element} content - Text content or child element
 * @returns {Element} Created element
 */
export function createElement(tagName, attributes = {}, content = null) {
    try {
        const element = document.createElement(tagName);

        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });

        // Add content
        if (content) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof Element) {
                element.appendChild(content);
            }
        }

        return element;
    } catch (error) {
        console.error(`[DOM] Error creating element ${tagName}:`, error);
        return null;
    }
}

/**
 * Safe event listener attachment with automatic cleanup
 * @param {Element} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {object} options - Event listener options
 * @returns {Function} Cleanup function
 */
export function addEventListener(element, event, handler, options = {}) {
    if (!element || !event || !handler) {
        console.warn('[DOM] Invalid parameters for addEventListener');
        return () => {};
    }

    try {
        element.addEventListener(event, handler, options);

        // Return cleanup function
        return () => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('[DOM] Error removing event listener:', error);
            }
        };
    } catch (error) {
        console.error(`[DOM] Error adding event listener for ${event}:`, error);
        return () => {};
    }
}

/**
 * Debounced event handler
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = AppConfig.ui.debounceDelay) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttled event handler
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Safe class manipulation
 * @param {Element} element - Target element
 * @param {string} operation - Operation: 'add', 'remove', 'toggle', 'has'
 * @param {string} className - Class name
 * @returns {boolean} Success status
 */
export function manipulateClass(element, operation, className) {
    if (!element || !className) {
        return false;
    }

    try {
        switch (operation) {
            case 'add':
                element.classList.add(className);
                return true;
            case 'remove':
                element.classList.remove(className);
                return true;
            case 'toggle':
                return element.classList.toggle(className);
            case 'has':
                return element.classList.contains(className);
            default:
                console.warn(`[DOM] Unknown class operation: ${operation}`);
                return false;
        }
    } catch (error) {
        console.error(`[DOM] Error manipulating class ${className}:`, error);
        return false;
    }
}

/**
 * Safe style manipulation
 * @param {Element} element - Target element
 * @param {string|object} property - CSS property or object of properties
 * @param {string} value - CSS value (if property is string)
 */
export function setStyle(element, property, value) {
    if (!element) return;

    try {
        if (typeof property === 'object') {
            Object.assign(element.style, property);
        } else if (typeof property === 'string' && value !== undefined) {
            element.style[property] = value;
        }
    } catch (error) {
        console.error(`[DOM] Error setting style:`, error);
    }
}

/**
 * Safe attribute manipulation
 * @param {Element} element - Target element
 * @param {string} name - Attribute name
 * @param {string} value - Attribute value
 */
export function setAttribute(element, name, value) {
    if (!element || !name) return;

    try {
        element.setAttribute(name, value);
    } catch (error) {
        console.error(`[DOM] Error setting attribute ${name}:`, error);
    }
}

/**
 * Safe innerHTML manipulation with XSS protection
 * @param {Element} element - Target element
 * @param {string} html - HTML content
 */
export function setHTML(element, html) {
    if (!element || typeof html !== 'string') return;

    try {
        // Basic XSS protection - only allow safe HTML
        const sanitized = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');

        element.innerHTML = sanitized;
    } catch (error) {
        console.error(`[DOM] Error setting HTML:`, error);
    }
}

/**
 * Safe text content manipulation
 * @param {Element} element - Target element
 * @param {string} text - Text content
 */
export function setText(element, text) {
    if (!element) return;

    try {
        element.textContent = text || '';
    } catch (error) {
        console.error(`[DOM] Error setting text:`, error);
    }
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Target element
 * @returns {boolean} Visibility status
 */
export function isElementVisible(element) {
    if (!element) return false;

    try {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 &&
               rect.left >= 0 &&
               rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
               rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    } catch (error) {
        console.error(`[DOM] Error checking element visibility:`, error);
        return false;
    }
}

/**
 * Get element dimensions safely
 * @param {Element} element - Target element
 * @returns {object} Dimensions object
 */
export function getDimensions(element) {
    if (!element) return { width: 0, height: 0 };

    try {
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right
        };
    } catch (error) {
        console.error(`[DOM] Error getting dimensions:`, error);
        return { width: 0, height: 0 };
    }
}

/**
 * Focus element safely
 * @param {Element} element - Target element
 */
export function focusElement(element) {
    if (!element || typeof element.focus !== 'function') return;

    try {
        // Use setTimeout to ensure element is rendered
        setTimeout(() => {
            element.focus();
        }, 0);
    } catch (error) {
        console.error(`[DOM] Error focusing element:`, error);
    }
}
