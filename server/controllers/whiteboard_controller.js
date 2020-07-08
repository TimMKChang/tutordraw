const Whiteboard = require('../models/whiteboard_model');

const createWhiteboard = async (whiteboard) => {
  const { error, message } = await Whiteboard.createWhiteboard(whiteboard);
  if (error) {
    console.log(error);
  }
};

const getWhiteboard = async (requirement) => {
  return await Whiteboard.getWhiteboard(requirement);
};

module.exports = {
  createWhiteboard,
  getWhiteboard,
};
