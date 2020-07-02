const whiteboardHTML = get('.whiteboard');
const canvas = get('.whiteboard canvas');
const ctx = canvas.getContext('2d');

ctx.fillStyle = '#FFFFFF';
ctx.fillRect(0, 0, canvas.width, canvas.height);

const Model = {
  user: {
    id: socket.id,
    name: getQuery().username,
  },
  room: {
    name: getQuery().roomname,
  },
  whiteboard: {
    color: 'blue',
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
          this.currX = e.clientX - canvas.offsetLeft + whiteboardHTML.scrollLeft + window.pageXOffset;
          this.currY = e.clientY - canvas.offsetTop + whiteboardHTML.scrollTop + window.pageYOffset;

          this.record = {
            author: 'teacher',
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
            this.currX = e.clientX - canvas.offsetLeft + whiteboardHTML.scrollLeft + window.pageXOffset;
            this.currY = e.clientY - canvas.offsetTop + whiteboardHTML.scrollTop + window.pageYOffset;

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
  },
};

initListener();

function initListener() {
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

  // // color
  // get('.color-btn').addEventListener('click', (e) => {
  //   Model.whiteboard.color = e.target.dataset.color || Model.whiteboard.color;
  // });

  // // width
  // get('.width-btn').addEventListener('click', (e) => {
  //   Model.whiteboard.width = e.target.dataset.width || Model.whiteboard.width;
  // });
}

function clear() {
  // background color white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function loadDraw() {
  for (let recordsIndex = 0; recordsIndex < Model.whiteboard.records.length; recordsIndex++) {
    const record = Model.whiteboard.records[recordsIndex];
    if (record.type === 'line') {
      View.whiteboard.line.draw(record);
    }
  }
}
