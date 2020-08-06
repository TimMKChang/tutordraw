const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createDraw = async (_draw) => {
  const { room_id, start_at, link, } = _draw;
  const whiteboards = await query('SELECT id FROM whiteboard WHERE room_id = ? AND start_at = ? ', [room_id, start_at]);
  const whiteboard = whiteboards[0];
  if (!whiteboard) {
    return { error: 'Whiteboard does not exist.' };
  }
  const draw = {
    whiteboard_id: whiteboard.id,
    link,
  };

  try {
    await query('INSERT INTO draw SET ?', draw);
    return { message: 'draw created' };
  } catch (error) {
    return { error };
  }
};

const getDraw = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (requirement.room_id && requirement.start_at) {
    condition.query = 'SELECT draw.link FROM draw ';
    condition.sql = 'INNER JOIN whiteboard ON whiteboard.id = draw.whiteboard_id ';
    condition.sql += 'WHERE whiteboard.room_id = ? AND whiteboard.start_at = ? ORDER BY draw.id ASC';
    condition.binding = [requirement.room_id, requirement.start_at];
  } else {
    return { error: 'requirement is necessary' };
  }

  try {
    const draws = await query(condition.query + condition.sql, condition.binding);
    return { draws };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createDraw,
  getDraw,
};
