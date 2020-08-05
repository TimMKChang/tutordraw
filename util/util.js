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

const checkInjection = (req, res, next) => {
  // remove <script> </script>
  // check nested <script> ex: <script<script>>
  function removeScriptTag(str) {
    let str_old = '';
    let str_new = str;
    while (str_new !== str_old) {
      str_old = str_new;
      str_new = str_old.replace(/(<|&lt;)\/?script(>|&gt;)/ig, '');
    }
    return str_new;
  }

  const query_str = JSON.stringify(req.query);
  req.query = JSON.parse(removeScriptTag(query_str));
  const body_str = JSON.stringify(req.body);
  req.body = JSON.parse(removeScriptTag(body_str));
  next();
};

module.exports = {
  upload,
  wrapAsync,
  verifyJWT,
  authenticate,
  checkInjection
};
