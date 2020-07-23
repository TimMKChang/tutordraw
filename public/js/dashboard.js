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
    console.log(rooms);
    get('.dashboard-rooms').innerHTML = htmlContent;
  },
};

const Controller = {
  init: async function () {
    await this.getRoom();
    View.renderRoom();
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
};

Controller.init();
