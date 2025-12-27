/**
 * Review API Service
 * Handles all review-related API operations
 * Follows Single Responsibility Principle - only review concerns
 */

import { baseApiService } from './base-api.service.js';
import { API_ENDPOINTS } from '../../core/constants/api.constants.js';

/**
 * Review API Service Class
 * Extends BaseApiService with review-specific operations
 */
export class ReviewApiService {
    constructor() {
        this.baseService = baseApiService;
    }

    /**
     * Submit a new review
     * @param {object} reviewData - Review data
     * @param {string} reviewData.toiletId - Toilet ID being reviewed
     * @param {number} reviewData.rating - Overall rating (1-5)
     * @param {number} reviewData.cleanliness - Cleanliness rating (1-5)
     * @param {number} reviewData.maintenance - Maintenance rating (1-5)
     * @param {number} reviewData.accessibility - Accessibility rating (1-5)
     * @param {string} reviewData.comment - Review comment (optional)
     * @returns {Promise} Review submission response
     */
    async submitReview(reviewData) {
        console.log('[REVIEW-API] Submitting review for toilet:', reviewData.toiletId);

        // Validate required fields
        this.validateReviewData(reviewData);

        const response = await this.baseService.post(API_ENDPOINTS.REVIEWS.SUBMIT, {
            toiletId: reviewData.toiletId,
            rating: reviewData.rating,
            cleanliness: reviewData.cleanliness,
            maintenance: reviewData.maintenance,
            accessibility: reviewData.accessibility,
            comment: reviewData.comment?.trim() || ''
        });

        console.log('[REVIEW-API] Review submitted successfully');
        return response;
    }

    /**
     * Get reviews for a specific toilet
     * @param {string} toiletId - Toilet ID
     * @param {object} options - Query options
     * @param {number} options.limit - Maximum reviews to return
     * @param {number} options.offset - Pagination offset
     * @param {string} options.sort - Sort order ('newest', 'oldest', 'rating')
     * @returns {Promise} Reviews response
     */
    async getReviewsForToilet(toiletId, options = {}) {
        console.log('[REVIEW-API] Fetching reviews for toilet:', toiletId);

        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);
        if (options.sort) params.append('sort', options.sort);

        const endpoint = `${API_ENDPOINTS.REVIEWS.BY_TOILET(toiletId)}?${params}`;
        const response = await this.baseService.get(endpoint);

        console.log(`[REVIEW-API] Retrieved ${response.length || 0} reviews for toilet`);
        return response;
    }

    /**
     * Get all reviews (admin only)
     * @param {object} options - Query options
     * @param {number} options.limit - Maximum reviews to return
     * @param {number} options.offset - Pagination offset
     * @param {string} options.sort - Sort order
     * @param {string} options.toiletId - Filter by toilet ID
     * @returns {Promise} All reviews response
     */
    async getAllReviews(options = {}) {
        console.log('[REVIEW-API] Fetching all reviews');

        const params = new URLSearchParams();
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);
        if (options.sort) params.append('sort', options.sort);
        if (options.toiletId) params.append('toiletId', options.toiletId);

        const endpoint = `${API_ENDPOINTS.REVIEWS.ALL}?${params}`;
        const response = await this.baseService.get(endpoint);

        console.log(`[REVIEW-API] Retrieved ${response.length || 0} total reviews`);
        return response;
    }

    /**
     * Get a specific review by ID
     * @param {string} reviewId - Review ID
     * @returns {Promise} Review response
     */
    async getReviewById(reviewId) {
        console.log('[REVIEW-API] Fetching review:', reviewId);

        const response = await this.baseService.get(API_ENDPOINTS.REVIEWS.BY_ID(reviewId));
        console.log('[REVIEW-API] Review retrieved successfully');
        return response;
    }

    /**
     * Update an existing review (admin only)
     * @param {string} reviewId - Review ID
     * @param {object} updateData - Updated review data
     * @returns {Promise} Update response
     */
    async updateReview(reviewId, updateData) {
        console.log('[REVIEW-API] Updating review:', reviewId);

        // Validate update data if provided
        if (updateData.rating || updateData.cleanliness || updateData.maintenance || updateData.accessibility) {
            this.validateRatingData(updateData);
        }

        const response = await this.baseService.put(API_ENDPOINTS.REVIEWS.BY_ID(reviewId), {
            ...updateData,
            comment: updateData.comment?.trim()
        });

        console.log('[REVIEW-API] Review updated successfully');
        return response;
    }

    /**
     * Delete a review (admin only)
     * @param {string} reviewId - Review ID
     * @returns {Promise} Delete response
     */
    async deleteReview(reviewId) {
        console.log('[REVIEW-API] Deleting review:', reviewId);

        const response = await this.baseService.delete(API_ENDPOINTS.REVIEWS.BY_ID(reviewId));
        console.log('[REVIEW-API] Review deleted successfully');
        return response;
    }

    /**
     * Get review statistics
     * @param {string} toiletId - Toilet ID (optional - gets global stats if not provided)
     * @returns {Promise} Statistics response
     */
    async getReviewStats(toiletId = null) {
        console.log('[REVIEW-API] Fetching review statistics', toiletId ? `for toilet: ${toiletId}` : 'globally');

        let endpoint;
        if (toiletId) {
            endpoint = `${API_ENDPOINTS.REVIEWS.BY_TOILET(toiletId)}/stats`;
        } else {
            endpoint = `${API_ENDPOINTS.REVIEWS.ALL}/stats`;
        }

        const response = await this.baseService.get(endpoint);
        console.log('[REVIEW-API] Review statistics retrieved');
        return response;
    }

    /**
     * Validate review data before submission
     * @param {object} reviewData - Review data to validate
     * @throws {Error} Validation error
     */
    validateReviewData(reviewData) {
        if (!reviewData) {
            throw new Error('Review data is required');
        }

        if (!reviewData.toiletId || typeof reviewData.toiletId !== 'string') {
            throw new Error('Valid toilet ID is required');
        }

        this.validateRatingData(reviewData);

        if (reviewData.comment && typeof reviewData.comment !== 'string') {
            throw new Error('Comment must be a string');
        }

        if (reviewData.comment && reviewData.comment.length > 500) {
            throw new Error('Comment must be 500 characters or less');
        }
    }

    /**
     * Validate rating data
     * @param {object} ratingData - Rating data to validate
     * @throws {Error} Validation error
     */
    validateRatingData(ratingData) {
        const ratings = ['rating', 'cleanliness', 'maintenance', 'accessibility'];

        ratings.forEach(rating => {
            if (ratingData[rating] !== undefined) {
                const value = ratingData[rating];
                if (typeof value !== 'number' || value < 1 || value > 5) {
                    throw new Error(`${rating} must be a number between 1 and 5`);
                }
            }
        });
    }

    /**
     * Calculate average rating from review data
     * @param {Array} reviews - Array of review objects
     * @returns {object} Average ratings
     */
    calculateAverageRatings(reviews) {
        if (!reviews || reviews.length === 0) {
            return {
                overall: 0,
                cleanliness: 0,
                maintenance: 0,
                accessibility: 0,
                totalReviews: 0
            };
        }

        const totals = reviews.reduce((acc, review) => {
            acc.rating += review.rating || 0;
            acc.cleanliness += review.cleanliness || 0;
            acc.maintenance += review.maintenance || 0;
            acc.accessibility += review.accessibility || 0;
            return acc;
        }, { rating: 0, cleanliness: 0, maintenance: 0, accessibility: 0 });

        const count = reviews.length;

        return {
            overall: Math.round((totals.rating / count) * 10) / 10,
            cleanliness: Math.round((totals.cleanliness / count) * 10) / 10,
            maintenance: Math.round((totals.maintenance / count) * 10) / 10,
            accessibility: Math.round((totals.accessibility / count) * 10) / 10,
            totalReviews: count
        };
    }

    /**
     * Get review summary for a toilet
     * @param {string} toiletId - Toilet ID
     * @returns {Promise} Review summary
     */
    async getReviewSummary(toiletId) {
        console.log('[REVIEW-API] Getting review summary for toilet:', toiletId);

        try {
            const reviews = await this.getReviewsForToilet(toiletId, { limit: 1000 });
            const summary = this.calculateAverageRatings(reviews);

            console.log('[REVIEW-API] Review summary calculated:', summary);
            return summary;
        } catch (error) {
            console.error('[REVIEW-API] Failed to get review summary:', error);
            // Return empty summary on error
            return {
                overall: 0,
                cleanliness: 0,
                maintenance: 0,
                accessibility: 0,
                totalReviews: 0
            };
        }
    }
}

// Create singleton instance
export const reviewApiService = new ReviewApiService();
