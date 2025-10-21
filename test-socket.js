// test-socket.js
// Simple Socket.IO client to test /conversations gateway
// Usage: node test-socket.js <JWT> <recipientId>
// Example: node test-socket.js "Bearer eyJ..." "user-uuid-2"

const { io } = require('socket.io-client');

const BASE = 'http://localhost:3000/conversations';
const [, , JWT, RECIPIENT] = process.argv;

if (!JWT || !RECIPIENT) {
  console.error('Usage: node test-socket.js <JWT> <recipientId>');
  process.exit(1);
}

const socket = io(BASE, { auth: { token: JWT } });

socket.on('connect', () => {
  console.log('connected', socket.id);

  const payload = {
    recipientId: RECIPIENT,
    content: 'Hello from test-socket.js',
    clientMessageId: 'cli-' + Date.now(),
  };

  console.log('sending payload', payload);
  socket.emit('send_message', payload);

  // resend after 1s to test idempotency
  setTimeout(() => {
    console.log('resending same clientMessageId to test idempotency');
    socket.emit('send_message', payload);
  }, 1000);
});

socket.on('new_message', (data) => {
  console.log('NEW_MESSAGE:', JSON.stringify(data, null, 2));
});

socket.on('connect_error', (err) => {
  console.error('connect_error', err.message || err);
});

socket.on('disconnect', (reason) => {
  console.log('disconnected', reason);
});
