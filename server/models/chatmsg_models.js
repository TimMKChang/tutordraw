const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createChatmsg = async (chatmsg) => {
  try {
    await transaction();
    await query('INSERT INTO chatmsg SET ?', chatmsg);
    await commit();
    return { message: 'chatmsg created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const getChatmsg = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (requirement.room) {
    condition.query = 'SELECT sender, type, msg, time, created_at FROM chatmsg ';
    condition.sql = 'WHERE room = ?';
    condition.binding = [requirement.room];
  } else {
    return { error: 'requirement is necessary' };
  }

  try {
    const chatmsgs = await query(condition.query + condition.sql, condition.binding);
    return { chatmsgs };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  createChatmsg,
  getChatmsg,
};
