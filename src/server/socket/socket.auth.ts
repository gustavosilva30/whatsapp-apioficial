import { Socket } from 'socket.io';
import JWTService from '../auth/jwt.service';

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

/**
 * Socket.IO Authentication Middleware
 * Validates JWT token from socket handshake and authenticates the user
 */
export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: Error) => void): void => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication token is required'));
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token as string);

    // Attach user data to socket
    socket.user = decoded;

    next();

  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Invalid or expired token'));
  }
};

/**
 * Join user to tenant room
 */
export const joinTenantRoom = (socket: AuthenticatedSocket): void => {
  if (!socket.user) {
    console.error('Cannot join room: User not authenticated');
    return;
  }

  const { tenantId, userId } = socket.user;

  // Join tenant room (for tenant-wide broadcasts)
  const tenantRoom = `tenant:${tenantId}`;
  socket.join(tenantRoom);
  console.log(`👤 User ${userId} joined tenant room: ${tenantRoom}`);

  // Join agent-specific room (for direct messages)
  const agentRoom = `agent:${userId}`;
  socket.join(agentRoom);
  console.log(`👤 User ${userId} joined agent room: ${agentRoom}`);

  // Store room info in socket data for easy access
  socket.data.rooms = {
    tenant: tenantRoom,
    agent: agentRoom
  };
};

/**
 * Leave tenant room
 */
export const leaveTenantRoom = (socket: AuthenticatedSocket): void => {
  if (!socket.user) return;

  const { tenantId, userId } = socket.user;

  const tenantRoom = `tenant:${tenantId}`;
  const agentRoom = `agent:${userId}`;

  socket.leave(tenantRoom);
  socket.leave(agentRoom);

  console.log(`👤 User ${userId} left rooms: ${tenantRoom}, ${agentRoom}`);
};

/**
 * Get tenant room name
 */
export const getTenantRoom = (tenantId: string): string => {
  return `tenant:${tenantId}`;
};

/**
 * Get agent room name
 */
export const getAgentRoom = (userId: string): string => {
  return `agent:${userId}`;
};

export default {
  socketAuthMiddleware,
  joinTenantRoom,
  leaveTenantRoom,
  getTenantRoom,
  getAgentRoom
};
