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
    return { error: 'Please contact the owner of the room to get the invite link to join the room' };
  }
  return { message: 'roomUser verified' };
};

const getRoomUser = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (!requirement.user_id) {
    return { error: 'requirement is necessary' };
  }

  condition.query = 'SELECT roomUser.room, room.title, roomUser.isOwner, lastHistoryWB.link, roomUser.note, roomUser.starred FROM roomUser ';

  let subquery = '(SELECT id, room, start_at, link FROM historyWB ';
  subquery += 'WHERE id IN (SELECT MAX(id) FROM (SELECT id, room FROM historyWB ORDER BY room, start_at DESC) ordered GROUP BY room)) lastHistoryWB ';

  condition.sql = 'LEFT JOIN ' + subquery;
  condition.sql += 'ON roomUser.room = lastHistoryWB.room ';

  condition.sql += 'LEFT JOIN room ';
  condition.sql += 'ON roomUser.room = room.id ';

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

const updateRoomUser = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };
  if (requirement.note || requirement.note === '') {
    condition.binding = [requirement.note, requirement.room, requirement.user_id];
    try {
      await transaction();
      await query('UPDATE roomUser SET note = ? WHERE room = ? AND user_id = ?', condition.binding);
      await commit();
      return { message: 'roomUser note updated' };
    } catch (error) {
      await rollback();
      return { error };
    }
  } else if (Number.isInteger(requirement.starred)) {
    condition.binding = [requirement.starred, requirement.room, requirement.user_id];
    try {
      await transaction();
      await query('UPDATE roomUser SET starred = ? WHERE room = ? AND user_id = ?', condition.binding);
      await commit();
      return { message: 'roomUser starred updated' };
    } catch (error) {
      await rollback();
      return { error };
    }
  }
  return { error: 'requirement is necessary' };
};

module.exports = {
  createRoomUser,
  verifyRoomUser,
  getRoomUser,
  updateRoomUser,
};
