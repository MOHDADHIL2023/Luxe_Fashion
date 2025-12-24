/**
 * Input Validation Middleware
 * Validates and sanitizes user input to prevent XSS and injection attacks
 */

/**
 * Validate email format
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate signup input
 */
const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    // Name validation
    if (!name || name.trim().length === 0) {
        errors.push('Name is required');
    } else if (name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    } else if (name.trim().length > 50) {
        errors.push('Name must not exceed 50 characters');
    }

    // Email validation
    if (!email || email.trim().length === 0) {
        errors.push('Email is required');
    } else if (!validateEmail(email)) {
        errors.push('Invalid email format');
    }

    // Password validation
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    } else if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed',
            errors 
        });
    }

    // Sanitize inputs
    req.body.name = name.trim();
    req.body.email = email.trim().toLowerCase();

    next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || email.trim().length === 0) {
        errors.push('Email is required');
    }

    if (!password || password.length === 0) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed',
            errors 
        });
    }

    req.body.email = email.trim().toLowerCase();

    next();
};

/**
 * Validate product input
 */
const validateProduct = (req, res, next) => {
    const { name, category, price, imageUrl } = req.body;
    const errors = [];

    const validCategories = [
        'mens-fashion', 
        'womens-fashion', 
        'accessories', 
        'footwear', 
        'bags', 
        'jewelry'
    ];

    // Name validation
    if (!name || name.trim().length === 0) {
        errors.push('Product name is required');
    } else if (name.trim().length > 100) {
        errors.push('Product name must not exceed 100 characters');
    }

    // Category validation
    if (!category) {
        errors.push('Category is required');
    } else if (!validCategories.includes(category)) {
        errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }

    // Price validation
    if (price === undefined || price === null) {
        errors.push('Price is required');
    } else if (isNaN(price) || price < 0) {
        errors.push('Price must be a positive number');
    } else if (price > 1000000) {
        errors.push('Price seems unreasonably high');
    }

    // Image URL validation
    if (!imageUrl || imageUrl.trim().length === 0) {
        errors.push('Image URL is required');
    } else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        errors.push('Image URL must start with http:// or https://');
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed',
            errors 
        });
    }

    // Sanitize inputs
    if (name) req.body.name = name.trim();
    if (imageUrl) req.body.imageUrl = imageUrl.trim();

    next();
};

/**
 * Validate order input
 */
const validateOrder = (req, res, next) => {
    const { items, totalAmount } = req.body;
    const errors = [];

    // Items validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('Order must contain at least one item');
    } else {
        items.forEach((item, index) => {
            if (!item.name || item.name.trim().length === 0) {
                errors.push(`Item ${index + 1}: Name is required`);
            }
            if (!item.qty || item.qty < 1) {
                errors.push(`Item ${index + 1}: Quantity must be at least 1`);
            }
            if (item.price === undefined || item.price < 0) {
                errors.push(`Item ${index + 1}: Price must be a positive number`);
            }
        });
    }

    // Total amount validation
    if (totalAmount === undefined || totalAmount === null) {
        errors.push('Total amount is required');
    } else if (isNaN(totalAmount) || totalAmount < 0) {
        errors.push('Total amount must be a positive number');
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            error: 'Validation failed',
            errors 
        });
    }

    next();
};

/**
 * Sanitize string to prevent XSS
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/[<>]/g, '') // Remove < and >
        .trim();
};

/**
 * General sanitization middleware
 */
const sanitizeInputs = (req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeString(req.body[key]);
            }
        }
    }
    next();
};

module.exports = {
    validateSignup,
    validateLogin,
    validateProduct,
    validateOrder,
    sanitizeInputs,
    validateEmail
};