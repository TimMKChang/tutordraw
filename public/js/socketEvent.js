socket.emit('join room',
  JSON.stringify({ room: Model.room.name, user: Model.user.name }));

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
