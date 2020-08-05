const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createRoomUser = async (roomUser) => {
  const { room_id, user_id } = roomUser;
  // check roomUser exist
  const roomUsers = await query('SELECT id FROM room_user WHERE room_id = ? AND user_id = ?', [room_id, user_id]);
  if (roomUsers.length > 0) {
    // roomUser exist, but it is not an error
    return { message: 'roomUser Already Exists' };
  }

  try {
    await transaction();
    await query('INSERT INTO room_user SET ?', roomUser);
    await commit();
    return { message: 'roomUser created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const verifyRoomUser = async (_roomUser) => {
  const { room_id, user_id } = _roomUser;
  const roomUsers = await query('SELECT id FROM room_user WHERE room_id = ? AND user_id = ?', [room_id, user_id]);
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

  condition.query = 'SELECT room_user.room_id, room.title, room_user.is_owner, lastWhiteboard.link, room_user.note, room_user.starred FROM room_user ';

  let subquery = '(SELECT id, room_id, start_at, link FROM whiteboard ';
  subquery += 'WHERE id IN (SELECT MAX(id) FROM (SELECT id, room_id FROM whiteboard WHERE link IS NOT NULL ORDER BY room_id, start_at DESC) ordered GROUP BY room_id)) lastWhiteboard ';

  condition.sql = 'LEFT JOIN ' + subquery;
  condition.sql += 'ON room_user.room_id = lastWhiteboard.room_id ';

  condition.sql += 'LEFT JOIN room ';
  condition.sql += 'ON room_user.room_id = room.id ';

  condition.sql += 'WHERE room_user.user_id = ? ORDER BY room_user.room_id DESC';
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
    condition.binding = [requirement.note, requirement.room_id, requirement.user_id];
    try {
      await transaction();
      await query('UPDATE room_user SET note = ? WHERE room_id = ? AND user_id = ?', condition.binding);
      await commit();
      return { message: 'roomUser note updated' };
    } catch (error) {
      await rollback();
      return { error };
    }
  } else if (Number.isInteger(requirement.starred)) {
    condition.binding = [requirement.starred, requirement.room_id, requirement.user_id];
    try {
      await transaction();
      await query('UPDATE room_user SET starred = ? WHERE room_id = ? AND user_id = ?', condition.binding);
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
