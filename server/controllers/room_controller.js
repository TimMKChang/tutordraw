const uploadImage = async (req, res) => {
  console.log(req.body);
  return res.status(200).json({ done: 'done!' });
};

module.exports = {
  uploadImage,
};
