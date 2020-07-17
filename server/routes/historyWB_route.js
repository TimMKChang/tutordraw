const router = require('express').Router();
const { wrapAsync } = require('../../util/util');

const {
  getHistoryWB,
} = require('../controllers/historyWB_controller');

router.route('/whiteboard/:room')
  .get(wrapAsync(getHistoryWB));

module.exports = router;