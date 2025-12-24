const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * @route   GET /auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account' // Always show account selection
    })
);

/**
 * @route   GET /auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback',
    passport.authenticate('google', { 
        session: false, // We use JWT, not sessions
        failureRedirect: '/auth/google/failure'
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user);

            console.log(' Google login successful for:', req.user.email);

            // Redirect to frontend with token
            // You can customize this URL based on your frontend
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
            
            // Option 1: Redirect with token in URL (for SPA)
            res.redirect(`${frontendURL}/auth/callback?token=${token}`);

            // Option 2: If you prefer JSON response, uncomment below and remove redirect
            /*
            res.json({
                success: true,
                message: 'Google login successful',
                token,
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    role: req.user.role,
                    status: req.user.status
                }
            });
            */

        } catch (error) {
            console.error('Error in Google callback:', error);
            res.redirect('/auth/google/failure');
        }
    }
);

/**
 * @route   GET /auth/google/failure
 * @desc    Google OAuth failure page
 * @access  Public
 */
router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        error: 'Google authentication failed',
        message: 'Failed to authenticate with Google. Please try again.'
    });
});

/**
 * @route   GET /auth/google/success (Optional - for testing)
 * @desc    Check if Google auth is working
 * @access  Public
 */
router.get('/google/success', (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            message: 'Google authentication successful',
            user: req.user
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
});

module.exports = router;