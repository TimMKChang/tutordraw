require('dotenv').config();
const { NODE_ENV } = process.env;
const { query } = require('../util/mysqlcon');
const {
  users,
  rooms,
  roomUsers,
  whiteboards,
  pins,
} = require('./fake_data');

async function createFakeUser() {
  const hashPassword = (password, salt) => {
    // random salt
    salt = salt || Math.random().toString(36).split('.')[1];

    // easy method, directly add to the last position
    const saltedPassword = password + salt;

    const hashedPassword = require('crypto')
      .createHash('sha256')
      .update(saltedPassword)
      .digest('hex');

    return `${salt}.${hashedPassword}`;
  };

  const hashed_users = users.map(user => {
    const hashed_user = [
      user.id,
      user.name,
      user.email,
      hashPassword(user.password),
      user.created_at,
    ];
    return hashed_user;
  });
  await query('INSERT INTO user (id, name, email, password, created_at) VALUES ?', [hashed_users]);
  return;
}

async function createFakeRoom() {
  await query('INSERT INTO room (id, token, title) VALUES ?', [rooms.map(x => Object.values(x))]);
  return;
}

async function createFakeRoomUser() {
  await query('INSERT INTO room_user (room_id, user_id, is_owner, note, starred) VALUES ?', [roomUsers.map(x => Object.values(x))]);
  return;
}

async function createFakeWhiteboard() {
  await query('INSERT INTO whiteboard (id, room_id, start_at, link) VALUES ?', [whiteboards.map(x => Object.values(x))]);
  return;
}

async function createFakePin() {
  await query('INSERT INTO pin (whiteboard_id, user_id, author, x, y, content, created_at, removed_at) VALUES ?', [pins.map(x => Object.values(x))]);
  return;
}

async function createFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }
  console.log('create fake data');

  try {
    await createFakeUser();
    await createFakeRoom();
    await createFakeRoomUser();
    await createFakeWhiteboard();
    await createFakePin();
  } catch (error) {
    console.log(error);
    return;
  }
};

async function truncateFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }
  console.log('truncate fake data');

  const setForeignKey = async (status) => {
    await query('SET FOREIGN_KEY_CHECKS = ?', status);
    return;
  };

  const truncateTable = async (table) => {
    await query(`TRUNCATE TABLE ${table}`);
    return;
  };

  try {
    await setForeignKey(0);
    await truncateTable('user');
    await truncateTable('room');
    await truncateTable('room_user');
    await truncateTable('chat');
    await truncateTable('whiteboard');
    await truncateTable('draw');
    await truncateTable('pin');
  } catch (error) {
    console.log(error);
    return;
  }
}

module.exports = {
  createFakeData,
  truncateFakeData,
};
