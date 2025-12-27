/**
 * PublicToiletExternalDataIngestionAgent
 * Version: 1.0.0
 * 
 * A senior data ingestion and geospatial systems engineer responsible for
 * extracting, validating, normalizing, deduplicating, and persisting public 
 * toilet location data from multiple external APIs and datasets.
 * 
 * Primary Objective: Maximize the number of accurate, usable public toilet POIs
 * while maintaining high data integrity, geographic correctness, and long-term maintainability.
 */

const Toilet = require('./models/Toilet');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

class PublicToiletExternalDataIngestionAgent {
    constructor(options = {}) {
        this.options = {
            cacheResults: true,
            batchQueries: true,
            confidenceThreshold: 0.6,
            deduplicationRadius: 15, // meters
            maxRetries: 3,
            timeout: 30000,
            ...options
        };
        
        // Rate limiting
        this.rateLimits = new Map();
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
        
        // Statistics
        this.stats = {
            totalProcessed: 0,
            totalAccepted: 0,
            totalRejected: 0,
            duplicatesRemoved: 0,
            sources: {}
        };
    }

    // Data Sources Configuration
    getDataSources() {
        return {
            osm_overpass: {
                type: 'api',
                priority: 1,
                endpoint: 'https://overpass-api.de/api/interpreter',
                expected_tags: ['amenity=toilets'],
                format: 'json',
                rate_limit_strategy: 'cache_results_and_batch_queries',
                trust_level: 'medium'
            },
            planet_osm: {
                type: 'bulk_dataset',
                priority: 2,
                format: 'osm.pbf',
                update_frequency: 'weekly',
                trust_level: 'medium'
            },
            government_datasets: {
                type: 'api_or_csv',
                priority: 3,
                requires_api_key: true,
                trust_level: 'high',
                constraints: [
                    'ignore datasets without latitude and longitude',
                    'ignore aggregated or statistical-only datasets'
                ]
            },
            verified_locations: {
                type: 'manual_seed',
                priority: 4,
                categories: ['railway_station', 'airport', 'mall', 'educational_institution'],
                trust_level: 'high'
            }
        };
    }

    // Canonical Schema Definition
    getCanonicalSchema() {
        return {
            id: 'uuid',
            name: 'string|null',
            latitude: 'number',
            longitude: 'number',
            source: 'OSM|PLANET_OSM|GOVERNMENT|MANUAL|USER',
            access: 'public|customers|private|unknown',
            gender: 'male|female|unisex|unknown',
            wheelchair_accessible: 'yes|no|unknown',
            operator: 'string|null',
            verified: 'boolean',
            confidence_score: 'number(0-1)',
            last_updated: 'ISO_8601_timestamp'
        };
    }

    // Ingestion Rules Implementation
    validateAndNormalizeRecord(rawRecord, source) {
        try {
            // Rule 1: Reject any record without valid latitude and longitude
            if (!rawRecord.latitude || !rawRecord.longitude) {
                throw new Error('Missing latitude or longitude');
            }

            // Rule 2: Reject coordinates outside valid Earth bounds
            const lat = parseFloat(rawRecord.latitude);
            const lng = parseFloat(rawRecord.longitude);
            
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                throw new Error('Invalid coordinate bounds');
            }

            // Rule 3: Normalize all coordinate precision to 6 decimal places
            const normalizedLat = Math.round(lat * 1000000) / 1000000;
            const normalizedLng = Math.round(lng * 1000000) / 1000000;

            // Rule 4: Convert missing optional fields to null, not empty strings
            const normalizedRecord = {
                id: rawRecord.id || uuidv4(),
                name: this.normalizeString(rawRecord.name),
                latitude: normalizedLat,
                longitude: normalizedLng,
                source: this.mapSourceType(source),
                access: this.normalizeAccessType(rawRecord.access),
                gender: this.normalizeGender(rawRecord.gender),
                wheelchair_accessible: this.normalizeWheelchairAccess(rawRecord.wheelchair_accessible),
                operator: this.normalizeString(rawRecord.operator),
                verified: rawRecord.verified || false,
                confidence_score: this.calculateConfidenceScore(rawRecord, source),
                last_updated: new Date().toISOString()
            };

            return normalizedRecord;

        } catch (error) {
            console.log(`[INGESTION] Validation failed: ${error.message}`);
            this.stats.totalRejected++;
            return null;
        }
    }

    // Deduplication Strategy Implementation
    async deduplicateRecords(records) {
        const uniqueRecords = [];
        const existingToilets = await Toilet.find({});
        
        for (const record of records) {
            const isDuplicate = this.checkForDuplicates(record, existingToilets, uniqueRecords);
            
            if (!isDuplicate) {
                uniqueRecords.push(record);
            } else {
                this.stats.duplicatesRemoved++;
                console.log(`[INGESTION] Duplicate removed: ${record.name} at ${record.latitude},${record.longitude}`);
            }
        }

        return uniqueRecords;
    }

    checkForDuplicates(newRecord, existingToilets, newRecords) {
        const radiusMeters = this.options.deduplicationRadius;
        
        // Check against existing database records
        for (const existing of existingToilets) {
            if (this.isWithinRadius(newRecord, existing, radiusMeters)) {
                if (this.shouldMergeRecords(newRecord, existing)) {
                    this.mergeRecords(newRecord, existing);
                    return true; // Consider as merged, not duplicate
                }
                return true; // Duplicate found
            }
        }

        // Check against new records being processed
        for (const newRec of newRecords) {
            if (this.isWithinRadius(newRecord, newRec, radiusMeters)) {
                if (this.shouldMergeRecords(newRecord, newRec)) {
                    this.mergeRecords(newRecord, newRec);
                    return true;
                }
                return true;
            }
        }

        return false;
    }

    // Confidence Scoring System
    calculateConfidenceScore(record, source) {
        const dataSources = this.getDataSources();
        const sourceConfig = dataSources[source];
        
        if (!sourceConfig) return 0.5;

        let baseScore = this.getBaseScore(sourceConfig.trust_level);
        
        // Boost conditions
        if (record.wheelchair_accessible === 'yes') baseScore += 0.1;
        if (record.operator) baseScore += 0.1;
        if (record.name) baseScore += 0.05;
        
        // Penalty conditions
        if (!record.name) baseScore -= 0.1;
        if (record.access === 'unknown') baseScore -= 0.05;
        
        return Math.max(0, Math.min(1, baseScore));
    }

    getBaseScore(trustLevel) {
        const scores = {
            'high': 0.8,
            'medium': 0.6,
            'low': 0.4
        };
        return scores[trustLevel] || 0.5;
    }

    // Data Source Implementations

    // 1. OSM Overpass API Implementation
    async ingestFromOSMOverpass(bounds) {
        console.log('[INGESTION] Starting OSM Overpass ingestion...');
        
        try {
            const query = this.buildOverpassQuery(bounds);
            const response = await this.makeRateLimitedRequest(
                'https://overpass-api.de/api/interpreter',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`
                }
            );

            if (!response.ok) {
                throw new Error(`Overpass API failed: ${response.status}`);
            }

            const data = await response.json();
            const records = this.parseOSMData(data.elements);
            
            console.log(`[INGESTION] OSM Overpass: ${records.length} records processed`);
            return records;

        } catch (error) {
            console.error('[INGESTION] OSM Overpass failed:', error.message);
            return [];
        }
    }

    buildOverpassQuery(bounds) {
        return `
            [out:json][timeout:30];
            (
                node["amenity"="toilets"](${bounds});
                way["amenity"="toilets"](${bounds});
                relation["amenity"="toilets"](${bounds});
            );
            out body;
            >;
            out skel qt;
        `;
    }

    parseOSMData(elements) {
        const records = [];
        
        for (const element of elements) {
            if (element.type === 'node' && element.tags) {
                const record = {
                    latitude: element.lat,
                    longitude: element.lon,
                    name: element.tags.name || null,
                    wheelchair_accessible: element.tags.wheelchair || 'unknown',
                    access: this.mapOSMAccess(element.tags.access),
                    operator: element.tags.operator || null,
                    source: 'osm_overpass'
                };
                
                const validated = this.validateAndNormalizeRecord(record, 'osm_overpass');
                if (validated) {
                    records.push(validated);
                }
            }
        }
        
        return records;
    }

    // 2. Government Datasets Implementation
    async ingestFromGovernmentDatasets(city) {
        console.log('[INGESTION] Starting government datasets ingestion...');
        
        try {
            // data.gov.in implementation
            const apiKey = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
            const response = await this.makeRateLimitedRequest(
                `https://www.data.gov.in/api/3/action/package_search?q=toilet&rows=50&api-key=${apiKey}`
            );

            if (!response.ok) {
                throw new Error(`Government API failed: ${response.status}`);
            }

            const data = await response.json();
            const records = this.parseGovernmentData(data.result?.results || []);
            
            console.log(`[INGESTION] Government datasets: ${records.length} records processed`);
            return records;

        } catch (error) {
            console.error('[INGESTION] Government datasets failed:', error.message);
            return [];
        }
    }

    parseGovernmentData(datasets) {
        const records = [];
        
        for (const dataset of datasets) {
            // Process dataset resources
            for (const resource of dataset.resources || []) {
                if (resource.format?.toLowerCase() === 'json') {
                    // In a real implementation, fetch and process the actual resource data
                    // For now, we'll skip actual resource processing due to complexity
                    console.log(`[INGESTION] Found government dataset: ${dataset.title}`);
                }
            }
        }
        
        return records;
    }

    // 3. Verified Locations Implementation
    async ingestVerifiedLocations() {
        console.log('[INGESTION] Starting verified locations ingestion...');
        
        const verifiedLocations = [
            // Transport Hubs
            {
                name: 'Mumbai Central Railway Station',
                latitude: 18.9700,
                longitude: 72.8200,
                category: 'railway_station',
                wheelchair_accessible: 'yes',
                access: 'public',
                operator: 'Indian Railways'
            },
            {
                name: 'Chhatrapati Shivaji Terminus',
                latitude: 18.9398,
                longitude: 72.8354,
                category: 'railway_station',
                wheelchair_accessible: 'yes',
                access: 'public',
                operator: 'Indian Railways'
            },
            // Commercial Centers
            {
                name: 'Phoenix Mall Public Toilets',
                latitude: 18.9944,
                longitude: 72.8259,
                category: 'mall',
                wheelchair_accessible: 'yes',
                access: 'public',
                operator: 'Phoenix Mills'
            },
            // Educational Institutions
            {
                name: 'IIT Bombay Campus Public Toilets',
                latitude: 19.1334,
                longitude: 72.9133,
                category: 'educational_institution',
                wheelchair_accessible: 'yes',
                access: 'public',
                operator: 'IIT Bombay'
            }
        ];

        const records = [];
        for (const location of verifiedLocations) {
            const record = {
                ...location,
                source: 'verified_locations'
            };
            
            const validated = this.validateAndNormalizeRecord(record, 'verified_locations');
            if (validated) {
                validated.verified = true;
                validated.confidence_score = Math.max(validated.confidence_score, 0.9);
                records.push(validated);
            }
        }
        
        console.log(`[INGESTION] Verified locations: ${records.length} records processed`);
        return records;
    }

    // Main Ingestion Pipeline
    async ingestAllSources(bounds, city) {
        console.log(`[INGESTION] Starting comprehensive ingestion for ${city}...`);
        console.log(`[INGESTION] Bounds: ${bounds}`);
        
        const dataSources = this.getDataSources();
        const allRecords = [];
        
        // Process sources in priority order
        for (const [sourceName, config] of Object.entries(dataSources)) {
            try {
                console.log(`[INGESTION] Processing ${sourceName}...`);
                
                let records = [];
                switch (sourceName) {
                    case 'osm_overpass':
                        records = await this.ingestFromOSMOverpass(bounds);
                        break;
                    case 'government_datasets':
                        records = await this.ingestFromGovernmentDatasets(city);
                        break;
                    case 'verified_locations':
                        records = await this.ingestVerifiedLocations();
                        break;
                    default:
                        console.log(`[INGESTION] Source ${sourceName} not implemented yet`);
                }
                
                if (records.length > 0) {
                    allRecords.push(...records);
                    this.stats.sources[sourceName] = records.length;
                    console.log(`[INGESTION] ${sourceName}: ${records.length} records`);
                }
                
            } catch (error) {
                console.error(`[INGESTION] Error processing ${sourceName}:`, error.message);
            }
        }
        
        // Deduplicate records
        console.log(`[INGESTION] Deduplicating ${allRecords.length} total records...`);
        const uniqueRecords = await this.deduplicateRecords(allRecords);
        
        // Save to database
        const savedCount = await this.saveToDatabase(uniqueRecords);
        
        // Update statistics
        this.stats.totalProcessed = allRecords.length;
        this.stats.totalAccepted = uniqueRecords.length;
        
        console.log(`[INGESTION] Ingestion complete:`);
        console.log(`  - Total processed: ${this.stats.totalProcessed}`);
        console.log(`  - Total accepted: ${this.stats.totalAccepted}`);
        console.log(`  - Duplicates removed: ${this.stats.duplicatesRemoved}`);
        console.log(`  - Sources: ${JSON.stringify(this.stats.sources)}`);
        
        return {
            success: true,
            stats: this.stats,
            saved: savedCount
        };
    }

    // Database Operations
    async saveToDatabase(records) {
        let saved = 0;
        
        for (const record of records) {
            try {
                const toilet = new Toilet({
                    name: record.name,
                    location: `${record.latitude},${record.longitude}`,
                    coordinates: {
                        latitude: record.latitude,
                        longitude: record.longitude
                    },
                    facilities: this.extractFacilities(record),
                    type: 'public',
                    source: record.source,
                    verified: record.verified,
                    averageRating: 0,
                    totalReviews: 0,
                    metadata: {
                        confidence_score: record.confidence_score,
                        access: record.access,
                        gender: record.gender,
                        wheelchair_accessible: record.wheelchair_accessible,
                        operator: record.operator
                    }
                });
                
                await toilet.save();
                saved++;
                
            } catch (error) {
                console.error(`[INGESTION] Error saving record:`, error.message);
            }
        }
        
        return saved;
    }

    // Utility Methods
    async makeRateLimitedRequest(url, options) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`[INGESTION] Rate limiting: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        
        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    normalizeString(value) {
        if (!value || typeof value !== 'string') return null;
        return value.trim();
    }

    mapSourceType(source) {
        const mapping = {
            'osm_overpass': 'OSM',
            'planet_osm': 'PLANET_OSM',
            'government_datasets': 'GOVERNMENT',
            'verified_locations': 'MANUAL'
        };
        return mapping[source] || 'UNKNOWN';
    }

    normalizeAccessType(access) {
        if (!access) return 'unknown';
        const normalized = access.toLowerCase();
        if (['public', 'customers', 'private'].includes(normalized)) {
            return normalized;
        }
        return 'unknown';
    }

    normalizeGender(gender) {
        if (!gender) return 'unknown';
        const normalized = gender.toLowerCase();
        if (['male', 'female', 'unisex'].includes(normalized)) {
            return normalized;
        }
        return 'unknown';
    }

    normalizeWheelchairAccess(access) {
        if (!access) return 'unknown';
        const normalized = access.toLowerCase();
        if (['yes', 'no'].includes(normalized)) {
            return normalized;
        }
        return 'unknown';
    }

    mapOSMAccess(tags) {
        if (tags.access === 'public') return 'public';
        if (tags.access === 'private') return 'private';
        if (tags.opening_hours && tags.opening_hours !== '24/7') return 'customers';
        return 'unknown';
    }

    extractFacilities(record) {
        const facilities = [];
        if (record.wheelchair_accessible === 'yes') facilities.push('handicap');
        if (record.gender === 'unisex') facilities.push('unisex');
        if (record.access === 'public') facilities.push('public_access');
        return facilities;
    }

    isWithinRadius(record1, record2, radiusMeters) {
        const R = 6371000; // Earth's radius in meters
        const lat1Rad = record1.latitude * Math.PI / 180;
        const lat2Rad = record2.coordinates.latitude * Math.PI / 180;
        const deltaLatRad = (record2.coordinates.latitude - record1.latitude) * Math.PI / 180;
        const deltaLngRad = (record2.coordinates.longitude - record1.longitude) * Math.PI / 180;
        
        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        const distance = R * c;
        return distance <= radiusMeters;
    }

    shouldMergeRecords(record1, record2) {
        // Same amenity type and within radius
        if (!this.isWithinRadius(record1, record2, this.options.deduplicationRadius)) {
            return false;
        }
        
        // Source priority check
        const priority1 = this.getSourcePriority(record1.source);
        const priority2 = this.getSourcePriority(record2.source);
        
        return priority1 >= priority2;
    }

    getSourcePriority(source) {
        const priorities = {
            'USER': 5,
            'GOVERNMENT': 4,
            'OSM': 3,
            'PLANET_OSM': 3,
            'MANUAL': 2
        };
        return priorities[source] || 1;
    }

    mergeRecords(primary, secondary) {
        // Merge missing fields from secondary into primary
        if (!primary.name && secondary.name) primary.name = secondary.name;
        if (!primary.operator && secondary.operator) primary.operator = secondary.operator;
        if (primary.confidence_score < secondary.confidence_score) {
            primary.confidence_score = secondary.confidence_score;
        }
    }

    // Success Metrics
    getSuccessMetrics() {
        const duplicateRate = this.stats.totalProcessed > 0 ? 
            (this.stats.duplicatesRemoved / this.stats.totalProcessed) * 100 : 0;
        
        return {
            precision_rate: this.stats.totalAccepted > 0 ? 
                (this.stats.totalAccepted / this.stats.totalProcessed) * 100 : 0,
            duplicate_rate: duplicateRate,
            total_toilets_ingested: this.stats.totalAccepted,
            target_range: '20k-40k toilets (India)',
            meets_targets: (
                this.stats.totalAccepted >= 20000 && 
                duplicateRate <= 3
            )
        };
    }
}

module.exports = PublicToiletExternalDataIngestionAgent;