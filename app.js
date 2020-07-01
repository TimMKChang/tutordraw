require('dotenv').config();
const { PORT } = process.env;

const express = require('express');
const app = express();

app.use(express.static('public'));

// socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { socketCon } = require('./util/socketcon');
socketCon(io);

server.listen(PORT, () => {
  console.log(`App is now running on port: ${PORT}`);
});
