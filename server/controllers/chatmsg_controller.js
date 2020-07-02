const chatmsgModel = require('../models/chatmsg_models');

const createChatmsg = async (chatmsgObj) => {
  const { room, sender, msg, time, created_at } = chatmsgObj;
  const chatmsg = {
    room,
    sender,
    msg,
    time,
    created_at,
  }
  const { error, message } = await chatmsgModel.createChatmsg(chatmsg);
  if (error) {
    console.log(error);
  } else {
    console.log(message);
  }
};

const getChatmsg = async (requirement) => {
  return await chatmsgModel.getChatmsg(requirement);
};

module.exports = {
  createChatmsg,
  getChatmsg,
};
