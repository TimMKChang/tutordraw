const router = require('express').Router();
const { upload, wrapAsync } = require('../../util/util');

const multerUpload = upload.fields([
  { name: 'image', maxCount: 1 },
]);

const {
  uploadImage,
} = require('../controllers/room_controller');

router.route('/room/image')
  .post(multerUpload, wrapAsync(uploadImage));

module.exports = router;