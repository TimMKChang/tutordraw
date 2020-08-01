const Room = require('../models/room_model');
const RoomUser = require('../models/roomUser_model');
const { verifyJWT } = require('../../util/util');

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

  return res.status(200).json({ message: 'Update room successfully.' });
};

module.exports = {
  getRoomUser,
  updateRoomUser,
};
