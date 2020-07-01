const socketCon = (io) => {
  io.on('connection', (socket) => {

    console.log('new user has connected');

  });
}

module.exports = {
  socketCon
}