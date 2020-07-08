function createRoom() {
  const password = get('.create-form input[name="roomPassword"]').value;
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
      const { error, room_id } = resObj;
      if (error) {
        alert(error);
        return;
      }
      location.href = `/room.html?room=${room_id}`;
    })
    .catch(error => console.log(error));
}

function joinRoom() {
  const user = get('.join-form input[name="user"]').value;
  const room = get('.join-form input[name="room"]').value;
  if (user.replace(/\s/g, '') === '' || !/^[a-zA-Z0-9]+$/.test(room)) {
    return alert('Please enter your name or check the room name is correct');
  }
  location.href = `/room.html?room=${room}&user=${user}`;
}
