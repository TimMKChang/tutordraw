const socket = io({
  query: {
    access_JWT: localStorage.getItem('access_JWT'),
    room: getQuery().room,
  }
});

socket.on('error', function (error) {
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: error.message,
  }).then(() => {
    location.href = '/';
  });
});

socket.on('connect', () => {
  socket.emit('join room',
    JSON.stringify({ room: Model.room.name, user: Model.user.name }));
});

socket.on('notification msg', function (dataStr) {
  const { type, msg, created_at } = JSON.parse(dataStr);
  View.chatbox.displayNewMsg([{ type, msg, created_at }]);
});

socket.on('update user list', function (dataStr) {
  const { state, users, user, user_id } = JSON.parse(dataStr);
  View.chatbox.displayUserList(Object.values(users));
  Controller.whiteboard.updateTraceList(users, user, user_id, state);
});

socket.on('new draw', function (recordStr) {
  const record = JSON.parse(recordStr);
  const records = Model.whiteboard.records;

  // reorder whiteboard records
  for (let recordIndex = records.length - 1; recordIndex >= 0; recordIndex--) {
    if (record.created_at > records[recordIndex].created_at) {
      records.splice(recordIndex + 1, 0, record);
      if (recordIndex === records.length - 1) {
        if (record.type === 'line') {
          View.whiteboard.line.draw(record);
        } else if (record.type === 'image') {
          View.whiteboard.image.draw(record);
        } else if (record.type === 'text') {
          View.whiteboard.text.draw(record);
        }
      } else {
        View.whiteboard.redraw();
      }
      break;
    }
  }
});

socket.on('new whiteboard', function () {
  View.whiteboard.initWhiteboard();
  Model.whiteboard.records = [];
  // clear pin
  View.whiteboard.pin.clear();
});

socket.on('new chat msg', function (msgStr) {
  const { user_id, sender, type, msg, time } = JSON.parse(msgStr);
  View.chatbox.displayNewMsg([{ user_id, sender, type, msg, time }]);
});

socket.on('mouse trace', function (dataStr) {
  const { user_id, mouseTrace } = JSON.parse(dataStr);
  View.whiteboard.displayMouseTrace(user_id, mouseTrace);
});

socket.on('new whiteboard pin', function (dataStr) {
  const pin = JSON.parse(dataStr);
  View.whiteboard.pin.create([pin]);
});

socket.on('update whiteboard pin', function (dataStr) {
  const pin = JSON.parse(dataStr);
  View.whiteboard.pin.update(pin);
});

socket.on('load chat msg', function (msgObjsStr) {
  const msgObjs = JSON.parse(msgObjsStr);
  const isLoad = true;
  View.chatbox.displayNewMsg(msgObjs, isLoad);
});

socket.on('load whiteboard records', async function (dataStr) {
  Model.whiteboard.records = [];

  const { links, records } = JSON.parse(dataStr);
  const allRecords = [];
  for (let linkIndex = 0; linkIndex < links.length; linkIndex++) {
    const { link } = links[linkIndex];
    await fetch(link)
      .then(res => res.json())
      .then(data => {
        const { records } = data;
        allRecords.push(...records);
      })
      .catch(error => console.error('Error:', error));
  }
  allRecords.push(...records);
  Model.whiteboard.records.unshift(...allRecords);
  View.whiteboard.redraw();
});

socket.on('load whiteboard pin', function (dataStr) {
  const { pins } = JSON.parse(dataStr);
  const isLoad = true;
  View.whiteboard.pin.create(pins, isLoad);
});

socket.on('users in call', function (dataStr) {
  const call = JSON.parse(dataStr);
  const peer_ids = Object.values(call);
  PeerjsCall.callAll(peer_ids);
});

socket.on('leave call room', function (user_id) {
  PeerjsCall.removeLeave(user_id);
});