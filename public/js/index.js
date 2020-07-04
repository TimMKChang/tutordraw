function createRoom() {
  const user = get('.create-form input[name="user"]').value;
  if (user.replace(/\s/g, '') === '') {
    return alert('Please enter your name!');
  }
  const room = Date.now().toString(36) + Math.random().toString(36).substr(-4);
  location.href = `/room.html?room=${room}&user=${user}`;
}

function joinRoom() {
  const user = get('.join-form input[name="user"]').value;
  const room = get('.join-form input[name="room"]').value;
  if (user.replace(/\s/g, '') === '' || !/^[a-zA-Z0-9]+$/.test(room)) {
    return alert('Please enter your name or check the room name is correct');
  }
  location.href = `/room.html?room=${room}&user=${user}`;
}
