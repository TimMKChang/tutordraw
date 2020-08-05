const fs = require('fs');
const Room = require('../models/room_model');
const RoomUser = require('../models/room_user_model');
const Whiteboard = require('../models/whiteboard_model');
const S3Upload = require('../S3/S3Upload');
const { verifyJWT } = require('../../util/util');

const createRoom = async (req, res) => {
  const token = Math.random().toString(36).split('.')[1].substr(-8);
  const user_id = res.locals.userData.id;

  // room id
  const id = Date.now().toString(36) + Math.random().toString(36).split('.')[1].substr(-8);
  const room = {
    id,
    token,
  };

  const createRoomResult = await Room.createRoom(room);
  if (createRoomResult.error) {
    console.log(createRoomResult.error);
    return res.status(500).json({ error: 'createRoom error' });
  }

  const whiteboard = {
    room_id: id,
    start_at: Date.now(),
  };

  const createWhiteboardResult = await Whiteboard.createWhiteboard(whiteboard);
  if (createWhiteboardResult.error) {
    console.log(createWhiteboardResult.error);
    return res.status(500).json({ error: 'createWhiteboard error' });
  }

  const createRoomUserResult = await RoomUser.createRoomUser({
    room_id: id,
    user_id,
    is_owner: true,
  });
  if (createRoomUserResult.error) {
    console.log(createRoomUserResult.error);
    return res.status(500).json({ error: 'createRoomUser error' });
  }

  return res.status(200).json({ room: id });
};

const uploadImage = async (req, res) => {
  const { room } = req.body;
  const imageFilename = req.files.image[0].filename;
  const filePath = `./images_temp/${imageFilename}`;
  try {
    await S3Upload.uploadImage(room, filePath, imageFilename);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'S3Upload uploadImage error' });
  }
  // remove image in images_temp
  fs.unlinkSync(filePath);
  return res.status(200).json({ message: 'image uploaded' });
};

module.exports = {
  createRoom,
  uploadImage,
};
