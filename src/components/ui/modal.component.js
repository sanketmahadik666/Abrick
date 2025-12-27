/**
 * Modal Component
 * Reusable modal dialog component with backdrop and animations
 * Follows Component Pattern with proper accessibility and lifecycle
 */

import { BaseComponent } from '../base/base.component.js';
import { createElement } from '../../core/utils/dom.utils.js';
import AppConfig from '../../core/config/app.config.js';

/**
 * Modal Component Class
 * Extends BaseComponent for reusable modal functionality
 */
export class ModalComponent extends BaseComponent {
    constructor(options = {}) {
        super({
            title: '',
            content: '',
            size: 'medium', // small, medium, large, fullscreen
            closable: true,
            backdrop: true, // true, false, 'static'
            keyboard: true, // Close on ESC key
            focus: true, // Focus management
            animation: true,
            onClose: null,
            onOpen: null,
            ...options
        });

        this.isOpen = false;
        this.backdropElement = null;
        this.focusTrap = null;
        this.previousFocus = null;
    }

    /**
     * Get the HTML tag name
     * @returns {string} Tag name
     */
    getTagName() {
        return 'div';
    }

    /**
     * Get CSS class name
     * @returns {string} Class name
     */
    getClassName() {
        const baseClass = 'modal';
        const sizeClass = `modal-${this.options.size}`;
        const stateClasses = [];

        if (this.isOpen) stateClasses.push('open');
        if (this.options.animation) stateClasses.push('animated');

        return `${baseClass} ${sizeClass} ${stateClasses.join(' ')}`.trim();
    }

    /**
     * Get additional attributes
     * @returns {object} Attributes object
     */
    getAttributes() {
        return {
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': 'modal-title',
            'aria-describedby': 'modal-content',
            tabindex: '-1'
        };
    }

    /**
     * Get the HTML template
     * @returns {string} HTML template
     */
    getTemplate() {
        const closeButton = this.options.closable ? `
            <button type="button" class="modal-close" aria-label="Close modal">
                <span aria-hidden="true">&times;</span>
            </button>
        ` : '';

        return `
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    ${this.options.title ? `
                        <div class="modal-header">
                            <h5 id="modal-title" class="modal-title">${this.options.title}</h5>
                            ${closeButton}
                        </div>
                    ` : closeButton ? `
                        <div class="modal-header">
                            ${closeButton}
                        </div>
                    ` : ''}
                    <div id="modal-content" class="modal-body">
                        ${this.options.content || ''}
                    </div>
                    <div class="modal-footer">
                        <!-- Footer content will be added dynamically -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    async setupEventListeners() {
        // Close button
        if (this.options.closable) {
            const closeButton = this.element.querySelector('.modal-close');
            if (closeButton) {
                this.addEventListener('click', '.modal-close', (event) => {
                    event.preventDefault();
                    this.close();
                });
            }
        }

        // Backdrop click
        if (this.options.backdrop && this.options.backdrop !== 'static') {
            this.addEventListener('click', (event) => {
                if (event.target === this.element) {
                    this.close();
                }
            });
        }

        // Keyboard events
        if (this.options.keyboard) {
            this.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    if (this.options.closable) {
                        this.close();
                    }
                }

                // Tab navigation within modal
                if (event.key === 'Tab') {
                    this.handleTabNavigation(event);
                }
            });
        }
    }

    /**
     * Attach component to DOM
     */
    async attachToDOM() {
        // Create backdrop
        if (this.options.backdrop) {
            this.backdropElement = createElement('div', {
                className: `modal-backdrop ${this.options.animation ? 'animated' : ''}`
            });
            document.body.appendChild(this.backdropElement);
        }

        // Attach modal to body
        document.body.appendChild(this.element);

        // Set up focus trap
        if (this.options.focus) {
            this.setupFocusTrap();
        }
    }

    /**
     * Detach from DOM
     */
    detachFromDOM() {
        // Remove backdrop
        if (this.backdropElement && this.backdropElement.parentNode) {
            this.backdropElement.parentNode.removeChild(this.backdropElement);
            this.backdropElement = null;
        }

        // Remove modal
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /**
     * Setup focus trap for accessibility
     */
    setupFocusTrap() {
        // Store currently focused element
        this.previousFocus = document.activeElement;

        // Get all focusable elements within modal
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        this.focusTrap = {
            first: focusableElements[0],
            last: focusableElements[focusableElements.length - 1]
        };

        // Focus first element
        if (this.focusTrap.first) {
            setTimeout(() => {
                this.focusTrap.first.focus();
            }, 100);
        }
    }

    /**
     * Handle tab navigation within modal
     * @param {KeyboardEvent} event - Key event
     */
    handleTabNavigation(event) {
        if (!this.focusTrap) return;

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === this.focusTrap.first) {
                event.preventDefault();
                this.focusTrap.last.focus();
            }
        } else {
            // Tab
            if (document.activeElement === this.focusTrap.last) {
                event.preventDefault();
                this.focusTrap.first.focus();
            }
        }
    }

    /**
     * Open the modal
     * @returns {Promise} Open promise
     */
    async open() {
        if (this.isOpen) return;

        console.log(`[MODAL] Opening modal: ${this.options.title || 'Untitled'}`);

        // Show modal
        this.isOpen = true;
        this.element.classList.add('open');
        document.body.classList.add('modal-open');

        // Show backdrop
        if (this.backdropElement) {
            this.backdropElement.classList.add('show');
        }

        // Call onOpen callback
        if (this.options.onOpen && typeof this.options.onOpen === 'function') {
            await this.options.onOpen();
        }

        // Trigger custom event
        this.element.dispatchEvent(new CustomEvent('modal:opened', {
            detail: { modal: this }
        }));

        console.log(`[MODAL] Modal opened: ${this.options.title || 'Untitled'}`);
    }

    /**
     * Close the modal
     * @returns {Promise} Close promise
     */
    async close() {
        if (!this.isOpen) return;

        console.log(`[MODAL] Closing modal: ${this.options.title || 'Untitled'}`);

        // Hide modal
        this.isOpen = false;
        this.element.classList.remove('open');
        document.body.classList.remove('modal-open');

        // Hide backdrop
        if (this.backdropElement) {
            this.backdropElement.classList.remove('show');
        }

        // Restore focus
        if (this.previousFocus && typeof this.previousFocus.focus === 'function') {
            setTimeout(() => {
                this.previousFocus.focus();
            }, 100);
        }

        // Call onClose callback
        if (this.options.onClose && typeof this.options.onClose === 'function') {
            await this.options.onClose();
        }

        // Trigger custom event
        this.element.dispatchEvent(new CustomEvent('modal:closed', {
            detail: { modal: this }
        }));

        console.log(`[MODAL] Modal closed: ${this.options.title || 'Untitled'}`);
    }

    /**
     * Update modal content
     * @param {object} data - Update data
     */
    async updateContent(data) {
        if (data.title !== undefined) {
            this.options.title = data.title;
            const titleElement = this.element.querySelector('#modal-title');
            if (titleElement) {
                titleElement.textContent = data.title;
            }
        }

        if (data.content !== undefined) {
            this.options.content = data.content;
            const contentElement = this.element.querySelector('#modal-content');
            if (contentElement) {
                contentElement.innerHTML = data.content;
            }
        }

        if (data.size !== undefined) {
            this.options.size = data.size;
            this.element.className = this.getClassName();
        }
    }

    /**
     * Set modal title
     * @param {string} title - Modal title
     */
    setTitle(title) {
        this.setData({ title });
    }

    /**
     * Set modal content
     * @param {string} content - Modal content (HTML)
     */
    setContent(content) {
        this.setData({ content });
    }

    /**
     * Set modal size
     * @param {string} size - Modal size (small, medium, large, fullscreen)
     */
    setSize(size) {
        this.setData({ size });
    }

    /**
     * Add footer button
     * @param {object} buttonOptions - Button options
     * @param {string} buttonOptions.text - Button text
     * @param {string} buttonOptions.variant - Button variant
     * @param {Function} buttonOptions.onClick - Click handler
     */
    addFooterButton(buttonOptions) {
        const footer = this.element.querySelector('.modal-footer');
        if (!footer) return;

        // Import ButtonComponent dynamically to avoid circular dependencies
        import('./button.component.js').then(({ ButtonComponent }) => {
            const button = new ButtonComponent({
                text: buttonOptions.text,
                variant: buttonOptions.variant || 'secondary',
                onClick: buttonOptions.onClick
            });

            button.init().then(() => {
                footer.appendChild(button.element);
            });
        });
    }

    /**
     * Clear footer buttons
     */
    clearFooterButtons() {
        const footer = this.element.querySelector('.modal-footer');
        if (footer) {
            footer.innerHTML = '';
        }
    }

    /**
     * Check if modal is currently open
     * @returns {boolean} Open state
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * Toggle modal visibility
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Get modal data
     * @returns {object} Modal data
     */
    getModalData() {
        return {
            title: this.options.title,
            content: this.options.content,
            size: this.options.size,
            isOpen: this.isOpen
        };
    }
}

// Static method to create and show modal
ModalComponent.show = async function(options) {
    const modal = new ModalComponent(options);
    await modal.init();
    await modal.open();
    return modal;
};

// Export the component class
export { ModalComponent };
