import { io, Socket } from 'socket.io-client';
import { displayAlert } from './alert';

// Define the socket connection details
const SOCKET_URL = 'https://vtol.verion.ch';

// Create and export the socket instance so it can be imported anywhere
export const socket: Socket = io(SOCKET_URL);

socket.on('connect', () => {
    displayAlert('Connected to Ground Station Server', 'information', 3000);
});

socket.on('disconnect', () => {
    displayAlert('Disconnected from Ground Station Server', 'error/problem', 5000);
});
