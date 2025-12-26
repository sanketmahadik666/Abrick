const Toilet = require('../../models/Toilet');
const { toilets } = require('../../models/storage');

describe('Toilet Model', () => {
    beforeEach(() => {
        toilets.length = 0; // Clear toilets array
    });

    describe('Toilet Constructor', () => {
        test('should create toilet with provided data', () => {
            const toiletData = {
                name: 'Test Toilet',
                location: 'Test Location',
                description: 'Test Description',
                coordinates: { latitude: 40.7128, longitude: -74.0060 },
                facilities: ['handicap', 'paper_towel']
            };

            const toilet = new Toilet(toiletData);

            expect(toilet.name).toBe('Test Toilet');
            expect(toilet.location).toBe('Test Location');
            expect(toilet.description).toBe('Test Description');
            expect(toilet.coordinates).toEqual({ latitude: 40.7128, longitude: -74.0060 });
            expect(toilet.facilities).toEqual(['handicap', 'paper_towel']);
            expect(toilet.averageRating).toBe(0);
            expect(toilet.totalReviews).toBe(0);
            expect(toilet.id).toBeDefined();
            expect(toilet.createdAt).toBeInstanceOf(Date);
            expect(toilet.updatedAt).toBeInstanceOf(Date);
        });

        test('should set default values', () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            expect(toilet.description).toBe('');
            expect(toilet.facilities).toEqual([]);
            expect(toilet.averageRating).toBe(0);
            expect(toilet.totalReviews).toBe(0);
        });
    });

    describe('Toilet.save()', () => {
        test('should save toilet and update timestamps', async () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            const initialUpdatedAt = toilet.updatedAt;

            await toilet.save();

            expect(toilets).toHaveLength(1);
            expect(toilets[0]).toBe(toilet);
            expect(toilet.updatedAt.getTime()).toBeGreaterThanOrEqual(initialUpdatedAt.getTime());
        });

        test('should update existing toilet', async () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            await toilet.save();
            toilet.name = 'Updated Toilet';
            await toilet.save();

            expect(toilets).toHaveLength(1);
            expect(toilets[0].name).toBe('Updated Toilet');
        });
    });

    describe('Toilet.remove()', () => {
        test('should remove toilet from storage', async () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            await toilet.save();
            expect(toilets).toHaveLength(1);

            await toilet.remove();
            expect(toilets).toHaveLength(0);
        });
    });

    describe('Toilet.toObject()', () => {
        test('should return toilet data', () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            const obj = toilet.toObject();

            expect(obj.id).toBe(toilet.id);
            expect(obj.name).toBe('Test Toilet');
            expect(obj.location).toBe('Test Location');
            expect(obj.coordinates).toEqual({ latitude: 40.7128, longitude: -74.0060 });
            expect(obj.createdAt).toBe(toilet.createdAt);
            expect(obj.updatedAt).toBe(toilet.updatedAt);
        });
    });

    describe('Toilet.find()', () => {
        test('should return all toilets when no query provided', async () => {
            const toilet1 = new Toilet({
                name: 'Toilet 1',
                location: 'Location 1',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            const toilet2 = new Toilet({
                name: 'Toilet 2',
                location: 'Location 2',
                coordinates: { latitude: 40.7589, longitude: -73.9851 }
            });

            await toilet1.save();
            await toilet2.save();

            const results = await Toilet.find();
            expect(results).toHaveLength(2);
            expect(results).toContain(toilet1);
            expect(results).toContain(toilet2);
        });

        test('should filter toilets by coordinates (near query)', async () => {
            const toilet1 = new Toilet({
                name: 'Nearby Toilet',
                location: 'Location 1',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            const toilet2 = new Toilet({
                name: 'Far Toilet',
                location: 'Location 2',
                coordinates: { latitude: 41.7128, longitude: -75.0060 } // Far away
            });

            await toilet1.save();
            await toilet2.save();

            // Mock the $near query (simplified distance check)
            const query = {
                coordinates: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [-74.0060, 40.7128] // [lng, lat]
                        },
                        $maxDistance: 1000 // Small distance
                    }
                }
            };

            const results = await Toilet.find(query);
            expect(results).toHaveLength(1);
            expect(results[0]).toBe(toilet1);
        });
    });

    describe('Toilet.findById()', () => {
        test('should find toilet by ID', async () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            await toilet.save();

            const found = await Toilet.findById(toilet.id);
            expect(found).toBe(toilet);
        });

        test('should return undefined for non-existent ID', async () => {
            const found = await Toilet.findById('nonexistent-id');
            expect(found).toBeUndefined();
        });
    });

    describe('Toilet.findByIdAndUpdate()', () => {
        test('should update toilet and return it', async () => {
            const toilet = new Toilet({
                name: 'Test Toilet',
                location: 'Test Location',
                coordinates: { latitude: 40.7128, longitude: -74.0060 }
            });

            await toilet.save();

            const updated = await Toilet.findByIdAndUpdate(toilet.id, { name: 'Updated Name' });
            expect(updated).toBe(toilet);
            expect(toilet.name).toBe('Updated Name');
        });

        test('should return null for non-existent ID', async () => {
            const result = await Toilet.findByIdAndUpdate('nonexistent-id', { name: 'Updated' });
            expect(result).toBeNull();
        });
    });
});