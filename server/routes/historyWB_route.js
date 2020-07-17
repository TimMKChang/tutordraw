const router = require('express').Router();
const { wrapAsync } = require('../../util/util');

const {
  getHistoryWB,
} = require('../controllers/historyWB_controller');

router.route('/whiteboard')
  .get(wrapAsync(getHistoryWB));

module.exports = router;