import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import JWTService from './jwt.service';

const prisma = new PrismaClient();

export class AuthController {
  
  /**
   * Login user
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ 
          success: false, 
          error: 'Email and password are required' 
        });
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      });

      if (!user || !user.isActive) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
        return;
      }

      // Verify password
      const isPasswordValid = await JWTService.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
        return;
      }

      // Generate tokens
      const payload = {
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        email: user.email
      };

      const tokens = JWTService.generateTokenPair(payload);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant.name
          },
          tokens
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a more complete implementation, you might want to:
      // 1. Add the token to a blacklist (Redis)
      // 2. Clear any session data
      // For now, we'll just return success as the client should remove the token

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Refresh tokens
   * POST /api/v1/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ 
          success: false, 
          error: 'Refresh token is required' 
        });
        return;
      }

      // Verify and refresh tokens
      const tokens = await JWTService.refreshTokens(refreshToken);

      res.status(200).json({
        success: true,
        data: { tokens }
      });

    } catch (error: any) {
      console.error('Refresh token error:', error);
      
      if (error.message === 'Invalid or expired refresh token') {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid or expired refresh token' 
        });
        return;
      }

      if (error.message === 'User not found or inactive') {
        res.status(401).json({ 
          success: false, 
          error: 'User not found or inactive' 
        });
        return;
      }

      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // User data is attached by auth middleware
      const userData = (req as any).user;

      if (!userData) {
        res.status(401).json({ 
          success: false, 
          error: 'Unauthorized' 
        });
        return;
      }

      // Get fresh user data from database
      const user = await prisma.user.findUnique({
        where: { id: userData.userId },
        include: { tenant: true },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          tenantId: true,
          tenant: {
            select: {
              id: true,
              name: true
            }
          },
          createdAt: true
        }
      });

      if (!user || !user.isActive) {
        res.status(401).json({ 
          success: false, 
          error: 'User not found or inactive' 
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Change password
   * POST /api/v1/auth/change-password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userData = (req as any).user;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ 
          success: false, 
          error: 'Current password and new password are required' 
        });
        return;
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userData.userId }
      });

      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }

      // Verify current password
      const isPasswordValid = await JWTService.comparePassword(currentPassword, user.password);
      
      if (!isPasswordValid) {
        res.status(401).json({ 
          success: false, 
          error: 'Current password is incorrect' 
        });
        return;
      }

      // Hash new password
      const hashedPassword = await JWTService.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userData.userId },
        data: { password: hashedPassword }
      });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}

export default AuthController;
