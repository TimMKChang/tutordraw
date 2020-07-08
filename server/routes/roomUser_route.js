const router = require('express').Router();
const { wrapAsync } = require('../../util/util');

const {
  createRoomUser,
} = require('../controllers/roomUser_controller');

router.route('/roomUser')
  .post(wrapAsync(createRoomUser));

module.exports = router;