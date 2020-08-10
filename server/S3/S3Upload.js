require('dotenv').config();
const aws = require('aws-sdk');
const fs = require('fs');
const { writeLog } = require('../../util/util');

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_SECRET_ACCESS,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const {
  createDraw,
} = require('../controllers/draw_controller');

const uploadWhiteboard = async (room, start_at, records) => {
  if (records.length === 0) {
    return;
  }

  const lastRecordCreatedAt = records[records.length - 1].created_at;
  const Key = `whiteboard/${room}/${start_at}/${lastRecordCreatedAt}`;
  const params = {
    Bucket: 'drawnow',
    Key,
    Body: JSON.stringify({ room, start_at, records }),
    ACL: 'public-read',
    ContentType: `application/json`,
  };

  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      writeLog({ error: err });
    }
    const whiteboardObj = {
      room,
      start_at,
      link: `${process.env.AWS_CLOUDFRONT_DOMAIN}/${Key}`,
    };
    createDraw(whiteboardObj);
  });
};

const uploadImage = async (room, filePath, imageFilename) => {
  return new Promise((resolve, reject) => {
    const extension = imageFilename.split('.')[1];
    const ContentType = `image/${extension === 'svg' ? 'svg+xml' : extension}`;
    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: 'drawnow',
      Key: `images/${room}/${imageFilename}`,
      Body: fileContent,
      ACL: 'public-read',
      ContentType,
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};

module.exports = {
  uploadWhiteboard,
  uploadImage,
};
