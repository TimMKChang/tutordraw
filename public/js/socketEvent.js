const socket = io({
  query: {
    token: 'drawnowisgood'
  }
});

socket.on('error', function (error) {
  alert(error.message);
});

socket.on('connect', () => {
  Model.user.id = socket.id;
  socket.emit('join room',
    JSON.stringify({ room: Model.room.name, user: Model.user.name }));
});

socket.on('user join leave msg', function (dataStr) {
  const { type, msg, created_at } = JSON.parse(dataStr);
  View.chatbox.displayNewMsg([{ type, msg, created_at }]);
});

socket.on('update user list', function (dataStr) {
  const { users } = JSON.parse(dataStr);
  View.chatbox.displayUserList(users);
});

socket.on('new draw', function (recordStr) {
  const record = JSON.parse(recordStr);
  Model.whiteboard.records.push(record);
  View.whiteboard.line.draw(record);
});

socket.on('new chat msg', function (msgStr) {
  const { sender, type, msg, time } = JSON.parse(msgStr);
  View.chatbox.displayNewMsg([{ sender, type, msg, time }]);
});

socket.on('load chat msg', function (msgObjsStr) {
  const msgObjs = JSON.parse(msgObjsStr);
  View.chatbox.displayNewMsg(msgObjs);
});

socket.on('load whiteboard records', function (recordsStr) {
  const records = JSON.parse(recordsStr);
  Model.whiteboard.records = records;
  View.whiteboard.redraw();
});
