const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createDraw = async (draw) => {
  try {
    await transaction();
    await query('INSERT INTO draw SET ?', draw);
    await commit();
    return { message: 'draw created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const getDraw = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (requirement.room_id && requirement.start_at) {
    condition.query = 'SELECT link FROM draw ';
    condition.sql = 'WHERE room_id = ? AND start_at = ? ORDER BY id ASC';
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
