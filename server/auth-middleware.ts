import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userName?: string;
  user?: any;
}

// Google OAuth configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  return done(null, {
    id: profile.id,
    name: profile.displayName,
    email: profile.emails?.[0]?.value
  });
}));

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check for Google OAuth session first
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    req.userId = req.user.id;
    req.userName = req.user.name;
    req.user = req.user;
    return next();
  }

  // Fallback to Replit auth headers
  const userId = req.headers['x-replit-user-id'] as string;
  const userName = req.headers['x-replit-user-name'] as string;

  if (!userId) {
    return res.status(401).json({ 
      message: "Authentication required",
      authenticated: false 
    });
  }

  req.userId = userId;
  req.userName = userName;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check for Google OAuth session first
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    req.userId = req.user.id;
    req.userName = req.user.name;
    req.user = req.user;
    return next();
  }

  // Fallback to Replit auth headers
  const userId = req.headers['x-replit-user-id'] as string;
  const userName = req.headers['x-replit-user-name'] as string;

  if (userId) {
    req.userId = userId;
    req.userName = userName;
  }

  next();
}