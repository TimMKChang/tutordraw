const Room = require('../models/room_model');
const RoomUser = require('../models/roomUser_model');
const { verifyJWT } = require('../../util/util');

const createRoomUser = async (req, res) => {
  const { room, password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const user_id = res.locals.userData.id;

  // verify password
  const verifyPasswordResult = await Room.verifyPassword(room, password);
  if (verifyPasswordResult.error) {
    return res.status(403).json({ error: verifyPasswordResult.error });
  }

  // create roomUser
  const createRoomUserResult = await RoomUser.createRoomUser({
    room,
    user_id,
  });
  if (createRoomUserResult.error) {
    return res.status(403).json({ error: createRoomUserResult.error });
  }

  return res.status(200).json({ message: 'Join room successfully' });
};

module.exports = {
  createRoomUser,
};
