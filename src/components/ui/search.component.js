/**
 * Search Component
 * Advanced search functionality with filtering, suggestions, and real-time results
 * Follows modular architecture with event-driven communication
 */

import { $ } from '../../core/utils/dom.utils.js';
import appStore from '../../state/store/app.store.js';
import AppConfig from '../../core/config/app.config.js';

/**
 * SearchComponent Class
 * Handles search input, filtering, suggestions, and results management
 */
export class SearchComponent {
    constructor(options = {}) {
        this.options = {
            container: '#search-container',
            placeholder: 'Search for toilets...',
            minQueryLength: 2,
            maxSuggestions: 5,
            debounceDelay: 300,
            enableVoiceSearch: false,
            enableAdvancedSearch: true,
            showFilters: true,
            ...options
        };

        // Component state
        this.state = {
            query: '',
            filters: {
                type: 'all', // all, public, private
                rating: 'all', // all, 1-5
                facilities: [],
                distance: 'all' // all, 1km, 5km, 10km
            },
            suggestions: [],
            results: [],
            isLoading: false,
            isExpanded: false,
            voiceListening: false
        };

        // DOM elements
        this.elements = {};

        // Event handlers
        this.handlers = {
            input: this.handleInput.bind(this),
            focus: this.handleFocus.bind(this),
            blur: this.handleBlur.bind(this),
            keydown: this.handleKeydown.bind(this),
            suggestionClick: this.handleSuggestionClick.bind(this),
            filterChange: this.handleFilterChange.bind(this),
            voiceClick: this.handleVoiceClick.bind(this),
            clearClick: this.handleClearClick.bind(this)
        };

        // Debounce timer
        this.debounceTimer = null;

        // Voice recognition
        this.recognition = null;

        console.log('[SEARCH] Search component initialized');
    }

    /**
     * Initialize the search component
     * @returns {Promise} Initialization promise
     */
    async init() {
        console.log('[SEARCH] Initializing search component...');

        try {
            this.createDOM();
            this.attachEventListeners();
            this.initializeVoiceSearch();
            this.loadInitialData();

            console.log('[SEARCH] Search component initialized successfully');
        } catch (error) {
            console.error('[SEARCH] Error initializing search component:', error);
            throw error;
        }
    }

    /**
     * Create the DOM structure
     */
    createDOM() {
        const container = $(this.options.container);
        if (!container) {
            throw new Error(`Search container not found: ${this.options.container}`);
        }

        container.innerHTML = this.render();

        // Cache DOM elements
        this.elements = {
            container: container,
            input: $('.search__input', container),
            icon: $('.search__icon', container),
            dropdown: $('.search__dropdown', container),
            suggestions: $('.search__suggestions', container),
            filters: $('.search__filters', container),
            results: $('.search__results', container),
            advanced: $('.search--advanced', container),
            voiceBtn: $('.search__voice-btn', container),
            clearBtn: $('.search__clear-btn', container)
        };
    }

    /**
     * Render the search component HTML
     * @returns {string} HTML string
     */
    render() {
        return `
            <div class="search ${this.options.showFilters ? 'search--with-filters' : ''}">
                <input
                    type="text"
                    class="search__input"
                    placeholder="${this.options.placeholder}"
                    autocomplete="off"
                    spellcheck="false"
                    aria-label="Search toilets"
                    aria-expanded="false"
                    aria-haspopup="listbox"
                    role="combobox"
                />
                <span class="search__icon" aria-hidden="true">🔍</span>
                ${this.options.enableVoiceSearch ? `
                    <button
                        class="search__voice-btn"
                        type="button"
                        aria-label="Voice search"
                        title="Voice search"
                    >
                        🎤
                    </button>
                ` : ''}
                <button
                    class="search__clear-btn btn btn-ghost btn-small"
                    type="button"
                    aria-label="Clear search"
                    style="display: none;"
                >
                    ✕
                </button>

                <!-- Search Suggestions -->
                <div class="search__suggestions" role="listbox" aria-label="Search suggestions" style="display: none;">
                    ${this.renderSuggestions()}
                </div>

                <!-- Search Dropdown -->
                <div class="search__dropdown" role="listbox" aria-label="Search results" style="display: none;">
                    ${this.renderDropdown()}
                </div>
            </div>

            <!-- Search Filters -->
            ${this.options.showFilters ? this.renderFilters() : ''}

            <!-- Advanced Search -->
            ${this.options.enableAdvancedSearch ? this.renderAdvancedSearch() : ''}

            <!-- Search Results -->
            <div class="search__results" style="display: none;">
                ${this.renderResults()}
            </div>
        `;
    }

    /**
     * Render search suggestions
     * @returns {string} HTML string
     */
    renderSuggestions() {
        if (!this.state.suggestions.length) {
            return '<div class="search__no-suggestions">No suggestions available</div>';
        }

        return this.state.suggestions.slice(0, this.options.maxSuggestions).map((suggestion, index) => `
            <div
                class="search__suggestion-item"
                role="option"
                tabindex="-1"
                data-index="${index}"
                data-type="${suggestion.type}"
                data-id="${suggestion.id}"
            >
                <span class="search__suggestion-icon" aria-hidden="true">${this.getSuggestionIcon(suggestion.type)}</span>
                <span class="search__suggestion-text">${this.highlightQuery(suggestion.text)}</span>
                <span class="search__suggestion-type">${suggestion.type}</span>
            </div>
        `).join('');
    }

    /**
     * Render search dropdown
     * @returns {string} HTML string
     */
    renderDropdown() {
        if (!this.state.results.length) {
            return '<div class="search__no-results">No results found</div>';
        }

        return this.state.results.slice(0, 10).map(result => `
            <button
                class="search__dropdown-item"
                type="button"
                data-id="${result.id}"
                data-type="${result.type}"
            >
                <span class="search__result-icon" aria-hidden="true">${this.getResultIcon(result)}</span>
                <div class="search__result-content">
                    <div class="search__result-title">${this.highlightQuery(result.name)}</div>
                    <div class="search__result-subtitle">${result.location}</div>
                    <div class="search__result-meta">
                        ${result.averageRating ? `⭐ ${result.averageRating.toFixed(1)}` : 'No rating'}
                        • ${result.totalReviews || 0} reviews
                    </div>
                </div>
            </button>
        `).join('');
    }

    /**
     * Render search filters
     * @returns {string} HTML string
     */
    renderFilters() {
        return `
            <div class="search__filters">
                <div class="search__filter-group">
                    <label class="search__filter-label">Type:</label>
                    <select class="search__filter-select" data-filter="type">
                        <option value="all">All Types</option>
                        <option value="public">Public Toilets</option>
                        <option value="private">Private Toilets</option>
                    </select>
                </div>

                <div class="search__filter-group">
                    <label class="search__filter-label">Rating:</label>
                    <select class="search__filter-select" data-filter="rating">
                        <option value="all">All Ratings</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                        <option value="2">2+ Stars</option>
                        <option value="1">1+ Stars</option>
                    </select>
                </div>

                <div class="search__filter-group">
                    <label class="search__filter-label">Distance:</label>
                    <select class="search__filter-select" data-filter="distance">
                        <option value="all">Any Distance</option>
                        <option value="1">Within 1km</option>
                        <option value="5">Within 5km</option>
                        <option value="10">Within 10km</option>
                    </select>
                </div>

                <div class="search__filter-group">
                    <label class="search__filter-checkbox">
                        <input type="checkbox" data-filter="hasReviews">
                        Has Reviews
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Render advanced search
     * @returns {string} HTML string
     */
    renderAdvancedSearch() {
        return `
            <div class="search--advanced" style="display: none;">
                <button class="search__advanced-toggle" type="button">
                    <span>🔧</span>
                    Advanced Search
                </button>
                <div class="search__advanced-content">
                    <div class="search__advanced-group">
                        <label class="search__advanced-label">Facilities:</label>
                        <div class="search__advanced-facilities">
                            ${this.renderFacilityCheckboxes()}
                        </div>
                    </div>

                    <div class="search__advanced-group">
                        <label class="search__advanced-label">Price Range:</label>
                        <select class="search__advanced-input" data-filter="priceRange">
                            <option value="all">Any Price</option>
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div class="search__advanced-group">
                        <label class="search__advanced-label">Operating Hours:</label>
                        <select class="search__advanced-input" data-filter="hours">
                            <option value="all">Any Time</option>
                            <option value="24h">24 Hours</option>
                            <option value="business">Business Hours</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render facility checkboxes for advanced search
     * @returns {string} HTML string
     */
    renderFacilityCheckboxes() {
        const facilities = [
            { id: 'handicap_accessible', label: '♿ Handicap Accessible', icon: '♿' },
            { id: 'baby_change', label: '👶 Baby Change', icon: '👶' },
            { id: 'shower', label: '🚿 Shower', icon: '🚿' },
            { id: 'bidet', label: '🪣 Bidet', icon: '🪣' },
            { id: 'paper_towel', label: '📄 Paper Towel', icon: '📄' },
            { id: 'hand_dryer', label: '💨 Hand Dryer', icon: '💨' }
        ];

        return facilities.map(facility => `
            <label class="search__facility-item">
                <input type="checkbox" data-facility="${facility.id}" value="${facility.id}">
                <span class="search__facility-label">${facility.label}</span>
            </label>
        `).join('');
    }

    /**
     * Render search results
     * @returns {string} HTML string
     */
    renderResults() {
        if (!this.state.results.length) {
            return `
                <div class="search__no-results">
                    <div class="search__no-results-icon">🔍</div>
                    <h3 class="search__no-results-title">No toilets found</h3>
                    <p class="search__no-results-message">
                        Try adjusting your search terms or filters.
                        <a href="#" class="search__clear-filters">Clear all filters</a>
                    </p>
                </div>
            `;
        }

        const resultsHtml = this.state.results.map(result => `
            <div class="search__result-item" data-id="${result.id}">
                <div class="search__result-header">
                    <h4 class="search__result-name">${this.highlightQuery(result.name)}</h4>
                    <div class="search__result-rating">
                        ${this.renderStars(result.averageRating)}
                        <span class="search__result-rating-text">
                            ${result.averageRating ? result.averageRating.toFixed(1) : 'No rating'}
                        </span>
                    </div>
                </div>

                <div class="search__result-details">
                    <p class="search__result-location">${result.location}</p>
                    <p class="search__result-meta">
                        ${result.totalReviews || 0} reviews •
                        ${result.distance ? `${result.distance.toFixed(1)}km away` : 'Distance unknown'}
                    </p>

                    ${result.facilities && result.facilities.length ? `
                        <div class="search__result-facilities">
                            ${result.facilities.slice(0, 3).map(facility =>
                                `<span class="search__facility-tag">${facility.replace('_', ' ')}</span>`
                            ).join('')}
                            ${result.facilities.length > 3 ? `<span class="search__facility-more">+${result.facilities.length - 3} more</span>` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="search__result-actions">
                    <button class="btn btn-primary btn-small" onclick="viewToilet('${result.id}')">
                        View Details
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="getDirections('${result.id}')">
                        Directions
                    </button>
                </div>
            </div>
        `).join('');

        return `
            <div class="search__results-header">
                <div class="search__results-count">
                    Found ${this.state.results.length} toilet${this.state.results.length !== 1 ? 's' : ''}
                    ${this.state.query ? `for "${this.state.query}"` : ''}
                </div>
                <div class="search__results-sort">
                    <label class="search__sort-label">Sort by:</label>
                    <select class="search__sort-select" data-sort="criteria">
                        <option value="relevance">Relevance</option>
                        <option value="rating">Rating</option>
                        <option value="distance">Distance</option>
                        <option value="reviews">Review Count</option>
                    </select>
                </div>
            </div>
            <div class="search__results-list">
                ${resultsHtml}
            </div>
        `;
    }

    /**
     * Render star rating
     * @param {number} rating - Rating value
     * @returns {string} HTML string
     */
    renderStars(rating) {
        if (!rating) return '';

        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - Math.ceil(rating);

        return `
            ${'★'.repeat(fullStars)}
            ${halfStar ? '☆' : ''}
            ${'☆'.repeat(emptyStars)}
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        const { input, voiceBtn, clearBtn } = this.elements;

        if (input) {
            input.addEventListener('input', this.handlers.input);
            input.addEventListener('focus', this.handlers.focus);
            input.addEventListener('blur', this.handlers.blur);
            input.addEventListener('keydown', this.handlers.keydown);
        }

        if (voiceBtn) {
            voiceBtn.addEventListener('click', this.handlers.voiceClick);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', this.handlers.clearClick);
        }

        // Attach filter listeners
        this.attachFilterListeners();

        // Attach advanced search listeners
        this.attachAdvancedSearchListeners();
    }

    /**
     * Attach filter event listeners
     */
    attachFilterListeners() {
        const filterSelects = this.elements.container.querySelectorAll('.search__filter-select');
        const filterCheckboxes = this.elements.container.querySelectorAll('input[data-filter]');

        filterSelects.forEach(select => {
            select.addEventListener('change', this.handlers.filterChange);
        });

        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.handlers.filterChange);
        });
    }

    /**
     * Attach advanced search event listeners
     */
    attachAdvancedSearchListeners() {
        const toggleBtn = this.elements.container.querySelector('.search__advanced-toggle');
        const facilityCheckboxes = this.elements.container.querySelectorAll('input[data-facility]');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const advanced = this.elements.container.querySelector('.search--advanced');
                const isVisible = advanced.style.display !== 'none';
                advanced.style.display = isVisible ? 'none' : 'block';
                this.state.isExpanded = !isVisible;
            });
        }

        facilityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const facilities = Array.from(facilityCheckboxes)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value);

                this.state.filters.facilities = facilities;
                this.performSearch();
            });
        });
    }

    /**
     * Initialize voice search
     */
    initializeVoiceSearch() {
        if (!this.options.enableVoiceSearch || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.state.voiceListening = true;
            if (this.elements.voiceBtn) {
                this.elements.voiceBtn.classList.add('listening');
            }
        };

        this.recognition.onend = () => {
            this.state.voiceListening = false;
            if (this.elements.voiceBtn) {
                this.elements.voiceBtn.classList.remove('listening');
            }
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.elements.input) {
                this.elements.input.value = transcript;
                this.state.query = transcript;
                this.performSearch();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('[SEARCH] Voice recognition error:', event.error);
            appStore.addNotification({
                type: 'error',
                title: 'Voice Search Error',
                message: 'Could not process voice input. Please try typing.',
                duration: 3000
            });
        };
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            // Load recent searches from localStorage
            const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            this.state.recentSearches = recentSearches;

            // Load popular locations or suggestions
            await this.loadSuggestions();

        } catch (error) {
            console.error('[SEARCH] Error loading initial data:', error);
        }
    }

    /**
     * Load search suggestions
     */
    async loadSuggestions() {
        try {
            // Get popular toilet names, locations, etc. for suggestions
            const response = await fetch(`${AppConfig.api.baseUrl}/api/toilet/suggestions`);
            if (response.ok) {
                const suggestions = await response.json();
                this.state.suggestions = suggestions.slice(0, this.options.maxSuggestions);
                this.updateSuggestions();
            }
        } catch (error) {
            console.warn('[SEARCH] Could not load suggestions:', error);
        }
    }

    /**
     * Handle input events
     * @param {Event} event - Input event
     */
    handleInput(event) {
        const query = event.target.value.trim();
        this.state.query = query;

        // Show/hide clear button
        if (this.elements.clearBtn) {
            this.elements.clearBtn.style.display = query ? 'flex' : 'none';
        }

        // Clear previous debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (query.length < this.options.minQueryLength) {
            this.hideDropdown();
            this.hideSuggestions();
            return;
        }

        // Debounce search
        this.debounceTimer = setTimeout(() => {
            this.performSearch();
        }, this.options.debounceDelay);
    }

    /**
     * Handle focus events
     */
    handleFocus() {
        this.state.isExpanded = true;
        if (this.state.query.length >= this.options.minQueryLength) {
            this.showSuggestions();
        }
        this.updateAriaExpanded(true);
    }

    /**
     * Handle blur events
     */
    handleBlur() {
        // Delay hiding to allow clicking on suggestions
        setTimeout(() => {
            this.state.isExpanded = false;
            this.hideSuggestions();
            this.hideDropdown();
            this.updateAriaExpanded(false);
        }, 150);
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event - Keydown event
     */
    handleKeydown(event) {
        switch (event.key) {
            case 'Escape':
                this.clearSearch();
                this.elements.input.blur();
                break;
            case 'Enter':
                event.preventDefault();
                this.performSearch();
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.navigateSuggestions('down');
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.navigateSuggestions('up');
                break;
        }
    }

    /**
     * Handle suggestion clicks
     * @param {Event} event - Click event
     */
    handleSuggestionClick(event) {
        const item = event.target.closest('.search__suggestion-item');
        if (!item) return;

        const type = item.dataset.type;
        const id = item.dataset.id;
        const text = item.querySelector('.search__suggestion-text').textContent;

        this.selectSuggestion(type, id, text);
    }

    /**
     * Handle filter changes
     * @param {Event} event - Change event
     */
    handleFilterChange(event) {
        const target = event.target;
        const filterType = target.dataset.filter || target.dataset.facility;

        if (target.type === 'checkbox') {
            if (filterType === 'hasReviews') {
                this.state.filters.hasReviews = target.checked;
            }
        } else if (target.tagName === 'SELECT') {
            this.state.filters[filterType] = target.value;
        }

        this.performSearch();
    }

    /**
     * Handle voice search click
     */
    handleVoiceClick() {
        if (!this.recognition) {
            appStore.addNotification({
                type: 'error',
                title: 'Voice Search Unavailable',
                message: 'Voice search is not supported in your browser.',
                duration: 3000
            });
            return;
        }

        if (this.state.voiceListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    /**
     * Handle clear search click
     */
    handleClearClick() {
        this.clearSearch();
    }

    /**
     * Perform search
     */
    async performSearch() {
        if (this.state.isLoading) return;

        this.state.isLoading = true;
        this.showLoadingState();

        try {
            const params = new URLSearchParams({
                q: this.state.query,
                ...this.state.filters
            });

            const response = await fetch(`${AppConfig.api.baseUrl}/api/toilet/search?${params}`);
            if (!response.ok) throw new Error('Search failed');

            const results = await response.json();
            this.state.results = Array.isArray(results) ? results : (results.data || []);

            this.updateResults();
            this.saveRecentSearch();

        } catch (error) {
            console.error('[SEARCH] Search error:', error);
            this.state.results = [];
            this.updateResults();
        } finally {
            this.state.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Update suggestions display
     */
    updateSuggestions() {
        if (this.elements.suggestions) {
            this.elements.suggestions.innerHTML = this.renderSuggestions();

            // Re-attach suggestion click listeners
            const suggestionItems = this.elements.suggestions.querySelectorAll('.search__suggestion-item');
            suggestionItems.forEach(item => {
                item.addEventListener('click', this.handlers.suggestionClick);
            });
        }
    }

    /**
     * Update results display
     */
    updateResults() {
        if (this.elements.results) {
            this.elements.results.innerHTML = this.renderResults();
            this.elements.results.style.display = this.state.results.length || this.state.query ? 'block' : 'none';
        }
    }

    /**
     * Show suggestions
     */
    showSuggestions() {
        if (this.elements.suggestions && this.state.suggestions.length) {
            this.elements.suggestions.style.display = 'block';
        }
    }

    /**
     * Hide suggestions
     */
    hideSuggestions() {
        if (this.elements.suggestions) {
            this.elements.suggestions.style.display = 'none';
        }
    }

    /**
     * Show dropdown
     */
    showDropdown() {
        if (this.elements.dropdown) {
            this.elements.dropdown.classList.add('show');
        }
    }

    /**
     * Hide dropdown
     */
    hideDropdown() {
        if (this.elements.dropdown) {
            this.elements.dropdown.classList.remove('show');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (this.elements.input) {
            this.elements.input.classList.add('search--loading');
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        if (this.elements.input) {
            this.elements.input.classList.remove('search--loading');
        }
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.state.query = '';
        this.state.results = [];
        if (this.elements.input) {
            this.elements.input.value = '';
        }
        if (this.elements.clearBtn) {
            this.elements.clearBtn.style.display = 'none';
        }
        this.hideDropdown();
        this.hideSuggestions();
        this.updateResults();
    }

    /**
     * Navigate suggestions with keyboard
     * @param {string} direction - Navigation direction
     */
    navigateSuggestions(direction) {
        // Implementation for keyboard navigation
        console.log('[SEARCH] Navigate suggestions:', direction);
    }

    /**
     * Select a suggestion
     * @param {string} type - Suggestion type
     * @param {string} id - Suggestion ID
     * @param {string} text - Suggestion text
     */
    selectSuggestion(type, id, text) {
        this.state.query = text;
        if (this.elements.input) {
            this.elements.input.value = text;
        }

        // Hide suggestions
        this.hideSuggestions();

        // Perform search or navigate to result
        if (type === 'toilet' && id) {
            // Navigate to toilet detail
            console.log('[SEARCH] Navigate to toilet:', id);
        } else {
            // Perform search
            this.performSearch();
        }
    }

    /**
     * Highlight query in text
     * @param {string} text - Text to highlight
     * @returns {string} Highlighted HTML
     */
    highlightQuery(text) {
        if (!this.state.query || !text) return text;

        const regex = new RegExp(`(${this.escapeRegex(this.state.query)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    /**
     * Escape regex special characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get suggestion icon
     * @param {string} type - Suggestion type
     * @returns {string} Icon
     */
    getSuggestionIcon(type) {
        switch (type) {
            case 'location': return '📍';
            case 'facility': return '🏢';
            case 'toilet': return '🚾';
            default: return '🔍';
        }
    }

    /**
     * Get result icon
     * @param {object} result - Search result
     * @returns {string} Icon
     */
    getResultIcon(result) {
        return result.type === 'public' ? '🏛️' : '🏢';
    }

    /**
     * Save recent search
     */
    saveRecentSearch() {
        if (!this.state.query) return;

        let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        recentSearches = recentSearches.filter(search => search !== this.state.query);
        recentSearches.unshift(this.state.query);

        // Keep only last 10 searches
        recentSearches = recentSearches.slice(0, 10);

        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        this.state.recentSearches = recentSearches;
    }

    /**
     * Update ARIA attributes
     * @param {boolean} expanded - Whether dropdown is expanded
     */
    updateAriaExpanded(expanded) {
        if (this.elements.input) {
            this.elements.input.setAttribute('aria-expanded', expanded.toString());
        }
    }

    /**
     * Get current search state
     * @returns {object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Set search query programmatically
     * @param {string} query - Search query
     */
    setQuery(query) {
        this.state.query = query;
        if (this.elements.input) {
            this.elements.input.value = query;
        }
        this.performSearch();
    }

    /**
     * Set search filters programmatically
     * @param {object} filters - Filter object
     */
    setFilters(filters) {
        this.state.filters = { ...this.state.filters, ...filters };
        this.performSearch();
    }

    /**
     * Destroy the search component
     */
    destroy() {
        console.log('[SEARCH] Destroying search component');

        // Remove event listeners
        if (this.elements.input) {
            this.elements.input.removeEventListener('input', this.handlers.input);
            this.elements.input.removeEventListener('focus', this.handlers.focus);
            this.elements.input.removeEventListener('blur', this.handlers.blur);
            this.elements.input.removeEventListener('keydown', this.handlers.keydown);
        }

        // Clear timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Stop voice recognition
        if (this.recognition && this.state.voiceListening) {
            this.recognition.stop();
        }

        // Clear state
        this.state = null;
        this.elements = null;
        this.handlers = null;
    }
}

// Export the SearchComponent class
export default SearchComponent;
