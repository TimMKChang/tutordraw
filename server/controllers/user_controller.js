const User = require('../models/user_model');
const { replaceToPureText } = require('../../util/util');
const validator = require('validator');

const signUp = async (req, res) => {

  const { email, password } = req.body;
  let { name } = req.body;
  // avoid empty
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // check injection
  if (name.match(/<.+>/)) {
    name = replaceToPureText(name);
  }

  // check email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // check password strength
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const { access_JWT, user, error } = await User.signUp(name, email, password);
  if (error) {
    return res.status(403).json({ error: 'Email already exists.' });
  }

  return res.status(200).json({ access_JWT, user });
};

const signIn = async (req, res) => {

  const { email, password } = req.body;
  // avoid empty
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const { access_JWT, user, error } = await User.signIn(email, password);
  if (error) {
    return res.status(403).json({ error });
  }

  return res.status(200).json({ access_JWT, user });
};

module.exports = {
  signUp,
  signIn,
};
