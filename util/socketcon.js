const {
  createChatmsg,
  getChatmsg,
} = require('../server/controllers/chatmsg_controller');

const {
  getWhiteboard,
} = require('../server/controllers/whiteboard_controller');

const {
  createPin,
  updatePin,
  getPin,
  removePin,
} = require('../server/controllers/pin_controller');

const {
  createHistoryWB,
} = require('../server/controllers/historyWB_controller');

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
  //   title: 'Untitled',
  //   users: {
  //     socket_id: 'alice',
  //     socket_id: 'bob',
  //   },
  //   user_idUser = {
  //     user_id: 'alice',
  //   },
  //   whiteboard: {
  //     start_at: timestamp
  //     records: [],
  //   },
  //   call: {
  //     socket.id: peer_id
  //   }
  //   token: '',
  // }
};

const closeRoomTimer = {
  // socket_id1: 'setTimeout',
};

const anonymousUserName = [
  '狸貓',
  '狐狸',
  '刺蝟',
  '犀牛',
  '恐龍',
  '浣熊',
  '羊駝',
  '水豚',
  '海貍',
  '海豚',
];

const anonymousUserColor = [
  '紅色',
  '橘色',
  '黃色',
  '綠色',
  '藍色',
  '紫色',
  '白色',
  '黑色',
  '灰色',
];

const socketCon = (io) => {
  // authentication
  io.use(function (socket, next) {
    if (socket.handshake.query && socket.handshake.query.access_JWT && socket.handshake.query.room) {
      const { access_JWT, room } = socket.handshake.query;
      const verifyJWTResult = verifyJWT(access_JWT);
      if (verifyJWTResult.error) {
        const err = new Error();
        err.data = { type: 'authError', message: 'Please sign in first' };
        next(err);
      } else {
        socket.handshake.query.userVerified = true;
        socket.handshake.query.user_id = verifyJWTResult.data.id;
        socket.handshake.query.user = verifyJWTResult.data.name;
        next();
      }
    } else if (socket.handshake.query && socket.handshake.query.room_JWT && socket.handshake.query.room) {
      const { room_JWT, room } = socket.handshake.query;

      const err = new Error();
      if (!rooms[room]) {
        // check room
        err.data = { type: 'authentication_error', message: 'The room is not available' };
        next(err);
      } else if (room_JWT !== rooms[room].token) {
        // check token
        err.data = { type: 'authentication_error', message: 'The token is not available' };
        next(err);
      } else {
        // token verified
        socket.handshake.query.user_id = Date.now().toString(36) + Math.random().toString(36).substr(-4);
        const randomName = '匿名' + randomItem(anonymousUserColor) + randomItem(anonymousUserName);
        socket.handshake.query.user = randomName;

        function randomItem(array) {
          return array[Math.floor(Math.random() * array.length)];
        }

        next();
      }

    } else {
      const err = new Error();
      err.data = { type: 'authError', message: 'Please sign in first' };
      next(err);
    }
  });

  // join room
  io.use(async function (socket, next) {
    const { room, user_id, user, room_JWT, userVerified } = socket.handshake.query;
    // check roomUser
    const verifyRoomUserResult = await RoomUser.verifyRoomUser(room, user_id);
    if (verifyRoomUserResult.error && room_JWT && userVerified) {
      // verify token
      const verifyTokenResult = await Room.verifyToken(room, room_JWT);
      if (verifyTokenResult.error) {
        const err = new Error();
        err.data = { type: 'authError', message: 'Please contact the owner of the room to get the invite link to join the room' };
        next(err);
      }
      // create roomUser
      const createRoomUserResult = await RoomUser.createRoomUser({
        room,
        user_id,
      });
      if (createRoomUserResult.error) {
        const err = new Error();
        err.data = { type: 'authError', message: 'Internal Server Error' };
        next(err);
      }
      next();

    } else if (verifyRoomUserResult.error && !socket.handshake.query.room_JWT) {
      const err = new Error();
      err.data = { type: 'authError', message: 'Please contact the owner of the room to get the invite link to join the room' };
      next(err);
    } else {
      // avoid connect repeatedly
      const lastConnectSocket_id = userClients[user_id];
      if (io.sockets.connected[lastConnectSocket_id]) {
        io.sockets.connected[lastConnectSocket_id].disconnect();
      }
      userClients[user_id] = socket.id;

      const { start_at, title, token } = await Room.getRoom(room);
      if (rooms[room]) {
        rooms[room]['users'][socket.id] = user;
        rooms[room]['user_idUser'][user_id] = user;
      } else {
        rooms[room] = {
          title,
          users: {},
          user_idUser: {},
          whiteboard: { start_at, records: [] },
          call: {},
          token,
          // created_at: Date.now(),
        };
        rooms[room]['users'][socket.id] = user;
        rooms[room]['user_idUser'][user_id] = user;
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

    socket.emit('connected', JSON.stringify({
      user_id: socket.handshake.query.user_id,
      user: socket.handshake.query.user,
      token: rooms[socket.handshake.query.room].token,
    }));

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
        JSON.stringify({
          state: 'join',
          users: rooms[room].user_idUser,
          user,
          user_id,
        }));

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

      // load whiteboard pin
      await loadWhiteboardPin(room, rooms[room].whiteboard.start_at);
      async function loadWhiteboardPin(room, start_at) {
        const { error, pins } = await getPin({ room, start_at });
        if (error) {
          console.log(error);
        } else {
          socket.emit('load whiteboard pin', JSON.stringify({ pins }));
        }
      }

      // load room title
      socket.emit('update room title', JSON.stringify({ title: rooms[room].title }));
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
      if (!rooms[room] || userClients[user_id] !== socket.id || rooms[room].users[socket.id] !== author) {
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

          } else if (recordIndex === 0) {
            records.unshift(record);
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

    socket.on('undo draw', function (dataStr) {
      const { room, user_id, created_at } = JSON.parse(dataStr);
      // check user_id and sender
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }

      const removedRecord = rooms[room].whiteboard.records.find(record => user_id === record.user_id && created_at === record.created_at);
      if (removedRecord) {
        removedRecord.isRemoved = true;
      }

      socket.to(room).emit('undo draw', dataStr);
    });

    socket.on('new whiteboard', async function (dataStr) {
      const { room, user_id, user, imageFilename } = JSON.parse(dataStr);
      // check user_id and sender
      if (!rooms[room] || userClients[user_id] !== socket.id || rooms[room].users[socket.id] !== user) {
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
      const link = `${process.env.AWS_CLOUDFRONT_DOMAIN}/images/${room}/${imageFilename}`;
      const whiteboardmsgObj = {
        room,
        type: 'whiteboard',
        msg: link,
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
      // add history whiteboard
      const historyWB = {
        room,
        start_at,
        link,
      };
      await createHistoryWB(historyWB);
    });

    socket.on('new chat msg', async function (msgStr) {
      const msgObj = JSON.parse(msgStr);
      // check user_id and sender
      const { room, user_id, sender } = msgObj;
      if (!rooms[room] || userClients[user_id] !== socket.id || rooms[room].users[socket.id] !== sender) {
        return;
      }
      await createChatmsg(msgObj);
      socket.to(room).emit('new chat msg', msgStr);
    });

    socket.on('mouse trace', async function (dataStr) {
      const mouseTraceObj = JSON.parse(dataStr);
      // check user_id
      const { room, user_id, mouseTrace } = mouseTraceObj;
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }
      socket.to(room).emit('mouse trace', dataStr);
    });

    socket.on('new whiteboard pin', async function (dataStr) {
      const pin = JSON.parse(dataStr);
      // check user_id
      const { room, user_id } = pin;
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }
      // save to DB
      const { start_at } = rooms[room].whiteboard;
      pin.whiteboard_start_at = start_at;
      await createPin(pin);

      socket.to(room).emit('new whiteboard pin', dataStr);
    });

    socket.on('update whiteboard pin', async function (dataStr) {
      const pin = JSON.parse(dataStr);
      // check user_id
      const { room, user_id } = pin;
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }
      // update to DB
      const { start_at } = rooms[room].whiteboard;
      pin.whiteboard_start_at = start_at;
      await updatePin(pin);

      socket.to(room).emit('update whiteboard pin', dataStr);
    });

    socket.on('remove whiteboard pin', async function (dataStr) {
      const pin = JSON.parse(dataStr);
      // check user_id
      const { room, user_id } = pin;
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }
      // update to DB
      const { start_at } = rooms[room].whiteboard;
      pin.whiteboard_start_at = start_at;
      await removePin(pin);

      socket.to(room).emit('remove whiteboard pin', dataStr);
    });

    socket.on('join call room', function (dataStr) {
      const { room, user_id, peer_id } = JSON.parse(dataStr);
      // check user_id
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }

      socket.to(room).emit('join call room', JSON.stringify({
        peer_id,
        user: rooms[room]['user_idUser'][user_id],
      }));
      socket.emit('users in call', JSON.stringify({
        call: rooms[room].call,
        users: rooms[room].users,
      }));
      rooms[room].call[socket.id] = peer_id;
    });

    socket.on('leave call room', function (dataStr) {
      const { room, user_id, peer_id } = JSON.parse(dataStr);
      // check user_id
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }

      socket.to(room).emit('leave call room', peer_id);
      delete rooms[room].call[socket.id];
    });

    socket.on('update room title', async function (dataStr) {
      const { room, user_id, title } = JSON.parse(dataStr);
      // check user_id
      if (!rooms[room] || userClients[user_id] !== socket.id) {
        return;
      }
      // update to DB
      const updateTitleResult = await Room.updateTitle(room, title);
      if (updateTitleResult.error) {
        console.log(updateTitleResult.error);
      }

      rooms[room].title = title;
      socket.to(room).emit('update room title', dataStr);
    });

    socket.on('disconnect', async function () {
      console.log(`user ${socket.id} has disconnected`);

      // delete user, room
      const socket_id = socket.id;
      const room = clientsRoom[socket_id];
      if (!rooms[room]) {
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
      delete rooms[room]['user_idUser'][user_id];

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
      io.to(room).emit('update user list', JSON.stringify({
        state: 'leave',
        users: rooms[room].user_idUser,
        user,
        user_id,
      }));

      // call
      io.to(room).emit('leave call room', rooms[room].call[socket.id]);
      delete rooms[room].call[socket.id];
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