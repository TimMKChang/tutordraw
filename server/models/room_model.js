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

module.exports = {
  createRoom,
};
