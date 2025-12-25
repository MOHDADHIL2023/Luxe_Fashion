const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// @desc    Register new user
// @route   POST /users/signup
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            status: 'active',
            role: 'customer'
        });

        const token = generateToken(user);
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Login user
// @route   POST /users/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: new RegExp(`^${email}$`, 'i') });
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.status = 'active';
        await user.save();

        const token = generateToken(user);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Google Authentication
// @route   POST /users/auth/google
const googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const { name, email, sub: googleId } = ticket.getPayload();
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            if (!user.googleId) user.googleId = googleId;
            user.status = 'active';
            await user.save();
        } else {
            user = await User.create({
                name,
                email: email.toLowerCase(),
                googleId,
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
                role: 'customer',
                status: 'active'
            });
        }

        const jwtToken = generateToken(user);
        res.json({
            success: true,
            token: jwtToken,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(400).json({ error: 'Google Auth Failed', details: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /users/me
const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};

// @desc    Logout user
// @route   POST /users/logout
const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            req.user.status = 'inactive';
            await req.user.save();
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    googleAuth,
    getMe,
    logoutUser
};