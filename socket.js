import { jwtVerify, createRemoteJWKSet } from 'jose';
import { User } from './model/User.js';
import { getAllRoomsWithMessages } from './routes/room.js';
const REGION = process.env.AWS_REGION;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`;

const JWKS = createRemoteJWKSet(
  new URL(`${COGNITO_ISSUER}/.well-known/jwks.json`)
);

export function registerSocketIO(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || null;

      if (!token) {
        return next(new Error('Missing token'));
      }

      const { payload } = await jwtVerify(token, JWKS, {
        issuer: COGNITO_ISSUER,
      });

      const userData = {
        username: payload?.username,
        id: payload?.sub,
      };

      const user = new User(userData.id, userData.username);
      socket.user = user;

      return next();
    } catch (err) {
      console.error('🔴 Socket auth failed:', err);
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 Connected:', socket.id);

    socket.on('joinRoom', async (room) => {
      socket.join(room);

      const sockets = await io.in(room).fetchSockets();
      const users = sockets.map((s) => s.user);
      socket.emit('roomUsers', users);

      io.to(room).emit(
        'message',
        socket.user.username + ' has joined the room'
      );

      const rooms = await getAllRoomsWithMessages();
      io.emit('rooms', rooms);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Disconnected:', socket.id);
    });
  });
}
