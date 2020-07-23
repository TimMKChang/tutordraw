const router = require('express').Router();
const { wrapAsync, authenticate } = require('../../util/util');

const {
  createRoomUser,
  getRoomUser,
} = require('../controllers/roomUser_controller');

router.route('/roomUser')
  .post(authenticate, wrapAsync(createRoomUser))
  .get(authenticate, wrapAsync(getRoomUser));

module.exports = router;