const fs = require('fs');
const Room = require('../models/room_model');
const RoomUser = require('../models/roomUser_model');
const uploadImageS3 = require('../S3/uploadImage').uploadImage;
const { verifyJWT } = require('../../util/util');

const createRoom = async (req, res) => {
  const password = Math.random().toString(36).split('.')[1].substr(-8);
  const user_id = res.locals.userData.id;

  // room id
  const id = Date.now().toString(36) + Math.random().toString(36).split('.')[1].substr(-8);
  const room = {
    id,
    password,
    whiteboard_start_at: Date.now(),
  };

  const createRoomResult = await Room.createRoom(room);
  if (createRoomResult.error) {
    return res.status(403).json({ error: createRoomResult.error });
  }

  const createRoomUserResult = await RoomUser.createRoomUser({
    room: id,
    user_id,
    isOwner: true,
  });
  if (createRoomUserResult.error) {
    return res.status(403).json({ error: createRoomUserResult.error });
  }

  return res.status(200).json({ room: id });
};

const uploadImage = async (req, res) => {
  const { room } = req.body;
  const imageFilename = req.files.image[0].filename;
  const filePath = `./images_temp/${imageFilename}`;
  try {
    await uploadImageS3(room, filePath, imageFilename);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Uploaded to S3 unsuccessfully' });
  }
  // remove image in images_temp
  fs.unlinkSync(filePath);
  return res.status(200).json({ message: 'Uploaded successfully' });
};

module.exports = {
  createRoom,
  uploadImage,
};
