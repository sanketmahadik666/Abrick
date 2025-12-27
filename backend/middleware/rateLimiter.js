// Rate limiting middleware for API protection
// Implements sliding window rate limiting

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
        this.maxRequests = options.maxRequests || 100; // Max requests per window
        this.message = options.message || 'Too many requests, please try again later.';
        
        // Store request counts per IP
        this.requests = new Map();
        
        // Clean up old entries periodically
        setInterval(() => this.cleanup(), this.windowMs);
    }

    middleware() {
        return (req, res, next) => {
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
            const now = Date.now();
            const windowStart = now - this.windowMs;

            // Get or initialize request record for this IP
            let record = this.requests.get(clientIP);
            if (!record) {
                record = { count: 0, windowStart: now };
                this.requests.set(clientIP, record);
            }

            // Reset window if needed
            if (now - record.windowStart > this.windowMs) {
                record.count = 0;
                record.windowStart = now;
            }

            // Increment counter
            record.count++;

            // Check rate limit
            if (record.count > this.maxRequests) {
                console.log(`[RATE-LIMIT] Rate limit exceeded for IP: ${clientIP}`);
                return res.status(429).json({
                    message: this.message,
                    retryAfter: Math.ceil(this.windowMs / 1000)
                });
            }

            // Add rate limit headers
            res.set({
                'X-RateLimit-Limit': this.maxRequests,
                'X-RateLimit-Remaining': Math.max(0, this.maxRequests - record.count),
                'X-RateLimit-Reset': new Date(record.windowStart + this.windowMs).getTime()
            });

            next();
        };
    }

    cleanup() {
        const now = Date.now();
        for (const [ip, record] of this.requests.entries()) {
            if (now - record.windowStart > this.windowMs * 2) {
                this.requests.delete(ip);
            }
        }
        console.log('[RATE-LIMIT] Cleaned up expired entries');
    }
}

// Specialized rate limiters for different endpoints
const authLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.'
});

const apiLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 API requests per 15 minutes
    message: 'API rate limit exceeded, please try again later.'
});

const syncLimiter = new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 sync requests per hour
    message: 'Too many sync requests, please try again later.'
});

module.exports = {
    RateLimiter,
    authLimiter: authLimiter.middleware(),
    apiLimiter: apiLimiter.middleware(),
    syncLimiter: syncLimiter.middleware()
};