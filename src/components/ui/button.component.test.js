/**
 * Button Component Unit Tests
 * Tests button component functionality and rendering
 */

import { ButtonComponent } from './button.component.js';

describe('ButtonComponent', () => {
  let buttonComponent;
  let container;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'button-container';
    document.body.appendChild(container);

    // Create button component
    buttonComponent = new ButtonComponent({
      container: '#button-container',
      text: 'Test Button',
      variant: 'primary',
      size: 'medium'
    });
  });

  afterEach(() => {
    // Clean up
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    buttonComponent = null;
  });

  describe('Initialization', () => {
    test('should create button element', async () => {
      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('Test Button');
    });

    test('should apply correct classes', async () => {
      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toHaveClass('btn', 'btn-primary', 'btn-medium');
    });

    test('should handle different variants', async () => {
      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Secondary Button',
        variant: 'secondary'
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toHaveClass('btn', 'btn-secondary');
    });

    test('should handle different sizes', async () => {
      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Small Button',
        size: 'small'
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toHaveClass('btn', 'btn-small');
    });
  });

  describe('Button States', () => {
    test('should handle disabled state', async () => {
      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Disabled Button',
        disabled: true
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('btn-disabled');
    });

    test('should handle loading state', async () => {
      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Loading Button',
        loading: true
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toHaveClass('btn-loading');
      expect(button.querySelector('.btn-spinner')).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    test('should handle click events', async () => {
      const mockCallback = jest.fn();

      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Clickable Button',
        onClick: mockCallback
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      button.click();

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    test('should prevent default on submit type', async () => {
      const mockCallback = jest.fn();

      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Submit Button',
        type: 'submit',
        onClick: mockCallback
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      const mockEvent = { preventDefault: jest.fn() };

      // Simulate form submission
      button.click();

      expect(mockCallback).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', async () => {
      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Accessible Button',
        ariaLabel: 'Custom label'
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    test('should support keyboard navigation', async () => {
      const mockCallback = jest.fn();

      buttonComponent = new ButtonComponent({
        container: '#button-container',
        text: 'Keyboard Button',
        onClick: mockCallback
      });

      await buttonComponent.init();

      const button = container.querySelector('.btn');

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(enterEvent);

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('API Methods', () => {
    test('should update button text', async () => {
      await buttonComponent.init();

      buttonComponent.setText('Updated Text');

      const button = container.querySelector('.btn');
      expect(button.textContent).toBe('Updated Text');
    });

    test('should enable/disable button', async () => {
      await buttonComponent.init();

      buttonComponent.setDisabled(true);
      expect(container.querySelector('.btn')).toBeDisabled();

      buttonComponent.setDisabled(false);
      expect(container.querySelector('.btn')).not.toBeDisabled();
    });

    test('should show/hide loading state', async () => {
      await buttonComponent.init();

      buttonComponent.setLoading(true);
      expect(container.querySelector('.btn')).toHaveClass('btn-loading');

      buttonComponent.setLoading(false);
      expect(container.querySelector('.btn')).not.toHaveClass('btn-loading');
    });
  });
});
