// Extend Express.Request to include a typed `user` property
import type { User } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user set by middleware (e.g. passport.js or custom auth)
       */
      user?: User;
    }
  }
}

export {};