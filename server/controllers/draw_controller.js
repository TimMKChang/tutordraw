const Draw = require('../models/draw_model');

const createDraw = async (drawObj) => {
  // from socket
  const { room, start_at, link } = drawObj;

  // to DB
  const draw = {
    room_id: room,
    start_at,
    link,
  };

  const { error, message } = await Draw.createDraw(draw);
  if (error) {
    console.log(error);
  }
};

const getDraw = async (requirement) => {
  const { room, start_at } = requirement;
  const { error, draws } = await Draw.getDraw({ room_id: room, start_at });
  return { error, links: draws };
};

module.exports = {
  createDraw,
  getDraw,
};
