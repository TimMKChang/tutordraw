const multer = require('multer');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images_temp');
    },
    filename: async function (req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  limits: {
    fileSize: 1024 * 1024 * 2
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(null, true);
    }
    cb(null, false);
  },
});

const wrapAsync = (fn) => {
  return function (req, res, next) {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  upload,
  wrapAsync
};
