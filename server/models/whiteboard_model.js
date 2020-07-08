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

const getWhiteboard = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (requirement.room && requirement.start_at) {
    condition.query = 'SELECT link FROM whiteboard ';
    condition.sql = 'WHERE room = ? AND start_at = ? ORDER BY id ASC';
    condition.binding = [requirement.room, requirement.start_at];
  } else {
    return { error: 'requirement is necessary' };
  }

  try {
    const links = await query(condition.query + condition.sql, condition.binding);
    return { links };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createWhiteboard,
  getWhiteboard,
};
