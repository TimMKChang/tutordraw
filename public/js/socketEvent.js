socket.emit('join room', Model.room.name);

socket.on('new draw', function (recordStr) {
  const record = JSON.parse(recordStr);
  Model.whiteboard.records.push(record);
  View.whiteboard.line.draw(record);
});
