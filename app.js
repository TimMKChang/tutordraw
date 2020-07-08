require('dotenv').config();
const { PORT } = process.env;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { socketCon } = require('./util/socketcon');
socketCon(io);

// API routes
app.use('/',
  [
    require('./server/routes/room_route'),
    require('./server/routes/user_route'),
  ]
);

// Page not found
app.use(function (req, res, next) {
  res.status(404).send('404 Page Not Found');
});

// Error handling
app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`App is now running on port: ${PORT}`);
});
