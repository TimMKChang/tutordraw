const User = require('../models/user_model');
const { replaceToPureText } = require('../../util/util');

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
