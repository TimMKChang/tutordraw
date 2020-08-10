require('dotenv').config();
const { assert, requester } = require('./set_up');
const { users, rooms, roomUsers, whiteboards } = require('./fake_data');
const { query } = require('../util/mysqlcon');

describe('room user test', () => {

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

  // get room user
  it('get room user', async () => {
    const res = await requester
      .get('/api/1.0/roomUser')
      .set('Authorization', `Bearer ${access_JWT}`);

    const { data } = res.body;

    const roomUserExpect = [
      {
        room: 'room2',
        isOwner: 1,
        note: 'note2',
        starred: 1,
        title: 'title2',
        link: null,
      },
      {
        room: 'room1',
        isOwner: 1,
        note: 'note1',
        starred: 1,
        title: 'title1',
        link: 'link1',
      }
    ];

    assert.deepEqual(data, roomUserExpect);
  });

  // update room user
  it('update room user note', async () => {
    const room1 = rooms[0];
    const roomUser = {
      room: room1.id,
      note: 'update note',
    };

    const res = await requester
      .patch('/api/1.0/roomUser')
      .set('Authorization', `Bearer ${access_JWT}`)
      .send(roomUser);

    assert.equal(res.body.message, 'roomUser updated');
  });

  it('update room user starred', async () => {
    const room1 = rooms[0];
    const roomUser = {
      room: room1.id,
      starred: 0,
    };

    const res = await requester
      .patch('/api/1.0/roomUser')
      .set('Authorization', `Bearer ${access_JWT}`)
      .send(roomUser);

    assert.equal(res.body.message, 'roomUser updated');
  });

  it('update room user without note and starred', async () => {
    const room1 = rooms[0];
    const roomUser = {
      room: room1.id,
    };

    const res = await requester
      .patch('/api/1.0/roomUser')
      .set('Authorization', `Bearer ${access_JWT}`)
      .send(roomUser);

    assert.equal(res.body.error, 'updateRoomUser error');
  });

  it('check update room user from database', async () => {
    const res = await requester
      .get('/api/1.0/roomUser')
      .set('Authorization', `Bearer ${access_JWT}`);

    const { data } = res.body;

    const roomUserExpect = [
      {
        room: 'room2',
        isOwner: 1,
        note: 'note2',
        starred: 1,
        title: 'title2',
        link: null,
      },
      {
        room: 'room1',
        isOwner: 1,
        note: 'update note',
        starred: 0,
        title: 'title1',
        link: 'link1',
      }
    ];

    assert.deepEqual(data, roomUserExpect);
  });

});
