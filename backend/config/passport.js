const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = (User) => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api${process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'}`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) {
        return done(new Error('Email not provided by Google'), null);
      }

      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email }
        ]
      }).select('+googleId +googleAccessToken +googleRefreshToken +googleTokenExpiry +authProvider');

      if (user) {
        // Link googleId if not already linked
        if (!user.googleId) {
          user.googleId = profile.id;
          user.authProvider = 'google';
        }
        // Store tokens for potential future Google API access
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        user.googleTokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = await User.create({
        email,
        name: profile.displayName || profile.name?.givenName || email.split('@')[0],
        googleId: profile.id,
        authProvider: 'google',
        role: 'donor', // Default role for Google signups
        profile: {
          profilePicture: profile.photos?.[0]?.value,
          verified: true, // Google-verified email
        },
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

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
};
