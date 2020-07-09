const {
  createChatmsg,
  getChatmsg,
} = require('../server/controllers/chatmsg_controller');

const {
  getWhiteboard,
} = require('../server/controllers/whiteboard_controller');

const {
  uploadWhiteboard,
} = require('../server/S3/uploadImage');

const { verifyJWT } = require('./util');
const Room = require('../server/models/room_model');
const RoomUser = require('../server/models/roomUser_model');

// users connection data
const clientsRoom = {
  // socket_id: 'room',
};

const userClients = {
  // user_id: 'socket_id',
};

const rooms = {
  // room: {
  //   users: {
  //     socket_id: 'alice',
  //     socket_id: 'bob',
  //   },
  //   whiteboard: {
  //     start_at: timestamp
  //     records: [],
  //   }
  // }
};

const closeRoomTimer = {
  // socket_id1: 'setTimeout',
};

const socketCon = (io) => {
  // authentication
  io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.access_JWT && socket.handshake.query.room) {
      const { access_JWT, room } = socket.handshake.query;
      const verifyJWTResult = verifyJWT(access_JWT);
      if (verifyJWTResult.error) {
        const err = new Error();
        err.data = { type: 'authError', message: 'authentication error' };
        next(err);
      } else {
        socket.handshake.query.user_id = verifyJWTResult.data.id;
        socket.handshake.query.user = verifyJWTResult.data.name;
        next();
      }
    }
    else {
      const err = new Error();
      err.data = { type: 'authentication_error', message: 'socket connection error' };
      next(err);
    }
  });

  // join room
  io.use(async function (socket, next) {
    const { room, user_id, user } = socket.handshake.query;
    // check roomUser
    const verifyRoomUserResult = await RoomUser.verifyRoomUser(room, user_id);
    if (verifyRoomUserResult.error) {
      const err = new Error();
      err.data = { type: 'authError', message: 'Please contact the owner of the room to get the password to join the room' };
      next(err);
    } else {
      // avoid connect repeatedly
      const lastConnectSocket_id = userClients[user_id];
      if (io.sockets.connected[lastConnectSocket_id]) {
        io.sockets.connected[lastConnectSocket_id].disconnect();
      }
      userClients[user_id] = socket.id;

      const { start_at } = await Room.getWhiteboardStart_at(room);
      if (room in rooms) {
        rooms[room]['users'][socket.id] = user;
      } else {
        rooms[room] = {
          users: {},
          whiteboard: { start_at, records: [] },
          // created_at: Date.now(),
        };
        rooms[room]['users'][socket.id] = user;
      }

      // cancel timer if it exist
      if (closeRoomTimer[room]) {
        clearTimeout(closeRoomTimer[room]);
      }

      // room
      socket.join(room);
      clientsRoom[socket.id] = room;

      next();
    }
  });

  io.on('connection', (socket) => {

    console.log(`new user ${socket.id} has connected`);

    socket.on('join room', async function (data) {
      const { room, user_id, user } = socket.handshake.query;

      // load message
      const { error, chatmsgs } = await getChatmsg({ room });
      if (error) {
        console.log(error);
      } else {
        // send to self
        socket.emit('load chat msg', JSON.stringify(chatmsgs));
      }

      // user join message
      const joinmsgObj = {
        room,
        type: 'notification',
        msg: `歡迎 ${user} 加入聊天室`,
        created_at: Date.now(),
      };
      await createChatmsg(joinmsgObj);
      io.to(room).emit('notification msg', JSON.stringify(joinmsgObj));

      // update user list
      io.to(room).emit('update user list',
        JSON.stringify({ users: Object.values(rooms[room].users) }));

      // load whiteboard records
      await loadWhiteboardRecords(room, rooms[room].whiteboard.start_at);
      async function loadWhiteboardRecords(room, start_at) {
        const { error, links } = await getWhiteboard({ room, start_at });
        const records = rooms[room].whiteboard.records;
        if (error) {
          console.log(error);
        } else {
          socket.emit('load whiteboard records', JSON.stringify({ links, records }));
        }
      }
    });

    socket.on('load chat msg', async function (dataStr) {
      const { room, lastOldestCreated_at } = JSON.parse(dataStr);
      // load message
      const { error, chatmsgs } = await getChatmsg({ room, lastOldestCreated_at });
      if (error) {
        console.log(error);
      } else {
        socket.emit('load chat msg', JSON.stringify(chatmsgs));
      }
    });

    socket.on('new draw', function (drawStr) {
      const { room, record } = JSON.parse(drawStr);

      // check user_id and sender
      const { user_id, author } = record;
      if (!room in rooms || userClients[user_id] !== socket.id || rooms[room].users[socket.id] !== author) {
        return;
      }

      socket.to(room).emit('new draw', JSON.stringify(record));

      // save draw in room whiteboard (temporary in server)
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

      // upload to S3
      if (records.length > 30) {
        const { start_at } = rooms[room].whiteboard;
        const uploadRecords = records.splice(0, 30);
        uploadWhiteboard(room, start_at, uploadRecords);
      }
    });

    socket.on('new whiteboard', async function (dataStr) {
      const { room, user_id, user, imageFilename } = JSON.parse(dataStr);
      // check user_id and sender
      if (!room in rooms || userClients[user_id] !== socket.id || rooms[room].users[socket.id] !== user) {
        return;
      }

      socket.to(room).emit('new whiteboard', '');
      // who does new whiteboard message
      const msgObj = {
        room,
        type: 'notification',
        msg: `${user} 重新開了一張畫布`,
        created_at: Date.now(),
      };
      await createChatmsg(msgObj);
      io.to(room).emit('notification msg', JSON.stringify(msgObj));
      // save whiteboard image message to DB and then send message back
      const whiteboardmsgObj = {
        room,
        type: 'whiteboard',
        msg: `${process.env.AWS_CLOUDFRONT_DOMAIN}/images/${room}/${imageFilename}`,
        created_at: Date.now(),
      };
      await createChatmsg(whiteboardmsgObj);
      io.to(room).emit('notification msg', JSON.stringify(whiteboardmsgObj));
      // upload remain records to S3
      const { start_at } = rooms[room].whiteboard;
      const { records } = rooms[room].whiteboard;
      const uploadRecords = records.splice(0, records.length);
      uploadWhiteboard(room, start_at, uploadRecords);
      // create new whiteboard
      const new_start_at = Date.now();
      rooms[room].whiteboard = { start_at: new_start_at, records: [] };
      // update whiteboard start_at
      const updateWhiteboardStart_atResult = await Room.updateWhiteboardStart_at(room, new_start_at);
      if (updateWhiteboardStart_atResult.error) {
        console.log(updateWhiteboardStart_atResult.error);
      }
    });

    socket.on('new chat msg', async function (msgStr) {
      const msgObj = JSON.parse(msgStr);
      // check user_id and sender
      const { room, user_id, sender } = msgObj;
      if (!room in rooms || userClients[user_id] !== socket.id || rooms[room].users[socket.id] !== sender) {
        return;
      }
      await createChatmsg(msgObj);
      socket.to(room).emit('new chat msg', msgStr);
    });

    socket.on('disconnect', async function () {
      console.log(`user ${socket.id} has disconnected`);

      // delete user, room
      const socket_id = socket.id;
      const room = clientsRoom[socket_id];
      if (!room in rooms) {
        return;
      }
      const user = rooms[room]['users'][socket_id];
      delete rooms[room]['users'][socket_id];

      const users = Object.values(rooms[room].users);
      if (users.length === 0) {
        // upload remain records to S3
        const { start_at, records } = rooms[room].whiteboard;
        const uploadRecords = records.splice(0, records.length);
        uploadWhiteboard(room, start_at, uploadRecords);

        // set timer to delay close room
        closeRoomTimer[room] = setTimeout(function () {
          delete rooms[room];
        }, 60000);
      }
      delete clientsRoom[socket_id];
      const { user_id } = socket.handshake.query;
      delete userClients[user_id];

      // user leave message
      const leavemsgObj = {
        room,
        type: 'notification',
        msg: `${user} 已離開聊天室`,
        created_at: Date.now(),
      };
      await createChatmsg(leavemsgObj);
      socket.to(room).emit('notification msg', JSON.stringify(leavemsgObj));

      // update user list
      io.to(room).emit('update user list', JSON.stringify({ users }));
    });

  });
};

function errorHandling(io, data) {
  io.use(function (socket, next) {
    const err = new Error();
    err.data = data;
    next(err);
  });
}

module.exports = {
  socketCon
};