const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createWhiteboard = async (whiteboard) => {
  try {
    await query('INSERT INTO whiteboard SET ?', whiteboard);
    return { message: 'whiteboard created' };
  } catch (error) {
    return { error };
  }
};

const updateWhiteboard = async (whiteboard) => {
  const { room_id, start_at, link, } = whiteboard;
  const condition = { query: '', sql: '', binding: [] };

  condition.binding = [link, room_id, start_at];

  try {
    await query('UPDATE whiteboard SET link = ? WHERE room_id = ? AND start_at = ?', condition.binding);
    return { message: 'whiteboard link updated' };
  } catch (error) {
    return { error };
  }
};

const getWhiteboard = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (!requirement.room_id) {
    return { error: 'requirement is necessary' };
  }

  condition.query = 'SELECT id, link FROM whiteboard ';
  condition.sql = 'WHERE room_id = ? ORDER BY id DESC';
  condition.binding = [requirement.room_id];

  let whiteboards;
  try {
    whiteboards = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  const whiteboardIds = whiteboards.map((whiteboard) => {
    return whiteboard.id;
  });

  condition.query = 'SELECT whiteboard_id, x, y, content, created_at FROM pin ';
  condition.sql = 'WHERE whiteboard_id IN (?) AND removed_at IS NULL';
  condition.binding = [[...whiteboardIds]];

  let pins;
  try {
    pins = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  for (let wbIndex = 0; wbIndex < whiteboards.length; wbIndex++) {
    const whiteboard = whiteboards[wbIndex];
    const pinsFound = pins.filter((pin) => pin.whiteboard_id === whiteboard.id);
    pinsFound.forEach((pin) => { delete pin.whiteboard_id; });
    whiteboard.pins = pinsFound;
    delete whiteboard.id;
  }

  return { whiteboards };

};

module.exports = {
  createWhiteboard,
  getWhiteboard,
  updateWhiteboard,
};
