const roomContainerHTML = get('.room-container');
const whiteboardHTML = get('.whiteboard');
const canvas = get('.whiteboard canvas');
const ctx = canvas.getContext('2d');

const Model = {
  user: {
    id: '',
    name: decodeURI(getQuery().user),
  },
  room: {
    name: getQuery().room,
  },
  whiteboard: {
    color: '#000000',
    width: '3',
    drawType: 'line',
    records: [],
  },
};

const View = {
  whiteboard: {
    line: {
      draw: function (record) {
        const { color, width, path } = record;

        if (path.length === 1) {
          const currX = path[0][0];
          const currY = path[0][1];
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(currX, currY, width / 2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.closePath();
        }

        for (let pathIndex = 1; pathIndex < path.length; pathIndex++) {
          const prevX = path[pathIndex - 1][0];
          const prevY = path[pathIndex - 1][1];
          const currX = path[pathIndex][0];
          const currY = path[pathIndex][1];

          ctx.beginPath();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(currX, currY);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.closePath();
          ctx.stroke();
        }
      }
    },
    initWhiteboard: function () {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    redraw: function () {
      View.whiteboard.initWhiteboard();

      for (let recordsIndex = 0; recordsIndex < Model.whiteboard.records.length; recordsIndex++) {
        const record = Model.whiteboard.records[recordsIndex];
        if (record.type === 'line') {
          View.whiteboard.line.draw(record);
        }
      }
    },
  },
  chatbox: {
    displayNewMsg: function (msgObjs) {
      for (let msgObjIndex = 0; msgObjIndex < msgObjs.length; msgObjIndex++) {
        const { sender, type, msg, time, created_at } = msgObjs[msgObjIndex];
        // type text
        if (type === 'text') {
          if (sender === Model.user.name) {
            get('.msg-container').innerHTML += `
              <div class="msg-self">
                You： ${msg}
                <span class="time-self">${time}</span>
              </div>
            `;
          } else {
            get('.msg-container').innerHTML += `
              <div class="msg-other">
                ${sender}： ${msg}
                <span class="time-other">${time}</span>
              </div>
            `;
          }
        } else if (type === 'notification') {
          get('.msg-container').innerHTML += `
            <div class="msg-notification">
              <div class="msg-notification-container">
                <div>${Controller.chatbox.getTime(created_at)}</div>
                <div>${msg}</div>
              </div>
            </div>
          `;
        } else if (type === 'whiteboard') {
          get('.msg-container').innerHTML += `
            <div class="msg-notification">
              <div class="msg-notification-container">
                <img src="${msg}" class="whiteboard-image">
              </div>
            </div>
          `;
        }
      }

      View.chatbox.scrollToBottom();
    },
    scrollToBottom: function () {
      const msgContainerHTML = get('.msg-container');
      msgContainerHTML.scrollTop = msgContainerHTML.scrollHeight;
    },
    displayUserList: function (users) {
      let htmlContent = '';
      for (let userIndex = 0; userIndex < users.length; userIndex++) {
        htmlContent += `<div>${users[userIndex]}</div>`;
      }
      get('.user-list .list-container').innerHTML = htmlContent;
    },
    displayRoomName: function () {
      get('.room-info .room-name').innerHTML = Model.room.name;
    }
  },
};

const Controller = {
  whiteboard: {
    line: {
      prevX: 0,
      prevY: 0,
      currX: 0,
      currY: 0,
      isDrawing: false,
      record: {
        author: 'teacher',
        type: 'line',
        created_at: Date.now(),
        color: 'blue',
        width: '5',
        path: [],
      },
      getXY: function (action, e) {
        const { color, width } = Model.whiteboard;

        if (action === 'down') {
          this.prevX = this.currX;
          this.prevY = this.currY;
          this.currX = e.clientX - roomContainerHTML.offsetLeft + whiteboardHTML.scrollLeft + window.pageXOffset;
          this.currY = e.clientY - roomContainerHTML.offsetTop + whiteboardHTML.scrollTop + window.pageYOffset;

          this.record = {
            author: Model.user.name,
            type: 'line',
            created_at: Date.now(),
            color,
            width,
            path: [[this.currX, this.currY]],
          };

          this.isDrawing = true;

          View.whiteboard.line.draw({
            color,
            width,
            path: [[this.currX, this.currY]],
          });

        } else if (action === 'move') {
          if (this.isDrawing) {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = e.clientX - roomContainerHTML.offsetLeft + whiteboardHTML.scrollLeft + window.pageXOffset;
            this.currY = e.clientY - roomContainerHTML.offsetTop + whiteboardHTML.scrollTop + window.pageYOffset;

            this.record.path.push([this.currX, this.currY]);

            View.whiteboard.line.draw({
              color,
              width,
              path: [[this.prevX, this.prevY], [this.currX, this.currY]],
            });
          }
        } else if (action === 'up' || action === 'out') {
          if (this.isDrawing) {
            Model.whiteboard.records.push(this.record);
            // socket
            socket.emit('new draw', JSON.stringify({ room: Model.room.name, record: this.record }));
          }
          this.isDrawing = false;
        }
      }
    },
    initListener: function () {
      // canvas
      canvas.addEventListener('mousedown', (e) => {
        if (Model.whiteboard.drawType === 'line') {
          Controller.whiteboard.line.getXY('down', e);
        }
      });
      canvas.addEventListener('mousemove', (e) => {
        if (Model.whiteboard.drawType === 'line') {
          Controller.whiteboard.line.getXY('move', e);
        }
      });
      canvas.addEventListener('mouseup', (e) => {
        if (Model.whiteboard.drawType === 'line') {
          Controller.whiteboard.line.getXY('up', e);
        }
      });
      canvas.addEventListener('mouseout', (e) => {
        if (Model.whiteboard.drawType === 'line') {
          Controller.whiteboard.line.getXY('out', e);
        }
      });

      // color
      get('.color-btn-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('color-btn')) {
          Model.whiteboard.color = e.target.dataset.color || Model.whiteboard.color;
          get('.now-color').classList.remove('now-color');
          e.target.classList.add('now-color');
        }
      });

      // width
      get('.width-btn-container input').addEventListener('change', (e) => {
        Model.whiteboard.width = e.target.value || Model.whiteboard.width;
      });

      // create new
      get('.edit-container .new').addEventListener('click', async (e) => {
        if (Model.whiteboard.records.length === 0) {
          return;
        }
        const isNew = confirm('Sure to create a new whiteboard?');
        if (isNew) {
          const imageFilename = await Controller.whiteboard.uploadWhiteboardImage();
          View.whiteboard.initWhiteboard();
          Model.whiteboard.records = [];
          socket.emit('new whiteboard', JSON.stringify({
            room: Model.room.name, user: Model.user.name, imageFilename
          }));
        }
      });

      // download
      get('.edit-container .download').addEventListener('click', (e) => {
        const link = document.createElement('a');
        link.download = `whiteboard-${getNowTimeString()}-${getRandomString(8)}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    },
    uploadWhiteboardImage: async function () {
      const blob = await getCanvasBlob(canvas);
      const formData = new FormData();
      const imageFilename = `whiteboard-${getNowTimeString()}-${getRandomString(8)}.png`
      formData.append('image', blob, imageFilename);
      formData.append('room', Model.room.name);
      const url = HOMEPAGE_URL + '/room/image';

      await fetch(url, {
        method: 'POST',
        body: formData,
      }).then(res => res.json())
        .then(resObj => {
          if (resObj.error) {
            return;
          }
        })
        .catch(error => console.log(error));

      return imageFilename;

      function getCanvasBlob(canvas) {
        return new Promise(function (resolve, reject) {
          canvas.toBlob(function (blob) {
            resolve(blob);
          });
        });
      }
    },
  },
  chatbox: {
    initListener: function () {
      // send message
      // for click send button
      get('.chatbox .send-btn').addEventListener('click', Controller.chatbox.sendMsg);
      // for press enter
      get('.chatbox .send-msg textarea').addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
          e.preventDefault();
          Controller.chatbox.sendMsg();
        }
      });
      // click and copy room invite url
      get('.chatbox .copy-link-btn i').addEventListener('click', (e) => {
        get('.room-info input[name="invite-url"]').value = `${HOMEPAGE_URL}/room.html?room=${Model.room.name}`;
        const copyText = get('.room-info input[name="invite-url"]');
        copyText.setAttribute('type', 'text');
        copyText.select();
        document.execCommand("copy");
        copyText.setAttribute('type', 'hidden');
        // copy invite url hint
        const msgHTML = get('.room-info .copy-invite-url-msg');
        if (!msgHTML.classList.contains('show-hide')) {
          msgHTML.classList.add('show-hide');
          setTimeout(function () {
            msgHTML.classList.remove('show-hide');
          }, 2000);
        }
      });
    },
    sendMsg: function () {
      const msg = get('.chatbox .send-msg textarea').value;
      if (msg.replace(/\s/g, '') === '') {
        return;
      }
      const sender = Model.user.name;
      const type = 'text';
      const time = Controller.chatbox.getTime();
      const msgObj = {
        room: Model.room.name,
        sender,
        type,
        msg,
        time,
        created_at: Date.now()
      }
      View.chatbox.displayNewMsg([{ sender, type, msg, time }]);
      socket.emit('new chat msg', JSON.stringify(msgObj));
      get('.chatbox .send-msg textarea').value = '';
    },
    getTime: function (timestamp) {
      const nowTime = timestamp ? new Date(+timestamp) : new Date();
      const hour24 = nowTime.getHours();
      const hour12 = hour24 > 12 ? `下午 ${('0' + hour24 % 12).substr(-2)}` : `上午 ${('0' + hour24).substr(-2)}`;
      const minute = ('0' + nowTime.getMinutes()).substr(-2);
      return `${hour12}:${minute}`;
    },
  },
};

// whiteboard
View.whiteboard.initWhiteboard();
Controller.whiteboard.initListener();

// chatbox
View.chatbox.displayRoomName();
Controller.chatbox.initListener();
