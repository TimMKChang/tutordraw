const roomContainerHTML = get('.room-container');
const whiteboardHTML = get('.whiteboard');
const canvas = get('.whiteboard canvas');
const ctx = canvas.getContext('2d');

const Model = {
  user: JSON.parse(localStorage.getItem('user')),
  room: {
    name: getQuery().room,
  },
  whiteboard: {
    color: '#000000',
    width: '3',
    drawType: 'line',
    records: [],
    image: {
      imageReferencePosition: [0, 0],
      imagePosition: [300, 50],
      imageMovable: false,
    },
    text: {
      textReferencePosition: [0, 0],
      textPosition: [300, 50],
      textMovable: false,
    },
    pin: {
      pinOriginalPosition: [0, 0],
      pinReferencePosition: [0, 0],
      pinPosition: [300, 50],
      pinMovable: false,
      pinClickable: true,
    },
    boundary: {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
    },
  },
  chatbox: {
    lastOldestCreated_at: 0,
    scrollLock: false,
  },
  historyWB: [],
};

const View = {
  whiteboard: {
    line: {
      draw: function (record) {
        const { author, color, width, path } = record;

        // get trace boundary
        const boundary = {
          minX: path[0][0],
          maxX: path[0][0],
          minY: path[0][1],
          maxY: path[0][1],
        };

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

          // trace boundary
          if (currX < boundary.minX) {
            boundary.minX = currX;
          }
          if (currX > boundary.maxX) {
            boundary.maxX = currX;
          }
          if (currY < boundary.minY) {
            boundary.minY = currY;
          }
          if (currY > boundary.maxY) {
            boundary.maxY = currY;
          }

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

        if (author !== 'self') {
          View.whiteboard.line.updateTrace(record, boundary);
        }
      },
      updateTrace: function (record, boundary) {
        const { user_id, path, width } = record;
        const { minX, maxX, minY, maxY } = boundary;
        const userHTML = get(`.whiteboard .trace [data-user_id="${user_id}"]`);
        if (userHTML) {
          userHTML.style.top = `${minY - +width / 2 - 10}px`;
          userHTML.style.left = `${minX - +width / 2 - 10}px`;
          userHTML.style.width = `${maxX - minX + +width + 20}px`;
          userHTML.style.height = `${maxY - minY + +width + 20}px`;
        }
      },
    },
    image: {
      draw: function (record) {
        return new Promise(function (resolve, reject) {
          const { x, y, width, height, link } = record;
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = function () {
            ctx.drawImage(img, x, y, width, height);
            resolve();
          };
          img.src = link;
          // trace
          View.whiteboard.image.updateTrace(record, x, y, width, height);
        });
      },
      updateTrace: function (record, x, y, width, height) {
        const { user_id } = record;
        const userHTML = get(`.whiteboard .trace [data-user_id="${user_id}"]`);
        if (userHTML) {
          userHTML.style.top = `${y - 10}px`;
          userHTML.style.left = `${x - 10}px`;
          userHTML.style.width = `${width + 20}px`;
          userHTML.style.height = `${height + 20}px`;
        }
      },
    },
    text: {
      draw: function (record) {
        const { content, x, y, size } = record;
        ctx.font = `${size} Josefin Sans, cwTeXYen, Verdana`;
        ctx.fillStyle = '#000000';
        const width = ctx.measureText(content).width;
        const height = +size.replace('px', '');
        // offset
        ctx.fillText(content, x + 2, y + 0.25 * height);
        // trace
        View.whiteboard.text.updateTrace(record, x + 2, y + 0.25 * height, width, height);
      },
      updateTrace: function (record, x, y, width, height) {
        const { user_id } = record;
        const userHTML = get(`.whiteboard .trace [data-user_id="${user_id}"]`);
        if (userHTML) {
          userHTML.style.top = `${y - 10 - height}px`;
          userHTML.style.left = `${x - 10}px`;
          userHTML.style.width = `${width + 20}px`;
          userHTML.style.height = `${height + 20}px`;
        }
      },
    },
    pin: {
      create: function (pins, isLoad) {
        // offset from preview-container size
        const preWidth = 100;
        const preHeight = 100;

        // offset from pin itself size
        const pinWidth = 40;
        const pinHeight = 40;

        for (let pinIndex = 0; pinIndex < pins.length; pinIndex++) {
          const pin = pins[pinIndex];
          const { x, y, created_at, content } = pin;
          const iHTML = document.createElement('i');
          iHTML.className = 'fas fa-thumbtack pin';
          iHTML.dataset.created_at = created_at;
          get('.whiteboard .pin-container').appendChild(iHTML);
          iHTML.innerHTML += `
            <div class="pin-text">
              <textarea name="pin-text">${content}</textarea>
              <i class="fas fa-trash-alt remove-btn"></i>
            </div>
          `;
          iHTML.style.left = `${x + preWidth / 2 - pinWidth / 2}px`;
          iHTML.style.top = `${y + preHeight / 2 - pinHeight / 2}px`;
        }

        if (isLoad) {
          // close all pins
          get('.whiteboard .pin-container').click();
        } else {
          // pin container
          get('.whiteboard .pin-container').classList.remove('pointer-none');
        }
      },
      update: function (pin) {
        const { created_at, content, x, y } = pin;
        if (content) {
          const pinTextareaHTML = get(`.whiteboard .pin-container [data-created_at="${created_at}"] textarea`);
          if (pinTextareaHTML) {
            pinTextareaHTML.value = content;
          }
        } else if (x && y) {
          // offset from preview-container size
          const preWidth = 100;
          const preHeight = 100;

          // offset from pin itself size
          const pinWidth = 40;
          const pinHeight = 40;

          const pinHTML = get(`.whiteboard .pin-container [data-created_at="${created_at}"]`);
          if (pinHTML) {
            pinHTML.style.left = `${x + preWidth / 2 - pinWidth / 2}px`;
            pinHTML.style.top = `${y + preHeight / 2 - pinHeight / 2}px`;
          }
        }
      },
      remove: function (pin) {
        const { created_at } = pin;
        get(`.whiteboard .pin-container [data-created_at="${created_at}"]`).remove();
      },
      clear: function () {
        get('.whiteboard .pin-container').innerHTML = '';
      },
      createHistoryWB: function () {
        // offset from preview-container size
        const preWidth = 100;
        const preHeight = 100;

        // offset from pin itself size
        const pinWidth = 40;
        const pinHeight = 40;

        get('.history-whiteboard-pin-container').innerHTML = '';
        const pins = Model.historyWB.find((wb) => get('.history-whiteboard img').src === wb.link).pins;
        for (let pinIndex = 0; pinIndex < pins.length; pinIndex++) {
          const pin = pins[pinIndex];
          const { x, y, content, created_at } = pin;

          get('.history-whiteboard-pin-container').innerHTML += `
            <i class="fas fa-thumbtack pin" data-created_at="${created_at}">
              <div class="pin-text">
                <textarea name="pin-text" disabled>${content}</textarea>
              </div>
            </i>
          `;

          const pinHTML = get(`.history-whiteboard-pin-container [data-created_at="${created_at}"]`);
          pinHTML.style.left = `${x + preWidth / 2 - pinWidth / 2}px`;
          pinHTML.style.top = `${y + preHeight / 2 - pinHeight / 2}px`;
        }
      },
    },
    initWhiteboard: function () {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    redraw: async function () {
      View.whiteboard.initWhiteboard();

      for (let recordsIndex = 0; recordsIndex < Model.whiteboard.records.length; recordsIndex++) {
        const record = Model.whiteboard.records[recordsIndex];
        if (record.type === 'line') {
          View.whiteboard.line.draw(record);
        } else if (record.type === 'image') {
          await View.whiteboard.image.draw(record);
        } else if (record.type === 'text') {
          View.whiteboard.text.draw(record);
        }
      }
    },
    displayMouseTrace: function (user_id, mouseTrace) {
      const { x, y } = mouseTrace;
      const userHTML = get(`.whiteboard .mouse-trace [data-user_id="${user_id}"]`);
      if (userHTML) {
        userHTML.style.top = `${y}px`;
        userHTML.style.left = `${x}px`;
      }
    },
    displayHistoryWB: function () {
      get('.history-whiteboard-list').innerHTML = '';

      for (let wbIndex = 0; wbIndex < Model.historyWB.length; wbIndex++) {
        const { link } = Model.historyWB[wbIndex];
        get('.history-whiteboard-list').innerHTML += `
          <img src="${link}" alt="">
        `;
      }
    },
  },
  chatbox: {
    displayNewMsg: function (msgObjs, isLoad) {
      if (isLoad && msgObjs.length === 0) {
        Model.chatbox.scrollLock = true;
        return;
      }
      for (let msgObjIndex = 0; msgObjIndex < msgObjs.length; msgObjIndex++) {
        const { user_id, sender, type, msg, time, created_at } = msgObjs[msgObjIndex];
        let htmlContent = '';
        // type text
        if (type === 'text') {
          if (user_id === Model.user.id) {
            htmlContent += `
              <div class="msg-self">
                You： ${msg}
                <span class="time-self">${time}</span>
              </div>
            `;
          } else {
            htmlContent += `
              <div class="msg-other">
                ${sender}： ${msg}
                <span class="time-other">${time}</span>
              </div>
            `;
          }
        } else if (type === 'notification') {
          htmlContent += `
            <div class="msg-notification">
              <div class="msg-notification-container">
                <div>${Controller.chatbox.getTime(created_at)}</div>
                <div>${msg}</div>
              </div>
            </div>
          `;
        } else if (type === 'whiteboard') {
          htmlContent += `
            <div class="msg-notification">
              <div class="msg-notification-container">
                <img src="${msg}" class="whiteboard-image">
              </div>
            </div>
          `;
        } else if (type === 'image') {
          if (user_id === Model.user.id) {
            htmlContent += `
              <div class="msg-self">
                You：
                <img src="${msg}" class="image-msg">
                <span class="time-self">${time}</span>
              </div>
            `;
          } else {
            htmlContent += `
              <div class="msg-other">
                ${sender}：
                <img src="${msg}" class="image-msg">
                <span class="time-other">${time}</span>
              </div>
            `;
          }
        }
        // load message or not
        if (isLoad) {
          get('.msg-container').insertAdjacentHTML('afterbegin', htmlContent);
        } else {
          get('.msg-container').insertAdjacentHTML('beforeend', htmlContent);
        }
      }

      //  first time load message and not load message
      const isFirstLoad = Model.chatbox.lastOldestCreated_at === 0;
      if (!isLoad || isFirstLoad) {
        View.chatbox.scrollToBottom(isFirstLoad);
      }
      // mark oldest created_at
      if (isLoad) {
        Model.chatbox.lastOldestCreated_at = msgObjs[msgObjs.length - 1].created_at;
        Model.chatbox.scrollLock = false;
      }
    },
    scrollToBottom: function (isFirstLoad) {
      const msgContainerHTML = get('.msg-container');
      if (isFirstLoad) {
        msgContainerHTML.scrollTop = msgContainerHTML.scrollHeight;
        return;
      }

      const maxScrollTop = msgContainerHTML.scrollHeight - msgContainerHTML.offsetHeight;
      if (maxScrollTop - msgContainerHTML.scrollTop < msgContainerHTML.offsetHeight * 1.5) {
        msgContainerHTML.scrollTop = msgContainerHTML.scrollHeight;
      }
    },
    displayUserList: function (users) {
      let htmlContent = '';
      for (let userIndex = 0; userIndex < users.length; userIndex++) {
        htmlContent += `
          <div class="user">
            <span class="status"></span>
            <span class="name">${users[userIndex]}</span>
          </div>
        `;
      }
      get('.user-list .list-container').innerHTML = htmlContent;
    },
    displayRoomName: function () {
      get('.room-navbar .header .room-name span').innerHTML = Model.room.name;
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
        user_id: '',
        author: '',
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
          this.currX = e.clientX - roomContainerHTML.offsetLeft - whiteboardHTML.offsetLeft + whiteboardHTML.scrollLeft + window.pageXOffset;
          this.currY = e.clientY - roomContainerHTML.offsetTop - whiteboardHTML.offsetTop + whiteboardHTML.scrollTop + window.pageYOffset;

          // trace boundary
          Model.whiteboard.boundary = {
            minX: this.currX,
            maxX: this.currX,
            minY: this.currY,
            maxY: this.currY,
          };

          this.record = {
            user_id: Model.user.id,
            author: Model.user.name,
            type: 'line',
            created_at: Date.now(),
            color,
            width,
            path: [[this.currX, this.currY]],
          };

          this.isDrawing = true;

          View.whiteboard.line.draw({
            author: 'self',
            color,
            width,
            path: [[this.currX, this.currY]],
          });

        } else if (action === 'move') {
          if (this.isDrawing) {
            this.prevX = this.currX;
            this.prevY = this.currY;
            this.currX = e.clientX - roomContainerHTML.offsetLeft - whiteboardHTML.offsetLeft + whiteboardHTML.scrollLeft + window.pageXOffset;
            this.currY = e.clientY - roomContainerHTML.offsetTop - whiteboardHTML.offsetTop + whiteboardHTML.scrollTop + window.pageYOffset;

            // trace boundary
            if (this.currX < Model.whiteboard.boundary.minX) {
              Model.whiteboard.boundary.minX = this.currX;
            }
            if (this.currX > Model.whiteboard.boundary.maxX) {
              Model.whiteboard.boundary.maxX = this.currX;
            }
            if (this.currY < Model.whiteboard.boundary.minY) {
              Model.whiteboard.boundary.minY = this.currY;
            }
            if (this.currY > Model.whiteboard.boundary.maxY) {
              Model.whiteboard.boundary.maxY = this.currY;
            }

            this.record.path.push([this.currX, this.currY]);

            View.whiteboard.line.draw({
              author: 'self',
              color,
              width,
              path: [[this.prevX, this.prevY], [this.currX, this.currY]],
            });

            // mouse trace
            const mouseTrace = {
              x: this.currX,
              y: this.currY,
            };
            socket.emit('mouse trace', JSON.stringify({
              room: Model.room.name,
              user_id: this.record.user_id,
              mouseTrace
            }));
          }
        } else if (action === 'up' || action === 'out') {
          if (this.isDrawing) {
            Model.whiteboard.records.push(this.record);
            // socket
            socket.emit('new draw', JSON.stringify({ room: Model.room.name, record: this.record }));
            // trace
            View.whiteboard.line.updateTrace(this.record, Model.whiteboard.boundary);
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

      // toolbox cancel all feature
      get('.whiteboard-toolbox').addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'I') {
          return;
        }

        // image
        get('.image-whiteboard-preview-container').classList.add('hide');
        // clear input value
        get('.whiteboard-toolbox input[name="image-whiteboard"]').value = '';
        Model.whiteboard.image.imagePosition = [300, 50];

        // text
        get('.text-whiteboard-preview-container').classList.add('hide');
        // clear input value
        get('.text-whiteboard-preview-container input').value = '';
        Model.whiteboard.text.textPosition = [300, 50];

        // pin
        get('.pin-whiteboard-preview-container').classList.add('hide');
        Model.whiteboard.pin.pinPosition = [300, 50];
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
      get('.width-btn-container input').addEventListener('input', (e) => {
        Model.whiteboard.width = e.target.value || Model.whiteboard.width;
      });

      // text size
      get('.text-container input').addEventListener('input', (e) => {
        get('.text-whiteboard-preview-container input').style.fontSize = `${e.target.value}px`;
        get('.whiteboard-toolbox .text-container .size span').innerHTML = e.target.value;
      });

      // create new
      get('.whiteboard-toolbox .new').addEventListener('click', async (e) => {
        if (Model.whiteboard.records.length === 0) {
          return;
        }

        Swal.fire({
          title: 'Oops...',
          text: 'Sure to create a new whiteboard?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes'
        }).then(async (result) => {
          if (result.value) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Your new whiteboard has been created.'
            });

            const imageFilename = await Controller.whiteboard.uploadWhiteboardImage();
            View.whiteboard.initWhiteboard();
            Model.whiteboard.records = [];
            socket.emit('new whiteboard', JSON.stringify({
              room: Model.room.name, user_id: Model.user.id, user: Model.user.name, imageFilename
            }));
            // clear pin
            View.whiteboard.pin.clear();
          }
        });
      });

      // download
      get('.whiteboard-toolbox .download').addEventListener('click', (e) => {
        const link = document.createElement('a');
        link.download = `whiteboard-${getNowTimeString()}-${getRandomString(8)}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });

      // add image on whiteboard
      get('.whiteboard-toolbox .add-image').addEventListener('click', (e) => {
        get('.whiteboard-toolbox input[name="image-whiteboard"]').click();
      });
      // preview upload image on whiteboard
      get('.whiteboard-toolbox input[name="image-whiteboard"]').addEventListener('change', (e) => {
        const image = URL.createObjectURL(get('.whiteboard-toolbox input[name="image-whiteboard"]').files[0]);
        get('.image-whiteboard-preview-container img.preview').src = image;
        get('.image-whiteboard-preview-container').classList.remove('hide');
        const [left, top] = Model.whiteboard.image.imagePosition;
        get('.image-whiteboard-preview-container img.preview').style.left = `${left}px`;
        get('.image-whiteboard-preview-container img.preview').style.top = `${top}px`;
      });
      // move image
      get('.image-whiteboard-preview-container img.preview').addEventListener('dragstart', (e) => {
        e.preventDefault();
      });
      get('.image-whiteboard-preview-container img.preview').addEventListener('mousedown', (e) => {
        Model.whiteboard.image.imageReferencePosition = [e.clientX, e.clientY];
        Model.whiteboard.image.imageMovable = true;
      });
      get('.image-whiteboard-preview-container img.preview').addEventListener('mouseup', (e) => {
        const left = +get('.image-whiteboard-preview-container img.preview').style.left.replace('px', '');
        const top = +get('.image-whiteboard-preview-container img.preview').style.top.replace('px', '');
        Model.whiteboard.image.imagePosition = [left, top];
        Model.whiteboard.image.imageMovable = false;
      });
      get('.image-whiteboard-preview-container img.preview').addEventListener('mouseout', (e) => {
        const left = +get('.image-whiteboard-preview-container img.preview').style.left.replace('px', '');
        const top = +get('.image-whiteboard-preview-container img.preview').style.top.replace('px', '');
        Model.whiteboard.image.imagePosition = [left, top];
        Model.whiteboard.image.imageMovable = false;
      });
      get('.image-whiteboard-preview-container img.preview').addEventListener('mousemove', (e) => {
        if (!Model.whiteboard.image.imageMovable) {
          return;
        }
        const dx = Model.whiteboard.image.imagePosition[0] + e.clientX - Model.whiteboard.image.imageReferencePosition[0];
        const dy = Model.whiteboard.image.imagePosition[1] + e.clientY - Model.whiteboard.image.imageReferencePosition[1];
        get('.image-whiteboard-preview-container img.preview').style.left = `${dx}px`;
        get('.image-whiteboard-preview-container img.preview').style.top = `${dy}px`;
      });
      // draw image on whiteboard
      get('.image-whiteboard-preview-container').addEventListener('mousedown', async (e) => {
        if (e.target.tagName !== 'IMG') {
          const room = Model.room.name;
          const { width, height } = get('.image-whiteboard-preview-container img.preview').getBoundingClientRect();
          const [x, y] = Model.whiteboard.image.imagePosition;
          // let the user who upload the image no need to wait for the uploading delay
          await View.whiteboard.image.draw({ x, y, width, height, link: URL.createObjectURL(get('.whiteboard-toolbox input[name="image-whiteboard"]').files[0]) });
          get('.image-whiteboard-preview-container').classList.add('hide');
          Model.whiteboard.image.imagePosition = [300, 50];

          // trace
          View.whiteboard.image.updateTrace({ user_id: Model.user.id }, x, y, width, height);

          // upload and send new draw
          const imageFilename = await Controller.whiteboard.uploadImage();
          const link = `${AWS_CLOUDFRONT_DOMAIN}/images/${room}/${imageFilename}`;
          const record = {
            user_id: Model.user.id,
            author: Model.user.name,
            type: 'image',
            created_at: Date.now(),
            x,
            y,
            width,
            height,
            link,
          };
          socket.emit('new draw', JSON.stringify({ room, record }));
          Model.whiteboard.records.push(record);
          // clear input value
          get('.whiteboard-toolbox input[name="image-whiteboard"]').value = '';
        }
      });

      // add text on whiteboard
      get('.whiteboard-toolbox .add-text').addEventListener('click', (e) => {
        get('.text-whiteboard-preview-container').classList.remove('hide');
        get('.text-whiteboard-preview-container input').focus();
        const [left, top] = Model.whiteboard.text.textPosition;
        get('.text-whiteboard-preview-container input').style.left = `${left}px`;
        get('.text-whiteboard-preview-container input').style.top = `${top}px`;
      });
      // move text
      get('.text-whiteboard-preview-container input').addEventListener('mousedown', (e) => {
        Model.whiteboard.text.textReferencePosition = [e.clientX, e.clientY];
        Model.whiteboard.text.textMovable = true;
      });
      get('.text-whiteboard-preview-container input').addEventListener('mouseup', (e) => {
        const left = +get('.text-whiteboard-preview-container input').style.left.replace('px', '');
        const top = +get('.text-whiteboard-preview-container input').style.top.replace('px', '');
        Model.whiteboard.text.textPosition = [left, top];
        Model.whiteboard.text.textMovable = false;
      });
      get('.text-whiteboard-preview-container input').addEventListener('mouseout', (e) => {
        const left = +get('.text-whiteboard-preview-container input').style.left.replace('px', '');
        const top = +get('.text-whiteboard-preview-container input').style.top.replace('px', '');
        Model.whiteboard.text.textPosition = [left, top];
        Model.whiteboard.text.textMovable = false;
      });
      get('.text-whiteboard-preview-container input').addEventListener('mousemove', (e) => {
        if (!Model.whiteboard.text.textMovable) {
          return;
        }
        const dx = Model.whiteboard.text.textPosition[0] + e.clientX - Model.whiteboard.text.textReferencePosition[0];
        const dy = Model.whiteboard.text.textPosition[1] + e.clientY - Model.whiteboard.text.textReferencePosition[1];
        get('.text-whiteboard-preview-container input').style.left = `${dx}px`;
        get('.text-whiteboard-preview-container input').style.top = `${dy}px`;
      });
      // draw text
      get('.text-whiteboard-preview-container').addEventListener('mousedown', async (e) => {
        if (e.target.tagName !== 'INPUT') {
          if (get('.text-whiteboard-preview-container input').value.replace(/\s/g, '') !== '') {
            const room = Model.room.name;
            const [x, y] = Model.whiteboard.text.textPosition;
            const content = get('.text-whiteboard-preview-container input').value;
            const size = get('.text-whiteboard-preview-container input').style.fontSize || '32px';
            const record = {
              user_id: Model.user.id,
              author: Model.user.name,
              type: 'text',
              created_at: Date.now(),
              x,
              y,
              content,
              size,
            };
            View.whiteboard.text.draw(record);
            socket.emit('new draw', JSON.stringify({ room, record }));
            Model.whiteboard.records.push(record);
          }
          get('.text-whiteboard-preview-container').classList.add('hide');
          Model.whiteboard.text.textPosition = [300, 50];
          get('.text-whiteboard-preview-container input').value = '';
        }
      });

      // add pin on whiteboard
      get('.whiteboard-toolbox .add-pin').addEventListener('click', (e) => {
        get('.pin-whiteboard-preview-container').classList.remove('hide');
        get('.pin-whiteboard-preview-container i.pin').focus();
        const [left, top] = Model.whiteboard.pin.pinPosition;
        get('.pin-whiteboard-preview-container i.pin').style.left = `${left}px`;
        get('.pin-whiteboard-preview-container i.pin').style.top = `${top}px`;
      });
      // move pin
      get('.pin-whiteboard-preview-container i.pin').addEventListener('mousedown', (e) => {
        Model.whiteboard.pin.pinReferencePosition = [e.clientX, e.clientY];
        Model.whiteboard.pin.pinMovable = true;
      });
      get('.pin-whiteboard-preview-container i.pin').addEventListener('mouseup', (e) => {
        const left = +get('.pin-whiteboard-preview-container i.pin').style.left.replace('px', '');
        const top = +get('.pin-whiteboard-preview-container i.pin').style.top.replace('px', '');
        Model.whiteboard.pin.pinPosition = [left, top];
        Model.whiteboard.pin.pinMovable = false;
      });
      get('.pin-whiteboard-preview-container i.pin').addEventListener('mouseout', (e) => {
        const left = +get('.pin-whiteboard-preview-container i.pin').style.left.replace('px', '');
        const top = +get('.pin-whiteboard-preview-container i.pin').style.top.replace('px', '');
        Model.whiteboard.pin.pinPosition = [left, top];
        Model.whiteboard.pin.pinMovable = false;
      });
      get('.pin-whiteboard-preview-container i.pin').addEventListener('mousemove', (e) => {
        if (!Model.whiteboard.pin.pinMovable) {
          return;
        }
        const dx = Model.whiteboard.pin.pinPosition[0] + e.clientX - Model.whiteboard.pin.pinReferencePosition[0];
        const dy = Model.whiteboard.pin.pinPosition[1] + e.clientY - Model.whiteboard.pin.pinReferencePosition[1];
        get('.pin-whiteboard-preview-container i.pin').style.left = `${dx}px`;
        get('.pin-whiteboard-preview-container i.pin').style.top = `${dy}px`;
      });
      // draw pin
      get('.pin-whiteboard-preview-container').addEventListener('mousedown', async (e) => {
        if (e.target.tagName !== 'I') {
          const room = Model.room.name;
          const [x, y] = Model.whiteboard.pin.pinPosition;

          const pin = {
            room: Model.room.name,
            user_id: Model.user.id,
            author: Model.user.name,
            created_at: Date.now(),
            x,
            y,
            content: '',
          };
          View.whiteboard.pin.create([pin]);
          socket.emit('new whiteboard pin', JSON.stringify(pin));

          get('.pin-whiteboard-preview-container').classList.add('hide');
          Model.whiteboard.pin.pinPosition = [300, 50];
        }
      });
      // pin container
      get('.whiteboard .pin-container').addEventListener('click', async (e) => {
        if (!e.target.closest('.pin')) {
          get('.whiteboard .pin-container').classList.add('pointer-none');
          const pins = getAll('.whiteboard .pin-container .pin-text:not(.hide)');
          for (let pinIndex = 0; pinIndex < pins.length; pinIndex++) {
            pins[pinIndex].classList.add('hide');
          }
        } else {
          get('.whiteboard .pin-container').classList.remove('pointer-none');
          if (e.target.classList.contains('pin') && Model.whiteboard.pin.pinClickable) {
            e.target.closest('.pin').querySelector('.pin-text').classList.toggle('hide');
          }
        }

        // remove pin
        if (e.target.closest('.remove-btn')) {
          const pinHTML = e.target.closest('.pin');
          const created_at = pinHTML.dataset.created_at;

          const pin = {
            room: Model.room.name,
            user_id: Model.user.id,
            created_at,
          };
          View.whiteboard.pin.remove(pin);
          socket.emit('remove whiteboard pin', JSON.stringify(pin));
        }
      });
      // update pin text
      get('.whiteboard .pin-container').addEventListener('change', (e) => {
        const pinHTML = e.target.closest('.pin');
        const created_at = pinHTML.dataset.created_at;
        const content = e.target.value;

        const pin = {
          room: Model.room.name,
          user_id: Model.user.id,
          author: Model.user.name,
          created_at,
          content,
        };

        socket.emit('update whiteboard pin', JSON.stringify(pin));
      });
      // move pin
      get('.whiteboard .pin-container').addEventListener('mousedown', async (e) => {
        if (e.target.classList.contains('pin')) {
          const left = +e.target.closest('.pin').style.left.replace('px', '');
          const top = +e.target.closest('.pin').style.top.replace('px', '');
          Model.whiteboard.pin.pinPosition = [left, top];
          Model.whiteboard.pin.pinMovable = true;
          Model.whiteboard.pin.pinReferencePosition = [e.clientX, e.clientY];
          // check moved
          Model.whiteboard.pin.pinOriginalPosition = [left, top];
        }
      });
      get('.whiteboard .pin-container').addEventListener('mousemove', async (e) => {
        if (!Model.whiteboard.pin.pinMovable) {
          return;
        }
        if (e.target.closest('.pin')) {
          const dx = Model.whiteboard.pin.pinPosition[0] + e.clientX - Model.whiteboard.pin.pinReferencePosition[0];
          const dy = Model.whiteboard.pin.pinPosition[1] + e.clientY - Model.whiteboard.pin.pinReferencePosition[1];
          e.target.closest('.pin').style.left = `${dx}px`;
          e.target.closest('.pin').style.top = `${dy}px`;
        }
      });
      $('.whiteboard .pin-container').on('mouseup mouseout', async (e) => {
        if (!Model.whiteboard.pin.pinMovable) {
          return;
        }
        if (e.target.closest('.pin')) {
          const left = +e.target.closest('.pin').style.left.replace('px', '');
          const top = +e.target.closest('.pin').style.top.replace('px', '');
          Model.whiteboard.pin.pinPosition = [left, top];
          Model.whiteboard.pin.pinMovable = false;

          // check moved
          const [originalLeft, originalTop] = Model.whiteboard.pin.pinOriginalPosition;
          if (left === originalLeft && top === originalTop) {
            return;
          }

          Model.whiteboard.pin.pinClickable = false;
          setTimeout(() => {
            Model.whiteboard.pin.pinClickable = true;
          }, 100);

          const created_at = e.target.closest('.pin').dataset.created_at;

          // offset from preview-container size
          const preWidth = 100;
          const preHeight = 100;

          // offset from pin itself size
          const pinWidth = 40;
          const pinHeight = 40;

          const pin = {
            room: Model.room.name,
            user_id: Model.user.id,
            author: Model.user.name,
            created_at,
            // reverse offset
            x: left - (+ preWidth / 2 - pinWidth / 2),
            y: top - (+ preHeight / 2 - pinHeight / 2),
          };
          socket.emit('update whiteboard pin', JSON.stringify(pin));
        }
      });

      // display history whitaboard container
      get('.whiteboard-toolbox .display-history-whiteboard').addEventListener('click', async (e) => {
        await Controller.whiteboard.loadHistoryWB();
        View.whiteboard.displayHistoryWB();
        get('.history-whiteboard-container').classList.remove('hide');
      });
      // hide history whitaboard container
      get('.history-whiteboard-container').addEventListener('click', (e) => {
        if (e.target.closest('.close-btn')) {
          get('.history-whiteboard-container').classList.add('hide');
        }

        if (e.target.closest('.pin')) {
          e.target.querySelector('.pin-text').classList.toggle('hide');
        }
      });
      // display history whiteboard
      get('.history-whiteboard-list').addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
          get('.history-whiteboard img').src = e.target.src;
          View.whiteboard.pin.createHistoryWB();
        }
      });
    },
    uploadWhiteboardImage: async function () {
      const blob = await getCanvasBlob(canvas);
      const formData = new FormData();
      const imageFilename = `whiteboard-${getNowTimeString()}-${getRandomString(8)}.png`;
      formData.append('image', blob, imageFilename);
      formData.append('room', getQuery().room);
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
    uploadImage: async function () {
      const formData = new FormData();
      const file = get('.whiteboard-toolbox input[name="image-whiteboard"]').files[0];
      const filename = `image-${getNowTimeString()}-${getRandomString(8)}.${file.name.split('.').pop()}`;
      formData.append('image', file, filename);
      formData.append('room', getQuery().room);
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

      return filename;
    },
    updateTraceList: function (users, user, user_id, state) {
      if (state === 'leave') {
        return;
      }

      const traceHTML = get('.whiteboard .trace');
      const mouseTraceHTML = get('.whiteboard .mouse-trace');

      if (Model.user.id !== user_id) {
        const userHTML = get(`.whiteboard .trace [data-user_id="${user_id}"]`);
        if (!userHTML) {
          traceHTML.innerHTML += `
            <div class="author" data-user_id="${user_id}">
              <span>${user}</span>
            </div>
          `;
          mouseTraceHTML.innerHTML += `
            <div class="author" data-user_id="${user_id}">
              <span>${user}</span>
            </div>
          `;
        }
      } else {
        let htmlContent = '';
        for (const user_id in users) {
          htmlContent += `
            <div class="author" data-user_id="${user_id}">
              <span>${users[user_id]}</span>
            </div>
          `;
        }
        traceHTML.innerHTML = htmlContent;
        mouseTraceHTML.innerHTML = htmlContent;
      }
    },
    loadHistoryWB: async function () {
      const access_JWT = localStorage.getItem('access_JWT');
      const url = HOMEPAGE_URL + `/whiteboard/${Model.room.name}`;
      await fetch(url, {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${access_JWT}`,
        },
      }).then(res => res.json())
        .then(resObj => {
          if (resObj.error) {
            console.log(resObj.error);
            return;
          }
          Model.historyWB = resObj.data;
        })
        .catch(error => console.log(error));
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
      get('.chatbox-toolbox .copy-link').addEventListener('click', (e) => {
        get('.copy-link input[name="invite-url"]').value = `${HOMEPAGE_URL}/room.html?room=${Model.room.name}`;
        const copyText = get('.copy-link input[name="invite-url"]');
        copyText.setAttribute('type', 'text');
        copyText.select();
        document.execCommand("copy");
        copyText.setAttribute('type', 'hidden');
        // copy invite url hint
        const msgHTML = get('.copy-link .copy-invite-url-msg');
        if (!msgHTML.classList.contains('show-hide')) {
          msgHTML.classList.remove('hide');
          msgHTML.classList.add('show-hide');
          setTimeout(function () {
            msgHTML.classList.add('hide');
            msgHTML.classList.remove('show-hide');
          }, 2000);
        }
      });
      // add image
      get('.chatbox .send-msg').addEventListener('click', (e) => {
        if (e.target.closest('.add-image-btn')) {
          get('.chatbox .send-msg input[name="image"]').click();
        }
      });
      // preview upload image
      get('.chatbox .send-msg input[name="image"]').addEventListener('change', (e) => {
        const image = URL.createObjectURL(get('.chatbox .send-msg input[name="image"]').files[0]);
        get('.chatbox .send-msg img.preview').src = image;
        get('.chatbox .send-msg .preview-container').classList.remove('hide');
      });
      // send or cancel image
      get('.chatbox .send-msg .option-container').addEventListener('click', async (e) => {
        if (e.target.tagName === 'I') {
          get('.chatbox .send-msg .preview-container').classList.add('hide');

          const btnHTML = e.target.closest('i');
          if (btnHTML.classList.contains('send-image-btn')) {
            const imageFilename = await Controller.chatbox.uploadImage();
            const user_id = Model.user.id;
            const room = Model.room.name;
            const sender = Model.user.name;
            const type = 'image';
            const msg = `${AWS_CLOUDFRONT_DOMAIN}/images/${room}/${imageFilename}`;
            const time = Controller.chatbox.getTime();

            const msgObj = {
              user_id,
              room,
              sender,
              type,
              msg,
              time,
              created_at: Date.now()
            };
            View.chatbox.displayNewMsg([{ user_id, sender, type, msg, time }]);
            socket.emit('new chat msg', JSON.stringify(msgObj));
          }

          get('.chatbox .send-msg input[name="image"]').value = '';
        }
      });
      // display large size image for small message image
      get('.chatbox .msg-container').addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
          const src = e.target.src;
          get('.chatbox-large-image-container img').src = src;
          get('.chatbox-large-image-container').classList.remove('hide');
        }
      });
      // close large size image
      get('.chatbox-large-image-container').addEventListener('click', (e) => {
        if (e.target.tagName !== 'IMG') {
          get('.chatbox-large-image-container').classList.add('hide');
        }
      });
      // load history chat message when scroll
      get('.msg-container').onscroll = () => {
        const msgContainerHTML = get('.msg-container');
        if (get('.msg-container').scrollTop <= msgContainerHTML.offsetHeight * 1.5 && !Model.chatbox.scrollLock) {
          // lock
          Model.chatbox.scrollLock = true;
          const lastOldestCreated_at = Model.chatbox.lastOldestCreated_at;
          socket.emit('load chat msg', JSON.stringify({
            room: getQuery().room, lastOldestCreated_at
          }));
        }
      };

      // call
      get('.chatbox-toolbox i.call').addEventListener('click', (e) => {
        if (PeerjsCall.isConnecting) {
          return;
        }
        PeerjsCall.connect();

        e.target.classList.toggle('fa-phone');
        e.target.classList.toggle('fa-phone-slash');
        e.target.classList.toggle('color-used');
        if (e.target.classList.contains('fa-phone')) {
          get('.chatbox-toolbox i.users').classList.add('fa-users');
          get('.chatbox-toolbox i.users').classList.remove('fa-users-slash');
          get('.chatbox-toolbox i.users').classList.add('color-used');
          get('.call-container').classList.remove('hide');
          get('.whiteboard').scrollTop = 0;
          get('.whiteboard').classList.add('overflow-hidden');

        } else {
          get('.chatbox-toolbox i.users').classList.remove('fa-users');
          get('.chatbox-toolbox i.users').classList.add('fa-users-slash');
          get('.chatbox-toolbox i.users').classList.remove('color-used');
          get('.call-container').classList.add('hide');
          get('.whiteboard').classList.remove('overflow-hidden');
        }
        PeerjsCall.isAudio = false;
        get('.chatbox-toolbox i.audio').classList.remove('fa-microphone');
        get('.chatbox-toolbox i.audio').classList.add('fa-microphone-slash');
        get('.chatbox-toolbox i.audio').classList.remove('color-used');
        PeerjsCall.isVedio = false;
        get('.chatbox-toolbox i.video').classList.remove('fa-video');
        get('.chatbox-toolbox i.video').classList.add('fa-video-slash');
        get('.chatbox-toolbox i.video').classList.remove('color-used');
      });
      // display all users video
      get('.chatbox-toolbox i.users').addEventListener('click', (e) => {
        e.target.classList.toggle('fa-users');
        e.target.classList.toggle('fa-users-slash');
        e.target.classList.toggle('color-used');
        get('.call-container').classList.toggle('hide');
        get('.whiteboard').scrollTop = 0;
        get('.whiteboard').classList.toggle('overflow-hidden');
      });
      // audio
      get('.chatbox-toolbox i.audio').addEventListener('click', (e) => {
        PeerjsCall.toggleAudio();
        if (PeerjsCall.isAudio) {
          e.target.classList.add('fa-microphone');
          e.target.classList.remove('fa-microphone-slash');
          e.target.classList.add('color-used');
        } else {
          e.target.classList.remove('fa-microphone');
          e.target.classList.add('fa-microphone-slash');
          e.target.classList.remove('color-used');
        }
      });
      // video
      get('.chatbox-toolbox i.video').addEventListener('click', (e) => {
        PeerjsCall.toggleVedio();
        if (PeerjsCall.isVedio) {
          e.target.classList.add('fa-video');
          e.target.classList.remove('fa-video-slash');
          e.target.classList.add('color-used');
        } else {
          e.target.classList.remove('fa-video');
          e.target.classList.add('fa-video-slash');
          e.target.classList.remove('color-used');
        }
      });

      // display chatbox toggle
      get('.chatbox-toolbox i.chat').addEventListener('click', (e) => {
        get('.room-container .chatbox').classList.toggle('display');
        get('.chatbox-toolbox i.chat').classList.toggle('color-used');
      });
      // close chatbox
      get('.chatbox .header .close-btn').addEventListener('click', (e) => {
        get('.room-container .chatbox').classList.remove('display');
        get('.chatbox-toolbox i.chat').classList.remove('color-used');
      });

      // display user list
      get('.chatbox .show-list').addEventListener('click', (e) => {
        get('.room-container .user-list').classList.toggle('display');
        get('.chatbox .show-list').classList.toggle('color-used');
      });
    },
    sendMsg: function () {
      const msg = get('.chatbox .send-msg textarea').value;
      if (msg.replace(/\s/g, '') === '') {
        return;
      }
      const user_id = Model.user.id;
      const sender = Model.user.name;
      const type = 'text';
      const time = Controller.chatbox.getTime();
      const msgObj = {
        user_id,
        room: Model.room.name,
        sender,
        type,
        msg,
        time,
        created_at: Date.now()
      };
      View.chatbox.displayNewMsg([{ user_id, sender, type, msg, time }]);
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
    uploadImage: async function () {
      const formData = new FormData();
      const file = get('.chatbox .send-msg input[name="image"]').files[0];
      const filename = `image-${getNowTimeString()}-${getRandomString(8)}.${file.name.split('.').pop()}`;
      formData.append('image', file, filename);
      formData.append('room', getQuery().room);
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

      return filename;
    },
  },
};

// whiteboard
View.whiteboard.initWhiteboard();
Controller.whiteboard.initListener();

// chatbox
View.chatbox.displayRoomName();
Controller.chatbox.initListener();
