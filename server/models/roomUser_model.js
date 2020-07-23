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

const getRoomUser = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (!requirement.user_id) {
    return { error: 'requirement is necessary' };
  }

  condition.query = 'SELECT roomUser.room, roomUser.isOwner, lastHistoryWB.link FROM roomUser ';
  condition.sql = 'LEFT JOIN (SELECT room, MAX(start_at), link FROM historyWB GROUP BY room) lastHistoryWB ';
  condition.sql += 'ON roomUser.room = lastHistoryWB.room ';
  condition.sql += 'WHERE roomUser.user_id = ? ORDER BY roomUser.room DESC';
  condition.binding = [requirement.user_id];

  let roomUsers;
  try {
    roomUsers = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  return { roomUsers };
};

module.exports = {
  createRoomUser,
  verifyRoomUser,
  getRoomUser,
};
