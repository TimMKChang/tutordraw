const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createPin = async (pin) => {
  const { room_id, start_at } = pin;

  const whiteboards = await query('SELECT id FROM whiteboard WHERE room_id = ? AND start_at = ? ', [room_id, start_at]);
  const whiteboard = whiteboards[0];
  if (!whiteboard) {
    return { error: 'Whiteboard does not exist.' };
  }
  pin.whiteboard_id = whiteboard.id;
  delete pin.room_id;
  delete pin.start_at;

  try {
    await transaction();
    await query('INSERT INTO pin SET ?', pin);
    await commit();
    return { message: 'pin created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const updatePin = async (pin) => {
  const { room_id, content, x, y, start_at, created_at } = pin;

  const whiteboards = await query('SELECT id FROM whiteboard WHERE room_id = ? AND start_at = ? ', [room_id, start_at]);
  const whiteboard = whiteboards[0];
  if (!whiteboard) {
    return { error: 'Whiteboard does not exist.' };
  }

  const condition = { query: '', sql: '', binding: [] };

  if (content) {
    condition.query = 'UPDATE pin SET content = ? ';
    condition.sql = 'WHERE whiteboard_id = ? AND created_at = ?';
    condition.binding = [content, whiteboard.id, created_at];
  } else if (x && y) {
    condition.query = 'UPDATE pin SET x = ?, y = ? ';
    condition.sql = 'WHERE whiteboard_id = ? AND created_at = ?';
    condition.binding = [x, y, whiteboard.id, created_at];
  }

  try {
    await transaction();
    await query(condition.query + condition.sql, condition.binding);
    await commit();
    return { message: 'pin content updated' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const getPin = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };
  condition.query = 'SELECT pin.user_id, pin.author, pin.x, pin.y, pin.content, pin.created_at FROM pin ';
  condition.sql = 'INNER JOIN whiteboard ON whiteboard.id = pin.whiteboard_id ';
  condition.sql += 'WHERE whiteboard.room_id = ? AND whiteboard.start_at = ? AND pin.removed_at IS NULL';
  condition.binding = [requirement.room_id, requirement.start_at];

  try {
    const pins = await query(condition.query + condition.sql, condition.binding);
    return { pins };
  } catch (error) {
    return { error };
  }
};

const removePin = async (pin) => {
  const { room_id, start_at, created_at } = pin;

  const whiteboards = await query('SELECT id FROM whiteboard WHERE room_id = ? AND start_at = ? ', [room_id, start_at]);
  const whiteboard = whiteboards[0];
  if (!whiteboard) {
    return { error: 'Whiteboard does not exist.' };
  }

  const condition = { query: '', sql: '', binding: [] };

  condition.query = 'UPDATE pin SET removed_at = ? ';
  condition.sql = 'WHERE whiteboard_id = ? AND created_at = ?';
  condition.binding = [Date.now(), whiteboard.id, created_at];

  try {
    await transaction();
    await query(condition.query + condition.sql, condition.binding);
    await commit();
    return { message: 'pin removed' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

module.exports = {
  createPin,
  updatePin,
  getPin,
  removePin,
};
