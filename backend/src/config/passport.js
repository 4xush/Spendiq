import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Google OAuth strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
            scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                // Check if user exists with same email
                const existingEmailUser = await User.findOne({ email: profile.emails[0].value });

                if (existingEmailUser) {
                    // Link Google account to existing email account
                    existingEmailUser.googleId = profile.id;
                    existingEmailUser.picture = profile.photos[0].value;
                    existingEmailUser.authType = 'google';
                    await existingEmailUser.save();
                    return done(null, existingEmailUser);
                }

                // Create new user if doesn't exist
                const newUser = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    picture: profile.photos[0].value,
                    authType: 'google',
                });

                await newUser.save();
                return done(null, newUser);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// JWT strategy for regular authentication
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
        },
        async (payload, done) => {
            try {
                const user = await User.findById(payload.userId);

                if (!user) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                done(error, false);
            }
        }
    )
);

// Serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;