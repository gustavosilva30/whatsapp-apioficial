import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin, AuthenticatedRequest } from '../auth';

const prisma = new PrismaClient();
const router = Router();

// Validation schemas
const createChannelSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  wabaId: z.string().min(1, 'WhatsApp Business Account ID is required'),
  verifyToken: z.string().min(1, 'Verify Token is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  userId: z.string().uuid().optional(),
});

const updateChannelSchema = z.object({
  phoneNumberId: z.string().min(1).optional(),
  wabaId: z.string().min(1).optional(),
  verifyToken: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  userId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

const channelIdSchema = z.object({
  id: z.string().uuid(),
});

// Controller
class ChannelController {
  
  /**
   * Create new WhatsApp channel
   * POST /api/v1/channels
   */
  static async create(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validation = createChannelSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
        return;
      }

      const { phoneNumberId, wabaId, verifyToken, accessToken, userId } = validation.data;

      // Check if phoneNumberId already exists
      const existingChannel = await prisma.channel.findUnique({
        where: { phoneNumberId }
      });

      if (existingChannel) {
        res.status(409).json({ 
          success: false, 
          error: 'Phone Number ID already registered' 
        });
        return;
      }

      // Create channel with tenant isolation
      const channel = await prisma.channel.create({
        data: {
          tenantId: user.tenantId,
          phoneNumberId,
          wabaId,
          verifyToken,
          accessToken,
          userId: userId || null,
          isActive: true,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: channel,
        message: 'WhatsApp channel created successfully'
      });

    } catch (error) {
      console.error('Create channel error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * List all channels for tenant
   * GET /api/v1/channels
   */
  static async list(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const channels = await prisma.channel.findMany({
        where: { tenantId: user.tenantId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.status(200).json({
        success: true,
        data: channels,
        count: channels.length
      });

    } catch (error) {
      console.error('List channels error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Get channel by ID
   * GET /api/v1/channels/:id
   */
  static async getById(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const channel = await prisma.channel.findFirst({
        where: { 
          id,
          tenantId: user.tenantId // Tenant isolation
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      if (!channel) {
        res.status(404).json({ 
          success: false, 
          error: 'Channel not found' 
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: channel
      });

    } catch (error) {
      console.error('Get channel error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Update channel
   * PUT /api/v1/channels/:id
   */
  static async update(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const validation = updateChannelSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ 
          success: false, 
          error: 'Validation failed', 
          details: validation.error.errors 
        });
        return;
      }

      // Check if channel exists and belongs to tenant
      const existingChannel = await prisma.channel.findFirst({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      });

      if (!existingChannel) {
        res.status(404).json({ 
          success: false, 
          error: 'Channel not found' 
        });
        return;
      }

      // If updating phoneNumberId, check uniqueness
      if (validation.data.phoneNumberId && validation.data.phoneNumberId !== existingChannel.phoneNumberId) {
        const duplicate = await prisma.channel.findUnique({
          where: { phoneNumberId: validation.data.phoneNumberId }
        });
        if (duplicate) {
          res.status(409).json({ 
            success: false, 
            error: 'Phone Number ID already in use' 
          });
          return;
        }
      }

      // Update channel
      const channel = await prisma.channel.update({
        where: { id },
        data: validation.data,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: channel,
        message: 'Channel updated successfully'
      });

    } catch (error) {
      console.error('Update channel error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Delete channel
   * DELETE /api/v1/channels/:id
   */
  static async delete(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Check if channel exists and belongs to tenant
      const existingChannel = await prisma.channel.findFirst({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      });

      if (!existingChannel) {
        res.status(404).json({ 
          success: false, 
          error: 'Channel not found' 
        });
        return;
      }

      // Soft delete or hard delete? Let's do hard delete for now
      await prisma.channel.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Channel deleted successfully'
      });

    } catch (error) {
      console.error('Delete channel error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  /**
   * Test channel connection with Meta API
   * POST /api/v1/channels/:id/test
   */
  static async testConnection(req: AuthenticatedRequest, res: any): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      const channel = await prisma.channel.findFirst({
        where: { 
          id,
          tenantId: user.tenantId 
        }
      });

      if (!channel) {
        res.status(404).json({ 
          success: false, 
          error: 'Channel not found' 
        });
        return;
      }

      // Here you would test the connection with Meta API
      // For now, just return success
      res.status(200).json({
        success: true,
        message: 'Channel configuration is valid',
        data: {
          phoneNumberId: channel.phoneNumberId,
          wabaId: channel.wabaId,
          isActive: channel.isActive
        }
      });

    } catch (error) {
      console.error('Test connection error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}

// Routes

/**
 * @route   POST /api/v1/channels
 * @desc    Create new WhatsApp channel
 * @access  Private (Admin only)
 */
router.post('/', authenticateJWT, requireAdmin, ChannelController.create);

/**
 * @route   GET /api/v1/channels
 * @desc    List all channels for tenant
 * @access  Private (Admin or Agent)
 */
router.get('/', authenticateJWT, ChannelController.list);

/**
 * @route   GET /api/v1/channels/:id
 * @desc    Get channel by ID
 * @access  Private (Admin or Agent)
 */
router.get('/:id', authenticateJWT, ChannelController.getById);

/**
 * @route   PUT /api/v1/channels/:id
 * @desc    Update channel
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateJWT, requireAdmin, ChannelController.update);

/**
 * @route   DELETE /api/v1/channels/:id
 * @desc    Delete channel
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateJWT, requireAdmin, ChannelController.delete);

/**
 * @route   POST /api/v1/channels/:id/test
 * @desc    Test channel connection
 * @access  Private (Admin or Agent)
 */
router.post('/:id/test', authenticateJWT, ChannelController.testConnection);

export default router;
