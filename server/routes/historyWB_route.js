const router = require('express').Router();
const { wrapAsync, authenticate } = require('../../util/util');

const {
  getHistoryWB,
} = require('../controllers/historyWB_controller');

router.route('/whiteboard/:room')
  .get(authenticate, wrapAsync(getHistoryWB));

module.exports = router;