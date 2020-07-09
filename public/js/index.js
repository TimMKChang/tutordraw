function createRoom() {
  const password = get('.create-form input[name="createRoomPassword"]').value;
  if (!password) {
    return alert('Please enter room password');
  }

  // create room
  const url = HOMEPAGE_URL + '/room';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ password }),
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_JWT')}`,
    },
  }).then(res => res.json())
    .then(resObj => {
      const { error, room } = resObj;
      if (error) {
        alert(error);
        return;
      }
      location.href = `/room.html?room=${room}`;
    })
    .catch(error => console.log(error));
}

function joinRoom() {
  const room = get('.join-form input[name="room"]').value;
  const password = get('.join-form input[name="joinRoomPassword"]').value;
  if (!room || !password) {
    return alert('All fields are required.');
  }

  // join room, create roomUser
  const url = HOMEPAGE_URL + '/roomUser';

  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ room, password }),
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_JWT')}`,
    },
  }).then(res => res.json())
    .then(resObj => {
      const { error, message } = resObj;
      if (error) {
        alert(error);
        return;
      }
      location.href = `/room.html?room=${room}`;
    })
    .catch(error => console.log(error));
}
