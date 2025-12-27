// Service Level Objectives (SLOs) for Toilet Review System
// Implements best practices for performance monitoring and reliability

class SLOService {
    constructor() {
        this.metrics = {
            // API Performance SLOs
            apiResponseTime: {
                target: 500, // ms - 95% of requests < 500ms
                percentile: 95,
                window: 5 * 60 * 1000, // 5 minutes rolling window
                measurements: []
            },

            // API Availability SLO
            apiAvailability: {
                target: 99.9, // 99.9% uptime
                window: 24 * 60 * 60 * 1000, // 24 hours
                totalRequests: 0,
                successfulRequests: 0
            },

            // Error Rate SLO
            errorRate: {
                target: 1, // < 1% error rate
                window: 5 * 60 * 1000, // 5 minutes
                totalRequests: 0,
                errorRequests: 0
            },

            // Data Freshness SLO (for public toilets)
            dataFreshness: {
                target: 24 * 60 * 60 * 1000, // 24 hours
                lastSync: null
            },

            // User Experience SLOs
            mapLoadTime: {
                target: 2000, // ms - Map loads in < 2 seconds
                measurements: []
            },

            searchResponseTime: {
                target: 300, // ms - Search results in < 300ms
                measurements: []
            }
        };

        // Clean up old measurements periodically
        setInterval(() => this.cleanupOldMeasurements(), 60 * 1000); // Every minute
    }

    // Record API response time
    recordApiResponse(endpoint, method, responseTime, statusCode) {
        const measurement = {
            timestamp: Date.now(),
            endpoint,
            method,
            responseTime,
            statusCode
        };

        this.metrics.apiResponseTime.measurements.push(measurement);
        this.metrics.apiAvailability.totalRequests++;

        if (statusCode >= 200 && statusCode < 400) {
            this.metrics.apiAvailability.successfulRequests++;
        } else {
            this.metrics.errorRate.errorRequests++;
        }
        this.metrics.errorRate.totalRequests++;

        console.log(`[SLO] API ${method} ${endpoint}: ${responseTime}ms (${statusCode})`);
    }

    // Record map load time
    recordMapLoadTime(loadTime) {
        this.metrics.mapLoadTime.measurements.push({
            timestamp: Date.now(),
            loadTime
        });

        console.log(`[SLO] Map load time: ${loadTime}ms`);
    }

    // Record search response time
    recordSearchTime(searchTime, query) {
        this.metrics.searchResponseTime.measurements.push({
            timestamp: Date.now(),
            searchTime,
            query
        });

        console.log(`[SLO] Search time for "${query}": ${searchTime}ms`);
    }

    // Record public data sync
    recordDataSync() {
        this.metrics.dataFreshness.lastSync = Date.now();
        console.log(`[SLO] Public data sync completed`);
    }

    // Calculate current SLO compliance
    getCurrentSLOs() {
        const now = Date.now();

        const slos = {
            apiResponseTime: this.calculateResponseTimeSLO(now),
            apiAvailability: this.calculateAvailabilitySLO(now),
            errorRate: this.calculateErrorRateSLO(now),
            dataFreshness: this.calculateDataFreshnessSLO(now),
            mapLoadTime: this.calculateMapLoadSLO(now),
            searchResponseTime: this.calculateSearchSLO(now)
        };
        
        // Calculate overall SLO without circular reference
        const individualSLOs = [
            slos.apiResponseTime.compliance,
            slos.apiAvailability.compliance,
            slos.errorRate.compliance,
            slos.dataFreshness.compliance,
            slos.mapLoadTime.compliance,
            slos.searchResponseTime.compliance
        ];

        const overallCompliance = individualSLOs.reduce((sum, compliance) => sum + compliance, 0) / individualSLOs.length;

        slos.overall = {
            compliance: Math.round(overallCompliance),
            breakdown: slos
        };
        
        return slos;
    }

    // Calculate API response time SLO
    calculateResponseTimeSLO(now) {
        const windowStart = now - this.metrics.apiResponseTime.window;
        const recentMeasurements = this.metrics.apiResponseTime.measurements
            .filter(m => m.timestamp >= windowStart)
            .sort((a, b) => a.responseTime - b.responseTime);

        if (recentMeasurements.length === 0) return { compliance: 100, value: 0 };

        const percentileIndex = Math.floor(recentMeasurements.length * (this.metrics.apiResponseTime.percentile / 100));
        const percentileValue = recentMeasurements[percentileIndex]?.responseTime || 0;

        const compliance = percentileValue <= this.metrics.apiResponseTime.target ? 100 : 0;

        return {
            compliance,
            value: percentileValue,
            target: this.metrics.apiResponseTime.target,
            sampleSize: recentMeasurements.length
        };
    }

    // Calculate API availability SLO
    calculateAvailabilitySLO(now) {
        const windowStart = now - this.metrics.apiAvailability.window;

        // For simplicity, use recent 5-minute window for availability calculation
        const recentWindow = now - (5 * 60 * 1000);
        const recentMeasurements = this.metrics.apiResponseTime.measurements
            .filter(m => m.timestamp >= recentWindow);

        if (recentMeasurements.length === 0) return { compliance: 100, value: 100 };

        const successful = recentMeasurements.filter(m => m.statusCode >= 200 && m.statusCode < 400).length;
        const availability = (successful / recentMeasurements.length) * 100;

        return {
            compliance: availability >= this.metrics.apiAvailability.target ? 100 : (availability / this.metrics.apiAvailability.target) * 100,
            value: availability,
            target: this.metrics.apiAvailability.target,
            sampleSize: recentMeasurements.length
        };
    }

    // Calculate error rate SLO
    calculateErrorRateSLO(now) {
        const windowStart = now - this.metrics.errorRate.window;

        if (this.metrics.errorRate.totalRequests === 0) return { compliance: 100, value: 0 };

        const errorRate = (this.metrics.errorRate.errorRequests / this.metrics.errorRate.totalRequests) * 100;
        const compliance = errorRate <= this.metrics.errorRate.target ? 100 : 0;

        return {
            compliance,
            value: errorRate,
            target: this.metrics.errorRate.target,
            sampleSize: this.metrics.errorRate.totalRequests
        };
    }

    // Calculate data freshness SLO
    calculateDataFreshnessSLO(now) {
        if (!this.metrics.dataFreshness.lastSync) return { compliance: 0, value: null };

        const age = now - this.metrics.dataFreshness.lastSync;
        const compliance = age <= this.metrics.dataFreshness.target ? 100 : 0;

        return {
            compliance,
            value: age,
            target: this.metrics.dataFreshness.target,
            lastSync: new Date(this.metrics.dataFreshness.lastSync).toISOString()
        };
    }

    // Calculate map load time SLO
    calculateMapLoadSLO(now) {
        const windowStart = now - (60 * 60 * 1000); // Last hour
        const recentMeasurements = this.metrics.mapLoadTime.measurements
            .filter(m => m.timestamp >= windowStart);

        if (recentMeasurements.length === 0) return { compliance: 100, value: 0 };

        const avgLoadTime = recentMeasurements.reduce((sum, m) => sum + m.loadTime, 0) / recentMeasurements.length;
        const compliance = avgLoadTime <= this.metrics.mapLoadTime.target ? 100 : 0;

        return {
            compliance,
            value: avgLoadTime,
            target: this.metrics.mapLoadTime.target,
            sampleSize: recentMeasurements.length
        };
    }

    // Calculate search response time SLO
    calculateSearchSLO(now) {
        const windowStart = now - (60 * 60 * 1000); // Last hour
        const recentMeasurements = this.metrics.searchResponseTime.measurements
            .filter(m => m.timestamp >= windowStart);

        if (recentMeasurements.length === 0) return { compliance: 100, value: 0 };

        const avgSearchTime = recentMeasurements.reduce((sum, m) => sum + m.searchTime, 0) / recentMeasurements.length;
        const compliance = avgSearchTime <= this.metrics.searchResponseTime.target ? 100 : 0;

        return {
            compliance,
            value: avgSearchTime,
            target: this.metrics.searchResponseTime.target,
            sampleSize: recentMeasurements.length
        };
    }



    // Clean up old measurements to prevent memory leaks
    cleanupOldMeasurements() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        Object.keys(this.metrics).forEach(metricKey => {
            const metric = this.metrics[metricKey];
            if (metric.measurements) {
                metric.measurements = metric.measurements.filter(m => now - m.timestamp < maxAge);
            }
        });

        console.log('[SLO] Cleaned up old measurements');
    }

    // Get SLO targets for documentation
    getSLOTargets() {
        return {
            apiResponseTime: `${this.metrics.apiResponseTime.percentile}th percentile < ${this.metrics.apiResponseTime.target}ms`,
            apiAvailability: `> ${this.metrics.apiAvailability.target}% uptime`,
            errorRate: `< ${this.metrics.errorRate.target}% error rate`,
            dataFreshness: `< ${this.metrics.dataFreshness.target / (60 * 60 * 1000)} hours old`,
            mapLoadTime: `< ${this.metrics.mapLoadTime.target}ms`,
            searchResponseTime: `< ${this.metrics.searchResponseTime.target}ms`
        };
    }

    // Export metrics for monitoring dashboards
    exportMetrics() {
        return {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            service: 'toilet-review-system',
            environment: process.env.NODE_ENV || 'development',
            slos: this.getCurrentSLOs(),
            targets: this.getSLOTargets()
        };
    }
}

// Middleware for automatic SLO tracking
SLOService.middleware = (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        if (global.sloService) {
            global.sloService.recordApiResponse(req.originalUrl, req.method, responseTime, res.statusCode);
        }
    });

    next();
};

// Export singleton instance
const sloService = new SLOService();
global.sloService = sloService;

// Export both class and instance
module.exports = sloService;
module.exports.SLOService = SLOService;
module.exports.middleware = SLOService.middleware;
