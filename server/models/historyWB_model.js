const { query, transaction, commit, rollback } = require('../../util/mysqlcon');

const createHistoryWB = async (whiteboard) => {
  try {
    await transaction();
    await query('INSERT INTO historyWB SET ?', whiteboard);
    await commit();
    return { message: 'historyWB created' };

  } catch (error) {
    await rollback();
    return { error };
  }
};

const getHistoryWB = async (requirement) => {
  const condition = { query: '', sql: '', binding: [] };

  if (!requirement.room) {
    return { error: 'requirement is necessary' };
  }

  condition.query = 'SELECT start_at, link FROM historyWB ';
  condition.sql = 'WHERE room = ? ORDER BY start_at DESC';
  condition.binding = [requirement.room];

  let historyWBs;
  try {
    historyWBs = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  condition.query = 'SELECT whiteboard_start_at, x, y, content, created_at FROM pin ';
  condition.sql = 'WHERE room = ?';
  condition.binding = [requirement.room];

  let pins;
  try {
    pins = await query(condition.query + condition.sql, condition.binding);
  } catch (error) {
    return { error };
  }

  for (let wbIndex = 0; wbIndex < historyWBs.length; wbIndex++) {
    const historyWB = historyWBs[wbIndex];
    const { start_at } = historyWB;
    const pinsFound = pins.filter((pin) => pin.whiteboard_start_at === start_at);
    pinsFound.forEach((pin) => { delete pin.whiteboard_start_at; });
    historyWB.pins = pinsFound;
    delete historyWB.start_at;
  }

  return { historyWBs };

};

module.exports = {
  createHistoryWB,
  getHistoryWB,
};
