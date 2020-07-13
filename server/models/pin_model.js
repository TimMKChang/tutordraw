const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createPin = async (pin) => {
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
  const { content, x, y, whiteboard_start_at, created_at } = pin;
  const condition = { query: '', sql: '', binding: [] };

  if (content) {
    condition.query = 'UPDATE pin SET content = ? ';
    condition.sql = 'WHERE whiteboard_start_at = ? AND created_at = ?';
    condition.binding = [content, whiteboard_start_at, created_at];
  } else if (x && y) {
    condition.query = 'UPDATE pin SET x = ?, y = ? ';
    condition.sql = 'WHERE whiteboard_start_at = ? AND created_at = ?';
    condition.binding = [x, y, whiteboard_start_at, created_at];
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
  condition.query = 'SELECT user_id, author, x, y, content, created_at FROM pin ';
  condition.sql = 'WHERE room = ? AND whiteboard_start_at = ?';
  condition.binding = [requirement.room, requirement.start_at];

  try {
    const pins = await query(condition.query + condition.sql, condition.binding);
    return { pins };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createPin,
  updatePin,
  getPin,
};
