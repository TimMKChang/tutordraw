const socketCon = (io) => {
  io.on('connection', (socket) => {

    console.log(`new user ${socket.id} has connected`);

    socket.on('join room', function (roomname) {
      // room
      socket.join(roomname);
    });

    socket.on('new draw', function (drawStr) {
      const { room, record } = JSON.parse(drawStr);
      socket.to(room).emit('new draw', JSON.stringify(record));
    });

    socket.on('new chat msg', function (msgStr) {
      const { room } = JSON.parse(msgStr);
      socket.to(room).emit('new chat msg', msgStr);
    });

  });
}

module.exports = {
  socketCon
}