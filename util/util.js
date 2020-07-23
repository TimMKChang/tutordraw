require('dotenv').config();
const multer = require('multer');
const crypto = require('crypto');

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

const verifyJWT = (JWT) => {
  // check JWT style
  if (!JWT.toString().match(/.+\..+\..+/)) {
    return { error: 'Wrong Token Style' };
  }

  const [header, payload, signature] = JWT.split('.');

  // check signature
  if (signature !== crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${header}.${payload}`).digest('base64')) {
    return { error: 'Wrong Token Signature' };
  }

  // check exp
  const data = JSON.parse(Buffer.from(payload, 'base64').toString());
  if (Date.now() > data.exp) {
    return { error: 'Token Expired' };
  }

  return { data };
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    next({
      status: 403,
      error: 'Please sign in first',
    });
  } else {
    const JWT = authHeader.replace(/Bearer /, '');
    const verifyJWTResult = verifyJWT(JWT);
    if (verifyJWTResult.error) {
      next({
        status: 403,
        error: verifyJWTResult.error,
      });
    }
  }

  next();
};

module.exports = {
  upload,
  wrapAsync,
  verifyJWT,
  authenticate
};
