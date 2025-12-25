const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { auth, adminOnly } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =============================================
// HELPER FUNCTION: Generate JWT Token
// =============================================
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

// =============================================
// GOOGLE AUTH ROUTE (PUBLIC)
// =============================================
router.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        
        console.log(' Google Auth attempt');

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        
        // 1. Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { name, email, picture, sub: googleId } = payload;

        console.log(' Google token verified for:', email);

        // 2. Check if user exists in DB
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            console.log(' Existing user found:', email);
            // User exists - Update googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
            }
            user.status = 'active';
            await user.save();
        } else {
            console.log(' Creating new user:', email);
            // Create new user
            user = new User({
                name,
                email: email.toLowerCase(),
                googleId,
                // Generate random password for Google users (they won't use it)
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
                role: 'customer',
                status: 'active'
            });
            await user.save();
        }

        // 3. Generate JWT Token (Same as normal login)
        const jwtToken = generateToken(user);

        console.log(' Google login successful for:', email);

        res.json({
            success: true,
            message: 'Google login successful',
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error(' Google Auth Error:', error);
        res.status(400).json({ 
            error: 'Invalid Google Token',
            details: error.message 
        });
    }
});

// =============================================
// SIGNUP ROUTE (Public)
// =============================================
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                error: 'User with this email already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            status: 'active',
            role: 'customer'
        });

        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser);

        console.log(' New user created:', email);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            error: 'Server error during signup',
            details: error.message 
        });
    }
});

// =============================================
// LOGIN ROUTE (Public)
// =============================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(' Login attempt for:', email);

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find user (case-insensitive email search)
        const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') }
        });

        if (!user) {
            console.log(' User not found:', email);
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        console.log('👤 User found:', user.email);

        // Check if password field exists
        if (!user.password) {
            console.log(' No password set for user:', email);
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log(' Invalid password for:', email);
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Update user status to active
        user.status = 'active';
        await user.save();

        // Generate JWT token
        const token = generateToken(user);

        console.log(' User logged in successfully:', email);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Server error during login',
            details: error.message 
        });
    }
});

// =============================================
// GET CURRENT USER (Protected)
// =============================================
router.get('/me', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                status: req.user.status,
                joined: req.user.joined
            }
        });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ 
            error: 'Error fetching user data',
            details: error.message 
        });
    }
});

// =============================================
// LOGOUT ROUTE (Protected)
// =============================================
router.post('/logout', auth, async (req, res) => {
    try {
        // Update user status to inactive
        req.user.status = 'inactive';
        await req.user.save();

        console.log(' User logged out:', req.user.email);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            error: 'Error during logout',
            details: error.message 
        });
    }
});

// =============================================
// GET ALL USERS (Admin only - Protected)
// =============================================
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ joined: -1 });

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            error: 'Error fetching users',
            details: error.message 
        });
    }
});

// =============================================
// GET SINGLE USER (Protected)
// =============================================
router.get('/:id', auth, async (req, res) => {
    try {
        // Users can only view their own profile unless they're admin
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'You can only view your own profile'
            });
        }

        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            error: 'Error fetching user',
            details: error.message 
        });
    }
});

// =============================================
// UPDATE USER (Admin only - Protected)
// =============================================
router.put('/:id', auth, adminOnly, async (req, res) => {
    try {
        const { name, email, role, status } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.toLowerCase().trim();
        if (role) updateData.role = role;
        if (status) updateData.status = status;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(' User updated:', updatedUser.email);

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            error: 'Error updating user',
            details: error.message 
        });
    }
});

// =============================================
// UPDATE OWN PROFILE (Protected)
// =============================================
router.patch('/me/update', auth, async (req, res) => {
    try {
        const { name } = req.body;

        // Only allow users to update their own name
        if (name) {
            req.user.name = name.trim();
            await req.user.save();
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                status: req.user.status
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ 
            error: 'Error updating profile',
            details: error.message 
        });
    }
});

// =============================================
// CHANGE PASSWORD (Protected)
// =============================================
router.post('/me/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                error: 'New password must be at least 6 characters' 
            });
        }

        // Verify current password
        const user = await User.findById(req.user._id);
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        console.log(' Password changed for:', user.email);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            error: 'Error changing password',
            details: error.message 
        });
    }
});

// =============================================
// DELETE USER (Admin only - Protected)
// =============================================
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        // Prevent admin from deleting themselves
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ 
                error: 'You cannot delete your own account' 
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('🗑️ User deleted:', deletedUser.email);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            error: 'Error deleting user',
            details: error.message 
        });
    }
});

module.exports = router;