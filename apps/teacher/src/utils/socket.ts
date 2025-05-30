import { io, Socket } from 'socket.io-client';
import { getSession, useSession } from 'next-auth/react';

// Socket.IO singleton instance
let socket: Socket | null = null;

/**
 * Initialize and get the Socket.IO instance
 * @returns Socket instance
 */
export const getSocket = async (token: string): Promise<Socket> => {
  if (socket) {
    return socket;
  }

  // Get the authentication token from the session
  //const session = useSession();
  // Access the token from the session, structure may vary based on your auth setup
  //const token = session?.data?.user?.accessToken || '';
  console.log("token ", token)
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }

  // Create a new socket instance with authentication token
  socket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/boards` || 'http://localhost:3005/boards', {
    path: '/socket.io',
    autoConnect: false, // Don't connect automatically
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
    auth: {
      token: `Bearer ${token}`
    },
    extraHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return socket;
};

/**
 * Disconnect and cleanup socket instance
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 