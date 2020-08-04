const Whiteboard = require('../models/whiteboard_model');
const RoomUser = require('../models/roomUser_model');
const { verifyJWT } = require('../../util/util');

const createHistoryWB = async (whiteboardObj) => {
  // from socket
  const { room, start_at, link } = whiteboardObj;

  // to DB
  const whiteboard = {
    room_id: room,
    start_at,
    link,
  };

  const { error, message } = await Whiteboard.createWhiteboard(whiteboard);
  if (error) {
    console.log(error);
  }
};

const getHistoryWB = async (req, res) => {
  const { room } = req.params;

  if (!room) {
    return res.status(400).json({ error: 'Room id is required.' });
  }

  // check roomUser
  const user_id = res.locals.userData.id;
  const verifyRoomUserResult = await RoomUser.verifyRoomUser(room, user_id);
  if (verifyRoomUserResult.error) {
    return res.status(403).json({ error: verifyRoomUserResult.error });
  }

  const { error, whiteboards } = await Whiteboard.getWhiteboard({ room_id: room });
  if (error) {
    return res.status(403).json({ error });
  }

  return res.status(200).json({ data: whiteboards });

};

module.exports = {
  createHistoryWB,
  getHistoryWB,
};
