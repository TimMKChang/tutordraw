require('dotenv').config();
const { PORT } = process.env;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { ExpressPeerServer } = require('peer');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// check js injection middleware
app.use(require('./util/util').checkInjection);

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
const peerServer = PeerServer({ port: 9000, path: '/call' });

// API routes
app.use('/',
  [
    require('./server/routes/room_route'),
    require('./server/routes/roomUser_route'),
    require('./server/routes/user_route'),
    require('./server/routes/historyWB_route'),
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
  if (status === 403) {
    res.status(status).json({ error: 'Authentication Error' });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

server.listen(PORT, () => {
  console.log(`App is now running on port: ${PORT}`);
});
