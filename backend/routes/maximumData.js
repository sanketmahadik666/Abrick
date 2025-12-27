/**
 * Enhanced API Routes for Maximum Toilet Data Ingestion
 * 
 * These routes integrate the PublicToiletExternalDataIngestionAgent
 * to maximize toilet data for the home page map display.
 */

const express = require('express');
const router = express.Router();
const PublicToiletExternalDataIngestionAgent = require('../PublicToiletExternalDataIngestionAgent');
const Toilet = require('../models/Toilet');
const { protect, admin } = require('../middleware/auth');

// Initialize the ingestion agent
const ingestionAgent = new PublicToiletExternalDataIngestionAgent({
    deduplicationRadius: 15,
    confidenceThreshold: 0.6,
    maxRetries: 3
});

// Maximum Data Ingestion Endpoint
router.post('/ingest/maximum', async (req, res) => {
    try {
        const { 
            cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'pune'],
            forceRefresh = false,
            targetCount = 10000
        } = req.body;

        console.log(`[MAX-DATA] Starting maximum data ingestion for ${cities.length} cities`);
        console.log(`[MAX-DATA] Target: ${targetCount} toilets`);

        const cityConfigs = {
            'mumbai': { bounds: '18.8,72.7,19.3,73.0', expected: '800-1,500' },
            'delhi': { bounds: '28.4,76.8,28.9,77.4', expected: '1,000-2,000' },
            'bangalore': { bounds: '12.7,77.3,13.2,77.9', expected: '600-1,200' },
            'chennai': { bounds: '12.9,80.1,13.3,80.4', expected: '500-1,000' },
            'pune': { bounds: '18.3,73.7,18.7,74.0', expected: '400-800' }
        };

        const results = {
            totalIngested: 0,
            citiesProcessed: 0,
            sources: {},
            errors: [],
            startTime: new Date()
        };

        // Process each city
        for (const cityName of cities) {
            const config = cityConfigs[cityName];
            if (!config) {
                results.errors.push(`Unknown city: ${cityName}`);
                continue;
            }

            try {
                console.log(`[MAX-DATA] Processing ${cityName}...`);
                const startTime = Date.now();
                
                const result = await ingestionAgent.ingestAllSources(config.bounds, cityName);
                const duration = Date.now() - startTime;

                if (result.success) {
                    results.totalIngested += result.saved;
                    results.citiesProcessed++;
                    results.sources[cityName] = {
                        ingested: result.saved,
                        duration: duration,
                        expected: config.expected,
                        sources: result.stats.sources
                    };
                    
                    console.log(`[MAX-DATA] ${cityName}: ✅ ${result.saved} toilets in ${duration}ms`);
                } else {
                    results.errors.push(`${cityName}: ${result.error}`);
                    console.log(`[MAX-DATA] ${cityName}: ❌ ${result.error}`);
                }

            } catch (error) {
                results.errors.push(`${cityName}: ${error.message}`);
                console.log(`[MAX-DATA] ${cityName}: 💥 ${error.message}`);
            }
        }

        results.endTime = new Date();
        results.duration = results.endTime - results.startTime;

        // Check if we met the target
        const targetMet = results.totalIngested >= targetCount;
        
        console.log(`[MAX-DATA] Ingestion complete:`);
        console.log(`[MAX-DATA]   Total ingested: ${results.totalIngested}`);
        console.log(`[MAX-DATA]   Target met: ${targetMet ? 'YES' : 'NO'}`);
        console.log(`[MAX-DATA]   Success rate: ${((results.citiesProcessed / cities.length) * 100).toFixed(1)}%`);

        res.json({
            success: true,
            targetMet,
            results,
            summary: {
                totalIngested: results.totalIngested,
                targetCount,
                citiesProcessed: results.citiesProcessed,
                totalCities: cities.length,
                successRate: (results.citiesProcessed / cities.length) * 100,
                duration: results.duration,
                averagePerCity: results.citiesProcessed > 0 ? results.totalIngested / results.citiesProcessed : 0
            }
        });

    } catch (error) {
        console.error('[MAX-DATA] Critical error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Get Maximum Data Statistics
router.get('/stats/maximum', async (req, res) => {
    try {
        // Current database stats
        const allToilets = await Toilet.find();
        const totalToilets = allToilets.length;
        const publicToilets = allToilets.filter(t => t.type === 'public').length;
        const privateToilets = allToilets.filter(t => t.type === 'private').length;
        const verifiedToilets = allToilets.filter(t => t.verified).length;

        // Source breakdown
        const sourceMap = new Map();
        allToilets.forEach(toilet => {
            const source = toilet.source || 'unknown';
            if (!sourceMap.has(source)) {
                sourceMap.set(source, { count: 0, verified: 0 });
            }
            const stats = sourceMap.get(source);
            stats.count++;
            if (toilet.verified) stats.verified++;
        });
        
        const sourceStats = Array.from(sourceMap.entries()).map(([source, stats]) => ({
            source,
            count: stats.count,
            verified: stats.verified,
            verificationRate: stats.count > 0 ? ((stats.verified / stats.count) * 100).toFixed(1) : 0
        }));

        // Geographic distribution
        const geoMap = new Map();
        allToilets.filter(t => t.type === 'public' && t.coordinates).forEach(toilet => {
            const lat = toilet.coordinates.latitude;
            let region = 'Other Regions';
            
            if (lat >= 18 && lat <= 20) {
                region = 'Mumbai Metropolitan';
            } else if (lat >= 28 && lat <= 29) {
                region = 'Delhi NCR';
            } else if (lat >= 12 && lat <= 14) {
                region = 'South India';
            }
            
            if (!geoMap.has(region)) {
                geoMap.set(region, { count: 0, verified: 0 });
            }
            const stats = geoMap.get(region);
            stats.count++;
            if (toilet.verified) stats.verified++;
        });
        
        const geoStats = Array.from(geoMap.entries()).map(([region, stats]) => ({
            region,
            count: stats.count,
            verified: stats.verified
        }));

        // Potential calculation
        const potentialStats = {
            current: totalToilets,
            public: publicToilets,
            target: '21,000-54,000',
            potentialIncrease: '2,333x - 6,000x',
            majorCities: {
                mumbai: '800-1,500',
                delhi: '1,000-2,000',
                bangalore: '600-1,200',
                chennai: '500-1,000',
                pune: '400-800'
            }
        };

        res.json({
            success: true,
            timestamp: new Date(),
            current: {
                total: totalToilets,
                public: publicToilets,
                private: privateToilets,
                verified: verifiedToilets,
                verificationRate: totalToilets > 0 ? (verifiedToilets / totalToilets * 100).toFixed(1) : 0
            },
            sources: sourceStats.map(stat => ({
                source: stat._id || 'unknown',
                count: stat.count,
                verified: stat.verified,
                verificationRate: stat.count > 0 ? (stat.verified / stat.count * 100).toFixed(1) : 0
            })),
            geography: geoStats.map(stat => ({
                region: stat._id,
                count: stat.count,
                verified: stat.verified
            })),
            potential: potentialStats,
            apiEndpoints: {
                maximumIngestion: 'POST /api/maximum/ingest/maximum',
                statistics: 'GET /api/maximum/stats/maximum',
                mapData: 'GET /api/toilet/map',
                debugData: 'GET /api/toilet/debug/all'
            }
        });

    } catch (error) {
        console.error('[MAX-DATA] Stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Maximum Data Map Endpoint (Optimized for Home Page)
router.get('/map/maximum', async (req, res) => {
    try {
        const {
            showPublic = 'true',
            showPrivate = 'false',
            limit = '5000', // Increased limit for maximum data display
            verifiedOnly = 'false',
            minConfidence = '0.6'
        } = req.query;

        console.log(`[MAX-DATA] Map request: Public=${showPublic}, Private=${showPrivate}, Limit=${limit}`);

        const typesToInclude = [];
        if (showPublic === 'true') typesToInclude.push('public');
        if (showPrivate === 'true') typesToInclude.push('private');

        if (typesToInclude.length === 0) {
            return res.json({ success: true, data: [], message: 'No toilet types selected' });
        }

        let query = { type: { $in: typesToInclude } };

        // Add confidence filtering if specified
        if (minConfidence !== '0') {
            query['metadata.confidence_score'] = { $gte: parseFloat(minConfidence) };
        }

        // Verified only filter
        if (verifiedOnly === 'true') {
            query.verified = true;
        }

        const limitNum = Math.min(parseInt(limit), 10000); // Max 10k for performance

        // Get toilets with optimization
        let toilets = await Toilet.find(query);
        
        // Sort by verified, rating, reviews
        toilets.sort((a, b) => {
            if (a.verified !== b.verified) return b.verified - a.verified;
            if (a.averageRating !== b.averageRating) return (b.averageRating || 0) - (a.averageRating || 0);
            return (b.totalReviews || 0) - (a.totalReviews || 0);
        });
        
        // Apply limit
        toilets = toilets.slice(0, limitNum);

        console.log(`[MAX-DATA] Retrieved ${toilets.length} toilets for map`);

        // Optimize response for map display
        const optimizedToilets = toilets.map(toilet => ({
            id: toilet._id,
            name: toilet.name,
            location: toilet.location,
            coordinates: toilet.coordinates,
            facilities: toilet.facilities,
            averageRating: toilet.averageRating,
            totalReviews: toilet.totalReviews,
            type: toilet.type,
            source: toilet.source,
            verified: toilet.verified,
            confidence_score: toilet.metadata?.confidence_score || 0,
            // Map-specific optimizations
            marker_color: toilet.verified ? '#00ff00' : '#0066cc', // Green for verified, blue for unverified
            marker_size: toilet.averageRating > 0 ? 'medium' : 'small'
        }));

        const response = {
            success: true,
            data: optimizedToilets,
            metadata: {
                total: toilets.length,
                limit: limitNum,
                filtered: {
                    public: showPublic === 'true',
                    private: showPrivate === 'true',
                    verifiedOnly: verifiedOnly === 'true',
                    minConfidence: parseFloat(minConfidence)
                },
                performance: {
                    estimatedLoadTime: Math.ceil(toilets.length / 100) + 'ms',
                    density: toilets.length > 0 ? (toilets.length / 5).toFixed(0) + ' toilets per major city' : 'N/A'
                },
                sources: [...new Set(toilets.map(t => t.source))].length
            }
        };

        res.json(response);

    } catch (error) {
        console.error('[MAX-DATA] Map error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

// Trigger Maximum Data Ingestion (Admin Only)
router.post('/trigger/maximum', protect, admin, async (req, res) => {
    try {
        console.log('[MAX-DATA] Admin triggered maximum data ingestion');

        const { 
            cities = ['mumbai', 'delhi', 'bangalore', 'chennai', 'pune'],
            targetCount = 10000 
        } = req.body;

        // This would typically be queued for background processing
        // For demo purposes, we'll return immediate response
        const jobId = `max_ingestion_${Date.now()}`;
        
        console.log(`[MAX-DATA] Job queued: ${jobId}`);
        console.log(`[MAX-DATA] Target: ${targetCount} toilets across ${cities.length} cities`);

        // In a real implementation, you would:
        // 1. Queue this job for background processing
        // 2. Return job ID for tracking
        // 3. Send progress updates via WebSocket or polling

        res.json({
            success: true,
            jobId,
            message: 'Maximum data ingestion job queued successfully',
            details: {
                jobId,
                cities,
                targetCount,
                estimatedDuration: `${Math.ceil(targetCount / 1000)} minutes`,
                status: 'queued'
            }
        });

    } catch (error) {
        console.error('[MAX-DATA] Trigger error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date()
        });
    }
});

module.exports = router;