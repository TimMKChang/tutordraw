const Whiteboard = require('../models/whiteboard_model');
const RoomUser = require('../models/room_user_model');
const { verifyJWT } = require('../../util/util');

const createWhiteboard = async (whiteboardObj) => {
  // from socket
  const { room, start_at } = whiteboardObj;

  // to DB
  const whiteboard = {
    room_id: room,
    start_at,
  };

  const { error, message } = await Whiteboard.createWhiteboard(whiteboard);
  if (error) {
    console.log(error);
  }
};

const updateWhiteboard = async (whiteboardObj) => {
  // from socket
  const { room, start_at, link } = whiteboardObj;

  // to DB
  const whiteboard = {
    room_id: room,
    start_at,
    link,
  };

  const { error, message } = await Whiteboard.updateWhiteboard(whiteboard);
  if (error) {
    console.log(error);
  }
};

const getWhiteboard = async (req, res) => {
  const { room_id } = req.params;

  if (!room_id) {
    return res.status(400).json({ error: 'Room id is required.' });
  }

  // check roomUser
  const roomUser = {
    room_id,
    user_id: res.locals.userData.id,
  };
  const verifyRoomUserResult = await RoomUser.verifyRoomUser(roomUser);
  if (verifyRoomUserResult.error) {
    return res.status(403).json({ error: verifyRoomUserResult.error });
  }

  const { error, whiteboards } = await Whiteboard.getWhiteboard({ room_id });
  if (error) {
    console.log(error);
    return res.status(403).json({ error: 'getWhiteboar error' });
  }

  return res.status(200).json({ data: whiteboards });

};

module.exports = {
  createWhiteboard,
  getWhiteboard,
  updateWhiteboard,
};
