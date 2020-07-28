const Model = {
  rooms: [],
  editingRoom: '',
};

const View = {
  renderRoom: function () {
    const rooms = Model.rooms;
    let htmlContent = '';
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      const roomData = rooms[roomIndex];
      const { room, title, isOwner, link, note, starred } = roomData;
      const default_room_snapshot = `${AWS_CLOUDFRONT_DOMAIN}/dashboard/default_room_snapshot.png`;
      const snapshot = link || default_room_snapshot;
      htmlContent += `
        <div class="room" data-isOwner="${isOwner}" data-room="${room}" data-note="${note}" data-starred="${starred}">
          <div class="img-container">
            <img src="${snapshot}" alt="">
            <div class="cover"></div>
          </div>

          <div class="title-container">
            <div class="title">${title || 'Untitled'}</div>
            <div class="icon-container">
              <i class="fas fa-edit edit-btn"></i>
              <i class="${starred ? 'fas' : 'far'} fa-star star-btn"></i>
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
  displayRoom: function (type) {
    const titleHTML = get('.dashboard .header .title');
    if (type === 'starred') {
      $('.dashboard-rooms .room:not([data-starred="1"])').addClass('hide');
      titleHTML.innerHTML = 'Starred';
    } else if (type === 'all') {
      $('.dashboard-rooms .room').removeClass('hide');
      titleHTML.innerHTML = 'All rooms';
    }
  },
  updateRoomDisplay: function () {
    const type = get('.dashboard-navbar .navbar-item.color-used').dataset.roomType;
    View.displayRoom(type);
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
        title: `You've been signed out`,
      }).then(async (result) => {
        localStorage.removeItem('access_JWT');
        localStorage.removeItem('user');
        location.href = '/';
      });
    });

    // create room
    get('.create-join-room .create-btn').addEventListener('click', (e) => {
      Controller.createRoom();
    }, { once: true });

    // form container
    get('.form-container').addEventListener('mousedown', (e) => {
      if (e.target.closest('form')) {
        return;
      }
      View.closeFormContainer();
    });

    // edit room, enter room
    get('.dashboard-rooms').addEventListener('click', (e) => {
      const editBtnHTML = e.target.closest('.edit-btn');
      const starBtnHTML = e.target.closest('.star-btn');
      const roomHTML = e.target.closest('.room');

      if (editBtnHTML) {
        const room = roomHTML.dataset.room;
        const note = roomHTML.dataset.note;
        get('.edit-form textarea').value = note;
        get('.form-container').classList.remove('hide');
        get('.edit-form').classList.remove('hide');
        Model.editingRoom = room;
        return;
      }

      if (starBtnHTML) {
        const room = roomHTML.dataset.room;

        const updateStarred = +roomHTML.dataset.starred ? 0 : 1;
        roomHTML.dataset.starred = updateStarred;

        if (updateStarred) {
          starBtnHTML.classList.remove('far');
          starBtnHTML.classList.add('fas');
        } else {
          starBtnHTML.classList.add('far');
          starBtnHTML.classList.remove('fas');
        }
        View.updateRoomDisplay();

        Controller.starRoom(room, updateStarred);
        return;
      }

      if (roomHTML) {
        const room = roomHTML.dataset.room;
        location.href = `/room.html?room=${room}`;
      }
    });

    // display starred or all room
    get('.dashboard-navbar').addEventListener('mousedown', (e) => {
      const navbarItemHTML = e.target.closest('.navbar-item');
      if (navbarItemHTML && !navbarItemHTML.classList.contains('color-used')) {
        const roomType = navbarItemHTML.dataset.roomType;
        get('.dashboard-navbar .navbar-item.color-used').classList.remove('color-used');
        navbarItemHTML.classList.add('color-used');
        View.displayRoom(roomType);
      }
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
    // create room
    get('.create-join-room .spinner-container').classList.remove('hide');

    const url = HOMEPAGE_URL + '/room';
    const access_JWT = localStorage.getItem('access_JWT');

    fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${access_JWT}`,
      },
    }).then(res => res.json())
      .then(async (resObj) => {
        await delay(500);

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
  editRoom: async function () {
    get('.edit-form .spinner-container').classList.remove('hide');

    const url = HOMEPAGE_URL + '/roomUser';
    const access_JWT = localStorage.getItem('access_JWT');
    const room = Model.editingRoom;
    const note = get('.edit-form textarea').value;

    await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ room, note }),
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${access_JWT}`,
      },
    }).then(res => res.json())
      .then(async (resObj) => {
        await delay(500);
        get('.edit-form .spinner-container').classList.add('hide');

        if (resObj.error) {
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Note has been saved',
        }).then(async (result) => {
          get(`.dashboard-rooms .room[data-room="${room}"]`).dataset.note = note;
          View.closeFormContainer();
        });

      })
      .catch(error => console.log(error));
  },
  starRoom: function (room, starred) {
    const url = HOMEPAGE_URL + '/roomUser';
    const access_JWT = localStorage.getItem('access_JWT');

    fetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ room, starred }),
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${access_JWT}`,
      },
    }).then(res => res.json())
      .then(resObj => {
        if (resObj.error) {
          return;
        }
        return;
      })
      .catch(error => console.log(error));
  },
};

Controller.init();
Controller.initListener();