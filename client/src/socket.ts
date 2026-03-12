import { io, Socket } from 'socket.io-client';

// Define the socket connection details
const SOCKET_URL = 'https://vtol.verion.ch';

// Create and export the socket instance so it can be imported anywhere
export const socket: Socket = io(SOCKET_URL);
