const {
  createChatmsg,
  getChatmsg,
} = require('../server/controllers/chatmsg_controller');

const socketCon = (io) => {
  io.on('connection', (socket) => {

    console.log(`new user ${socket.id} has connected`);

    socket.on('join room', async function (room) {
      // room
      socket.join(room);
      // load message
      const { error, chatmsgs } = await getChatmsg({ room });
      if (error) {
        console.log(error);
      } else {
        socket.to(room).emit('load chat msg', JSON.stringify(chatmsgs));
      }
    });

    socket.on('new draw', function (drawStr) {
      const { room, record } = JSON.parse(drawStr);
      socket.to(room).emit('new draw', JSON.stringify(record));
    });

    socket.on('new chat msg', async function (msgStr) {
      const msgObj = JSON.parse(msgStr);
      await createChatmsg(msgObj);
      const { room } = msgObj;
      socket.to(room).emit('new chat msg', msgStr);
    });

  });
}

module.exports = {
  socketCon
}