const router = require('express').Router();
const { wrapAsync, authenticate } = require('../../util/util');

const {
  createRoomUser,
} = require('../controllers/roomUser_controller');

router.route('/roomUser')
  .post(authenticate, wrapAsync(createRoomUser));

module.exports = router;