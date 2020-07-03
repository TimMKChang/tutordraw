const {
  createChatmsg,
  getChatmsg,
} = require('../server/controllers/chatmsg_controller');

// users connection data
const clientsRoom = {
  // socket_id1: 'room1',
};

const rooms = {
  // room1: {
  //   users: {
  //     socket_id1: 'alice',
  //     socket_id2: 'bob',
  //   },
  //   whiteboard: {
  //     records: [],
  //   }
  // }
};

const socketCon = (io) => {
  io.on('connection', (socket) => {

    console.log(`new user ${socket.id} has connected`);

    socket.on('join room', async function (data) {
      const { room, user } = JSON.parse(data);
      // room
      socket.join(room);
      // add user to rooms
      clientsRoom[socket.id] = room;

      if (room in rooms) {
        rooms[room]['users'][socket.id] = user;
      } else {
        rooms[room] = {
          users: {},
          whiteboard: { records: [] },
          created_at: Date.now(),
        };
        rooms[room]['users'][socket.id] = user;
      }
      // user join message
      socket.to(room).emit('user join msg', JSON.stringify({ user }));
      // update user list
      io.to(room).emit('update user list',
        JSON.stringify({ users: Object.values(rooms[room].users) }));
      // load message
      const { error, chatmsgs } = await getChatmsg({ room });
      if (error) {
        console.log(error);
      } else {
        // send to self
        socket.emit('load chat msg', JSON.stringify(chatmsgs));
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

    socket.on('disconnect', function () {
      console.log(`user ${socket.id} has disconnected`);
      // delete user, room
      const id = socket.id;
      const room = clientsRoom[id];
      let user;
      let users = [];
      if (rooms[room]) {
        user = rooms[room]['users'][id];
        delete rooms[room]['users'][id];
        users = Object.values(rooms[room].users);
        if (Object.keys(rooms[room].users).length === 0) {
          delete rooms[room];
        }
      }
      delete clientsRoom[id];
      // user leave message
      socket.to(room).emit('user leave msg', JSON.stringify({ user }));
      // update user list
      io.to(room).emit('update user list', JSON.stringify({ users }));
    });

  });
}

module.exports = {
  socketCon
}