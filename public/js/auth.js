checkRoom(getQuery().room);

function checkRoom(room) {
  if (!room) {
    alert('Please enter the room id');
    location.href = '/';
  }
}
