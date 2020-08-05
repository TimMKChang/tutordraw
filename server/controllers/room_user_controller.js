const Room = require('../models/room_model');
const RoomUser = require('../models/room_user_model');
const { verifyJWT } = require('../../util/util');

const getRoomUser = async (req, res) => {

  const user_id = res.locals.userData.id;

  const { error, roomUsers } = await RoomUser.getRoomUser({ user_id });
  if (error) {
    console.log(error);
    return res.status(500).json({ error: 'getRoomUser error' });
  }
  const roomUsersAdjust = roomUsers.map((roomUser) => {
    roomUser.isOwner = roomUser.is_owner;
    roomUser.room = roomUser.room_id;
    delete roomUser.is_owner;
    delete roomUser.room_id;
    return roomUser;
  });

  return res.status(200).json({ data: roomUsersAdjust });
};

const updateRoomUser = async (req, res) => {
  const { room, note, starred } = req.body;
  const roomUser = {
    room_id: room,
    user_id: res.locals.userData.id,
    note,
    starred,
  };

  const updateRoomUserResult = await RoomUser.updateRoomUser(roomUser);

  if (updateRoomUserResult.error) {
    console.log(updateRoomUserResult.error);
    return res.status(500).json({ error: 'updateRoomUser error' });
  }

  return res.status(200).json({ message: 'roomUser updated' });
};

module.exports = {
  getRoomUser,
  updateRoomUser,
};
