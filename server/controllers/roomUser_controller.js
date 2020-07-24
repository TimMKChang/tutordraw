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

const getRoomUser = async (req, res) => {

  const user_id = res.locals.userData.id;

  const { error, roomUsers } = await RoomUser.getRoomUser({ user_id });

  if (error) {
    return res.status(403).json({ error });
  }

  return res.status(200).json({ data: roomUsers });
};

const updateRoomUser = async (req, res) => {
  const { room, note, starred } = req.body;
  const user_id = res.locals.userData.id;

  const updateRoomUserResult = await RoomUser.updateRoomUser({ user_id, room, note, starred });

  if (updateRoomUserResult.error) {
    return res.status(403).json({ error: updateRoomUserResult.error });
  }

  return res.status(200).json({ message: 'update room successfully' });
};

module.exports = {
  createRoomUser,
  getRoomUser,
  updateRoomUser,
};
