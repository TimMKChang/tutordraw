const fs = require('fs');
const uploadImageS3 = require('../S3/uploadImage').uploadImage;

const uploadImage = async (req, res) => {
  const { room } = req.body;
  const imageFilename = req.files.image[0].filename;
  const filePath = `./images_temp/${imageFilename}`;
  try {
    await uploadImageS3(room, filePath, imageFilename);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Uploaded to S3 unsuccessfully' });
  }
  // remove image in images_temp
  fs.unlinkSync(filePath);
  return res.status(200).json({ message: 'Uploaded successfully' });
};

module.exports = {
  uploadImage,
};
