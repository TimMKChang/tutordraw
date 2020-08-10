require('dotenv').config();
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
    if (file.originalname.match(/\.(jpg|jpeg|png|svg)$/i)) {
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
      error: 'Please sign in first.',
    });
  } else {
    const JWT = authHeader.replace(/Bearer /, '');
    const verifyJWTResult = verifyJWT(JWT);
    if (verifyJWTResult.error) {
      next({
        status: 403,
        error: 'Please sign in first.',
      });
    } else {
      res.locals.userData = verifyJWTResult.data;
    }
  }

  next();
};

const replaceToPureText = (str) => {
  // <
  str = str.replace(/</ig, '&lt;');
  // >
  str = str.replace(/>/ig, '&gt;');
  // "
  str = str.replace(/"/ig, '&quot;');
  // '
  str = str.replace(/'/ig, '&#x27;');

  return str;
};

const writeLog = (content) => {
  const timeTaipei = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });
  let record = `Timestamp: ${Date.now()} Time: ${timeTaipei}\n${JSON.stringify(content)}\n`;
  fs.appendFile(path.join(__dirname, '../log.txt'), record + '\n', function (err) { });
};

module.exports = {
  upload,
  wrapAsync,
  verifyJWT,
  authenticate,
  replaceToPureText,
  writeLog,
};
