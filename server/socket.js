/**
 * Socket.IO Singleton
 * Provides a single `io` instance shared across all controllers.
 * Usage: const { getIO } = require('./socket');
 *        getIO().to(room).emit(event, data);
 */

let io;

const init = (httpServer) => {
	const { Server } = require('socket.io');
	io = new Server(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST', 'PUT', 'DELETE'],
		},
	});

	io.on('connection', (socket) => {
		console.log(`[Socket.IO] Client connected: ${socket.id}`);

		// Client requests to join a board room
		socket.on('join-board', (boardId) => {
			socket.join(boardId);
			console.log(`[Socket.IO] ${socket.id} joined board: ${boardId}`);
		});

		// Client requests to leave a board room
		socket.on('leave-board', (boardId) => {
			socket.leave(boardId);
			console.log(`[Socket.IO] ${socket.id} left board: ${boardId}`);
		});

		socket.on('disconnect', () => {
			console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
		});
	});

	return io;
};

const getIO = () => {
	if (!io) throw new Error('Socket.IO has not been initialized. Call init() first.');
	return io;
};

module.exports = { init, getIO };
