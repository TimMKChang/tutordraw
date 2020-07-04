checkRoomAndUser(getQuery().room, getQuery().user);

function checkRoomAndUser(room, user) {
  if (!room) {
    alert('Please enter the room id');
    location.href = '/';
  } else if (!user) {
    const name = prompt("Please enter your name", "");
    location.href = `/room.html?room=${room}&user=${name}`;
  }
}
