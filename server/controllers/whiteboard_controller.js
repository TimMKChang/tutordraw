const whiteboardModel = require('../models/whiteboard_models');

const createWhiteboard = async (whiteboard) => {
  const { error, message } = await whiteboardModel.createWhiteboard(whiteboard);
  if (error) {
    console.log(error);
  }
};

const getWhiteboard = async (requirement) => {
  return await whiteboardModel.getWhiteboard(requirement);
};

module.exports = {
  createWhiteboard,
  getWhiteboard,
};
