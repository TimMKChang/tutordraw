const HistoryWB = require('../models/historyWB_model');
const RoomUser = require('../models/roomUser_model');
const { verifyJWT } = require('../../util/util');

const createHistoryWB = async (whiteboard) => {
  const { error, message } = await HistoryWB.createHistoryWB(whiteboard);
  if (error) {
    console.log(error);
  }
};

const getHistoryWB = async (req, res) => {
  const { room } = req.params;

  if (!room) {
    return res.status(400).json({ error: 'room is required.' });
  }

  // check roomUser
  const user_id = res.locals.userData.id;
  const verifyRoomUserResult = await RoomUser.verifyRoomUser(room, user_id);
  if (verifyRoomUserResult.error) {
    return res.status(403).json({ error: verifyRoomUserResult.error });
  }

  const { error, historyWBs } = await HistoryWB.getHistoryWB({ room });
  if (error) {
    return res.status(403).json({ error });
  }

  return res.status(200).json({ data: historyWBs });

};

module.exports = {
  createHistoryWB,
  getHistoryWB,
};
