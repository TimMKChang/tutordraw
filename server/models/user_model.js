const crypto = require('crypto');
const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const signUp = async (name, email, password) => {
  try {
    await transaction();

    // check user exist
    const emails = await query('SELECT email FROM user WHERE email = ?', email);
    if (emails.length > 0) {
      await commit();
      return { error: 'Email Already Exists' };
    }

    // hash password
    const hashedPassword = hashPassword(password);

    await query('INSERT INTO user SET ?', {
      name,
      email,
      password: hashedPassword,
      created_at: Date.now(),
    });
    await commit();

    // accessToken
    const access_JWT = createJWT({ name, email });
    return { access_JWT };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const signIn = async (email, password) => {
  const users = await query('SELECT name, email, password FROM user WHERE email = ?', email);
  const user = users[0];
  if (!user) {
    return { error: 'Email Does Not Exist' };
  }

  const salt = user.password.split('.')[0];
  if (user.password !== hashPassword(password, salt)) {
    return { error: 'Password is wrong' };
  }

  // accessToken
  const access_JWT = createJWT({ name: user.name, email });
  return { access_JWT };
};

module.exports = {
  signUp,
  signIn,
};

function hashPassword(password, salt) {
  // random salt
  salt = salt || Math.random().toString(36).split('.')[1];

  // easy method, directly add to the last position
  const saltedPassword = password + salt;

  const hashedPassword = crypto
    .createHash('sha256')
    .update(saltedPassword)
    .digest('hex');

  return `${salt}.${hashedPassword}`;
}

function createJWT(data) {
  // JWT Hmac SHA256

  // header
  const header = Buffer.from(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  })).toString('base64');

  // payload
  // add exp time 30 days
  data.exp = Date.now() + 1000 * 86400 * 30;
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');

  // signature
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${header}.${payload}`).digest('base64');

  return `${header}.${payload}.${signature}`;
}

