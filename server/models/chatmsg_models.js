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
  const paging = requirement.paging || 0;
  const limit = (paging + 1) * 20
  if (requirement.room) {
    condition.query = 'SELECT sender, type, msg, time, created_at FROM (SELECT * FROM chatmsg WHERE room = ? ORDER BY created_at DESC LIMIT ?) AS sub ';
    condition.sql = 'ORDER BY created_at ASC';
    condition.binding = [requirement.room, limit];
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
