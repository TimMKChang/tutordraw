const router = require('express').Router();
const { wrapAsync, authenticate } = require('../../util/util');

const {
  getRoomUser,
  updateRoomUser,
} = require('../controllers/room_user_controller');

router.route('/roomUser')
  .get(authenticate, wrapAsync(getRoomUser))
  .patch(authenticate, wrapAsync(updateRoomUser));

module.exports = router;