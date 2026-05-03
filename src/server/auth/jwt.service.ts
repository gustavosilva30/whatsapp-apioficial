import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JWTService {
  
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: JWTPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: JWT_EXPIRES_IN as any,
      issuer: 'whatsapp-saas',
      audience: 'whatsapp-saas-users'
    };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(userId: string): string {
    const options: jwt.SignOptions = {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN as any,
      issuer: 'whatsapp-saas',
      audience: 'whatsapp-saas-users'
    };
    return jwt.sign({ userId }, JWT_SECRET, options);
  }

  /**
   * Generate both tokens
   */
  static generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload.userId);
    
    // Parse expiresIn to milliseconds
    const expiresInMatch = JWT_EXPIRES_IN.match(/^(\d+)([dhms])$/);
    let expiresIn = 7 * 24 * 60 * 60 * 1000; // Default 7 days
    
    if (expiresInMatch) {
      const value = parseInt(expiresInMatch[1]);
      const unit = expiresInMatch[2];
      switch (unit) {
        case 'd': expiresIn = value * 24 * 60 * 60 * 1000; break;
        case 'h': expiresIn = value * 60 * 60 * 1000; break;
        case 'm': expiresIn = value * 60 * 1000; break;
        case 's': expiresIn = value * 1000; break;
      }
    }

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'whatsapp-saas',
        audience: 'whatsapp-saas-users'
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'whatsapp-saas',
        audience: 'whatsapp-saas-users'
      }) as { userId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Refresh token pair
   */
  static async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const { userId } = this.verifyRefreshToken(refreshToken);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email
    };

    return this.generateTokenPair(payload);
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export default JWTService;
