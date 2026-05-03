import { Request, Response, NextFunction } from 'express';
import JWTService from './jwt.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

/**
 * JWT Authentication Middleware
 * Validates the Authorization header and attaches user data to the request
 */
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ 
        success: false, 
        error: 'Authorization header is required' 
      });
      return;
    }

    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid authorization format. Use: Bearer <token>' 
      });
      return;
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Attach user data to request
    req.user = decoded;

    next();

  } catch (error: any) {
    if (error.message === 'Invalid or expired token') {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

/**
 * RBAC Middleware - Check if user has required role
 * @param roles Array of allowed roles
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized - User not authenticated' 
        });
        return;
      }

      if (!roles.includes(user.role)) {
        res.status(403).json({ 
          success: false, 
          error: `Forbidden - Required role: ${roles.join(' or ')}` 
        });
        return;
      }

      next();

    } catch (error) {
      console.error('RBAC error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  };
};

/**
 * Admin Role Middleware
 * Shortcut for requireRole('ADMIN')
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Agent Role Middleware
 * Allows both ADMIN and AGENT roles
 */
export const requireAgent = requireRole('ADMIN', 'AGENT');

/**
 * Tenant Isolation Middleware
 * Ensures the user can only access data from their own tenant
 * This should be used after authenticateJWT
 */
export const tenantIsolation = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - User not authenticated' 
      });
      return;
    }

    // Attach tenantId to request for use in controllers
    (req as any).tenantId = user.tenantId;

    next();

  } catch (error) {
    console.error('Tenant isolation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

/**
 * Optional Authentication Middleware
 * Authenticates if token is present, but doesn't require it
 * Useful for public routes that have additional features for logged-in users
 */
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token, continue without authentication
      return next();
    }

    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      // Invalid format, continue without authentication
      return next();
    }

    try {
      // Verify token
      const decoded = JWTService.verifyAccessToken(token);
      // Attach user data to request
      req.user = decoded;
    } catch {
      // Token invalid, continue without authentication
    }

    next();

  } catch (error) {
    // Any error, continue without authentication
    next();
  }
};

export default {
  authenticateJWT,
  requireRole,
  requireAdmin,
  requireAgent,
  tenantIsolation,
  optionalAuth
};
