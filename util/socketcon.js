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

const closeRoomTimer = {
  // socket_id1: 'setTimeout',
};

const socketCon = (io) => {
  io.use(function (socket, next) {
    socket.emit('autherror', 'error');
    if (socket.handshake.query && socket.handshake.query.token) {
      if (socket.handshake.query.token === 'drawnowisgood') {
        next();
      } else {
        const err = new Error();
        err.data = { type: 'authentication_error', message: 'authentication error' };
        next(err);
      }
    }
    else {
      const err = new Error();
      err.data = { type: 'authentication_error', message: 'authentication error' };
      next(err);
    }
  })

  io.on('connection', (socket) => {

    console.log(`new user ${socket.id} has connected`);

    socket.on('join room', async function (data) {
      const { room, user } = JSON.parse(data);

      // avoid connect repeatedly
      if (room in rooms) {
        const users = rooms[room]['users'];
        const socket_id = Object.keys(users).find(key => users[key] === user);
        if (io.sockets.connected[socket_id]) {
          io.sockets.connected[socket_id].disconnect();
        }
      }

      // cancel timer if it exist
      if (closeRoomTimer[room]) {
        clearTimeout(closeRoomTimer[room]);
      }

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

      // load whiteboard records
      socket.emit('load whiteboard records', JSON.stringify(rooms[room].whiteboard.records));
    });

    socket.on('new draw', function (drawStr) {
      const { room, record } = JSON.parse(drawStr);
      socket.to(room).emit('new draw', JSON.stringify(record));

      // save draw in room whiteboard (temporary in server)
      if (room in rooms) {
        const newDrawCreate_at = record.created_at;
        const { records } = rooms[room].whiteboard;
        if (records.length === 0) {
          records.push(record);
        } else {
          for (let recordIndex = records.length - 1; recordIndex >= 0; recordIndex--) {
            if (newDrawCreate_at > records[recordIndex].created_at) {
              records.splice(recordIndex + 1, 0, record);
              break;
            }
          }
        }
      }
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
          // set timer to delay close room
          closeRoomTimer[room] = setTimeout(function () {
            delete rooms[room];
          }, 60000);
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