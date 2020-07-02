socket.emit('join room', Model.room.name);

socket.on('new draw', function (recordStr) {
  const record = JSON.parse(recordStr);
  Model.whiteboard.records.push(record);
  View.whiteboard.line.draw(record);
});

socket.on('new chat msg', function (msgStr) {
  const { sender, msg, time } = JSON.parse(msgStr);
  View.chatbox.displayNewMsg(sender, msg, time);
});
