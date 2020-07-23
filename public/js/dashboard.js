const Model = {
  rooms: [],
};

const View = {
  renderRoom: function () {
    const rooms = Model.rooms;
    let htmlContent = '';
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      const roomData = rooms[roomIndex];
      const { room, isOwner, link } = roomData;
      const default_room_snapshot = `${AWS_CLOUDFRONT_DOMAIN}/dashboard/default_room_snapshot.png`;
      const snapshot = link || default_room_snapshot;
      htmlContent += `
        <div class="room" data-isOwner="${isOwner}">
          <div class="img-container">
            <a href="/room.html?room=${room}">
              <img
                src="${snapshot}"
                alt="">
            </a>
            <div class="cover"></div>
          </div>

          <div class="title-container">
            <div class="title">Untitled</div>
            <div class="icon-container">
              <i class="fas fa-edit"></i>
              <i class="far fa-star"></i>
            </div>
          </div>
        </div>
      `;
    }

    get('.dashboard-rooms').innerHTML = htmlContent;
  },
  closeFormContainer: function () {
    get('.form-container').classList.add('hide');
    get('.form-container form:not(.hide)').classList.add('hide');

    const inputs = getAll('form input');
    for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
      const input = inputs[inputIndex];
      input.value = '';
    }
  },
};

const Controller = {
  init: async function () {
    await this.getRoom();
    View.renderRoom();
  },
  initListener: function () {
    // sign out
    get('.dashboard-navbar .signout-btn').addEventListener('click', (e) => {
      localStorage.removeItem('access_JWT');
      localStorage.removeItem('user');
      Swal.fire({
        icon: 'success',
        title: 'sign out successfully',
      }).then(async (result) => {
        localStorage.removeItem('access_JWT');
        localStorage.removeItem('user');
        location.href = '/';
      });
    });

    // create room
    get('.create-join-room .create-btn').addEventListener('click', (e) => {
      get('.form-container').classList.remove('hide');
      get('.create-form').classList.remove('hide');
    });

    // join room
    get('.create-join-room .join-btn').addEventListener('click', (e) => {
      get('.form-container').classList.remove('hide');
      get('.join-form').classList.remove('hide');
    });

    // form container
    get('.form-container').addEventListener('mousedown', (e) => {
      if (e.target.closest('form')) {
        return;
      }
      View.closeFormContainer();
    });
  },
  getRoom: async function () {
    const url = HOMEPAGE_URL + '/roomUser';
    const access_JWT = localStorage.getItem('access_JWT');

    const rooms = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${access_JWT}`,
      },
    }).then(res => res.json())
      .then(resObj => {
        if (resObj.error) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please sign in first',
          }).then(async (result) => {
            localStorage.removeItem('access_JWT');
            localStorage.removeItem('user');
            location.href = '/';
          });

          return;
        }
        return resObj.data;
      })
      .catch(error => console.log(error));

    Model.rooms = rooms;
  },
  createRoom: function () {
    const password = get('.create-form input[name="createRoomPassword"]').value;
    if (!password) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please setting room password',
      });
      return;
    }

    // create room
    const url = HOMEPAGE_URL + '/room';
    const access_JWT = localStorage.getItem('access_JWT');

    fetch(url, {
      method: 'POST',
      body: JSON.stringify({ password }),
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${access_JWT}`,
      },
    }).then(res => res.json())
      .then(resObj => {
        const { authError, error, room } = resObj;
        if (error) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Please sign in first',
          }).then(async (result) => {
            localStorage.removeItem('access_JWT');
            localStorage.removeItem('user');
            location.href = '/';
          });
        } else {
          location.href = `/room.html?room=${room}`;
        }
      })
      .catch(error => console.log(error));
  },
  joinRoom: function () {
    const room = get('.join-form input[name="room"]').value;
    const password = get('.join-form input[name="joinRoomPassword"]').value;
    if (!room || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'All fields are required',
      });
      return;
    }

    // join room, create roomUser
    const url = HOMEPAGE_URL + '/roomUser';
    const access_JWT = localStorage.getItem('access_JWT');

    fetch(url, {
      method: 'POST',
      body: JSON.stringify({ room, password }),
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${access_JWT}`,
      },
    }).then(res => res.json())
      .then(resObj => {
        const { authError, error, message } = resObj;
        if (error) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: error,
          });
        } else {
          location.href = `/room.html?room=${room}`;
        }
      })
      .catch(error => console.log(error));
  },
};

Controller.init();
Controller.initListener();