const Review = require('../../models/Review');
const { reviews } = require('../../models/storage');

describe('Review Model', () => {
    beforeEach(() => {
        reviews.length = 0; // Clear reviews array
    });

    describe('Review Constructor', () => {
        test('should create review with provided data', () => {
            const reviewData = {
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4,
                comment: 'Great toilet!'
            };

            const review = new Review(reviewData);

            expect(review.toiletId).toBe('toilet123');
            expect(review.rating).toBe(5);
            expect(review.cleanliness).toBe(4);
            expect(review.maintenance).toBe(5);
            expect(review.accessibility).toBe(4);
            expect(review.comment).toBe('Great toilet!');
            expect(review.id).toBeDefined();
            expect(review.createdAt).toBeInstanceOf(Date);
        });

        test('should set default empty comment', () => {
            const review = new Review({
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            expect(review.comment).toBe('');
        });
    });

    describe('Review.save()', () => {
        test('should save review to storage', async () => {
            const review = new Review({
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4,
                comment: 'Great toilet!'
            });

            await review.save();

            expect(reviews).toHaveLength(1);
            expect(reviews[0]).toBe(review);
        });

        test('should update existing review', async () => {
            const review = new Review({
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4,
                comment: 'Great toilet!'
            });

            await review.save();
            review.comment = 'Updated comment';
            await review.save();

            expect(reviews).toHaveLength(1);
            expect(reviews[0].comment).toBe('Updated comment');
        });
    });

    describe('Review.remove()', () => {
        test('should remove review from storage', async () => {
            const review = new Review({
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            await review.save();
            expect(reviews).toHaveLength(1);

            await review.remove();
            expect(reviews).toHaveLength(0);
        });
    });

    describe('Review.toObject()', () => {
        test('should return review data', () => {
            const review = new Review({
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4,
                comment: 'Great toilet!'
            });

            const obj = review.toObject();

            expect(obj.id).toBe(review.id);
            expect(obj.toiletId).toBe('toilet123');
            expect(obj.rating).toBe(5);
            expect(obj.cleanliness).toBe(4);
            expect(obj.maintenance).toBe(5);
            expect(obj.accessibility).toBe(4);
            expect(obj.comment).toBe('Great toilet!');
            expect(obj.createdAt).toBe(review.createdAt);
        });
    });

    describe('Review.find()', () => {
        test('should return all reviews when no query provided', async () => {
            const review1 = new Review({
                toiletId: 'toilet1',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            const review2 = new Review({
                toiletId: 'toilet2',
                rating: 4,
                cleanliness: 5,
                maintenance: 4,
                accessibility: 5
            });

            await review1.save();
            await review2.save();

            const results = await Review.find();
            expect(results).toHaveLength(2);
            expect(results).toContain(review1);
            expect(results).toContain(review2);
        });

        test('should filter reviews by toiletId', async () => {
            const review1 = new Review({
                toiletId: 'toilet1',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            const review2 = new Review({
                toiletId: 'toilet2',
                rating: 4,
                cleanliness: 5,
                maintenance: 4,
                accessibility: 5
            });

            await review1.save();
            await review2.save();

            const results = await Review.find({ toiletId: 'toilet1' });
            expect(results).toHaveLength(1);
            expect(results[0]).toBe(review1);
        });

        test('should sort reviews by createdAt descending', async () => {
            const review1 = new Review({
                toiletId: 'toilet1',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            const review2 = new Review({
                toiletId: 'toilet1',
                rating: 4,
                cleanliness: 5,
                maintenance: 4,
                accessibility: 5
            });

            // Manually set creation times to ensure order
            review1.createdAt = new Date('2024-01-01');
            review2.createdAt = new Date('2024-01-02');

            await review1.save();
            await review2.save();

            const results = await Review.find({ toiletId: 'toilet1' });
            expect(results).toHaveLength(2);
            expect(results[0]).toBe(review2); // Newer first
            expect(results[1]).toBe(review1); // Older second
        });
    });

    describe('Review.findById()', () => {
        test('should find review by ID', async () => {
            const review = new Review({
                toiletId: 'toilet123',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            await review.save();

            const found = await Review.findById(review.id);
            expect(found).toBe(review);
        });

        test('should return undefined for non-existent ID', async () => {
            const found = await Review.findById('nonexistent-id');
            expect(found).toBeUndefined();
        });
    });

    describe('Review.countDocuments()', () => {
        test('should return total number of reviews', async () => {
            const review1 = new Review({
                toiletId: 'toilet1',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            const review2 = new Review({
                toiletId: 'toilet2',
                rating: 4,
                cleanliness: 5,
                maintenance: 4,
                accessibility: 5
            });

            await review1.save();
            await review2.save();

            const count = await Review.countDocuments();
            expect(count).toBe(2);
        });

        test('should return 0 when no reviews exist', async () => {
            const count = await Review.countDocuments();
            expect(count).toBe(0);
        });
    });

    describe('Review.aggregate()', () => {
        test('should calculate average ratings', async () => {
            const review1 = new Review({
                toiletId: 'toilet1',
                rating: 5,
                cleanliness: 4,
                maintenance: 5,
                accessibility: 4
            });

            const review2 = new Review({
                toiletId: 'toilet1',
                rating: 3,
                cleanliness: 5,
                maintenance: 3,
                accessibility: 5
            });

            await review1.save();
            await review2.save();

            const pipeline = [{
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    avgCleanliness: { $avg: '$cleanliness' },
                    avgMaintenance: { $avg: '$maintenance' },
                    avgAccessibility: { $avg: '$accessibility' }
                }
            }];

            const results = await Review.aggregate(pipeline);

            expect(results).toHaveLength(1);
            expect(results[0].avgRating).toBe(4); // (5 + 3) / 2
            expect(results[0].avgCleanliness).toBe(4.5); // (4 + 5) / 2
            expect(results[0].avgMaintenance).toBe(4); // (5 + 3) / 2
            expect(results[0].avgAccessibility).toBe(4.5); // (4 + 5) / 2
        });

        test('should return empty array for empty reviews', async () => {
            const pipeline = [{
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' }
                }
            }];

            const results = await Review.aggregate(pipeline);
            expect(results).toEqual([{
                avgRating: 0,
                avgCleanliness: 0,
                avgMaintenance: 0,
                avgAccessibility: 0
            }]);
        });
    });
});