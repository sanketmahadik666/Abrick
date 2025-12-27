/**
 * DOM Utilities Unit Tests
 * Tests utility functions for DOM manipulation
 */

import { $ } from './dom.utils.js';

describe('DOM Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-container">
        <button class="btn btn-primary">Test Button</button>
        <input type="text" id="test-input" value="test value">
        <div class="test-class">Test Content</div>
        <div class="test-class">Another Content</div>
      </div>
    `;
  });

  describe('$ (Query Selector)', () => {
    test('should select element by ID', () => {
      const element = $('#test-container');
      expect(element).toBeInTheDocument();
      expect(element.id).toBe('test-container');
    });

    test('should select element by class', () => {
      const element = $('.btn');
      expect(element).toBeInTheDocument();
      expect(element).toHaveClass('btn', 'btn-primary');
    });

    test('should return null for non-existent element', () => {
      const element = $('#non-existent');
      expect(element).toBeNull();
    });
  });

  describe('DOM manipulation helpers', () => {
    test('should handle element creation and manipulation', () => {
      const container = $('#test-container');
      expect(container).toBeInTheDocument();

      // Test child elements
      const button = container.querySelector('.btn');
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('Test Button');
    });

    test('should handle input values', () => {
      const input = $('#test-input');
      expect(input).toBeInTheDocument();
      expect(input.value).toBe('test value');
    });
  });

  describe('Multiple element selection', () => {
    test('should select multiple elements by class', () => {
      const elements = document.querySelectorAll('.test-class');
      expect(elements.length).toBe(2);

      elements.forEach(element => {
        expect(element).toHaveClass('test-class');
      });
    });
  });
});
