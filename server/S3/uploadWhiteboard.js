require('dotenv').config();
const aws = require('aws-sdk');

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_SECRET_ACCESS,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

const uploadWhiteboard = async (room, start_at, records) => {
  const lastRecordCreatedAt = records[records.length - 1].created_at;
  const params = {
    Bucket: 'drawnow',
    Key: `whiteboard/${room}/${start_at}/${lastRecordCreatedAt}`,
    Body: JSON.stringify({ room, start_at, records }),
    ACL: 'public-read',
    ContentType: `application/json`,
  };

  // Uploading files to the bucket
  s3.upload(params, function (err, data) {
    if (err) {
      console.log(err);
    }
    console.log('uploaded');
  });
};

module.exports = {
  uploadWhiteboard,
};
