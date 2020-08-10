require('dotenv').config();
const { NODE_ENV, PORT, PORT_TEST, PORT_PEER_SERVER, API_VERSION } = process.env;
const port = NODE_ENV === 'test' ? PORT_TEST : PORT;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { ExpressPeerServer } = require('peer');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS
app.use((req, res, next) => {
  const allowedOrigins = ['https://tutordraw.xyz', 'https://www.tutordraw.xyz'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'POST, GET, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  next();
});

// socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { socketCon } = require('./util/socketcon');
socketCon(io);

// peerjs
const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: PORT_PEER_SERVER, path: '/call' });

// API routes
app.use('/api/' + API_VERSION,
  [
    require('./server/routes/room_route'),
    require('./server/routes/room_user_route'),
    require('./server/routes/user_route'),
    require('./server/routes/whiteboard_route'),
  ]
);

// Page not found
app.use(function (req, res, next) {
  res.status(404).redirect('/404.html');
});

// Error handling
app.use(function (err, req, res, next) {
  console.log(err);
  const { status, error } = err;
  if (status && error) {
    res.status(status).json({ error });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

server.listen(port, () => {
  console.log(`App is now running on port: ${port}`);
});

module.exports = server;
