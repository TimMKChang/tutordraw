const Chat = require('../models/chat_model');

const createChatmsg = async (chatObj) => {
  // from socket
  const { user_id, room, sender, type, msg, time, created_at } = chatObj;

  // to DB
  const chat = {
    user_id,
    room_id: room,
    sender,
    type,
    message: msg,
    time,
    created_at,
  };

  const { error, message } = await Chat.createChat(chat);
  if (error) {
    console.log(error);
  }
};

const getChatmsg = async (requirement) => {
  const { room, lastOldestCreated_at } = requirement;
  const { error, chats } = await Chat.getChat({ room_id: room, lastOldestCreated_at });
  if (error) {
    console.log(error);
  }

  const chatsAdjust = chats.map((chat) => {
    chat.msg = chat.message;
    delete chat.message;
    return chat;
  });

  return { error, chatmsgs: chatsAdjust };
};

module.exports = {
  createChatmsg,
  getChatmsg,
};
