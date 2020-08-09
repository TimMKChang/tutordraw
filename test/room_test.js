require('dotenv').config();
const { assert, requester } = require('./set_up');
const { users } = require('./fake_data');
const { query } = require('../util/mysqlcon');
const fs = require('fs');

describe('room test', () => {

  // create room
  it('create room', async () => {
    const user1 = users[0];
    const user = {
      email: user1.email,
      password: user1.password,
    };

    const res1 = await requester
      .post('/api/1.0/user/signin')
      .send(user);

    const { access_JWT } = res1.body;

    const res2 = await requester
      .post('/api/1.0/room')
      .set('Authorization', `Bearer ${access_JWT}`);

    const data = res2.body;
    const roomExpect = {
      room: data.room,
    };

    assert.deepEqual(data, roomExpect);
  });

  it('create room without token or with wrong token', async () => {
    const res1 = await requester
      .post('/api/1.0/room');

    assert.equal(res1.statusCode, 403);
    assert.equal(res1.body.error, 'Please sign in first.');

    const res2 = await requester
      .post('/api/1.0/room')
      .set('Authorization', 'Bearer wrong token');

    assert.equal(res2.statusCode, 403);
    assert.equal(res2.body.error, 'Please sign in first.');
  });

  // upload image
  it('upload image', async () => {
    const room_image_test = fs.readFileSync(__dirname + '/upload/room_image_test.png');

    const res = await requester
      .post('/api/1.0/room/image')
      .field('room', 'room_image_test')
      .attach('image', room_image_test, 'room_image_test.png');

    assert.equal(res.body.message, 'image uploaded');
  }).timeout(5000); // set 5 seconds timeout for uploading image

});
