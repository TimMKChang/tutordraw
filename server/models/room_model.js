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
  const rooms = await query('SELECT title, token FROM room WHERE id = ?', [room_id]);
  const room = rooms[0];
  if (!room) {
    return { error: 'Room does not exist.' };
  }

  const whiteboards = await query('SELECT start_at FROM whiteboard WHERE room_id = ? AND link IS NULL', [room_id]);
  const whiteboard = whiteboards[0];
  if (!whiteboard) {
    return { error: 'Whiteboard does not exist.' };
  }

  return { start_at: whiteboard.start_at, title: room.title, token: room.token };
};

const updateTitle = async (room_id, title) => {
  try {
    await transaction();
    await query('UPDATE room SET title = ? WHERE id = ?', [title, room_id]);
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
  updateTitle,
};
