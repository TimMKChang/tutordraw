const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createRoomUser = async (roomUser) => {
  const { room, user_id } = roomUser;
  // check roomUser exist
  const roomUsers = await query('SELECT id FROM roomUser WHERE room = ? AND user_id = ?', [room, user_id]);
  if (roomUsers.length > 0) {
    // roomUser exist, but it is not an error
    return { message: 'roomUser Already Exists' };
  }

  try {
    await transaction();
    await query('INSERT INTO roomUser SET ?', roomUser);
    await commit();
    return { message: 'roomUser created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const verifyRoomUser = async (room, user_id) => {
  const roomUsers = await query('SELECT id FROM roomUser WHERE room = ? AND user_id = ?', [room, user_id]);
  const roomUser = roomUsers[0];
  if (!roomUser) {
    return { error: 'Please contact the owner of the room to get the password to join the room' };
  }
  return { message: 'roomUser verified' };
};

module.exports = {
  createRoomUser,
  verifyRoomUser,
};
