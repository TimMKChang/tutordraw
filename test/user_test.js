require('dotenv').config();
const { assert, requester } = require('./set_up');
const { users } = require('./fake_data');
const { query } = require('../util/mysqlcon');
const { verifyJWT } = require('../util/util');

describe('user test', () => {

  // sign up
  it('sign up', async () => {
    const user = {
      name: 'tim',
      email: 'tim@mail.com',
      password: 'password',
    };

    const res = await requester
      .post('/api/1.0/user/signup')
      .send(user);

    const data = res.body;

    const userExpect = {
      id: data.user.id, // from returned data
      name: user.name,
      email: user.email,
    };

    // verify JWT
    const userFromToken = verifyJWT(data.access_JWT).data;
    const expire = userFromToken.exp;
    const expireExpect = Date.now() + 1000 * 86400 * 30; // 30 days
    delete userFromToken.exp;

    assert.deepEqual(data.user, userExpect);
    assert.deepEqual(userFromToken, userExpect);
    assert.closeTo(expire, expireExpect, 1000);
  });

  it('sign up without name or email or password', async () => {
    const user1 = {
      email: 'tim@mail.com',
      password: 'password',
    };

    const res1 = await requester
      .post('/api/1.0/user/signup')
      .send(user1);

    assert.equal(res1.statusCode, 400);
    assert.equal(res1.body.error, 'All fields are required.');

    const user2 = {
      name: 'tim',
      password: 'password',
    };

    const res2 = await requester
      .post('/api/1.0/user/signup')
      .send(user2);

    assert.equal(res2.statusCode, 400);
    assert.equal(res2.body.error, 'All fields are required.');

    const user3 = {
      name: 'tim',
      email: 'tim@mail.com',
    };

    const res3 = await requester
      .post('/api/1.0/user/signup')
      .send(user3);

    assert.equal(res3.statusCode, 400);
    assert.equal(res3.body.error, 'All fields are required.');
  });

  it('sign up with existed email', async () => {
    const user = users[0];
    delete user.created_at;

    const res = await requester
      .post('/api/1.0/user/signup')
      .send(user);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Email already exists.');
  });

  it('sign up with invalid email format', async () => {
    const user = {
      name: 'tim',
      email: 'tim mail',
      password: 'password',
    };

    const res = await requester
      .post('/api/1.0/user/signup')
      .send(user);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Invalid email address');
  });

  it('sign up without strong password', async () => {
    const user = {
      name: 'tim',
      email: 'tim@mail.com',
      password: '123',
    };

    const res = await requester
      .post('/api/1.0/user/signup')
      .send(user);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Password must be at least 8 characters long.');
  });

  // sign in
  it('sign in', async () => {
    const user1 = users[0];
    const user = {
      email: user1.email,
      password: user1.password,
    };

    const res = await requester
      .post('/api/1.0/user/signin')
      .send(user);

    const data = res.body;

    const userExpect = {
      id: data.user.id, // from returned data
      name: user1.name,
      email: user1.email,
    };

    // verify JWT
    const userFromToken = verifyJWT(data.access_JWT).data;
    const expire = userFromToken.exp;
    const expireExpect = Date.now() + 1000 * 86400 * 30; // 30 days
    delete userFromToken.exp;

    assert.deepEqual(data.user, userExpect);
    assert.deepEqual(userFromToken, userExpect);
    assert.closeTo(expire, expireExpect, 1000);
  });

  it('sign in without email or password', async () => {
    const user1 = {
      password: 'password',
    };

    const res1 = await requester
      .post('/api/1.0/user/signin')
      .send(user1);

    assert.equal(res1.statusCode, 400);
    assert.equal(res1.body.error, 'All fields are required.');

    const user2 = {
      email: 'tim@mail.com',
    };

    const res2 = await requester
      .post('/api/1.0/user/signin')
      .send(user2);

    assert.equal(res2.statusCode, 400);
    assert.equal(res2.body.error, 'All fields are required.');
  });

  it('sign in with unregistered email', async () => {
    const user = {
      email: 'unregistered email',
      password: 'password',
    };

    const res = await requester
      .post('/api/1.0/user/signin')
      .send(user);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Email does not exist.');
  });

  it('sign in with wrong password', async () => {
    const user1 = users[0];
    const user = {
      email: user1.email,
      password: 'wrong password',
    };

    const res = await requester
      .post('/api/1.0/user/signin')
      .send(user);

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'Password is incorrect.');
  });

});
