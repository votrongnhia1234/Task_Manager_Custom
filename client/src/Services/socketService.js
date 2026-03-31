import { io } from 'socket.io-client';

// Determine socket server URL from API URL
const SOCKET_URL =
	process.env.REACT_APP_SOCKET_URL ||
	(process.env.REACT_APP_API_URL
		? process.env.REACT_APP_API_URL.replace('/api', '') // strip possible /api suffix
		: 'http://localhost:3001');

let socket = null;

/**
 * Initialize and connect the socket to the server.
 * Call this once when the user logs in / app loads.
 */
export const connectSocket = () => {
	if (socket && socket.connected) return socket;

	const token = localStorage.getItem('token');

	socket = io(SOCKET_URL, {
		auth: { token },
		transports: ['websocket', 'polling'],
		reconnectionAttempts: 5,
		reconnectionDelay: 2000,
	});

	socket.on('connect', () => {
		console.log('[Socket.IO] Connected:', socket.id);
	});

	socket.on('disconnect', (reason) => {
		console.log('[Socket.IO] Disconnected:', reason);
	});

	socket.on('connect_error', (err) => {
		console.warn('[Socket.IO] Connection error:', err.message);
	});

	return socket;
};

/**
 * Disconnect the socket.
 */
export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};

/**
 * Get the current socket instance.
 */
export const getSocket = () => socket;

/**
 * Join a board room so the client receives board-specific events.
 * @param {string} boardId
 */
export const joinBoard = (boardId) => {
	if (!socket || !socket.connected) connectSocket();
	if (socket && boardId) {
		socket.emit('join-board', boardId);
	}
};

/**
 * Leave a board room.
 * @param {string} boardId
 */
export const leaveBoard = (boardId) => {
	if (socket && boardId) {
		socket.emit('leave-board', boardId);
	}
};

/**
 * Register a listener for a socket event.
 * @param {string} event
 * @param {Function} callback
 */
export const onEvent = (event, callback) => {
	if (!socket) return;
	socket.on(event, callback);
};

/**
 * Remove a listener for a socket event.
 * @param {string} event
 * @param {Function} callback
 */
export const offEvent = (event, callback) => {
	if (!socket) return;
	socket.off(event, callback);
};

/**
 * Check if socket is currently connected.
 */
export const isConnected = () => !!(socket && socket.connected);
