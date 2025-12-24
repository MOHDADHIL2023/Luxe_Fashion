const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

/**
 * Configure Passport with Google OAuth Strategy
 */
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
            proxy: true // Required for some hosting environments
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log(' Google OAuth Profile:', {
                    id: profile.id,
                    email: profile.emails[0].value,
                    name: profile.displayName
                });

                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    // User exists - update status to active
                    console.log(' Existing Google user found:', user.email);
                    user.status = 'active';
                    await user.save();
                    return done(null, user);
                }

                // Check if user exists with same email (regular signup)
                user = await User.findOne({ 
                    email: profile.emails[0].value.toLowerCase() 
                });

                if (user) {
                    // Link Google account to existing user
                    console.log(' Linking Google account to existing user:', user.email);
                    user.googleId = profile.id;
                    user.status = 'active';
                    await user.save();
                    return done(null, user);
                }

                // Create new user
                console.log(' Creating new Google user');
                const newUser = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value.toLowerCase(),
                    status: 'active',
                    role: 'customer',
                    // No password needed for Google users
                });

                console.log(' New Google user created:', newUser.email);
                done(null, newUser);

            } catch (error) {
                console.error(' Google OAuth Error:', error);
                done(error, null);
            }
        }
    )
);

/**
 * Serialize user to session
 * Only store user ID in session
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

/**
 * Deserialize user from session
 * Fetch full user data from database
 */
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;