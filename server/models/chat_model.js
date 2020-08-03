const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createChat = async (chat) => {
  try {
    await transaction();
    await query('INSERT INTO chat SET ?', chat);
    await commit();
    return { message: 'chat created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const getChat = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };
  const lastOldestCreated_at = requirement.lastOldestCreated_at || Date.now();
  const limit = 20;
  if (requirement.room_id) {
    condition.query = 'SELECT user_id, sender, type, message, time, created_at FROM chat ';
    condition.sql = 'WHERE room_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?';
    condition.binding = [requirement.room_id, lastOldestCreated_at, limit];
  } else {
    return { error: 'requirement is necessary' };
  }

  try {
    const chats = await query(condition.query + condition.sql, condition.binding);
    return { chats };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createChat,
  getChat,
};
