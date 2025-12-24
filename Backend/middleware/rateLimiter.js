/**
 * Simple in-memory rate limiter
 * For production, use Redis-based solutions like express-rate-limit with Redis store
 */

const requestCounts = new Map();

/**
 * Create a rate limiter middleware
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @param {string} message - Error message to return
 */
const createRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000, message = 'Too many requests') => {
    return (req, res, next) => {
        // Use IP address as identifier
        const identifier = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        // Get or create request history for this identifier
        if (!requestCounts.has(identifier)) {
            requestCounts.set(identifier, []);
        }
        
        const requests = requestCounts.get(identifier);
        
        // Remove old requests outside the time window
        const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
        
        // Check if limit exceeded
        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: message,
                retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
            });
        }
        
        // Add current request
        validRequests.push(now);
        requestCounts.set(identifier, validRequests);
        
        next();
    };
};

/**
 * Cleanup old entries periodically (every 10 minutes)
 */
setInterval(() => {
    const now = Date.now();
    const maxAge = 15 * 60 * 1000; // 15 minutes
    
    for (const [identifier, requests] of requestCounts.entries()) {
        const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
        
        if (validRequests.length === 0) {
            requestCounts.delete(identifier);
        } else {
            requestCounts.set(identifier, validRequests);
        }
    }
}, 10 * 60 * 1000);

// Specific rate limiters for different endpoints

/**
 * Login rate limiter - More strict to prevent brute force
 * 5 attempts per 15 minutes
 */
const loginRateLimiter = createRateLimiter(
    5, 
    15 * 60 * 1000, 
    'Too many login attempts. Please try again later.'
);

/**
 * Signup rate limiter
 * 3 signups per hour per IP
 */
const signupRateLimiter = createRateLimiter(
    3, 
    60 * 60 * 1000, 
    'Too many signup attempts. Please try again later.'
);

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const apiRateLimiter = createRateLimiter(
    100, 
    15 * 60 * 1000, 
    'Too many requests. Please slow down.'
);

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
const strictRateLimiter = createRateLimiter(
    10, 
    60 * 60 * 1000, 
    'Rate limit exceeded for this operation.'
);

module.exports = {
    createRateLimiter,
    loginRateLimiter,
    signupRateLimiter,
    apiRateLimiter,
    strictRateLimiter
};