import { Router } from 'express';
import AuthController from './auth.controller';
import { authenticateJWT, requireAdmin, requireAgent } from './auth.middleware';

const router = Router();

/**
 * Auth Routes
 * Base path: /api/v1/auth
 */

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', AuthController.login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private (any authenticated user)
 */
router.post('/logout', authenticateJWT, AuthController.logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 */
router.post('/refresh', AuthController.refresh);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (any authenticated user)
 */
router.get('/me', authenticateJWT, AuthController.getProfile);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private (any authenticated user)
 */
router.post('/change-password', authenticateJWT, AuthController.changePassword);

export default router;

/**
 * Protected Routes Example Usage:
 * 
 * import { authenticateJWT, requireAdmin, requireAgent } from './auth.middleware';
 * 
 * // Any authenticated user
 * app.get('/api/v1/protected', authenticateJWT, handler);
 * 
 * // Only admin users
 * app.get('/api/v1/admin', authenticateJWT, requireAdmin, handler);
 * 
 * // Admin or agent users
 * app.get('/api/v1/agent', authenticateJWT, requireAgent, handler);
 */
