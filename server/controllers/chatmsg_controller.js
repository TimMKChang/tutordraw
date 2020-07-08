const Chatmsg = require('../models/chatmsg_model');

const createChatmsg = async (chatmsgObj) => {
  const { room, sender, type, msg, time, created_at } = chatmsgObj;
  const chatmsg = {
    room,
    sender,
    type,
    msg,
    time,
    created_at,
  };
  const { error, message } = await Chatmsg.createChatmsg(chatmsg);
  if (error) {
    console.log(error);
  }
};

const getChatmsg = async (requirement) => {
  return await Chatmsg.getChatmsg(requirement);
};

module.exports = {
  createChatmsg,
  getChatmsg,
};
