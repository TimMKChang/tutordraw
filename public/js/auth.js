checkRoomAndUser(getQuery().room, getQuery().user);

function checkRoomAndUser(room, user) {
  if (!room) {
    alert('Please enter the room id');
    location.href = '/';
  } else if (!user) {
    const user = prompt("Please enter your name");
    if (!user) {
      location.href = `/`;
    } else {
      location.href = `/room.html?room=${room}&user=${user}`;
    }
  }
}
