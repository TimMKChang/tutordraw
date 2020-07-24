const router = require('express').Router();
const { wrapAsync, authenticate } = require('../../util/util');

const {
  createRoomUser,
  getRoomUser,
  updateRoomUser,
} = require('../controllers/roomUser_controller');

router.route('/roomUser')
  .post(authenticate, wrapAsync(createRoomUser))
  .get(authenticate, wrapAsync(getRoomUser))
  .patch(authenticate, wrapAsync(updateRoomUser));

module.exports = router;