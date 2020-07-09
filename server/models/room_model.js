const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createRoom = async (room) => {
  try {
    await transaction();
    await query('INSERT INTO room SET ?', room);
    await commit();
    return { message: 'room created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const verifyPassword = async (room_id, password) => {
  const rooms = await query('SELECT id, password FROM room WHERE id = ?', [room_id]);
  const room = rooms[0];
  if (!room) {
    return { error: 'room does not exist' };
  }
  if (room.password !== password) {
    return { error: 'Incorrect password. Please contact the owner of the room to get the password' };
  }

  return { message: 'room password verified' };
};

const getWhiteboardStart_at = async (room_id) => {
  const rooms = await query('SELECT whiteboard_start_at FROM room WHERE id = ?', [room_id]);
  const room = rooms[0];
  if (!room) {
    return { error: 'room does not exist' };
  }

  return { start_at: room.whiteboard_start_at };
};

const updateWhiteboardStart_at = async (room, start_at) => {
  try {
    await transaction();
    await query('UPDATE room SET whiteboard_start_at = ? WHERE id = ?', [start_at, room]);
    await commit();
    return { message: 'room whiteboard_start_at updated' };
  } catch (error) {
    await rollback();
    return { error };
  }
};

module.exports = {
  createRoom,
  verifyPassword,
  getWhiteboardStart_at,
  updateWhiteboardStart_at,
};
