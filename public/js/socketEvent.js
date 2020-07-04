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

socket.on('user join msg', function (dataStr) {
  const { user } = JSON.parse(dataStr);
  View.chatbox.displayUserJoinLeaveMsg(user, 'join');
});

socket.on('user leave msg', function (dataStr) {
  const { user } = JSON.parse(dataStr);
  View.chatbox.displayUserJoinLeaveMsg(user, 'leave');
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
  const { sender, msg, time } = JSON.parse(msgStr);
  View.chatbox.displayNewMsg([{ sender, msg, time }]);
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
