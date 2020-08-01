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

const verifyToken = async (room_id, token) => {
  const rooms = await query('SELECT id, token FROM room WHERE id = ?', [room_id]);
  const room = rooms[0];
  if (!room) {
    return { error: 'Room does not exist.' };
  }
  if (room.token !== token) {
    return { error: 'Please contact the owner of the room to get the invite link to join the room' };
  }

  return { message: 'Room token verified.' };
};

const getRoom = async (room_id) => {
  const rooms = await query('SELECT whiteboard_start_at, title, token FROM room WHERE id = ?', [room_id]);
  const room = rooms[0];
  if (!room) {
    return { error: 'Room does not exist.' };
  }

  return { start_at: room.whiteboard_start_at, title: room.title, token: room.token };
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

const updateTitle = async (room, title) => {
  try {
    await transaction();
    await query('UPDATE room SET title = ? WHERE id = ?', [title, room]);
    await commit();
    return { message: 'room title updated' };
  } catch (error) {
    await rollback();
    return { error };
  }
};

module.exports = {
  createRoom,
  verifyToken,
  getRoom,
  updateWhiteboardStart_at,
  updateTitle,
};
