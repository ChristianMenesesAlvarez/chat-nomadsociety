import chatModel from './chatModel.js';

export async function addMessageRecord(user, recipient, type, value) {
  const getRecord = await chatModel.findOne({ user, recipient }).exec();
  if (!getRecord) await chatModel.create({ user, recipient });
  const date = new Date();
  await chatModel.findOneAndUpdate({ user, recipient }, { $push: { 'messages': { type, value, date } } }, { new: true }).exec();
  return;
}

export async function retrieveChatHistory(user, recipient) {
  const getRecord = await chatModel.findOne({ user, recipient });
  return getRecord ? getRecord.messages : [];
}
