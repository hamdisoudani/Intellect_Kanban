import { io, Socket } from 'socket.io-client';

// Socket.IO singleton instance
let socket: Socket | null = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3005';

/**
 * Gets or creates a Socket.IO instance with authentication.
 * The namespace is hardcoded to '/boards' as that is where the board-related events are.
 */
export const getSocket = (token: string): Socket => {
  if (socket) {
    console.log('[SocketUtil] Returning existing socket instance.');
    // Update auth token in case it changed
    socket.auth = { token: `Bearer ${token}` };
    return socket;
  }

  console.log('[SocketUtil] Creating new socket instance.');
  socket = io(`${SOCKET_URL}/boards`, {
    autoConnect: false,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      token: `Bearer ${token}`,
    },
  });

  // Log basic connection events for debugging
  socket.on('connect', () => console.log('[SocketUtil] Socket connected.'));
  socket.on('disconnect', (reason) => console.log(`[SocketUtil] Socket disconnected: ${reason}`));
  socket.on('connect_error', (err) => console.error(`[SocketUtil] Connection error: ${err.message}`));

  return socket;
};

/**
 * Disconnects and nullifies the singleton socket instance.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    console.log('[SocketUtil] Disconnecting socket.');
    socket.disconnect();
    socket = null;
  }
}; 