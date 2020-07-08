const User = require('../models/user_model');

const signUp = async (req, res) => {

  const { name, email, password } = req.body;
  // avoid empty
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const { access_JWT, error } = await User.signUp(name, email, password);
  if (error) {
    return res.status(403).json({ error: 'Email already exists' });
  }

  return res.status(200).json({ access_JWT });
};

const signIn = async (req, res) => {

  const { email, password } = req.body;
  // avoid empty
  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const { access_JWT, error } = await User.signIn(email, password);
  if (error) {
    return res.status(403).json({ error });
  }

  return res.status(200).json({ access_JWT });
};

module.exports = {
  signUp,
  signIn,
};
