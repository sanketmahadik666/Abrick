/**
 * Button Component
 * Reusable button component with various styles and states
 * Follows Component Pattern with lifecycle management
 */

import { BaseComponent } from '../base/base.component.js';
import { createElement } from '../../core/utils/dom.utils.js';
import AppConfig from '../../core/config/app.config.js';

/**
 * Button Component Class
 * Extends BaseComponent for reusable button functionality
 */
export class ButtonComponent extends BaseComponent {
    constructor(options = {}) {
        super({
            text: '',
            type: 'button',
            variant: 'primary', // primary, secondary, danger, success
            size: 'medium', // small, medium, large
            disabled: false,
            loading: false,
            icon: null,
            onClick: null,
            ...options
        });
    }

    /**
     * Get the HTML tag name
     * @returns {string} Tag name
     */
    getTagName() {
        return 'button';
    }

    /**
     * Get CSS class name
     * @returns {string} Class name
     */
    getClassName() {
        const baseClass = 'btn';
        const variantClass = `btn-${this.options.variant}`;
        const sizeClass = `btn-${this.options.size}`;
        const stateClasses = [];

        if (this.options.disabled) stateClasses.push('disabled');
        if (this.options.loading) stateClasses.push('loading');

        return `${baseClass} ${variantClass} ${sizeClass} ${stateClasses.join(' ')}`.trim();
    }

    /**
     * Get additional attributes
     * @returns {object} Attributes object
     */
    getAttributes() {
        return {
            type: this.options.type,
            disabled: this.options.disabled || this.options.loading,
            'aria-label': this.options.ariaLabel || this.options.text
        };
    }

    /**
     * Get the HTML template
     * @returns {string} HTML template
     */
    getTemplate() {
        const iconHtml = this.options.icon ? `<span class="btn-icon">${this.options.icon}</span>` : '';
        const textHtml = this.options.text ? `<span class="btn-text">${this.options.text}</span>` : '';
        const loadingHtml = this.options.loading ? '<span class="btn-spinner"></span>' : '';

        return `${iconHtml}${textHtml}${loadingHtml}`;
    }

    /**
     * Setup event listeners
     */
    async setupEventListeners() {
        if (this.options.onClick && typeof this.options.onClick === 'function') {
            this.addEventListener('click', (event) => {
                if (!this.options.disabled && !this.options.loading) {
                    this.options.onClick(event);
                }
            });
        }

        // Handle keyboard activation
        this.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (!this.options.disabled && !this.options.loading) {
                    this.element.click();
                }
            }
        });
    }

    /**
     * Update component content
     * @param {object} data - Update data
     */
    async updateContent(data) {
        if (data.text !== undefined) {
            this.options.text = data.text;
            const textElement = this.element.querySelector('.btn-text');
            if (textElement) {
                textElement.textContent = data.text;
            }
        }

        if (data.disabled !== undefined) {
            this.options.disabled = data.disabled;
            this.element.disabled = data.disabled;
            this.element.classList.toggle('disabled', data.disabled);
        }

        if (data.loading !== undefined) {
            this.options.loading = data.loading;
            this.element.classList.toggle('loading', data.loading);
            this.element.disabled = data.loading;

            // Update or create spinner
            let spinner = this.element.querySelector('.btn-spinner');
            if (data.loading && !spinner) {
                spinner = createElement('span', { className: 'btn-spinner' });
                this.element.appendChild(spinner);
            } else if (!data.loading && spinner) {
                spinner.remove();
            }
        }

        if (data.variant !== undefined) {
            this.options.variant = data.variant;
            this.updateClassName();
        }

        if (data.size !== undefined) {
            this.options.size = data.size;
            this.updateClassName();
        }

        if (data.icon !== undefined) {
            this.options.icon = data.icon;
            let iconElement = this.element.querySelector('.btn-icon');
            if (data.icon && !iconElement) {
                iconElement = createElement('span', { className: 'btn-icon' });
                this.element.insertBefore(iconElement, this.element.firstChild);
            }
            if (iconElement) {
                iconElement.innerHTML = data.icon;
            }
        }
    }

    /**
     * Update class name
     */
    updateClassName() {
        this.element.className = this.getClassName();
    }

    /**
     * Set button text
     * @param {string} text - Button text
     */
    setText(text) {
        this.setData({ text });
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.setData({ loading });
    }

    /**
     * Set disabled state
     * @param {boolean} disabled - Disabled state
     */
    setDisabled(disabled) {
        this.setData({ disabled });
    }

    /**
     * Set button variant
     * @param {string} variant - Button variant (primary, secondary, danger, success)
     */
    setVariant(variant) {
        this.setData({ variant });
    }

    /**
     * Simulate click
     */
    click() {
        if (this.element && !this.options.disabled && !this.options.loading) {
            this.element.click();
        }
    }

    /**
     * Focus the button
     */
    focus() {
        if (this.element) {
            this.element.focus();
        }
    }

    /**
     * Get button value (for form submission)
     * @returns {string} Button value
     */
    getValue() {
        return this.element ? this.element.value : '';
    }

    /**
     * Set button value
     * @param {string} value - Button value
     */
    setValue(value) {
        if (this.element) {
            this.element.value = value;
        }
    }
}

// Export the component class
export { ButtonComponent };
