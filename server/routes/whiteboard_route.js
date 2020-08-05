const router = require('express').Router();
const { wrapAsync, authenticate } = require('../../util/util');

const {
  getWhiteboard,
} = require('../controllers/whiteboard_controller');

router.route('/whiteboard/:room_id')
  .get(authenticate, wrapAsync(getWhiteboard));

module.exports = router;