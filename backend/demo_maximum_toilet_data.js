/**
 * Demonstration Script - Maximum Toilet Data Ingestion
 * 
 * This script demonstrates how to use the PublicToiletExternalDataIngestionAgent
 * to maximize toilet data for the home page map display.
 */

const PublicToiletExternalDataIngestionAgent = require('./PublicToiletExternalDataIngestionAgent');
const Toilet = require('./models/Toilet');

async function demonstrateMaximumToiletDataIngestion() {
    console.log('🚀 DEMONSTRATING MAXIMUM TOILET DATA INGESTION');
    console.log('='.repeat(60));
    
    // Initialize the ingestion agent
    const agent = new PublicToiletExternalDataIngestionAgent({
        deduplicationRadius: 15, // 15 meters
        confidenceThreshold: 0.6,
        maxRetries: 3
    });

    // Define major Indian cities with their bounds
    const cities = [
        {
            name: 'mumbai',
            bounds: '18.8,72.7,19.3,73.0',
            expectedCount: '800-1,500'
        },
        {
            name: 'delhi', 
            bounds: '28.4,76.8,28.9,77.4',
            expectedCount: '1,000-2,000'
        },
        {
            name: 'bangalore',
            bounds: '12.7,77.3,13.2,77.9', 
            expectedCount: '600-1,200'
        },
        {
            name: 'chennai',
            bounds: '12.9,80.1,13.3,80.4',
            expectedCount: '500-1,000'
        },
        {
            name: 'pune',
            bounds: '18.3,73.7,18.7,74.0',
            expectedCount: '400-800'
        }
    ];

    let totalIngested = 0;
    let totalCities = cities.length;

    console.log(`📊 Target: ${totalCities} major Indian cities`);
    console.log(`🎯 Expected Total: 3,300-6,500 toilets across all cities`);
    console.log('');

    // Process each city
    for (let i = 0; i < cities.length; i++) {
        const city = cities[i];
        console.log(`🏙️  Processing ${city.name.toUpperCase()} (${i + 1}/${totalCities})`);
        console.log(`📍 Bounds: ${city.bounds}`);
        console.log(`🎯 Expected: ${city.expectedCount} toilets`);
        console.log('');

        try {
            const startTime = Date.now();
            const result = await agent.ingestAllSources(city.bounds, city.name);
            const duration = Date.now() - startTime;

            if (result.success) {
                totalIngested += result.saved;
                console.log(`✅ ${city.name}: SUCCESS`);
                console.log(`   📈 Ingested: ${result.saved} toilets`);
                console.log(`   ⏱️  Duration: ${(duration / 1000).toFixed(1)}s`);
                console.log(`   📊 Sources: ${JSON.stringify(result.stats.sources)}`);
            } else {
                console.log(`❌ ${city.name}: FAILED`);
                console.log(`   🔍 Error: ${result.error}`);
            }

        } catch (error) {
            console.log(`❌ ${city.name}: ERROR`);
            console.log(`   🔍 Exception: ${error.message}`);
        }

        console.log('');
        console.log('-'.repeat(60));
        console.log('');
    }

    // Display final statistics
    await displayFinalStatistics(agent, totalIngested);

    // Demonstrate map-ready data
    await demonstrateMapReadyData();
}

async function displayFinalStatistics(agent, totalIngested) {
    console.log('📊 FINAL INGESTION STATISTICS');
    console.log('='.repeat(60));

    const stats = agent.getSuccessMetrics();
    console.log(`🎯 Precision Rate: ${stats.precision_rate.toFixed(1)}%`);
    console.log(`🔄 Duplicate Rate: ${stats.duplicate_rate.toFixed(1)}%`);
    console.log(`🚽 Total Toilets Ingested: ${totalIngested}`);
    console.log(`🎯 Target Range: ${stats.target_range}`);
    console.log(`✅ Meets Targets: ${stats.meets_targets ? 'YES' : 'NO'}`);
    console.log('');

    // Database statistics
    const dbStats = await Toilet.aggregate([
        {
            $group: {
                _id: '$source',
                count: { $sum: 1 },
                verified: { $sum: { $cond: ['$verified', 1, 0] } }
            }
        }
    ]);

    console.log('📈 DATABASE BREAKDOWN BY SOURCE:');
    dbStats.forEach(stat => {
        const verifiedPercent = ((stat.verified / stat.count) * 100).toFixed(1);
        console.log(`   ${stat._id}: ${stat.count} toilets (${verifiedPercent}% verified)`);
    });
    console.log('');

    // Geographic distribution
    const geoStats = await Toilet.aggregate([
        {
            $match: { coordinates: { $exists: true } }
        },
        {
            $group: {
                _id: {
                    $switch: {
                        branches: [
                            { case: { $and: [{ $gte: ['$coordinates.latitude', 18] }, { $lte: ['$coordinates.latitude', 20] }] }, then: 'Mumbai Region' },
                            { case: { $and: [{ $gte: ['$coordinates.latitude', 28] }, { $lte: ['$coordinates.latitude', 29] }] }, then: 'Delhi Region' },
                            { case: { $and: [{ $gte: ['$coordinates.latitude', 12] }, { $lte: ['$coordinates.latitude', 14] }] }, then: 'South India' }
                        ],
                        default: 'Other Regions'
                    }
                },
                count: { $sum: 1 }
            }
        }
    ]);

    console.log('🗺️  GEOGRAPHIC DISTRIBUTION:');
    geoStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} toilets`);
    });
    console.log('');
}

async function demonstrateMapReadyData() {
    console.log('🗺️  MAP-READY DATA DEMONSTRATION');
    console.log('='.repeat(60));

    // Get map-ready data for home page
    const mapData = await Toilet.find({ 
        type: 'public',
        coordinates: { $exists: true }
    }).limit(10).lean();

    console.log(`📍 Sample Map Data (${mapData.length} records):`);
    console.log('');

    mapData.forEach((toilet, index) => {
        console.log(`${index + 1}. ${toilet.name || 'Unnamed Toilet'}`);
        console.log(`   📍 Location: ${toilet.location}`);
        console.log(`   🗺️  Coordinates: ${toilet.coordinates.latitude}, ${toilet.coordinates.longitude}`);
        console.log(`   🏷️  Source: ${toilet.source}`);
        console.log(`   ✅ Verified: ${toilet.verified ? 'Yes' : 'No'}`);
        console.log(`   🛠️  Facilities: ${toilet.facilities.join(', ') || 'None listed'}`);
        console.log('');
    });

    // Performance metrics for map loading
    const totalPublicToilets = await Toilet.countDocuments({ type: 'public' });
    console.log(`📊 MAP PERFORMANCE ESTIMATES:`);
    console.log(`   🚽 Total Public Toilets: ${totalPublicToilets}`);
    console.log(`   ⚡ Estimated Map Load Time: ${Math.ceil(totalPublicToilets / 100)}ms`);
    console.log(`   🎯 Density: ${(totalPublicToilets / 5).toFixed(0)} toilets per major city`);
    console.log('');

    console.log('✅ HOME PAGE MAP IS READY FOR MAXIMUM TOILET DISPLAY!');
}

// Error handling and graceful shutdown
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});

// Run the demonstration
if (require.main === module) {
    demonstrateMaximumToiletDataIngestion()
        .then(() => {
            console.log('🎉 Demonstration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Demonstration failed:', error);
            process.exit(1);
        });
}

module.exports = {
    demonstrateMaximumToiletDataIngestion,
    PublicToiletExternalDataIngestionAgent
};