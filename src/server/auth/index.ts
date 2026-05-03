// Auth Module Exports

export { default as JWTService } from './jwt.service';
export { default as AuthController } from './auth.controller';
export { default as authRoutes } from './auth.routes';
export {
  authenticateJWT,
  requireRole,
  requireAdmin,
  requireAgent,
  tenantIsolation,
  optionalAuth
} from './auth.middleware';

export type { AuthenticatedRequest } from './auth.middleware';
