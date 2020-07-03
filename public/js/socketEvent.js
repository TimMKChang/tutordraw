socket.emit('join room',
  JSON.stringify({ room: Model.room.name, user: Model.user.name }));

socket.on('user join msg', function (dataStr) {
  const { user } = JSON.parse(dataStr);
  View.chatbox.displayUserJoinLeaveMsg(user, 'join');
});

socket.on('user leave msg', function (dataStr) {
  const { user } = JSON.parse(dataStr);
  View.chatbox.displayUserJoinLeaveMsg(user, 'leave');
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
