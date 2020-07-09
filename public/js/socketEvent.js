const socket = io({
  query: {
    access_JWT: localStorage.getItem('access_JWT'),
    room: getQuery().room,
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

socket.on('notification msg', function (dataStr) {
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
  if (record.type === 'line') {
    View.whiteboard.line.draw(record);
  } else if (record.type === 'image') {
    View.whiteboard.image.draw(record);
  }
});

socket.on('new whiteboard', function () {
  View.whiteboard.initWhiteboard();
  Model.whiteboard.records = [];
});

socket.on('new chat msg', function (msgStr) {
  const { sender, type, msg, time } = JSON.parse(msgStr);
  View.chatbox.displayNewMsg([{ sender, type, msg, time }]);
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
