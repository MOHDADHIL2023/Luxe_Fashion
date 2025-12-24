const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches user object to request if valid
 */
const auth = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        // Expected format: "Bearer <token>"
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'No authentication token provided',
                message: 'Please include Authorization header with Bearer token'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Invalid token format',
                message: 'Authorization header must be in format: Bearer <token>'
            });
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by ID from token
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                error: 'User not found',
                message: 'The user associated with this token no longer exists'
            });
        }

        if (user.status !== 'active') {
            return res.status(401).json({ 
                error: 'Account inactive',
                message: 'Your account has been deactivated'
            });
        }
        
        // Attach user and token to request object
        req.user = user;
        req.token = token;
        
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token',
                message: 'The provided token is invalid'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired',
                message: 'Your session has expired. Please login again'
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            error: 'Authentication failed',
            message: 'Please authenticate to access this resource'
        });
    }
};

/**
 * Admin Authorization Middleware
 * Must be used AFTER auth middleware
 * Verifies that authenticated user has admin role
 */
const adminOnly = (req, res, next) => {
    // Check if user exists (should be set by auth middleware)
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please authenticate first'
        });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'This resource requires admin privileges'
        });
    }
    
    next();
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't block request if no token
 * Useful for routes that behave differently for logged-in users
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return next();
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.status === 'active') {
            req.user = user;
            req.token = token;
        }
        
        next();
        
    } catch (error) {
        // Just continue without user - don't block the request
        next();
    }
};

module.exports = { 
    auth, 
    adminOnly, 
    optionalAuth 
};