const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createWhiteboard = async (whiteboard) => {
  try {
    await transaction();
    await query('INSERT INTO whiteboard SET ?', whiteboard);
    await commit();
    return { message: 'whiteboard created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const updateWhiteboard = async (whiteboard) => {
  const { room_id, start_at, link, } = whiteboard;
  const condition = { query: '', sql: '', binding: [] };

  condition.binding = [link, room_id, start_at];

  try {
    await transaction();
    await query('UPDATE whiteboard SET link = ? WHERE room_id = ? AND start_at = ?', condition.binding);
    await commit();
    return { message: 'whiteboard link updated' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const getWhiteboard = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (!requirement.room_id) {
    return { error: 'requirement is necessary' };
  }

  condition.query = 'SELECT start_at, link FROM whiteboard ';
  condition.sql = 'WHERE room_id = ? ORDER BY start_at DESC';
  condition.binding = [requirement.room_id];

  let whiteboards;
  try {
    whiteboards = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  condition.query = 'SELECT whiteboard_start_at, x, y, content, created_at FROM pin ';
  condition.sql = 'WHERE room = ? AND removed_at IS NULL';
  condition.binding = [requirement.room_id];

  let pins;
  try {
    pins = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  for (let wbIndex = 0; wbIndex < whiteboards.length; wbIndex++) {
    const whiteboard = whiteboards[wbIndex];
    const { start_at } = whiteboard;
    const pinsFound = pins.filter((pin) => pin.whiteboard_start_at === start_at);
    pinsFound.forEach((pin) => { delete pin.whiteboard_start_at; });
    whiteboard.pins = pinsFound;
    delete whiteboard.start_at;
  }

  return { whiteboards };

};

module.exports = {
  createWhiteboard,
  getWhiteboard,
  updateWhiteboard,
};
