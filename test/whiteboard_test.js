require('dotenv').config();
const { assert, requester } = require('./set_up');
const { users, rooms, roomUsers, whiteboards, pins } = require('./fake_data');
const { query } = require('../util/mysqlcon');

describe('whiteboard test', () => {

  let access_JWT;
  before(async () => {
    const user2 = users[1];
    const user = {
      email: user2.email,
      password: user2.password,
    };

    const res = await requester
      .post('/api/1.0/user/signin')
      .send(user);

    access_JWT = res.body.access_JWT;
  });

  // get whiteboard
  it('get whiteboard', async () => {
    const res = await requester
      .get('/api/1.0/whiteboard/room1')
      .set('Authorization', `Bearer ${access_JWT}`);

    const { data } = res.body;

    const whiteboardExpect = [
      {
        link: 'link1',
        pins: [
          {
            x: 1,
            y: 1,
            content: 'content1',
            created_at: Date.parse(new Date('2020-07-01')),
          },
          {
            x: 2,
            y: 2,
            content: 'content2',
            created_at: Date.parse(new Date('2020-07-02')),
          }
        ],
      }
    ];

    assert.deepEqual(data, whiteboardExpect);
  });

  it('get whiteboard without verified room user', async () => {
    const res = await requester
      .get('/api/1.0/whiteboard/room_without_verified_room_user')
      .set('Authorization', `Bearer ${access_JWT}`);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Please contact the owner of the room to get the invite link to join the room');
  });

});
